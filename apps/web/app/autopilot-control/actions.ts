"use server";

import { revalidatePath } from "next/cache";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

const getValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const getBoolean = (formData: FormData, key: string) => getValue(formData, key) === "on";

export const updateAutopilotPolicy = async (formData: FormData) => {
  const businessId = getValue(formData, "businessId");

  if (!businessId) {
    throw new Error("Business id is required.");
  }

  const payload = {
    status: getValue(formData, "status") || undefined,
    planningMode: getValue(formData, "planningMode") || undefined,
    approvalMode: getValue(formData, "approvalMode") || undefined,
    publishEnabled: getBoolean(formData, "publishEnabled"),
    allowAutoVisualGeneration: getBoolean(formData, "allowAutoVisualGeneration"),
    allowAutoPublishing: getBoolean(formData, "allowAutoPublishing"),
    weeklyCadenceJson: getValue(formData, "weeklyCadenceJson") || undefined,
    preferredTimeWindowsJson: getValue(formData, "preferredTimeWindowsJson") || undefined,
    agendaSensitivityJson: getValue(formData, "agendaSensitivityJson") || undefined,
    seasonalPriorityJson: getValue(formData, "seasonalPriorityJson") || undefined,
    contentMixJson: getValue(formData, "contentMixJson") || undefined,
    generationGuardrailsJson: getValue(formData, "generationGuardrailsJson") || undefined,
  };

  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/autopilot-policy`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Autopilot policy could not be updated.");
  }

  revalidatePath("/autopilot-control");
};

export const regenerateAutopilotWeek = async (formData: FormData) => {
  const businessId = getValue(formData, "businessId");

  if (!businessId) {
    throw new Error("Business id is required.");
  }

  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/autopilot/regenerate-week`, {
    method: "POST",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Autopilot week could not be regenerated.");
  }

  revalidatePath("/autopilot-control");
};
