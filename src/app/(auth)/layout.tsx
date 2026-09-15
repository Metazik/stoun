import { Music2 } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-stoun-radial" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stoun-gradient shadow-glow">
            <Music2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Stoun</h1>
          <p className="text-sm text-muted">Ma voix, transformée en vraie production.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
