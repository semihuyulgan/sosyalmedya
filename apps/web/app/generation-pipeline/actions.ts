"use server";

import { revalidatePath } from "next/cache";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

const getValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

export const materializeAutopilotJobs = async (formData: FormData) => {
  const businessId = getValue(formData, "businessId");
  const limit = Number(getValue(formData, "limit") || 14);

  if (!businessId) {
    throw new Error("Business id is required.");
  }

  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/generation-jobs/materialize-autopilot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ limit }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Generation jobs could not be materialized.");
  }

  revalidatePath("/generation-pipeline");
  revalidatePath("/content-calendar");
  revalidatePath("/approval-center");
};

export const runQueuedGenerationJobs = async (formData: FormData) => {
  const businessId = getValue(formData, "businessId");
  const limit = Number(getValue(formData, "limit") || 6);

  if (!businessId) {
    throw new Error("Business id is required.");
  }

  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/generation-jobs/run-queued`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ limit }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Queued generation jobs could not be executed.");
  }

  revalidatePath("/generation-pipeline");
  revalidatePath("/content-calendar");
  revalidatePath("/approval-center");
  revalidatePath("/asset-library");
};

export const selectFinalOutput = async (formData: FormData) => {
  const contentItemId = getValue(formData, "contentItemId");
  const contentItemAssetId = getValue(formData, "contentItemAssetId");

  if (!contentItemId || !contentItemAssetId) {
    throw new Error("Content item id and output id are required.");
  }

  const response = await fetch(`${apiBaseUrl}/api/content-items/${contentItemId}/select-output`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contentItemAssetId }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Final output could not be selected.");
  }

  revalidatePath("/generation-pipeline");
  revalidatePath("/content-calendar");
  revalidatePath("/approval-center");
};
