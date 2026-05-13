import { Sparkles } from "lucide-react";

export function CommunitySection() {
  return (
    <section id="community" className="marketing-section-slab border-b border-border py-16 sm:py-20">
      <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-1 size-6 shrink-0 text-primary/80" aria-hidden />
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Powered by the community</h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
              The future of crypto narratives is community-driven.
            </p>
          </div>
        </div>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Create markets",
            "Build reputation",
            "Compete on leaderboards",
            "Earn from accurate predictions",
            "Discover emerging narratives early",
          ].map((item) => (
            <li
              key={item}
              className="rounded-xl border border-border bg-card/40 px-4 py-3 text-sm font-medium text-card-foreground transition hover:border-yes/20"
            >
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center text-sm text-muted-foreground">Orakly is designed to evolve alongside its community.</p>
      </div>
    </section>
  );
}
