"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

export function showComingSoonToast() {
  toast.message("Coming soon", {
    description: "We're putting on the finishing touches. Check back shortly.",
  });
}

type ComingSoonButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

/** Keeps label; click shows toast instead of navigating. */
export function ComingSoonButton({ children, className, onClick, ...props }: ComingSoonButtonProps) {
  return (
    <button
      type="button"
      className={cn(className)}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) showComingSoonToast();
      }}
      {...props}
    >
      {children}
    </button>
  );
}
