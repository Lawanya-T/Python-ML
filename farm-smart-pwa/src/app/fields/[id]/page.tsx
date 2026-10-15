"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Sprout, MapPin, Loader2, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { DEMO_FIELDS } from "@/lib/demoData";
import TodaysSchedule from "@/components/todaysScheduler";
import { SoilMoistureChart, WeatherChart } from "@/components/Charts";
import type { Field, SensorReading, WeatherForecastDay } from "@/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function FieldDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useLanguage();
  const { id } = use(params);

  const [field, setField] = useState<Field | null>(null);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [forecast, setForecast] = useState<WeatherForecastDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [moistureInput, setMoistureInput] = useState("");
  const [savingReading, setSavingReading] = useState(false);
  const [readingMessage, setReadingMessage] = useState("");

  useEffect(() => {
    Promise.all([
      api.getField(id).catch(() => DEMO_FIELDS.find((item) => item.id === id) ?? DEMO_FIELDS[0]),
      api.getSensorHistory(id, 14).catch(() => []),
      api.getWeatherForecast(id),
    ]).then(([nextField, nextReadings, nextForecast]) => {
      setField(nextField);
      setReadings(nextReadings);
      setForecast(nextForecast);
      setLoading(false);
    });
  }, [id]);

  async function saveMoistureReading(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const moisture = Number(moistureInput);
    if (!Number.isFinite(moisture) || moisture < 0 || moisture > 100) {
      setReadingMessage(t("Enter a moisture value from 0 to 100%.") );
      return;
    }

    setSavingReading(true);
    setReadingMessage("");
    try {
      await api.recordSensorReading(id, moisture);
      const nextReadings = await api.getSensorHistory(id, 14);
      setReadings(nextReadings);
      setField((current) => current ? { ...current, moisture } : current);
      setMoistureInput("");
      setReadingMessage(t("Moisture reading saved."));
    } catch (error) {
      setReadingMessage(error instanceof Error ? error.message : t("Could not save reading."));
    } finally {
      setSavingReading(false);
    }
  }

  if (loading || !field) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
        <Loader2 size={18} className="animate-spin" /> {t("Loading fields…")}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <header className="mb-5 flex items-center gap-3">
        <Link href="/fields" className="text-gray-500">
          <ArrowLeft size={22} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{field.name}</h1>
          <p className="flex items-center gap-1 text-sm text-gray-500">
            <MapPin size={13} /> {field.soil_type} {t("soil")} · {field.area_hectare ?? 0} ha
          </p>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-3 text-sm">
        <Sprout size={18} className="text-olive" />
        <span className="font-medium">{field.crop_type}</span>
        {field.crop_is_active !== undefined && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${field.crop_is_active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
            {t(field.crop_is_active ? "Active crop" : "Inactive crop")}
          </span>
        )}
        <span className="text-gray-400">·</span>
        <span className="text-gray-600">{field.growth_stage} {t("stage")}</span>
      </div>

      <section className="mb-4 rounded-xl border border-line bg-surface p-4" aria-labelledby="crop-npk-heading">
        <h2 id="crop-npk-heading" className="font-semibold text-gray-900">{t("Crop nutrients (kg/ha)")}</h2>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
          {([
            [t("Nitrogen"), field.npk?.nitrogen],
            [t("Phosphorus"), field.npk?.phosphorus],
            [t("Potassium"), field.npk?.potassium],
          ] as const).map(([label, value]) => (
            <div key={label} className="rounded-md bg-surface-raised p-2">
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="font-semibold text-gray-800">{value ?? "Not recorded"}</dd>
            </div>
          ))}
        </dl>
        <Link href="/fields" className="mt-3 inline-block text-sm font-medium text-leaf-700">{t("Edit crop details")}</Link>
      </section>

      <div className="mb-4">
        <TodaysSchedule
          field={field}
          features={{
            crop_type: field.crop_type,
            moisture: readings[0]?.moisture_value ?? field.moisture ?? 35,
            temp: field.temp ?? 28,
            humidity: field.humidity ?? 55,
            area_hectare: field.area_hectare ?? field.area_acres / 2.471,
          }}
        />
      </div>

      <div className="space-y-4">
        <form onSubmit={saveMoistureReading} className="rounded-xl border border-line bg-surface p-4">
          <label htmlFor="moisture-reading" className="block font-semibold text-gray-900">{t("Record soil moisture")}</label>
          <p className="mt-1 text-sm text-gray-600">{t("Add a manual reading to build this field's trend.")}</p>
          <div className="mt-3 flex gap-2">
            <input
              id="moisture-reading"
              type="number"
              min="0"
              max="100"
              step="0.1"
              required
              value={moistureInput}
              onChange={(event) => setMoistureInput(event.target.value)}
              aria-label={t("Soil moisture percent")}
              className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-base"
              placeholder={t("0–100%")}
            />
            <button type="submit" disabled={savingReading} className="inline-flex items-center gap-1.5 rounded-lg bg-leaf-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
              <Plus size={16} /> {savingReading ? t("Saving…") : t("Add reading")}
            </button>
          </div>
          {readingMessage && <p role="status" className="mt-2 text-sm text-gray-600">{readingMessage}</p>}
        </form>
        <SoilMoistureChart readings={readings} />
        <WeatherChart forecast={forecast} />
      </div>
    </div>
  );
}