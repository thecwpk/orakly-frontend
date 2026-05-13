"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Mobile-only slide-in drawer that hosts the sidebar. */
export function AdminSidebarDrawer({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-40 bg-black/70 supports-[backdrop-filter]:backdrop-blur-sm lg:hidden",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex max-w-[88%] flex-col p-3 lg:hidden",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
            "outline-none",
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Admin navigation
          </DialogPrimitive.Title>
          {children}
          <DialogPrimitive.Close
            aria-label="Close menu"
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/[0.04] text-zinc-300 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08]"
          >
            <X className="h-3.5 w-3.5" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
