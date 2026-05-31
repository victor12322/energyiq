interface Props { fullPage?: boolean; size?: 'sm' | 'md' | 'lg'; }

export default function LoadingSpinner({ fullPage = false, size = 'md' }: Props) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  const spinner = (
    <div className={`${sizes[size]} animate-spin rounded-full border-2 border-zinc-700 border-t-green-500`} />
  );
  if (fullPage) {
    return <div className="flex h-screen w-screen items-center justify-center" style={{ background: '#09090b' }}>{spinner}</div>;
  }
  return <div className="flex items-center justify-center p-8">{spinner}</div>;
}
