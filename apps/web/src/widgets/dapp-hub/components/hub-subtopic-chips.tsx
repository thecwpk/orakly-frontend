"use client";

import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";

const SUBTOPICS = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "breaking", label: "Breaking" },
  { id: "volume", label: "High volume" },
] as const;

function buildHref(
  pathname: string,
  searchParams: URLSearchParams,
  topic: (typeof SUBTOPICS)[number]["id"],
): string {
  const qs = new URLSearchParams(searchParams.toString());
  qs.delete("breaking");
  qs.delete("sort");

  if (topic === "breaking") {
    qs.set("breaking", "1");
  } else if (topic === "volume") {
    qs.set("sort", "volume");
  }

  const q = qs.toString();
  return q ? `${pathname}?${q}` : pathname;
}

function activeTopic(searchParams: URLSearchParams): (typeof SUBTOPICS)[number]["id"] {
  if (searchParams.get("breaking") === "1") return "breaking";
  if (searchParams.get("sort") === "volume") return "volume";
  return "all";
}

/** Secondary filter row — All · Breaking · High volume. */
export function HubSubtopicChips() {
  const pathname = usePathname() ?? ROUTES.dapp;
  const searchParams = useSearchParams();
  const active = activeTopic(searchParams ?? new URLSearchParams());

  return (
    <div className="hub-subtopic-chips" role="tablist" aria-label="Feed filters">
      {SUBTOPICS.map((topic) => {
        const isActive = active === topic.id;
        const Icon = "icon" in topic ? topic.icon : null;
        return (
          <Link
            key={topic.id}
            href={buildHref(pathname, searchParams ?? new URLSearchParams(), topic.id)}
            role="tab"
            aria-selected={isActive}
            className={cn("hub-subtopic-chip", isActive && "hub-subtopic-chip--active")}
          >
            {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden /> : null}
            {topic.label}
          </Link>
        );
      })}
    </div>
  );
}
