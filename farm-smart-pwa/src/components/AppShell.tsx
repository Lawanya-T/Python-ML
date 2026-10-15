// src/components/AppShell.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Sprout, Calendar, History, BarChart3,
  FileText, User, Home, TrendingUp, Menu, X, LogOut, Bell, Globe2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import BrownDropdown from "@/components/BrownDropdown";
import type { Lang } from "@/lib/i18n/translations";
import AIAssistant from "./AIAssistant";

const NAV = [
  { href: "/", labelKey: "dashboard" as const, icon: LayoutDashboard },
  { href: "/fields", labelKey: "fields" as const, icon: Sprout },
  { href: "/schedule", labelKey: "schedule" as const, icon: Calendar },
  { href: "/history", labelKey: "history" as const, icon: History },
  { href: "/analytics", labelKey: "analytics" as const, icon: BarChart3 },
  { href: "/reports", labelKey: "reports" as const, icon: FileText },
];

const BOTTOM_NAV = [
  { href: "/", labelKey: "home" as const, icon: Home },
  { href: "/fields", labelKey: "fields" as const, icon: Sprout },
  { href: "/schedule", labelKey: "schedule" as const, icon: Calendar },
  { href: "/history", labelKey: "history" as const, icon: History },
  { href: "/analytics", labelKey: "trends" as const, icon: TrendingUp },
  { href: "/profile", labelKey: "profile" as const, icon: User },
];

const PUBLIC_ROUTES = ["/login", "/register", "/signup", "/welcome", "/logout"];

const LANGUAGE_OPTIONS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "mr", label: "मराठी" },
  { code: "ta", label: "தமிழ்" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
  { code: "bn", label: "বাংলা" },
  { code: "te", label: "తెలుగు" },
  { code: "gu", label: "ગુજરાતી" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      router.push("/login");
    }
  }, [loading, user, isPublicRoute, pathname, router]);

  const changeLanguage = (nextLang: Lang) => setLang(nextLang);

  // Login/register pages render without the sidebar/nav chrome
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Don't flash protected content while auth state is still loading or redirecting
  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-paper" />;
  }

  return (
    <div className="min-h-screen bg-paper md:flex">
      {/* Sidebar — desktop/tablet */}
      <aside className="sticky top-0 hidden h-screen w-[112px] flex-shrink-0 flex-col border-r border-[#493326] bg-gradient-to-b from-[#35251c] via-[#493326] to-[#281b14] text-[#F7F0E5] md:flex">
        <div className="flex flex-col items-center gap-1 px-2 pb-4 pt-5 text-center">
          <Image src="/icons/sinchai.svg" alt="" aria-hidden="true" width={32} height={32} className="rounded-lg" />
            <span className="text-[9px] font-bold leading-tight tracking-wide">SINCHAI</span>
        </div>

        <nav aria-label="Main navigation" className="sidebar-nav-scroll min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-2 py-2">
          {NAV.map(({ href, labelKey, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={t(labelKey)}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-center transition ${
                    active ? "bg-[#777B55] text-white shadow-sm" : "text-[#E7DCCC]/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span className="max-w-full truncate text-[10px] font-medium leading-tight">{t(labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-white/10 px-2 py-3">
          <label className="flex w-full cursor-pointer flex-col items-center gap-1 rounded-lg py-2 text-[#E7DCCC]/75 hover:bg-white/10 hover:text-white">
            <Globe2 size={18} />
            <BrownDropdown
              value={lang}
              onChange={(value) => changeLanguage(value as Lang)}
              label="Change language"
              options={LANGUAGE_OPTIONS.map((option) => ({ value: option.code, label: option.label }))}
              className="w-[94px] min-w-0 rounded-md border-white/10 bg-[#35251c] px-1 py-1 text-xs font-semibold text-white"
            />
          </label>
          <Link
            href="/profile"
            title={t("profile")}
            className="flex flex-col items-center gap-1 rounded-lg py-2 text-[#E7DCCC]/75 hover:bg-white/10 hover:text-white"
          >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="max-w-full truncate text-[10px] leading-tight">{user.name.split(" ")[0]}</span>
          </Link>
          <button
            onClick={logout}
            aria-label="Log out"
            title="Log out"
              className="flex w-full flex-col items-center gap-1 rounded-lg py-2 text-[#E7DCCC]/75 hover:bg-white/10 hover:text-white"
          >
            <LogOut size={18} />
              <span className="text-[10px] leading-tight">{t("Log out")}</span>
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-surface px-4 py-4 text-leaf-900 md:hidden">
        <button
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation"
          className="rounded-full bg-white p-2 shadow-sm"
        >
          <Menu size={19} />
        </button>
        <div className="flex items-center gap-1.5 text-sm font-bold tracking-tight">
          <Image src="/icons/sinchai.svg" alt="" aria-hidden="true" width={24} height={24} className="rounded-md" /> SinchAI
        </div>
        <div className="flex items-center gap-2">
          <Link href="/#alerts" aria-label="View notifications" className="rounded-full bg-surface-raised p-2 text-leaf-700 shadow-sm">
            <Bell size={17} />
          </Link>
            <BrownDropdown
              value={lang}
              onChange={(value) => changeLanguage(value as Lang)}
              label="Change language"
              options={LANGUAGE_OPTIONS.map((option) => ({ value: option.code, label: option.code.toUpperCase() }))}
              className="w-[40px] min-w-0 rounded-md border-line bg-leaf-700 px-1 py-1 text-xs font-bold text-white"
            />
        </div>
      </header>

      {/* Mobile slide-out menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-gradient-to-b from-[#35251c] via-[#493326] to-[#281b14] p-4 text-[#F7F0E5]">
            <button onClick={() => setMobileMenuOpen(false)} className="mb-4 p-1">
              <X size={22} />
            </button>
            <nav className="space-y-1">
              {NAV.map(({ href, labelKey, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#E7DCCC]/80 hover:bg-white/5"
                >
                  <Icon size={17} /> {t(labelKey)}
                </Link>
              ))}
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#E7DCCC]/80 hover:bg-white/5"
              >
                <LogOut size={17} /> {t("Log out")}
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <main className="app-page-background pb-20 md:pb-6">{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-line bg-surface/95 shadow-[0_-8px_24px_rgba(55,38,24,0.08)] backdrop-blur md:hidden">
          {BOTTOM_NAV.map(({ href, labelKey, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                  active ? "text-leaf-700" : "text-[#998D7D]"
                }`}
              >
                <Icon size={19} />
                {t(labelKey)}
              </Link>
            );
          })}
        </nav>
      </div>

      <AIAssistant />
    </div>
  );
}
