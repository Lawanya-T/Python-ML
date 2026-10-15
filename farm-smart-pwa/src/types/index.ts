// src/types/index.ts

export interface Field {
  moisture?: number;
  id: string;
  name: string;
  location: string;
  area_acres: number;
  area_hectare?: number;
  soil_type?: string;
  crop_type: string;
  growth_stage:
    | "Sowing"
    | "Germination"
    | "Vegetative"
    | "Flowering"
    | "Fruiting"
    | "Maturity"
    | "Harvest";
  created_at?: string;
  is_active?: boolean;
  temp?: number;
  humidity?: number;
  crop_id?: number;
  crop_is_active?: boolean;
  npk?: CropNpk;
  is_demo_data?: boolean;
}

export interface CropNpk {
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
}

export interface Crop {
  id: number;
  name: string;
  growth_stage: string;
  water_requirement_mm_per_day: number;
  npk: CropNpk;
  is_active: boolean;
}

export interface SensorReading {
  id: string;
  field_id: string;
  moisture_value: number;
  recorded_at: string;
  source?: "sensor" | "manual";
  is_demo_data?: boolean;
}

export interface WeatherForecastDay {
  date: string;
  temperature: number;
  rain_mm: number;
}

export interface FieldAlert {
  severity: string;
  field_id: string;
  alert_type: "Low Moisture" | "High Moisture" | "Irrigation Needed";
  message: string;
  created_at: string;
  resolved: boolean;
}

export interface SoilMoistureReading {
  field_id: string;
  moisture_percent: number;
  target_min: number;
  target_max: number;
  recorded_at: string;
}

export interface WeatherInfo {
  temperature_c: number;
  condition: string; // e.g. "Sunny", "Cloudy", "Rain"
  location: string;
  rain_chance_percent: number;
  rainfall_mm?: number;
}

export interface IrrigationSchedule {
  field_id: string;
  scheduled_time: string; // e.g. "06:30 AM" or ISO time
  duration_minutes: number;
  volume_liters: number;
  status: "Scheduled" | "Completed" | "Skipped" | "In Progress";
}

export interface IrrigationRecommendation {
  field_id: string;
  method: string; // e.g. "Drip Irrigation"
  need_level: "Low" | "Medium" | "High";
  generated_at: string;
}

export interface IrrigationHistoryRecord {
  id: string;
  field_id: string;
  irrigation_type: string;
  irrigated_at: string; // ISO date string
  amount_or_duration: number; // liters (or minutes, depending on your convention)
  duration_minutes?: number;
  water_applied_liters?: number;
  status?: "completed" | "stopped";
  is_local?: boolean;
}

// Add to src/types/index.ts
export interface FarmerProfile {
  name: string;
  phone: string;
  email: string;
  village: string;
  land_size_acres: number;
  farming_experience_years: number;
  preferred_crops: string[];
  preferred_language: "en" | "hi" | "kn" | "mr" | "ta" | "pa" | "bn" | "te" | "gu";
  notifications_enabled: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface RegisterInput {
  name: string;
  phone: string;
  email?: string;
  password: string;
}

export interface LoginInput {
  identifier: string; // phone or email
  password: string;
}