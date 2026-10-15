import type { ReactNode } from "react";
import Image from "next/image";

interface AuthFrameProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  variant?: "farmer" | "forest";
}

export default function AuthFrame({
  eyebrow,
  title,
  description,
  children,
  footer,
  variant = "farmer",
}: AuthFrameProps) {
  const isForest = variant === "forest";

  return (
    <main
      className={`relative flex min-h-screen items-center justify-center overflow-hidden px-3 py-6 sm:px-4 ${
        isForest ? "auth-shell" : "auth-shell-light"
      }`}
    >
      {isForest && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center opacity-55"
            style={{
              backgroundImage: "url('/images/farmer-login.png')",
            }}
          />
          <div className="auth-overlay absolute inset-0" />
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
        </>
      )}

      <div
        className={`auth-popup relative z-10 w-full max-w-[430px] overflow-hidden ${
          isForest ? "border border-white/15 shadow-[0_30px_80px_rgba(43,29,21,0.42)]" : "auth-popup-light border border-line shadow-[0_18px_45px_rgba(74,49,31,0.18)]"
        }`}
      >
        <section className={`relative overflow-hidden ${isForest ? "bg-[#2b1d15]/55" : "bg-surface-raised"}`}>
          <div className={`relative px-5 pb-6 pt-5 ${isForest ? "text-white" : "text-leaf-900"}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isForest ? "bg-white/12 text-white" : "bg-[#E7D7BD] text-leaf-700"
                  }`}
                >
                  <Image src="/icons/sinchai.svg" alt="" aria-hidden="true" width={24} height={24} className="rounded-md" />
                </span>
                <span className={`text-base font-bold tracking-wide ${isForest ? "text-white" : "text-leaf-900"}`}>
                  SinchAI
                </span>
              </div>

              {isForest && (
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
                  Smart Farming
                </span>
              )}
            </div>

            <div className="mt-5 flex items-center justify-center">
              <div className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border ${isForest ? "border-white/30 bg-white/10" : "border-[#CDBA9B] bg-[#E8DDC9]"}`}>
                <Image
                  src="/images/farmer-login.png"
                  alt="Farmer profile"
                  width={64}
                  height={64}
                  className="h-full w-full object-cover object-top"
                />
              </div>
            </div>

            <div className="mt-5 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#E4CDA5]">
                {eyebrow}
              </p>
              <h1 className={`mt-3 text-3xl font-bold tracking-tight ${isForest ? "text-white" : "text-leaf-900"}`}>
                {title}
              </h1>
              <p className={`mt-2 text-sm leading-6 ${isForest ? "text-white/75" : "text-leaf-700/75"}`}>
                {description}
              </p>
            </div>
          </div>
        </section>

        <section className={`relative z-30 px-5 pb-5 pt-4 ${isForest ? "bg-[#34251c]/75 text-white" : "bg-surface text-leaf-900"}`}>
          <div className="mt-2">{children}</div>

          <div className={`mt-5 text-center text-sm ${isForest ? "text-white/70" : "text-leaf-700/70"}`}>
            {footer}
          </div>
        </section>
      </div>
    </main>
  );
}
