"use server";

import { revalidatePath } from "next/cache";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

const getValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
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
    whatsappUrl: getValue(formData, "whatsappUrl") || undefined,
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
    ctaPreferencesJson: getValue(formData, "ctaPreferencesJson") || undefined,
    forbiddenPhrasesJson: getValue(formData, "forbiddenPhrasesJson") || undefined,
    targetAudienceJson: getValue(formData, "targetAudienceJson") || undefined,
    peakHoursJson: getValue(formData, "peakHoursJson") || undefined,
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
