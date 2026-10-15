// src/app/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import BrownDropdown from "@/components/BrownDropdown";
import { MoistureTrendChart, RainfallTrendChart } from "@/components/Charts";
import { demoSensorHistory } from "@/lib/demoData";
import type { Field, SensorReading, WeatherForecastDay } from "@/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function AnalyticsPage() {
  const { t } = useLanguage();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [forecast, setForecast] = useState<WeatherForecastDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFields().then((data) => {
      setFields(data);
      setSelectedFieldId(data[0]?.id ?? "");
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedFieldId) return;
    let active = true;
    const selectedField = fields.find((field) => field.id === selectedFieldId);
    Promise.all([
      api.getSensorHistory(selectedFieldId, 7).catch(() => []),
      api.getWeatherForecast(selectedFieldId),
    ]).then(([sensorReadings, weatherForecast]) => {
      if (!active) return;
      setReadings(sensorReadings.length > 0
        ? sensorReadings
        : selectedField?.is_demo_data
          ? demoSensorHistory(selectedFieldId, 7)
          : []);
      setForecast(weatherForecast);
    });
    return () => { active = false; };
  }, [selectedFieldId, fields]);

  const averageMoisture = readings.length > 0
    ? Math.round(readings.reduce((sum, reading) => sum + reading.moisture_value, 0) / readings.length)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-gray-400">
        <Loader2 size={18} className="animate-spin" /> {t("Loading analytics…")}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">{t("Sensor Analytics")}</h1>
        {fields.length > 0 && (
          <BrownDropdown
            label={t("Select Field")}
            value={selectedFieldId}
            onChange={setSelectedFieldId}
            className="max-w-44 border-gray-200 bg-white py-2 text-gray-800"
            options={fields.map((field) => ({ value: field.id, label: field.name }))}
          />
        )}
      </div>

      <div className="space-y-3 mb-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-sm text-gray-500">{t("7-reading average soil moisture")}</p>
          <p className="text-2xl font-bold text-gray-900">{averageMoisture === null ? "—" : `${averageMoisture}%`}</p>
        </div>
      </div>

      <h2 className="mb-2 font-semibold text-gray-800">{t("Moisture Trend (7 Days)")}</h2>
      {readings.length > 0 ? (
        <MoistureTrendChart data={readings.map((reading) => ({
          day: new Date(reading.recorded_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          moisture: reading.moisture_value,
        }))} />
      ) : (
        <p className="rounded-xl border border-dashed border-gray-200 p-5 text-sm text-gray-500">{t("No sensor readings available.")}</p>
      )}

      <h2 className="mb-2 mt-5 font-semibold text-gray-800">{t("Rainfall Trend (7 Days)")}</h2>
      {forecast.length > 0 ? (
        <RainfallTrendChart data={forecast.map((day) => ({ day: day.date, rain_mm: day.rain_mm }))} />
      ) : (
        <p className="rounded-xl border border-dashed border-gray-200 p-5 text-sm text-gray-500">{t("Weather forecast unavailable.")}</p>
      )}
    </div>
  );
}
