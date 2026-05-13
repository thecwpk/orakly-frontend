import { Section } from "@/shared/ui";

export default function Loading() {
  return (
    <>
      <Section spacing="loose" width="lg">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="skeleton-shimmer h-5 w-36 rounded-full bg-white/[0.04]" />
            <div className="skeleton-shimmer h-5 w-44 rounded-full bg-white/[0.04]" />
          </div>
          <div className="skeleton-shimmer h-10 w-full max-w-2xl rounded-md bg-white/[0.04]" />
          <div className="skeleton-shimmer h-10 w-3/4 max-w-xl rounded-md bg-white/[0.04]" />
          <div className="skeleton-shimmer h-4 w-2/3 max-w-md rounded-full bg-white/[0.03]" />

          <div className="mt-8 skeleton-shimmer h-[164px] w-full rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06]" />

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="skeleton-shimmer h-[68px] rounded-xl bg-white/[0.03] ring-1 ring-white/[0.05]"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        </div>
      </Section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 pb-16 sm:px-6 md:space-y-20 md:pb-20">
        <div className="space-y-4">
          <div className="skeleton-shimmer h-3 w-32 rounded-full bg-white/[0.04]" />
          <div className="skeleton-shimmer h-7 w-56 rounded-md bg-white/[0.04]" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="skeleton-shimmer h-[160px] w-[78%] shrink-0 rounded-xl bg-white/[0.03] ring-1 ring-white/[0.05] sm:w-[44%] md:w-[34%] lg:w-[28%] xl:w-[24%]"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
