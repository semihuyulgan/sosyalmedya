"use server";

import { revalidatePath } from "next/cache";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

const getValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const toJsonList = (value: string) => {
  const items = value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length ? JSON.stringify(items) : undefined;
};

const toPeakHoursJson = (value: string) => {
  const normalized = value.trim();
  return normalized ? JSON.stringify([normalized]) : undefined;
};

const toWhatsappUrl = (value: string) => {
  const normalized = value.replace(/\D/g, "");
  return normalized ? `https://wa.me/${normalized}` : undefined;
};

export const updateBusinessProfile = async (formData: FormData) => {
  const businessId = getValue(formData, "businessId");

  if (!businessId) {
    throw new Error("Business id is required.");
  }

  const payload = {
    name: getValue(formData, "name"),
    category: getValue(formData, "category"),
    description: getValue(formData, "description") || undefined,
    priceSegment: getValue(formData, "priceSegment") || undefined,
    address: getValue(formData, "address") || undefined,
    city: getValue(formData, "city"),
    country: getValue(formData, "country"),
    phone: getValue(formData, "phone") || undefined,
    websiteUrl: getValue(formData, "websiteUrl") || undefined,
    reservationUrl: getValue(formData, "reservationUrl") || undefined,
    whatsappUrl: toWhatsappUrl(getValue(formData, "whatsappUrl")),
    primaryGoal: getValue(formData, "primaryGoal"),
    operatingMode: getValue(formData, "operatingMode"),
    dashboardAccessEnabled: getValue(formData, "dashboardAccessEnabled") === "on",
    telegramControlEnabled: getValue(formData, "telegramControlEnabled") === "on",
    publishMode: getValue(formData, "publishMode"),
    preferredLanguage: getValue(formData, "preferredLanguage"),
    toneSummary: getValue(formData, "toneSummary") || undefined,
    brandSummary: getValue(formData, "brandSummary") || undefined,
    voiceGuidelines: getValue(formData, "voiceGuidelines") || undefined,
    visualGuidelines: getValue(formData, "visualGuidelines") || undefined,
    ctaPreferencesJson: toJsonList(getValue(formData, "ctaPreferencesJson")),
    forbiddenPhrasesJson: toJsonList(getValue(formData, "forbiddenPhrasesJson")),
    targetAudienceJson: toJsonList(getValue(formData, "targetAudienceJson")),
    peakHoursJson: toPeakHoursJson(getValue(formData, "peakHoursJson")),
    seasonalNotesJson: getValue(formData, "seasonalNotesJson") || undefined,
  };

  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Business profile could not be updated.");
  }

  revalidatePath("/business-profile");
};
