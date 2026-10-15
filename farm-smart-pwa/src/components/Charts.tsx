// src/components/Charts.tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import type { IrrigationHistoryRecord, SensorReading, WeatherForecastDay } from "@/types";

export function SoilMoistureChart({ readings }: { readings: SensorReading[] }) {
  if (readings.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-line bg-surface p-4" aria-labelledby="soil-moisture-heading">
        <h2 id="soil-moisture-heading" className="font-semibold text-gray-800">Soil moisture trend</h2>
        <p className="mt-2 text-sm text-gray-600">No sensor readings have been recorded for this field yet.</p>
      </section>
    );
  }

  const data = readings
    .slice()
    .sort((first, second) => new Date(first.recorded_at).getTime() - new Date(second.recorded_at).getTime())
    .map((reading) => ({
    day: new Date(reading.recorded_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    moisture: reading.moisture_value,
    }));

  return <MoistureTrendChart data={data} />;
}

export function WeatherChart({ forecast }: { forecast: WeatherForecastDay[] }) {
  const data = forecast.map((day) => ({
    day: new Date(day.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    temperature: day.temperature,
    rain_mm: day.rain_mm,
  }));

  return (
    <div className="h-56 w-full rounded-2xl border border-line bg-surface p-3">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E6DCCB" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="temperature" tick={{ fontSize: 11 }} unit="°C" />
          <YAxis yAxisId="rain" orientation="right" tick={{ fontSize: 11 }} unit=" mm" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="rain" dataKey="rain_mm" name="Rain" fill="#28dff7" radius={[4, 4, 0, 0]} />
          <Line yAxisId="temperature" type="monotone" dataKey="temperature" name="Temperature" stroke="#e08a3f" strokeWidth={2} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Used in the History page (#17-18)
export function WaterUsageChart({ history }: { history: IrrigationHistoryRecord[] }) {
  const data = history
    .slice()
    .reverse()
    .map((r) => ({
      date: new Date(r.irrigated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      liters: r.amount_or_duration,
    }));

  return (
    <div className="h-48 w-full rounded-2xl border border-line bg-surface p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E6DCCB" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="liters" fill="#28dff7" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Sensor/soil moisture trend — used on the Analytics page (#20)
export function MoistureTrendChart({
  data,
}: {
  data: { day: string; moisture: number }[];
}) {
  return (
    <div className="h-56 w-full rounded-2xl border border-line bg-surface p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E6DCCB" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
          <Tooltip />
          <Line type="monotone" dataKey="moisture" stroke="#45cdfe" strokeWidth={3} dot={{ r: 4, fill: "#6f99fa", stroke: "#1130fd", strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Rainfall trend — this was the one genuinely missing piece from Week 5 (#21)
export function RainfallTrendChart({
  data,
}: {
  data: { day: string; rain_mm: number }[];
}) {
  return (
    <div className="h-56 w-full rounded-2xl border border-line bg-surface p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E6DCCB" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="rain_mm" fill="#28dff7" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
