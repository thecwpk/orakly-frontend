import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  header?: ReactNode;
  sidebar?: ReactNode;
};

export function AppShell({ children, header, sidebar }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {header}
      <div className="flex flex-1">
        {sidebar}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
