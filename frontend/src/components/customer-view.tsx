"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMockLogin } from "./mock-login-provider";

// Keep the two demo interfaces separate. This is UI routing, not API authorization.
export function CustomerView({ children }: { children: ReactNode }) {
  const { user, ready } = useMockLogin();
  const router = useRouter();
  const isAdmin = user?.role === "Admin";

  useEffect(() => {
    if (ready && isAdmin) router.replace("/admin");
  }, [ready, isAdmin, router]);

  if (!ready || isAdmin)
    return <div className="container empty-state inner-page"><span className="spinner" /><p>กำลังเปิดหน้าที่เหมาะกับบัญชีของคุณ...</p></div>;
  return children;
}
