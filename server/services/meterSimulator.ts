import { PrismaClient } from '@prisma/client';
import { pathToFileURL } from 'node:url';

const prisma = new PrismaClient();

function jitter(base: number, pct = 0.15): number {
  return base * (1 + (Math.random() * 2 - 1) * pct);
}

// Returns true if `hour` falls within [startHour, endHour) (handles midnight wrap).
function isInBand(hour: number, startHour: number, endHour: number): boolean {
  if (startHour < endHour) return hour >= startHour && hour < endHour;
  return hour >= startHour || hour < endHour;
}

export async function simulateReadings(companyId: string, days = 30): Promise<number> {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    include: { machines: true, tariffBands: true },
  });

  const { machines, tariffBands } = company;
  if (machines.length === 0) return 0;

  // Delete old simulated readings for this company to avoid duplicates on re-run
  await prisma.meterReading.deleteMany({ where: { companyId } });

  const now = new Date();
  const readings: {
    companyId: string;
    machineId: string;
    timestamp: Date;
    kwhDelta: number;
  }[] = [];

  for (const machine of machines) {
    const band = machine.tariffBandName
      ? tariffBands.find((b) => b.name === machine.tariffBandName)
      : null;

    // Determine the hours this machine typically operates
    const operatingStartHour = band ? band.startHour : 8;
    const operatingEndHour = band ? band.endHour : 18;

    for (let d = days - 1; d >= 0; d--) {
      const day = new Date(now);
      day.setDate(day.getDate() - d);

      // Generate one reading per operating hour
      for (let h = 0; h < 24; h++) {
        if (!isInBand(h, operatingStartHour, operatingEndHour)) continue;

        const ts = new Date(day);
        ts.setHours(h, Math.floor(Math.random() * 60), 0, 0);

        // kWh in this hour = ratedPower * utilization (jittered)
        const utilization = jitter(1.0, 0.2);
        const kwhDelta = machine.ratedPowerKw * utilization;

        readings.push({
          companyId,
          machineId: machine.id,
          timestamp: ts,
          kwhDelta: Math.max(0, kwhDelta),
        });
      }
    }
  }

  // Batch insert
  const CHUNK = 500;
  for (let i = 0; i < readings.length; i += CHUNK) {
    await prisma.meterReading.createMany({ data: readings.slice(i, i + CHUNK) });
  }

  return readings.length;
}

// CLI entrypoint: run `npm run simulate` from the backend dir
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const companyEmail = process.argv[2];
  if (!companyEmail) {
    console.error('Usage: ts-node meterSimulator.ts <company-email>');
    process.exit(1);
  }

  prisma.company
    .findUnique({ where: { email: companyEmail } })
    .then(async (c) => {
      if (!c) throw new Error(`Company not found: ${companyEmail}`);
      const count = await simulateReadings(c.id);
      console.log(`Simulated ${count} readings for ${c.name}`);
    })
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
