import type { SensorReading, WeatherInfo } from "@/types";

export type IrrigationAlertType =
  | "moisture_low"
  | "moisture_critical"
  | "overwatering"
  | "weather_warning"
  | "irrigation_reminder"
  | "sensor_failure"
  | "ml_recommendation"
  | "system_status";

export interface IrrigationAlert {
  id: string;
  fieldId: string;
  fieldName: string;
  type: IrrigationAlertType;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export const initialAlerts: IrrigationAlert[] = [];

export interface AlertRecommendation {
  recommended_need_level: string;
  recommended_irrigation_type: string;
  recommended_time: string;
  recommended_duration_minutes: number;
  recommended_volume_liters: number;
  model_confidence: number | null;
  is_fallback: boolean;
}

interface AlertField {
  id: string;
  name: string;
  moisture?: number;
}

interface AlertContext {
  sensorReading?: SensorReading | null;
  weather?: WeatherInfo | null;
  recommendation?: AlertRecommendation | null;
  lastIrrigatedAt?: string | null;
  now?: Date;
}

function createAlert(
  field: AlertField,
  type: IrrigationAlertType,
  severity: IrrigationAlert["severity"],
  title: string,
  message: string,
  now: Date,
): IrrigationAlert {
  return {
    id: `${field.id}:${type}`,
    fieldId: field.id,
    fieldName: field.name,
    type,
    severity,
    title,
    message,
    timestamp: now.toISOString(),
    isRead: false,
  };
}

export function generateAlertsForField(field: AlertField, context: AlertContext = {}): IrrigationAlert[] {
  const now = context.now ?? new Date();
  const alerts: IrrigationAlert[] = [];
  const reading = context.sensorReading;
  const readingIsLive = reading !== undefined && reading !== null && reading.is_demo_data !== true;
  const readingTime = reading ? new Date(reading.recorded_at).getTime() : Number.NaN;
  const readingIsStale = !Number.isFinite(readingTime) || now.getTime() - readingTime > 24 * 60 * 60 * 1000;

  if (!readingIsLive || readingIsStale) {
    alerts.push(createAlert(
      field,
      "sensor_failure",
      "warning",
      "Sensor data unavailable",
      `No recent live soil sensor reading is available for ${field.name}. Check the sensor connection.`,
      now,
    ));
  }

  const moisture = readingIsLive ? reading.moisture_value : field.moisture;
  if (typeof moisture === "number" && Number.isFinite(moisture)) {
    if (moisture < 20) {
      alerts.push(createAlert(field, "moisture_critical", "critical", "Critically low soil moisture", `Soil moisture is ${moisture.toFixed(0)}%. Irrigation is urgently recommended.`, now));
    } else if (moisture < 35) {
      alerts.push(createAlert(field, "moisture_low", "warning", "Low soil moisture", `Soil moisture is ${moisture.toFixed(0)}%. Review the irrigation recommendation.`, now));
    }

    if (moisture >= 95) {
      alerts.push(createAlert(field, "overwatering", "critical", "Over-watering risk", `Soil moisture is ${moisture.toFixed(0)}%. Pause irrigation and check for standing water.`, now));
    } else if (moisture >= 85) {
      alerts.push(createAlert(field, "overwatering", "warning", "Soil moisture is very high", `Soil moisture is ${moisture.toFixed(0)}%. Avoid additional watering until it falls.`, now));
    }
  }

  if (context.weather) {
    const rainfall = context.weather.rainfall_mm ?? 0;
    const heavyRain = rainfall >= 20;
    const likelyRain = rainfall >= 10 || context.weather.rain_chance_percent >= 85;
    if (heavyRain || likelyRain) {
      alerts.push(createAlert(
        field,
        "weather_warning",
        heavyRain ? "critical" : "warning",
        heavyRain ? "Heavy rainfall expected" : "Rain may affect irrigation",
        `${rainfall.toFixed(1)} mm of rain is forecast for ${context.weather.location} with a ${context.weather.rain_chance_percent}% chance. Adjust irrigation to avoid waterlogging.`,
        now,
      ));
    }
  }

  const recommendation = context.recommendation;
  if (recommendation && !recommendation.is_fallback) {
    const need = recommendation.recommended_need_level.toLowerCase();
    if (need === "high" || need === "medium") {
      const lastWatered = context.lastIrrigatedAt ? new Date(context.lastIrrigatedAt).getTime() : Number.NaN;
      const reminderAfterMs = need === "high" ? 12 : 24;
      const wateringIsDue = !Number.isFinite(lastWatered) || now.getTime() - lastWatered >= reminderAfterMs * 60 * 60 * 1000;

      if (wateringIsDue) {
        alerts.push(createAlert(
          field,
          "irrigation_reminder",
          need === "high" ? "warning" : "info",
          "Irrigation reminder",
          `${recommendation.recommended_irrigation_type} is recommended ${recommendation.recommended_time.toLowerCase()} for about ${recommendation.recommended_duration_minutes} minutes (${recommendation.recommended_volume_liters.toLocaleString()} L).`,
          now,
        ));
      }
    }

    alerts.push(createAlert(
      field,
      "ml_recommendation",
      recommendation.recommended_need_level.toLowerCase() === "high" ? "warning" : "info",
      "ML irrigation recommendation",
      `The prediction service reports ${recommendation.recommended_need_level.toLowerCase()} water need and recommends ${recommendation.recommended_irrigation_type}.`,
      now,
    ));
  }

  return alerts;
}

export function checkSensorThresholds(field: AlertField): IrrigationAlert | null {
  return generateAlertsForField(field).find((alert) => alert.type === "moisture_critical") ?? null;
}

export async function fetchSystemAlerts(): Promise<IrrigationAlert[]> {
  const apiBase = "/api/backend";
  try {
    const response = await fetch(`${apiBase}/alerts`);
    if (!response.ok) throw new Error("Failed to fetch alerts");
    return (await response.json()) as IrrigationAlert[];
  } catch {
    return [];
  }
}
