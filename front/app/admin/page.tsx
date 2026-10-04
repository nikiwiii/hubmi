"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";

function AdminRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab") || "calls";
    router.replace(`/dashboard?tab=${tab}`);
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center h-96 text-stone-400">
      <RefreshCw className="w-5 h-5 animate-spin mr-2" />
      <span className="text-sm font-medium">
        Przekierowywanie do Panelu Zarządzania...
      </span>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-96 text-stone-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm font-medium">Wczytywanie...</span>
        </div>
      }
    >
      <AdminRedirect />
    </Suspense>
  );
}
