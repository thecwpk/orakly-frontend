import { Section } from "@/shared/ui";

export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <Section spacing="default" width="lg">
        <div className="space-y-3">
          <div className="skeleton-shimmer h-4 w-24 rounded-full bg-white/[0.04]" />
          <div className="skeleton-shimmer h-9 w-48 rounded-md bg-white/[0.04]" />
          <div className="skeleton-shimmer h-4 w-full max-w-md rounded bg-white/[0.03]" />
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer h-28 rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06]"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      </Section>
    </main>
  );
}
