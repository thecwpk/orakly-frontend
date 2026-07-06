"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import {
  AdminApiError,
  adminLogout,
  adminMeQueryKey,
  type AdminMe,
} from "./lib/admin-api";
import { hasPermission } from "./lib/permissions";
import { useAdminMeQuery } from "./hooks/use-admin-queries";
import { useAdminWalletBootstrap } from "./hooks/use-admin-wallet-bootstrap";
import { AdminMarketsPage } from "./admin-markets-page";
import { adminUi } from "./lib/admin-ui-classes";
import "@/widgets/admin-dashboard/admin-hub-scope.css";

export function AdminMarketsRoutePage() {
  const router = useRouter();
  const meQ = useAdminMeQuery(true);
  const qc = useQueryClient();
  const { state: bootstrapState, walletOperator, bootstrap } =
    useAdminWalletBootstrap(ROUTES.adminMarkets);

  useEffect(() => {
    if (
      meQ.isError &&
      meQ.error instanceof AdminApiError &&
      meQ.error.status === 401
    ) {
      if (bootstrapState === "booting") return;
      if (walletOperator) {
        void bootstrap().then((ok) => {
          if (ok) void qc.invalidateQueries({ queryKey: adminMeQueryKey });
          else router.replace(ROUTES.adminLogin);
        });
        return;
      }
      router.replace(ROUTES.adminLogin);
    }
  }, [bootstrap, bootstrapState, meQ.error, meQ.isError, qc, router, walletOperator]);

  const me: AdminMe | undefined = meQ.data;
  const permissions = useMemo(() => me?.permissions ?? [], [me?.permissions]);

  const signOut = useMutation({
    mutationFn: () => adminLogout(),
    onSuccess: () => {
      toast.success("Signed out");
      qc.removeQueries({ queryKey: ["admin"] });
      router.replace(ROUTES.adminLogin);
    },
    onError: () => toast.error("Sign-out failed"),
  });

  if (meQ.isLoading || bootstrapState === "booting") {
    return (
      <div className="hub-container flex min-h-[50vh] items-center justify-center text-[var(--hub-muted)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--hub-primary-bright)]" />
      </div>
    );
  }

  if (!me) return null;

  const canCreate = hasPermission(permissions, ["markets.write"]);
  const canModerate = hasPermission(permissions, ["markets.moderate"]);
  const canResolve = hasPermission(permissions, ["markets.resolve"]);
  const canView = hasPermission(permissions, ["analytics.read"]);

  if (!canView) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <ShieldAlert className="h-10 w-10 text-amber-200" />
        <p className="text-[14px] font-semibold text-[var(--hub-fg)]">Access denied</p>
        <button
          type="button"
          onClick={() => signOut.mutate()}
          className={adminUi.btnGhost}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="hub-container max-w-[1600px] px-3 py-6 sm:px-4 lg:px-6 lg:py-8">
      <AdminMarketsPage
        canCreate={canCreate}
        canModerate={canModerate}
        canResolve={canResolve}
      />
    </div>
  );
}
