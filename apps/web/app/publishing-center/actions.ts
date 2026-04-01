"use server";

import { revalidatePath } from "next/cache";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

const getValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

export const materializePublishJobs = async (formData: FormData) => {
  const businessId = getValue(formData, "businessId");
  const limit = Number(getValue(formData, "limit") || 10);

  if (!businessId) {
    throw new Error("Business id is required.");
  }

  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/publish-jobs/materialize-ready`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ limit }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Publish queue could not be materialized.");
  }

  revalidatePath("/publishing-center");
  revalidatePath("/content-calendar");
};

export const runDuePublishJobs = async (formData: FormData) => {
  const businessId = getValue(formData, "businessId");
  const limit = Number(getValue(formData, "limit") || 5);

  if (!businessId) {
    throw new Error("Business id is required.");
  }

  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/publish-jobs/run-due`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ limit }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Due publish jobs could not be executed.");
  }

  revalidatePath("/publishing-center");
  revalidatePath("/content-calendar");
  revalidatePath("/approval-center");
};
