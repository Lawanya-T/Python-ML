"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  CloudRain,
  Droplets,
  Gauge,
  Loader2,
  Play,
  Square,
  Sprout,
  SunMedium,
  TimerReset,
  Waves,
} from "lucide-react";
import * as api from "@/lib/api";
import type { RecommendationResult } from "@/lib/api";
import type { IrrigationHistoryRecord } from "@/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Field = { id: string };
type FeatureVector = Record<string, unknown>;
type IrrigationRecommendation = Awaited<ReturnType<typeof api.getRecommendation>>;
type SessionStatus = "idle" | "running" | "completed" | "stopped";

interface IrrigationRun {
  started_at_ms: number;
  duration_minutes: number;
  water_liters: number;
  irrigation_type: string;
}

const NEED_STYLES: Record<string, { color: string; badge: string; detail: string }> = {
  Low: {
    color: "border-[#D5E0BA] bg-[#F4F8EA] text-[#53633D]",
    badge: "bg-[#FF0044] text-[#53633D]",
    detail: "Light watering, ~15 min",
  },
  Medium: {
    color: "border-[#F0D7A5] bg-[#FFF7E9] text-[#7A5B21]",
    badge: "bg-[#FCE672] text-[#CD6504]",
    detail: "Moderate watering, ~30 min",
  },
  High: {
    color: "border-[#F7C9C4] bg-[#FFF1F0] text-[#8B362F]",
    badge: "bg-[#38D100] text-[#8B362F]",
    detail: "Full watering, ~45–60 min",
  },
};

interface Props {
  field: Field;
  features: FeatureVector;
  refreshKey?: number;
  onRecommendation?: (recommendation: RecommendationResult) => void;
  onIrrigationComplete?: (record: IrrigationHistoryRecord) => void;
}

export default function TodaysSchedule({ field, features, refreshKey = 0, onRecommendation, onIrrigationComplete }: Props) {
  const { t } = useLanguage();
  const [rec, setRec] = useState<IrrigationRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState<IrrigationRun | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("idle");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const finishing = useRef(false);
  const completionHandler = useRef(onIrrigationComplete);
  // eslint-disable-next-line react-hooks/refs
  completionHandler.current = onIrrigationComplete;
  const runStorageKey = `irrigation-run:${field.id}`;
  const statusStorageKey = `irrigation-status:${field.id}`;

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
        setRec(null);
      }
    });

    api
      .getRecommendation(field.id, features)
      .then((result: IrrigationRecommendation) => {
        if (!cancelled) {
          setRec(result);
          onRecommendation?.(result);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not reach the prediction service.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [field.id, features.crop_type, features.moisture, features.temp, features.humidity, features.area_hectare, refreshKey, onRecommendation]);

  useEffect(() => {
    try {
      const savedRun = localStorage.getItem(runStorageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedRun) setRun(JSON.parse(savedRun) as IrrigationRun);
      const savedStatus = JSON.parse(localStorage.getItem(statusStorageKey) || "null") as { date?: string; status?: SessionStatus } | null;
      if (savedStatus?.date === new Date().toDateString() && (savedStatus.status === "completed" || savedStatus.status === "stopped")) {
        setSessionStatus(savedStatus.status);
      }
    } catch {
      localStorage.removeItem(runStorageKey);
      localStorage.removeItem(statusStorageKey);
    }
  }, [runStorageKey, statusStorageKey]);

  const finishSession = useCallback(async (activeRun: IrrigationRun, status: "completed" | "stopped") => {
    if (finishing.current) return;
    finishing.current = true;
    const elapsedMinutes = Math.max(1, Math.ceil((Date.now() - activeRun.started_at_ms) / 60000));
    const durationMinutes = status === "completed"
      ? activeRun.duration_minutes
      : Math.min(activeRun.duration_minutes, elapsedMinutes);
    const waterAppliedLiters = status === "completed"
      ? activeRun.water_liters
      : Math.round(activeRun.water_liters * durationMinutes / activeRun.duration_minutes);

    setRun(null);
    setSessionStatus(status);
    setRemainingSeconds(0);
    localStorage.removeItem(runStorageKey);
    localStorage.setItem(statusStorageKey, JSON.stringify({ status, date: new Date().toDateString() }));

    const record = await api.recordIrrigation(field.id, {
      irrigation_type: activeRun.irrigation_type,
      duration_minutes: durationMinutes,
      water_applied_liters: waterAppliedLiters,
      status,
    });
    completionHandler.current?.(record);
  }, [field.id, runStorageKey, statusStorageKey]);

  useEffect(() => {
    if (!run) return;
    const stopAt = run.started_at_ms + run.duration_minutes * 60_000;
    const updateTimer = () => {
      const secondsLeft = Math.max(0, Math.ceil((stopAt - Date.now()) / 1000));
      setRemainingSeconds(secondsLeft);
      if (secondsLeft === 0) void finishSession(run, "completed");
    };
    updateTimer();
    const timer = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(timer);
  }, [run, finishSession]);

  const startIrrigation = () => {
    if (!rec || sessionStatus === "completed") return;
    finishing.current = false;
    const nextRun: IrrigationRun = {
      started_at_ms: Date.now(),
      duration_minutes: Math.max(1, rec.recommended_duration_minutes),
      water_liters: rec.recommended_volume_liters,
      irrigation_type: rec.recommended_irrigation_type,
    };
    localStorage.setItem(runStorageKey, JSON.stringify(nextRun));
    setSessionStatus("running");
    setRun(nextRun);
  };

  const formattedRemaining = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  const rainAwareMessage = useMemo(() => {
    const humidity = Number(features.humidity ?? 55);
    return humidity >= 75
      ? t("Rain is likely today; delay watering by 1–2 hours if the sky remains cloudy.")
      : humidity >= 60
        ? t("Cloud cover is moderate; reduce irrigation by 10–15% if rain arrives.")
        : t("Dry conditions expected; irrigation should stay on the planned schedule.");
  }, [features.humidity, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white p-6 text-gray-500 shadow-sm">
        <Loader2 size={18} className="animate-spin" />
        {t("Getting today&apos;s recommendation…")}
      </div>
    );
  }

  if (error || !rec) {
    return (
      <div className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">{t("Couldn&apos;t load today&apos;s schedule")}</p>
          <p className="mt-0.5 text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const style = NEED_STYLES[rec.recommended_need_level] ?? NEED_STYLES.Medium;
  const scheduleItems = [
    { icon: CalendarClock, label: t("Window"), value: rec.recommended_time || t("Check later") },
    { icon: TimerReset, label: t("Duration"), value: `${rec.recommended_duration_minutes} ${t("min")}` },
    { icon: Droplets, label: t("Water"), value: `${rec.recommended_volume_liters.toLocaleString()} L` },
    { icon: CloudRain, label: t("Rain watch"), value: rainAwareMessage },
  ];

  return (
    <div className={`rounded-3xl border p-4 shadow-sm ${style.color}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white/60 text-current shadow-sm">
            <Sprout size={18} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-75">{t("Smart irrigation")}</p>
            <h3 className="text-lg font-bold">{t("Rain-Aware Recommendation")}</h3>
          </div>
        </div>
        <span className={`whitespace-nowrap rounded-full border border-black/10 px-2.5 py-1 text-sm font-semibold ${style.badge}`}>
          {rec.recommended_need_level} need
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-black/10 bg-white/50 p-3 text-sm backdrop-blur-sm">
        <div className="flex items-center gap-2 text-current">
          <Waves size={16} />
          <span>
            {t("Method")}: <strong>{rec.recommended_irrigation_type}</strong>
          </span>
        </div>
        <div className="mt-2 flex items-start gap-2 text-current">
          <SunMedium size={16} className="mt-0.5 shrink-0" />
          <span>{rainAwareMessage}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {scheduleItems.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex gap-3 rounded-2xl border border-black/10 bg-white/45 p-2.5 shadow-inner shadow-white/30">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 bg-white/70 text-current">
              <Icon size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#C25A0A]">{label}</p>
              <p className="mt-1 text-sm font-medium break-words">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-black/10 bg-white/50 p-3">
        <div className="flex items-center gap-2">
          <Gauge size={16} />
          <span className="text-sm font-medium">{rec.values_are_estimated ? t("Estimated water") : t("Target water")}</span>
        </div>
        <span className="text-sm font-bold">{rec.recommended_volume_liters.toLocaleString()} L</span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock3 size={16} />
              <span>{run ? `${t("Irrigation running now")} · ${formattedRemaining} ${t("left")}` : sessionStatus === "completed" ? t("Completed today") : sessionStatus === "stopped" ? t("Stopped early") : t("Today's schedule ready")}</span>
        </div>

        {run ? (
          <button
            type="button"
            onClick={() => void finishSession(run, "stopped")}
            className="inline-flex whitespace-nowrap items-center gap-2 rounded-lg border border-black/10 bg-red-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-800"
          >
            <Square size={15} /> {t("Stop irrigation")}
          </button>
        ) : (
          <button
            type="button"
            onClick={startIrrigation}
            disabled={sessionStatus === "completed"}
            className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-[#A7FF4F] px-3.5 py-2 text-sm font-semibold text-[#4D3525] shadow-sm transition hover:bg-[#3FC846] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sessionStatus === "completed" ? <CheckCircle2 size={16} /> : <Play size={16} />}
            {sessionStatus === "completed" ? t("Completed today") : sessionStatus === "stopped" ? t("Restart irrigation") : t("Start irrigation")}
          </button>
        )}
      </div>

      {sessionStatus === "completed" && !run && (
        <p role="alert" className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
          {t("Irrigation time is complete. Stop the water flow now.")} {t("This session was added to history.")}
        </p>
      )}
      {sessionStatus === "stopped" && !run && (
        <p role="status" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {t("Irrigation stopped early and recorded in history.")}
        </p>
      )}

      {rec.model_confidence !== null && !rec.is_fallback && (
        <p className="mt-3 text-xs opacity-75">
          Model confidence: {(rec.model_confidence * 100).toFixed(0)}%
        </p>
      )}

      {rec.is_fallback && (
        <p className="mt-3 rounded-xl border border-black/10 bg-white/45 p-2 text-xs">
          {t("Local guidance based on field conditions; prediction service is unavailable.")}
        </p>
      )}

      {rec.override_reasons.length > 0 && (
        <div className="mt-3 rounded-xl border border-black/10 bg-white/45 p-2 text-xs">
          {rec.override_reasons.map((reason: string, i: number) => (
            <p key={i} className="mt-1 flex items-start gap-1.5">
              <span className="mt-0.5 text-amber-500">⚠</span>
              <span>{reason}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
