"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function WelcomePage() {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-paper">
      <div className="mx-auto flex min-h-full max-w-md flex-col">
        <div
          className="relative h-[56vh] min-h-[320px] rounded-b-[44px] bg-cover bg-center"
          style={{ backgroundImage: "url('/images/farmer-login.png')" }}
        >
          <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-white/90 py-1.5 pl-1.5 pr-4 shadow-sm">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-leaf-600 text-white">
              <Image src="/icons/sinchai.svg" alt="" aria-hidden="true" width={32} height={32} className="rounded-full" />
            </span>
            <span className="font-display text-base text-leaf-1200">SinchAI</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-6 pb-8 pt-8">
          <h1 className="font-display text-[34px] leading-[1.08] text-leaf-900">
            {t("Farmers smart companion. Know when to water, and how much.")}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-leaf-900/70">
            {t("Soil moisture, weather and crop stage, turned into a simple irrigation plan for every field.")}
          </p>

          <div className="mt-auto pt-10">
            <Link
              href="/signup"
              className="flex items-center justify-between rounded-full bg-leaf-600 py-2 pl-8 pr-2 text-lg font-bold text-white shadow-[0_10px_24px_-8px_rgba(77,53,37,0.45)] transition-transform active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-900"
            >
              {t("Get started")}
              <span className="grid h-12 w-12 place-items-center rounded-full bg-lime text-leaf-900">
                <ArrowRight size={22} />
              </span>
            </Link>
            <p className="mt-5 text-center text-sm text-leaf-900/70">
              {t("Already have an account?")}{" "}
              <Link href="/login" className="font-bold text-leaf-600 underline underline-offset-4">
                {t("Log in")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
