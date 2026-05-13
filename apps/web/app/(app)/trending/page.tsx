import { redirect } from "next/navigation";
import { ROUTES } from "@/shared/constants/routes";

/** Legacy path — trending tape lives on the markets explorer with `trending=1`. */
export default function TrendingLegacyRedirectPage() {
  redirect(ROUTES.marketsTrending);
}
