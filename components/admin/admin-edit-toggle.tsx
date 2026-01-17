"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminEditToggle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  const editMode = searchParams.get("edit") === "1";

  const toggleHref = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (editMode) {
      params.delete("edit");
    } else {
      params.set("edit", "1");
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, searchParams, editMode]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsAdmin(Boolean(data.user));
    });
  }, []);

  if (!isAdmin) return null;

  return (
    <button
      type="button"
      onClick={() => {
        // Push immediately - toolbar will appear via URL param detection
        router.push(toggleHref);
      }}
      className="text-xs font-light tracking-wide uppercase border border-white/40 px-3 py-1 rounded-full text-white hover:border-white"
    >
      {editMode ? "Exit Edit" : "Edit"}
    </button>
  );
}
