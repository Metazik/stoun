import { BottomNav, Sidebar } from "@/components/ui/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="min-h-screen md:pl-60">{children}</main>
      <BottomNav />
    </div>
  );
}
