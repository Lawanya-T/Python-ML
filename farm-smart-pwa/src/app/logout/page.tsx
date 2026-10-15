"use client";

import { useEffect, useRef } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

export default function LogoutPage() {
  const { logout } = useAuth();
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    if (hasLoggedOut.current) return;
    hasLoggedOut.current = true;
    logout();
  }, [logout]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-leaf-700 text-white">
          <LogOut size={22} />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Signing you out</h1>
        <p className="mt-1 text-sm text-gray-500">Redirecting to the login page...</p>
      </div>
    </main>
  );
}
