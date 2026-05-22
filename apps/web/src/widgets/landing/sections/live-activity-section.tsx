"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RealtimeActivityFeed } from "@/features/realtime-activity";
import { ROUTES } from "@/shared/constants/routes";
import { SectionShell } from "../components/section-shell";

const NEW_TAB = { target: "_blank" as const, rel: "noopener noreferrer" as const };

/**
 * Landing-page live activity section. Wraps the canonical
 * `RealtimeActivityFeed` widget — the same one rendered on `/activity` and
 * inside market detail panels — and renders it in a marketing-friendly shell
 * with eyebrow, title and a "view all" affordance.
 */
export function LiveActivitySection() {
  return (
    <SectionShell
      id="live-activity"
      eyebrow="Tape"
      title="Live activity"
      description="Every fill, settlement, and platform update streams here in real time as the market room fans out."
      action={
        <Button
          asChild
          variant="ghost"
          size="xs"
          className="h-auto gap-1 px-2 py-1 text-[11px] font-medium text-cyan-400/90 hover:bg-white/[0.04] hover:text-cyan-300"
        >
          <Link href={ROUTES.activity} {...NEW_TAB}>
            Open activity hub
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      }
    >
      <RealtimeActivityFeed
        title={null}
        height="380px"
      />
    </SectionShell>
  );
}
