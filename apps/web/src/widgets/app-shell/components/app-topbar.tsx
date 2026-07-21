"use client";

import { Navbar } from "./Navbar";

export type AppTopbarDensity = "default" | "hub";

/**
 * Thin wrapper kept for existing AppShell imports.
 * Product chrome lives in `Navbar`.
 */
export function AppTopbar(_props: { density?: AppTopbarDensity }) {
  return <Navbar />;
}
