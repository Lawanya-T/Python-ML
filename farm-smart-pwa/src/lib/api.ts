import type { Crop as SharedCrop, Field as SharedField, IrrigationHistoryRecord as SharedIrrigationHistoryRecord, SensorReading, WeatherForecastDay } from "@/types";
import type { AuthUser, RegisterInput, LoginInput } from "@/types";
import { demoWeatherForecast } from "@/lib/demoData";

// Use the Next.js same-origin proxy so the backend URL and /api/v1 prefix are
// configured once in next.config.ts rather than duplicated in browser calls.
const API_BASE = "/api/backend";

export function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = typeof window === "undefined" ? null : window.localStorage.getItem("auth_token");
  if (token && !token.startsWith("demo-token-")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

type DemoUser = AuthUser & { password: string };

const LOCAL_FIELDS_KEY = "demo_fields";

function getLocalFields(): Field[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_FIELDS_KEY) || "[]") as Field[];
  } catch {
    return [];
  }
}

function saveLocalFields(fields: Field[]) {
  localStorage.setItem(LOCAL_FIELDS_KEY, JSON.stringify(fields));
}

export type Field = SharedField & {
  temp?: number;
  humidity?: number;
  crop?: string;
  stage?: string;
  is_demo_data?: boolean;
};

const mockFields: Field[] = [
  {
    id: "1",
    name: "North Wheat Field",
    location: "Pune, Maharashtra",
    area_acres: 5.4,
    crop_type: "Wheat",
    growth_stage: "Vegetative",
    moisture: 34,
    temp: 28,
    humidity: 62,
    is_demo_data: true,
  },
  {
    id: "2",
    name: "South Tomato Plot",
    location: "Nashik, Maharashtra",
    area_acres: 3.1,
    crop_type: "Tomato",
    growth_stage: "Flowering",
    moisture: 45,
    temp: 30,
    humidity: 55,
    is_demo_data: true,
  },
  {
    id: "3",
    name: "East Orchard",
    location: "Satara, Maharashtra",
    area_acres: 7.2,
    crop_type: "Pomegranate",
    growth_stage: "Maturity",
    moisture: 28,
    temp: 29,
    humidity: 58,
    is_demo_data: true,
  },
];

export async function getFields(): Promise<Field[]> {
  try {
    const res = await backendFetch("/fields");
    if (!res.ok) throw new Error("Failed to fetch fields");
    const data = (await res.json()) as Array<Partial<Field> & { id: string; name: string }>;
    const backendFields = data.map((field) => ({
      id: field.id,
      name: field.name,
      location: field.location ?? "Unknown location",
      area_acres: field.area_acres ?? 0,
      area_hectare: field.area_hectare ?? (field.area_acres ? field.area_acres / 2.471 : 0),
      soil_type: field.soil_type ?? "Loamy",
      crop_type: !field.crop_type || field.crop_type === "string" ? "Unspecified crop" : field.crop_type,
      growth_stage: (String(field.growth_stage) === "string" ? "Vegetative" : field.growth_stage ?? field.stage ?? "Vegetative") as SharedField["growth_stage"],
      moisture: typeof field.moisture === "number" ? field.moisture : undefined,
      temp: field.temp ?? 28,
      humidity: field.humidity ?? 55,
      is_active: field.is_active ?? true,
      crop_id: field.crop_id,
      crop_is_active: field.crop_is_active ?? true,
      npk: field.npk,
      is_demo_data: false,
    }));
    const localFields = getLocalFields();
    return [...backendFields, ...localFields.filter((localField) => !backendFields.some((field) => field.id === localField.id))];
  } catch {
    const localFields = getLocalFields();
    return [...localFields, ...mockFields.filter((field) => !localFields.some((localField) => localField.id === field.id))];
  }
}

export async function getCrops(): Promise<SharedCrop[]> {
  const response = await backendFetch("/crops");
  if (!response.ok) throw new Error("Could not load crops");
  const crops = (await response.json()) as SharedCrop[];
  return crops.map((crop) => ({
    ...crop,
    name: crop.name === "string" ? "Unspecified crop" : crop.name,
    growth_stage: crop.growth_stage === "string" ? "Stage not recorded" : crop.growth_stage,
  }));
}

export async function setCropActive(cropId: number, isActive: boolean): Promise<void> {
  const response = await backendFetch(`/crops/${cropId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: isActive }),
  });
  if (!response.ok) throw new Error("Could not update crop status");
}

export async function renameField(fieldId: string, name: string, isDemoField = false): Promise<void> {
  if (!isBackendFieldId(fieldId) || isDemoField) {
    const localFields = getLocalFields();
    if (localFields.some((field) => field.id === fieldId)) {
      saveLocalFields(localFields.map((field) => field.id === fieldId ? { ...field, name } : field));
      return;
    }

    const demoField = isDemoField ? mockFields.find((field) => field.id === fieldId) : undefined;
    if (!demoField) throw new Error("Field not found on this device");
    saveLocalFields([...localFields, { ...demoField, name }]);
    return;
  }

  const response = await backendFetch(`/fields/${fieldId}/name`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null;
    throw new Error(body?.detail ?? "Could not rename field");
  }
}

export async function updateCrop(
  cropId: number,
  update: { name: string; growth_stage: string; npk: { nitrogen: number | null; phosphorus: number | null; potassium: number | null } },
): Promise<void> {
  const response = await backendFetch(`/crops/${cropId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: update.name,
      growth_stage: update.growth_stage,
      nitrogen_kg_per_hectare: update.npk.nitrogen,
      phosphorus_kg_per_hectare: update.npk.phosphorus,
      potassium_kg_per_hectare: update.npk.potassium,
    }),
  });
  if (!response.ok) throw new Error("Could not update crop details");
}

export async function getField(fieldId: string): Promise<Field> {
  const field = (await getFields()).find((item) => item.id === fieldId);
  if (!field) throw new Error("Field not found.");
  return field;
}

const isBackendFieldId = (fieldId: string) => /^\d+$/.test(fieldId);

export async function getLatestSensorReading(fieldId: string): Promise<SensorReading> {
  if (!isBackendFieldId(fieldId)) throw new Error("This field is saved only on this device");
  const response = await backendFetch(`/fields/${fieldId}/sensors/latest`);
  if (!response.ok) throw new Error("Sensor reading unavailable");
  return { ...(await response.json() as SensorReading), is_demo_data: false };
}

export async function getSensorHistory(fieldId: string, count: number): Promise<SensorReading[]> {
  if (!isBackendFieldId(fieldId)) return [];
  const response = await backendFetch(`/fields/${fieldId}/sensors/history?limit=${count}`);
  if (!response.ok) throw new Error("Sensor history unavailable");
  return ((await response.json()) as SensorReading[]).map((reading) => ({ ...reading, is_demo_data: false }));
}

export async function recordSensorReading(fieldId: string, moistureValue: number): Promise<SensorReading> {
  const response = await backendFetch(`/fields/${fieldId}/sensors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ moisture_value: moistureValue }),
  });
  if (!response.ok) throw new Error("Could not save soil moisture reading");
  return (await response.json()) as SensorReading;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

function parseCoordinates(location: string): Coordinates | null {
  const match = location.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

async function resolveCoordinates(location: string): Promise<Coordinates> {
  const directCoordinates = parseCoordinates(location);
  if (directCoordinates) return directCoordinates;

  const searchTerms = [location.trim(), ...location.split(",").map((part) => part.trim())]
    .filter(Boolean)
    .filter((term, index, terms) => terms.indexOf(term) === index);

  for (const term of searchTerms) {
    const geocodingUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
    geocodingUrl.search = new URLSearchParams({ name: term, count: "1", language: "en", format: "json" }).toString();
    const response = await fetch(geocodingUrl);
    if (!response.ok) throw new Error("Could not find weather for this location.");
    const data = (await response.json()) as { results?: Coordinates[] };
    if (data.results?.[0]) return data.results[0];
  }

  throw new Error("Could not find weather for this location.");
}

export async function getWeatherForecast(locationOrFieldId: string): Promise<WeatherForecastDay[]> {
  try {
    const fields = await getFields();
    const location = fields.find((field) => field.id === locationOrFieldId)?.location ?? locationOrFieldId;
    const place = await resolveCoordinates(location);

    const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
    forecastUrl.search = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      daily: "temperature_2m_mean,precipitation_sum",
      forecast_days: "7",
      timezone: "auto",
    }).toString();
    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok) throw new Error("Could not load weather trends.");
    const forecastData = (await forecastResponse.json()) as {
      daily?: { time?: string[]; temperature_2m_mean?: number[]; precipitation_sum?: number[] };
    };
    if (!forecastData.daily?.time) throw new Error("Weather trends are unavailable.");

    return forecastData.daily.time.map((date, index) => ({
      date,
      temperature: forecastData.daily?.temperature_2m_mean?.[index] ?? 0,
      rain_mm: forecastData.daily?.precipitation_sum?.[index] ?? 0,
    }));
  } catch {
    return demoWeatherForecast(locationOrFieldId, 7);
  }
}

export async function createField(input: {
  farmer_id: number;
  name: string;
  crop_type: string;
  growth_stage: string;
  area_hectare: number;
  soil_type: string;
  location: string;
}): Promise<Field> {
  const coordinates = await resolveCoordinates(input.location);
  const response = await backendFetch("/fields", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      farmer_id: input.farmer_id,
      name: input.name,
      crop_type: input.crop_type,
      growth_stage: input.growth_stage,
      area_hectare: input.area_hectare,
      soil_type: input.soil_type,
      location_lat: coordinates.latitude,
      location_lng: coordinates.longitude,
      sensor_id: `unassigned-${Date.now()}`,
    }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null;
    throw new Error(body?.detail ?? "Could not save field to the backend");
  }
  return (await response.json()) as Field;
}

function describeWeatherCode(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code <= 99) return "Thunderstorms";
  return "Unknown";
}

export async function getWeather(location: string) {
  const place = await resolveCoordinates(location);

  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
  forecastUrl.search = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: "temperature_2m,weather_code",
    daily: "precipitation_probability_max,precipitation_sum",
    forecast_days: "1",
    timezone: "auto",
  }).toString();
  const forecastResponse = await fetch(forecastUrl);
  if (!forecastResponse.ok) throw new Error("Could not load the weather forecast.");
  const forecastData = (await forecastResponse.json()) as {
    current?: { temperature_2m: number; weather_code: number };
    daily?: {
      precipitation_probability_max?: number[];
      precipitation_sum?: number[];
    };
  };

  if (!forecastData.current) throw new Error("Could not load the weather forecast.");

  return {
    temperature_c: Math.round(forecastData.current.temperature_2m),
    condition: describeWeatherCode(forecastData.current.weather_code),
    location,
    rain_chance_percent: forecastData.daily?.precipitation_probability_max?.[0] ?? 0,
    rainfall_mm: forecastData.daily?.precipitation_sum?.[0],
  };
}

export async function getIrrigationHistory(
  fieldId: string,
  limit: number = 30,
): Promise<SharedIrrigationHistoryRecord[]> {
  const localHistory = readLocalIrrigationHistory(fieldId, limit);
  if (!isBackendFieldId(fieldId)) return localHistory;
  try {
    const res = await backendFetch(`/fields/${fieldId}/history?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch irrigation history");
    const serverHistory = (await res.json()) as SharedIrrigationHistoryRecord[];
    const serverIds = new Set(serverHistory.map((record) => record.id));
    return [...serverHistory, ...localHistory.filter((record) => !serverIds.has(record.id))]
      .sort((first, second) => new Date(second.irrigated_at).getTime() - new Date(first.irrigated_at).getTime())
      .slice(0, limit);
  } catch {
    return localHistory;
  }
}

const LOCAL_IRRIGATION_HISTORY_KEY = "irrigation_history";

function readLocalIrrigationHistory(fieldId: string, limit: number): SharedIrrigationHistoryRecord[] {
  try {
    const records = JSON.parse(localStorage.getItem(LOCAL_IRRIGATION_HISTORY_KEY) || "[]") as SharedIrrigationHistoryRecord[];
    return records
      .filter((record) => record.field_id === fieldId)
      .sort((first, second) => new Date(second.irrigated_at).getTime() - new Date(first.irrigated_at).getTime())
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function recordIrrigation(
  fieldId: string,
  input: { irrigation_type: string; duration_minutes: number; water_applied_liters: number; status: "completed" | "stopped" },
): Promise<SharedIrrigationHistoryRecord> {
  try {
    const response = await backendFetch(`/fields/${fieldId}/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error("Could not save irrigation history");
    return (await response.json()) as SharedIrrigationHistoryRecord;
  } catch {
    const record: SharedIrrigationHistoryRecord = {
      id: `local-${Date.now()}`,
      field_id: fieldId,
      irrigation_type: input.irrigation_type,
      irrigated_at: new Date().toISOString(),
      amount_or_duration: input.water_applied_liters,
      duration_minutes: input.duration_minutes,
      water_applied_liters: input.water_applied_liters,
      status: input.status,
      is_local: true,
    };
    try {
      const allRecords = JSON.parse(localStorage.getItem(LOCAL_IRRIGATION_HISTORY_KEY) || "[]") as SharedIrrigationHistoryRecord[];
      localStorage.setItem(LOCAL_IRRIGATION_HISTORY_KEY, JSON.stringify([record, ...allRecords]));
    } catch {
      localStorage.setItem(LOCAL_IRRIGATION_HISTORY_KEY, JSON.stringify([record]));
    }
    return record;
  }
}
async function register(data: RegisterInput): Promise<{ user: AuthUser; token: string }> {
  try {
    const res = await backendFetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null) as { detail?: string; message?: string } | null;
      if (res.status >= 500) throw new TypeError("Backend unavailable");
      throw new Error(body?.detail ?? body?.message ?? `Registration failed (${res.status}).`);
    }
    return await res.json();
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    // Offline fallback — stores locally so registration/login still works for demos
    const existing = JSON.parse(localStorage.getItem("demo_users") || "[]") as DemoUser[];
    if (existing.some((user) => user.phone === data.phone)) {
      throw new Error("An account with this phone number already exists.");
    }
    const newUser: DemoUser = { id: `local-${Date.now()}`, ...data };
    existing.push(newUser);
    localStorage.setItem("demo_users", JSON.stringify(existing));
    const user: AuthUser = {
      id: newUser.id,
      name: newUser.name,
      phone: newUser.phone,
      email: newUser.email,
    };
    return { user, token: `demo-token-${newUser.id}` };
  }
}

async function login(data: LoginInput): Promise<{ user: AuthUser; token: string }> {
  try {
    const res = await backendFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null) as { detail?: string; message?: string } | null;
      if (res.status >= 500) throw new TypeError("Backend unavailable");
      throw new Error(body?.detail ?? body?.message ?? `Login failed (${res.status}).`);
    }
    return await res.json();
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    const existing = JSON.parse(localStorage.getItem("demo_users") || "[]") as DemoUser[];
    const match = existing.find(
      (user) =>
        (user.phone === data.identifier || user.email === data.identifier) &&
        user.password === data.password,
    );
    if (!match) throw new Error("Invalid phone/email or password.");
    const user: AuthUser = {
      id: match.id,
      name: match.name,
      phone: match.phone,
      email: match.email,
    };
    return { user, token: `demo-token-${user.id}` };
  }
}

export interface MLPredictionInput {
  crop_type: string;
  soil_moisture: number;
  temperature: number;
  humidity: number;
}

export interface MLPredictionResponse {
  irrigation_type: string;
  need_level: string;
  confidence: number;
  recommended_time?: string;
  duration_minutes?: number;
  volume_liters?: number;
  recommended_duration_minutes?: number;
  recommended_volume_liters?: number;
  water_quantity_liters?: number;
  is_fallback?: boolean;
}

export interface RecommendationResult {
  recommended_need_level: string;
  recommended_irrigation_type: string;
  recommended_time: string;
  recommended_duration_minutes: number;
  recommended_volume_liters: number;
  values_are_estimated: boolean;
  is_fallback: boolean;
  model_confidence: number | null;
  override_reasons: string[];
}

export async function fetchIrrigationRecommendation(data: MLPredictionInput): Promise<MLPredictionResponse> {
  try {
    const res = await backendFetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Backend offline");
    return await res.json();
  } catch {
    // Keep scheduling useful when the optional prediction service is offline.
    // This is an explicit local heuristic, not an ML prediction.
    const moisture = Number.isFinite(data.soil_moisture) ? data.soil_moisture : 40;
    const temperature = Number.isFinite(data.temperature) ? data.temperature : 28;
    const humidity = Number.isFinite(data.humidity) ? data.humidity : 55;
    const needLevel = moisture <= 25 || (moisture <= 34 && temperature >= 34)
      ? "High"
      : moisture >= 60 || (humidity >= 85 && moisture >= 40)
        ? "Low"
        : "Medium";

    return {
      irrigation_type: "Drip Irrigation",
      need_level: needLevel,
      confidence: 0,
      is_fallback: true,
    };
  }
}

export async function getRecommendation(
  fieldId: string,
  features: Record<string, unknown>,
): Promise<RecommendationResult> {
  const cropType = String(features.crop_type ?? "Wheat");
  const soilMoisture = Number(features.moisture ?? 35);
  const temperature = Number(features.temp ?? 28);
  const humidity = Number(features.humidity ?? 55);

  const prediction = await fetchIrrigationRecommendation({
    crop_type: cropType,
    soil_moisture: soilMoisture,
    temperature,
    humidity,
  });

  const overrideReasons: string[] = [];
  if (soilMoisture < 35) overrideReasons.push("Soil moisture is below the optimal target range.");
  if (temperature > 32) overrideReasons.push("High temperature may increase crop water demand.");

  const needLevel = prediction.need_level || "Medium";
  const estimate = needLevel === "High"
    ? { time: "5:30 AM – 7:30 AM", duration: 50, litersPerHectare: 900 }
    : needLevel === "Low"
      ? { time: "Optional — check tomorrow", duration: 15, litersPerHectare: 250 }
      : { time: "5:30 AM – 7:00 AM", duration: 30, litersPerHectare: 550 };
  const apiDuration = prediction.recommended_duration_minutes ?? prediction.duration_minutes;
  const apiVolume = prediction.recommended_volume_liters ?? prediction.volume_liters ?? prediction.water_quantity_liters;
  const areaHectares = Math.max(Number(features.area_hectare ?? 1), 0.1);

  return {
    recommended_need_level: needLevel,
    recommended_irrigation_type: prediction.irrigation_type || "Drip Irrigation",
    recommended_time: prediction.recommended_time || estimate.time,
    recommended_duration_minutes: apiDuration ?? estimate.duration,
    recommended_volume_liters: apiVolume ?? Math.round(estimate.litersPerHectare * areaHectares),
    values_are_estimated: apiDuration === undefined || apiVolume === undefined,
    is_fallback: prediction.is_fallback ?? false,
    model_confidence: typeof prediction.confidence === "number" ? prediction.confidence : null,
    override_reasons: overrideReasons,
  };
}

export async function registerField(fieldData: Omit<Field, "id">) {
  return Promise.resolve({ success: true, id: `${Date.now()}`, ...fieldData });
}

export const api = {
  getFields,
  getCrops,
  setCropActive,
  renameField,
  updateCrop,
  getField,
  getLatestSensorReading,
  getSensorHistory,
  recordSensorReading,
  getWeatherForecast,
  createField,
  getWeather,
  getIrrigationHistory,
  getRecommendation,
  fetchIrrigationRecommendation,
  registerField,
  register,
  login,
};
