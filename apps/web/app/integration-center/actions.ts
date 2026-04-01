"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

const getValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

export const updateInstagramIntegration = async (formData: FormData) => {
  const businessId = getValue(formData, "businessId");

  if (!businessId) {
    throw new Error("Business id is required.");
  }

  const payload = {
    accountName: getValue(formData, "accountName"),
    externalAccountId: getValue(formData, "externalAccountId") || undefined,
    status: getValue(formData, "status"),
    connectorMode: getValue(formData, "connectorMode"),
    username: getValue(formData, "username") || undefined,
    pageId: getValue(formData, "pageId") || undefined,
    igBusinessId: getValue(formData, "igBusinessId") || undefined,
    notes: getValue(formData, "notes") || undefined,
  };

  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/integrations/instagram`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Instagram integration could not be updated.");
  }

  revalidatePath("/integration-center");
  revalidatePath("/publishing-center");
};

export const startMetaOAuth = async (formData: FormData) => {
  const businessId = getValue(formData, "businessId");

  if (!businessId) {
    throw new Error("Business id is required.");
  }

  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/integrations/instagram/oauth/start`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Meta OAuth could not be started.");
  }

  const payload = (await response.json()) as {
    authUrl?: string;
  };

  if (!payload.authUrl) {
    throw new Error("Meta auth URL is missing.");
  }

  redirect(payload.authUrl);
};
