import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { simulateReadings } from '../server/services/meterSimulator';

const prisma = new PrismaClient();

async function hash(pw: string) {
  return bcrypt.hash(pw, 12);
}

async function main() {
  console.log('Seeding EnergyIQ database...');

  // Wipe tables in dependency order
  await prisma.meterReading.deleteMany({});
  await prisma.billBandBreakdown.deleteMany({});
  await prisma.monthlyBill.deleteMany({});
  await prisma.machine.deleteMany({});
  await prisma.tariffBand.deleteMany({});
  await prisma.company.deleteMany({});

  // ── 1. Admin account ────────────────────────────────────────────────────────
  await prisma.company.create({
    data: {
      name: 'EnergyIQ Admin',
      email: 'admin@energyiq.com',
      passwordHash: await hash('admin123'),
      role: 'ADMIN',
      currency: 'EUR',
      emissionFactor: 0.4,
    },
  });

  // ── 2. Acme Manufacturing ────────────────────────────────────────────────────
  const acme = await prisma.company.create({
    data: {
      name: 'Acme Manufacturing',
      email: 'acme@example.com',
      passwordHash: await hash('acme123'),
      role: 'CLIENT',
      currency: 'EUR',
      emissionFactor: 0.42,
    },
  });

  await prisma.tariffBand.createMany({
    data: [
      { companyId: acme.id, name: 'peak',     pricePerKwh: 0.28, startHour: 8,  endHour: 20, color: '#EF4444' },
      { companyId: acme.id, name: 'off-peak', pricePerKwh: 0.11, startHour: 20, endHour: 8,  color: '#22C55E' },
    ],
  });

  const acmeMachines = await Promise.all([
    prisma.machine.create({ data: { companyId: acme.id, name: 'CNC Milling Centre',   ratedPowerKw: 18.5, dailyHours: 8,  tariffBandName: 'peak',     description: 'Main machining centre — 3-axis' } }),
    prisma.machine.create({ data: { companyId: acme.id, name: 'Industrial Compressor',ratedPowerKw: 7.5,  dailyHours: 10, tariffBandName: 'peak',     description: 'Supplies compressed air to all lines' } }),
    prisma.machine.create({ data: { companyId: acme.id, name: 'Conveyor Belt A',      ratedPowerKw: 3.0,  dailyHours: 9,  tariffBandName: 'peak',     description: 'Assembly line feed conveyor' } }),
    prisma.machine.create({ data: { companyId: acme.id, name: 'Hydraulic Press',      ratedPowerKw: 22.0, dailyHours: 6,  tariffBandName: 'peak',     description: '200-ton stamping press' } }),
    prisma.machine.create({ data: { companyId: acme.id, name: 'Cooling Tower Pump',   ratedPowerKw: 5.5,  dailyHours: 16, tariffBandName: 'off-peak', description: 'Recirculating water pump' } }),
  ]);

  // Monthly bills — last 3 months
  const now = new Date();
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const totalKwh = 18000 + Math.round(Math.random() * 3000);
    const totalCost = parseFloat((totalKwh * 0.22).toFixed(2));

    await prisma.monthlyBill.create({
      data: {
        companyId: acme.id,
        month,
        year,
        totalCost,
        totalKwh,
        currency: 'EUR',
        notes: i === 0 ? 'Latest billing period' : null,
        bandBreakdowns: {
          create: [
            { bandName: 'peak',     kwh: Math.round(totalKwh * 0.72), cost: parseFloat((totalKwh * 0.72 * 0.28).toFixed(2)) },
            { bandName: 'off-peak', kwh: Math.round(totalKwh * 0.28), cost: parseFloat((totalKwh * 0.28 * 0.11).toFixed(2)) },
          ],
        },
      },
    });
  }

  // Simulate meter readings for Acme
  await simulateReadings(acme.id, 30);
  console.log(`  ✔ Acme Manufacturing (${acmeMachines.length} machines)`);

  // ── 3. TechPlast Industries ──────────────────────────────────────────────────
  const techplast = await prisma.company.create({
    data: {
      name: 'TechPlast Industries',
      email: 'techplast@example.com',
      passwordHash: await hash('techplast123'),
      role: 'CLIENT',
      currency: 'GBP',
      emissionFactor: 0.35,
    },
  });

  await prisma.tariffBand.createMany({
    data: [
      { companyId: techplast.id, name: 'peak',     pricePerKwh: 0.32, startHour: 9,  endHour: 19, color: '#EF4444' },
      { companyId: techplast.id, name: 'mid',      pricePerKwh: 0.19, startHour: 7,  endHour: 9,  color: '#F59E0B' },
      { companyId: techplast.id, name: 'off-peak', pricePerKwh: 0.09, startHour: 22, endHour: 7,  color: '#22C55E' },
    ],
  });

  const tpMachines = await Promise.all([
    prisma.machine.create({ data: { companyId: techplast.id, name: 'Injection Moulding #1', ratedPowerKw: 55.0, dailyHours: 12, tariffBandName: 'peak',     description: '550-ton clamping force' } }),
    prisma.machine.create({ data: { companyId: techplast.id, name: 'Injection Moulding #2', ratedPowerKw: 45.0, dailyHours: 10, tariffBandName: 'peak',     description: '350-ton clamping force' } }),
    prisma.machine.create({ data: { companyId: techplast.id, name: 'Heat Treatment Oven',   ratedPowerKw: 32.0, dailyHours: 8,  tariffBandName: 'peak',     description: 'Annealing & stress relief' } }),
    prisma.machine.create({ data: { companyId: techplast.id, name: 'Assembly Robot Cell',   ratedPowerKw: 12.0, dailyHours: 10, tariffBandName: 'mid',      description: '6-axis collaborative robot' } }),
    prisma.machine.create({ data: { companyId: techplast.id, name: 'Chiller Unit',          ratedPowerKw: 18.0, dailyHours: 20, tariffBandName: 'off-peak', description: 'Process cooling, runs night shift' } }),
  ]);

  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const totalKwh = 32000 + Math.round(Math.random() * 5000);
    const totalCost = parseFloat((totalKwh * 0.26).toFixed(2));

    await prisma.monthlyBill.create({
      data: {
        companyId: techplast.id,
        month,
        year,
        totalCost,
        totalKwh,
        currency: 'GBP',
        bandBreakdowns: {
          create: [
            { bandName: 'peak',     kwh: Math.round(totalKwh * 0.65), cost: parseFloat((totalKwh * 0.65 * 0.32).toFixed(2)) },
            { bandName: 'mid',      kwh: Math.round(totalKwh * 0.12), cost: parseFloat((totalKwh * 0.12 * 0.19).toFixed(2)) },
            { bandName: 'off-peak', kwh: Math.round(totalKwh * 0.23), cost: parseFloat((totalKwh * 0.23 * 0.09).toFixed(2)) },
          ],
        },
      },
    });
  }

  await simulateReadings(techplast.id, 30);
  console.log(`  ✔ TechPlast Industries (${tpMachines.length} machines)`);

  // ── 4. Ferretti Metalworks ───────────────────────────────────────────────────
  const ferretti = await prisma.company.create({
    data: {
      name: 'Ferretti Metalworks',
      email: 'ferretti@example.com',
      passwordHash: await hash('ferretti123'),
      role: 'CLIENT',
      currency: 'EUR',
      emissionFactor: 0.38,
    },
  });

  await prisma.tariffBand.createMany({
    data: [
      { companyId: ferretti.id, name: 'F1-peak',     pricePerKwh: 0.26, startHour: 7,  endHour: 19, color: '#EF4444' },
      { companyId: ferretti.id, name: 'F2-off-peak', pricePerKwh: 0.10, startHour: 19, endHour: 7,  color: '#22C55E' },
    ],
  });

  const ferMachines = await Promise.all([
    prisma.machine.create({ data: { companyId: ferretti.id, name: 'Laser Cutter 4kW',  ratedPowerKw: 4.0,  dailyHours: 10, tariffBandName: 'F1-peak',     description: 'Sheet metal laser cutting' } }),
    prisma.machine.create({ data: { companyId: ferretti.id, name: 'MIG Welding Station',ratedPowerKw: 8.0,  dailyHours: 8,  tariffBandName: 'F1-peak',     description: '3-station MIG welding' } }),
    prisma.machine.create({ data: { companyId: ferretti.id, name: 'Powder Coat Oven',  ratedPowerKw: 14.0, dailyHours: 6,  tariffBandName: 'F1-peak',     description: 'Curing oven 200°C' } }),
    prisma.machine.create({ data: { companyId: ferretti.id, name: 'Air Compressor',    ratedPowerKw: 5.5,  dailyHours: 14, tariffBandName: 'F2-off-peak', description: 'Runs partially on night shift' } }),
  ]);

  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const totalKwh = 9000 + Math.round(Math.random() * 2000);
    const totalCost = parseFloat((totalKwh * 0.20).toFixed(2));

    await prisma.monthlyBill.create({
      data: {
        companyId: ferretti.id,
        month,
        year,
        totalCost,
        totalKwh,
        currency: 'EUR',
        bandBreakdowns: {
          create: [
            { bandName: 'F1-peak',     kwh: Math.round(totalKwh * 0.68), cost: parseFloat((totalKwh * 0.68 * 0.26).toFixed(2)) },
            { bandName: 'F2-off-peak', kwh: Math.round(totalKwh * 0.32), cost: parseFloat((totalKwh * 0.32 * 0.10).toFixed(2)) },
          ],
        },
      },
    });
  }

  await simulateReadings(ferretti.id, 30);
  console.log(`  ✔ Ferretti Metalworks (${ferMachines.length} machines)`);

  // ── Trial subscriptions for all pilot companies ──────────────────────────────
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);

  await prisma.subscription.createMany({
    data: [
      { companyId: acme.id,      status: 'trialing', plan: 'growth',    currentPeriodEnd: trialEnd },
      { companyId: techplast.id, status: 'trialing', plan: 'enterprise', currentPeriodEnd: trialEnd },
      { companyId: ferretti.id,  status: 'trialing', plan: 'starter',   currentPeriodEnd: trialEnd },
    ],
  });
  console.log('  ✔ Trial subscriptions seeded');

  console.log('\nSeed complete. Pilot credentials:');
  console.log('  Admin:     admin@energyiq.com   / admin123');
  console.log('  Client 1:  acme@example.com      / acme123');
  console.log('  Client 2:  techplast@example.com / techplast123');
  console.log('  Client 3:  ferretti@example.com  / ferretti123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
