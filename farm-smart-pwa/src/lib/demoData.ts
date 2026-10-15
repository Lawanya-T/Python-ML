// src/lib/demoData.ts
import type { Field, SensorReading, WeatherForecastDay } from "@/types";

type IrrigationHistoryRecord = {
  id: string;
  field_id: string;
  irrigation_type: string;
  irrigated_at: string;
  amount_or_duration: number;
};

export const DEMO_FIELDS: Field[] = [
  { id: "field-1", name: "North Wheat Field", location: "Pune", area_acres: 5, area_hectare: 2.02, soil_type: "Loamy", crop_type: "Wheat", growth_stage: "Vegetative", moisture: 34 },
  { id: "field-2", name: "South Tomato Plot", location: "Nashik", area_acres: 3, area_hectare: 1.21, soil_type: "Sandy", crop_type: "Tomato", growth_stage: "Flowering", moisture: 45 },
  { id: "field-3", name: "East Orchard", location: "Satara", area_acres: 7, area_hectare: 2.83, soil_type: "Loamy", crop_type: "Pomegranate", growth_stage: "Maturity", moisture: 28 },
];

export const DEMO_FEATURES = {
  crop_type: "Wheat",
  moisture: 34,
  temp: 28,
  humidity: 55,
};

export function demoSensorHistory(fieldId: string, count: number): SensorReading[] {
  return Array.from({ length: count }, (_, index) => {
    const recordedAt = new Date();
    recordedAt.setDate(recordedAt.getDate() - (count - index - 1));
    return {
      id: `${fieldId}-reading-${index}`,
      field_id: fieldId,
      moisture_value: Math.max(20, 42 - index * 2),
      recorded_at: recordedAt.toISOString(),
      is_demo_data: true,
    };
  });
}

export function demoWeatherForecast(fieldId: string, count: number): WeatherForecastDay[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return {
      date: date.toISOString().slice(0, 10),
      temperature: 27 + ((fieldId.length + index) % 5),
      rain_mm: index % 2 === 0 ? 0 : 2.5,
    };
  });
}

const IRRIGATION_TYPES = ["Drip Irrigation", "Sprinkler", "Flood Irrigation"];

export function demoIrrigationHistory(
  fieldId: string,
  count: number = 10
): IrrigationHistoryRecord[] {
  const records: IrrigationHistoryRecord[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 2);

    records.push({
      id: `${fieldId}-history-${i}`,
      field_id: fieldId,
      irrigation_type: IRRIGATION_TYPES[i % IRRIGATION_TYPES.length],
      irrigated_at: date.toISOString(),
      amount_or_duration: Math.round(800 + Math.random() * 800),
    } as IrrigationHistoryRecord);
  }

  return records;
}