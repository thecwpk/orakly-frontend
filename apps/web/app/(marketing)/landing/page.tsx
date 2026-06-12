import { permanentRedirect } from "next/navigation";

import { ROUTES } from "@/shared/constants/routes";

/** Legacy in-app landing path — marketing site is separate; hub entry is `/dapp`. */
export default function LegacyLandingPathRedirect() {
  permanentRedirect(ROUTES.dapp);
}
