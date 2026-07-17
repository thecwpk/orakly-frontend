import type { Metadata } from "next";
import { SignInPage } from "@/widgets/auth/sign-in-page";

export const metadata: Metadata = {
  title: "Sign in: Orakly",
  description: "Connect a wallet to start trading conviction on Orakly.",
};

export default function SignInRoute() {
  return <SignInPage />;
}
