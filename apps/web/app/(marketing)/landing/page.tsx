import { permanentRedirect } from "next/navigation";

/** `/landing` is a permanent alias of `/` (entry is the root marketing page). */
export default function LegacyLandingPathRedirect() {
  permanentRedirect("/");
}
