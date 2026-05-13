import { Section, Stack } from "@/shared/ui";

export default function Loading() {
  return (
    <Section spacing="default" width="lg">
      <Stack gap="xl">
        <div className="space-y-2">
          <div className="skeleton-shimmer h-3 w-32 rounded-full bg-white/[0.04]" />
          <div className="skeleton-shimmer h-7 w-56 rounded-md bg-white/[0.04]" />
          <div className="skeleton-shimmer h-3 w-72 rounded-full bg-white/[0.03]" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer h-[148px] rounded-xl bg-white/[0.03] ring-1 ring-white/[0.05]"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      </Stack>
    </Section>
  );
}
