"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { User, Loader2, Cloud, CloudLightning, CloudRain, CloudSnow, CloudSun, MapPin, Moon, Sprout, Sun, Droplets, Plus, ArrowRight } from "lucide-react";
import { api, type Field as ApiField } from "@/lib/api";
import { generateAlertsForField, type IrrigationAlert } from "@/lib/alerts";
import { dispatchAlertNotifications } from "@/lib/notify";
import { getPushSubscription } from "@/lib/push";
import { DEMO_FIELDS, demoIrrigationHistory, demoSensorHistory, demoWeatherForecast } from "@/lib/demoData";
import FieldSummaryCard from "@/components/fieldSummarychart";
import TodaysSchedule from "@/components/todaysScheduler";
import AlertsList from "@/components/AlertsList";
import { SoilMoistureChart, WaterUsageChart, WeatherChart } from "@/components/Charts";
import type { IrrigationHistoryRecord, SensorReading, WeatherForecastDay, WeatherInfo } from "@/types";
import type { RecommendationResult } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function getWeatherKind(condition?: string): "sunny" | "rainy" | "stormy" | "snowy" | "cloudy" {
  const normalized = condition?.toLowerCase() ?? "";
  if (normalized.includes("thunder") || normalized.includes("storm")) return "stormy";
  if (normalized.includes("snow")) return "snowy";
  if (normalized.includes("rain") || normalized.includes("drizzle")) return "rainy";
  if (normalized.includes("clear") || normalized.includes("sun")) return "sunny";
  return "cloudy";
}

function WeatherScene({ condition, kind }: { condition: string; kind: ReturnType<typeof getWeatherKind> }) {
  const label = condition.toLowerCase();
  if (kind === "sunny") return <Sun aria-hidden="true" className="weather-sun h-20 w-20 text-yellow-500" strokeWidth={1.4} />;
  if (kind === "stormy") return <CloudLightning aria-hidden="true" className="weather-lightning h-20 w-20 text-indigo-600" strokeWidth={1.4} />;
  if (kind === "snowy") return <CloudSnow aria-hidden="true" className="weather-cloud h-20 w-20 text-sky-600" strokeWidth={1.4} />;
  if (kind === "rainy") return <CloudRain aria-hidden="true" className="weather-cloud h-20 w-20 text-sky-500" strokeWidth={1.4} />;
  if (label.includes("partly")) return <CloudSun aria-hidden="true" className="weather-cloud h-20 w-20 text-amber-500" strokeWidth={1.4} />;
  if (label.includes("fog")) return <Cloud aria-hidden="true" className="weather-cloud h-20 w-20 text-slate-500" strokeWidth={1.4} />;
  return <Cloud aria-hidden="true" className="weather-cloud h-20 w-20 text-slate-500" strokeWidth={1.4} />;
}

export default function DashboardPage() {
  const [fields, setFields] = useState<ApiField[]>([]);
  const [latestReadings, setLatestReadings] = useState<Record<string, SensorReading>>({});
  const [temperatures, setTemperatures] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [weatherLocation, setWeatherLocation] = useState("");
  const [weatherResult, setWeatherResult] = useState<{
    location: string;
    weather: WeatherInfo | null;
    error: boolean;
  } | null>(null);
  const [sensorTrend, setSensorTrend] = useState<SensorReading[]>([]);
  const [weatherTrend, setWeatherTrend] = useState<WeatherForecastDay[]>([]);
  const [recentIrrigation, setRecentIrrigation] = useState<IrrigationHistoryRecord[]>([]);
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [completionAlert, setCompletionAlert] = useState<IrrigationAlert | null>(null);
  const [pushReady, setPushReady] = useState(false);
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const farmerName = profile?.name || user?.name || "Farmer";

  const handleIrrigationComplete = useCallback((record: IrrigationHistoryRecord) => {
    const field = fields.find((item) => item.id === record.field_id);
    setCompletionAlert({
      id: `irrigation-stop:${record.id}`,
      fieldId: record.field_id,
      fieldName: field?.name ?? `Field ${record.field_id}`,
      type: "system_status",
      severity: "warning",
      title: "Irrigation complete: stop the water",
      message: `${record.irrigation_type} has completed for ${record.duration_minutes ?? 0} minutes. Stop the water flow now.`,
      timestamp: record.irrigated_at,
      isRead: false,
    });
  }, [fields]);

  useEffect(() => {
    api
      .getFields()
      .then(async (fetchedFields) => {
        setFields(fetchedFields);
        setUsingDemoData(fetchedFields.length > 0 && fetchedFields.every((field) => field.is_demo_data === true));
        setTemperatures(Object.fromEntries(fetchedFields.map((field) => [field.id, field.temp ?? 28])));
        let profileLocation = "";
        try {
          const savedProfile = localStorage.getItem("farmer_profile");
          if (savedProfile) {
            const profile = JSON.parse(savedProfile) as { village?: unknown };
            if (typeof profile.village === "string") profileLocation = profile.village.trim();
          }
        } catch {
          profileLocation = "";
        }
        setWeatherLocation(profileLocation || fetchedFields[0]?.location || "");
        const fieldReadings = await Promise.all(fetchedFields.map(async (field) => {
          try {
            return [field.id, await api.getLatestSensorReading(field.id)] as const;
          } catch {
            return null;
          }
        }));
        const readings = Object.fromEntries(fieldReadings.filter((reading) => reading !== null));
        setLatestReadings(readings);
      })
      .catch(() => {
        // Backend field endpoints not available yet — fall back to demo data
        // so the dashboard is still demonstrable.
        setUsingDemoData(true);
        setFields(DEMO_FIELDS);
        const readings: Record<string, SensorReading> = {};
        const temps: Record<string, number> = {};
        DEMO_FIELDS.forEach((f) => {
          const history = demoSensorHistory(f.id, 1);
          readings[f.id] = history[history.length - 1];
          temps[f.id] = demoWeatherForecast(f.id, 1)[0].temperature;
        });
        setLatestReadings(readings);
        setTemperatures(temps);
      })
      .finally(() => setLoading(false));
  }, []);

  const primaryField = fields[0];
  const primaryFieldId = primaryField?.id;
  const primaryFieldLocation = primaryField?.location;
  const weather = weatherResult?.location === weatherLocation ? weatherResult.weather : null;
  const weatherLoading = Boolean(weatherLocation) && weatherResult?.location !== weatherLocation;
  const weatherError = weatherResult?.location === weatherLocation && weatherResult.error;
  const weatherKind = getWeatherKind(weather?.condition);
  const primaryReading = primaryField ? latestReadings[primaryField.id] : undefined;
  const cropMoisture = primaryReading?.moisture_value ?? primaryField?.moisture;
  const moistureStatus = cropMoisture === undefined
    ? "No recent reading"
    : cropMoisture < 30
      ? "Dry"
      : cropMoisture < 60
        ? "Moderate"
        : "Wet";

  const alerts = useMemo(() => {
    const latestIrrigation = recentIrrigation[recentIrrigation.length - 1];
    const fieldAlerts = fields.flatMap((field) => generateAlertsForField(field, {
      sensorReading: latestReadings[field.id],
      weather: field.id === primaryField?.id ? weather : null,
      recommendation: field.id === primaryField?.id ? recommendation : null,
      lastIrrigatedAt: field.id === primaryField?.id ? latestIrrigation?.irrigated_at : null,
    }));
    return completionAlert ? [...fieldAlerts, completionAlert] : fieldAlerts;
  }, [fields, latestReadings, weather, recommendation, recentIrrigation, primaryField?.id, completionAlert]);

  useEffect(() => {
    getPushSubscription()
      .then((subscription) => setPushReady(Boolean(subscription)))
      .catch(() => setPushReady(false));
  }, []);

  useEffect(() => {
    if (!pushReady) return;

    let sentIds: string[] = [];
    try {
      sentIds = JSON.parse(localStorage.getItem("sent_field_alerts") || "[]") as string[];
    } catch {
      sentIds = [];
    }
    const sent = new Set(sentIds);
    const actionableAlerts = alerts.filter((alert) =>
      (alert.severity === "critical" || alert.type === "irrigation_reminder" || alert.type === "weather_warning" || alert.type === "system_status")
      && !sent.has(alert.id)
    );
    if (actionableAlerts.length === 0) return;

    let active = true;
    getPushSubscription().then(async (subscription) => {
      if (!subscription || !active) return;
      await Promise.all(actionableAlerts.map((alert) => dispatchAlertNotifications(alert, { pushSubscription: subscription })));
      if (active) {
        const updatedIds = [...sentIds, ...actionableAlerts.map((alert) => alert.id)];
        localStorage.setItem("sent_field_alerts", JSON.stringify(updatedIds));
      }
    }).catch(() => undefined);

    return () => {
      active = false;
    };
  }, [alerts, pushReady]);

  useEffect(() => {
    if (!primaryFieldId) return;

    let active = true;
    const fieldId = primaryFieldId;
    Promise.all([
      api.getSensorHistory(fieldId, 7).catch(() => []),
      api.getWeatherForecast(weatherLocation || primaryFieldLocation || ""),
      api.getIrrigationHistory(fieldId, 7),
    ]).then(([readings, forecast, history]) => {
      if (!active) return;
      setSensorTrend(readings.length > 0
        ? readings
        : usingDemoData
          ? demoSensorHistory(fieldId, 7)
          : []);
      setWeatherTrend(forecast);
      const availableHistory = history.length > 0
        ? history
        : usingDemoData
          ? demoIrrigationHistory(fieldId, 7)
          : [];
      setRecentIrrigation(availableHistory.slice().reverse());
    });

    return () => {
      active = false;
    };
  }, [primaryFieldId, primaryFieldLocation, weatherLocation, usingDemoData]);

  useEffect(() => {
    if (!weatherLocation) return;

    let active = true;
    api.getWeather(weatherLocation)
      .then((result) => {
        if (active) setWeatherResult({ location: weatherLocation, weather: result, error: false });
      })
      .catch(() => {
        if (active) setWeatherResult({ location: weatherLocation, weather: null, error: true });
      });

    return () => {
      active = false;
    };
  }, [weatherLocation]);

  return (
    <div
      className={`dashboard-container weather-bg-${weatherKind} mx-auto max-w-4xl px-4 pt-6 pb-10`}
>
      <header className="mb-5 flex items-center justify-between">
        <div>
            <p className="text-sm text-gray-500">{t("Welcome back")}, {farmerName}</p>
            <h1 className="text-xl font-bold text-gray-900">{t("Your Fields")}</h1>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8DDC9] text-leaf-700">
          <User size={20} />
        </div>
      </header>

      {usingDemoData && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
            {t("Backend demo warning")}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
          <Loader2 size={18} className="animate-spin" /> Loading your fields…
        </div>
      ) : (
        <>
          <section className="mb-4 grid gap-3 sm:grid-cols-[1.4fr_1fr]" aria-label={t("Local weather")}>
            <div className="weather-panel rounded-2xl border p-4 sm:p-5" data-weather={weatherKind}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <CloudSun size={17} /> {t("Local weather")}
                  </p>
                  <p className="mt-2 flex items-center gap-1 truncate text-sm opacity-80">
                    <MapPin size={14} /> {weather?.location || weatherLocation || t("Location not set")}
                  </p>
                </div>
                <div className="weather-scene flex h-20 w-20 shrink-0 items-center justify-center" aria-label={weather ? t(weather.condition) : t("Current conditions")}>
                  {weather && <WeatherScene condition={weather.condition} kind={weatherKind} />}
                  {!weather && (weatherError ? <Cloud aria-hidden="true" className="h-12 w-12 opacity-50" /> : <Sun aria-hidden="true" className="weather-sun h-12 w-12 opacity-70" />)}
                </div>
              </div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="text-5xl font-bold leading-none">
                  {weather ? `${weather.temperature_c}°` : weatherLoading ? "…" : "—"}
                  <span className="ml-1 text-lg font-medium">C</span>
                </p>
                <p className="text-right text-sm font-semibold">
                    {weather ? t(weather.condition) : weatherError ? t("Weather unavailable") : t("Current conditions")}
                </p>
              </div>
            </div>

            <div className="weather-panel rounded-2xl border p-4 sm:p-5" data-weather="rainy">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <CloudRain size={17} /> {t("Rainfall today")}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-4xl font-bold leading-none">
                  {weather?.rainfall_mm !== undefined ? weather.rainfall_mm.toFixed(1) : weatherLoading ? "…" : "—"}
                  <span className="ml-1 text-base font-medium">mm</span>
                </p>
                {weather?.rainfall_mm !== undefined && weather.rainfall_mm > 0 ? (
                  <div className="flex items-end gap-1" aria-hidden="true">
                    {[0, 1, 2].map((drop) => <span key={drop} className="weather-rain-drop block h-5 w-1.5 rounded-full bg-sky-500" />)}
                  </div>
                ) : <Moon className="h-9 w-9 text-sky-600" aria-hidden="true" />}
              </div>
              <p className="mt-2 text-sm opacity-80">
                  {weather ? `${weather.rain_chance_percent}% ${t("chance today")}` : weatherError ? t("Forecast unavailable") : t("Expected today")}
              </p>
            </div>
          </section>

          {primaryField && (
            <section className="mb-5 rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-olive">
                    <Sprout size={15} /> {t("Crop update")}
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-gray-900">{primaryField.crop_type}</h2>
                  <p className="text-sm text-gray-500">{primaryField.name} · {primaryField.growth_stage}</p>
                </div>
                <div className="shrink-0 rounded-xl bg-[#E8E7D8] px-3 py-2 text-center text-[#6B5A00]">
                  <Droplets size={16} className="mx-auto" />
                  <p className="mt-1 text-sm font-bold">{cropMoisture !== undefined ? `${cropMoisture.toFixed(0)}%` : "—"}</p>
                  <p className="text-[10px]">{moistureStatus}</p>
                </div>
              </div>
            </section>
          )}

          {primaryField && (
            <div className="mb-5">
              <TodaysSchedule
                field={primaryField}
                onRecommendation={setRecommendation}
                onIrrigationComplete={handleIrrigationComplete}
                features={{
                  crop_type: primaryField.crop_type,
                  moisture: cropMoisture ?? primaryField.moisture,
                  temp: weather?.temperature_c ?? primaryField.temp ?? 28,
                  humidity: primaryField.humidity ?? 55,
                  area_hectare: primaryField.area_hectare ?? primaryField.area_acres / 2.471,
                }}
              />
            </div>
          )}

          <section id="alerts" className="mb-6 scroll-mt-4">
            <AlertsList alerts={alerts} onPushEnabled={() => setPushReady(true)} />
          </section>

          <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-500">{t("All Fields")} ({fields.length})</h2>
            <Link href="/fields/new" className="inline-flex items-center gap-1 rounded-lg bg-leaf-600 px-3 py-2 text-xs font-semibold text-white hover:bg-leaf-700">
                <Plus size={14} /> {t("Register field")}
            </Link>
          </div>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <FieldSummaryCard
                key={field.id}
                field={field}
                latestReading={latestReadings[field.id]}
                temperature={temperatures[field.id]}
                colorIndex={index}
              />
            ))}
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">Soil moisture trend</h2>
                <Link href="/analytics" aria-label="View all analytics" className="text-leaf-600"><ArrowRight size={17} /></Link>
              </div>
              {sensorTrend.length > 0 ? (
                <SoilMoistureChart readings={sensorTrend} />
              ) : (
                <p className="rounded-xl border border-dashed border-gray-200 p-5 text-sm text-gray-500">No sensor history available yet.</p>
              )}
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">Weather & rainfall trend</h2>
                <Link href="/analytics" aria-label="View weather trends" className="text-leaf-600"><ArrowRight size={17} /></Link>
              </div>
              {weatherTrend.length > 0 ? (
                <WeatherChart forecast={weatherTrend} />
              ) : (
                <p className="rounded-xl border border-dashed border-gray-200 p-5 text-sm text-gray-500">Weather trend unavailable.</p>
              )}
            </section>
          </div>

          <section className="mt-7">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Recent irrigation & water use</h2>
              <Link href="/history" className="inline-flex items-center gap-1 text-xs font-semibold text-leaf-600">
                Full history <ArrowRight size={14} />
              </Link>
            </div>
            {recentIrrigation.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                <WaterUsageChart history={recentIrrigation} />
                <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white px-4">
                  {recentIrrigation.slice(0, 4).map((record) => (
                    <div key={record.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <div>
                        <p className="font-medium text-gray-800">{record.irrigation_type}</p>
                        <p className="text-xs text-gray-500">{new Date(record.irrigated_at).toLocaleDateString()}</p>
                      </div>
                      <span className="font-semibold text-gray-700">{record.amount_or_duration.toLocaleString()} L</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-gray-200 p-5 text-sm text-gray-500">No irrigation records yet.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
