import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AdminLoginPage } from "@/widgets/admin-dashboard/admin-login-page";

export default function AdminLoginRoute() {
  return (
    <Suspense
      fallback={
        <div className="hub-container flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--hub-primary-bright)]" />
        </div>
      }
    >
      <AdminLoginPage />
    </Suspense>
  );
}
