"use server";

import { revalidatePath } from "next/cache";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

const getValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

export const createContentItem = async (formData: FormData) => {
  const payload = {
    businessId: getValue(formData, "businessId"),
    title: getValue(formData, "title"),
    type: getValue(formData, "type"),
    status: getValue(formData, "status"),
    pillarName: getValue(formData, "pillarName") || undefined,
    targetAction: getValue(formData, "targetAction") || undefined,
    plannedFor: getValue(formData, "plannedFor") || undefined,
    approvalRequired: getValue(formData, "approvalRequired") === "on",
    needsClientApproval: getValue(formData, "needsClientApproval") === "on",
  };

  const response = await fetch(`${apiBaseUrl}/api/content-items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Content item could not be created.");
  }

  revalidatePath("/content-calendar");
};

export const updateContentItem = async (formData: FormData) => {
  const contentItemId = getValue(formData, "contentItemId");

  if (!contentItemId) {
    throw new Error("Content item id is required.");
  }

  const payload = {
    title: getValue(formData, "title"),
    type: getValue(formData, "type"),
    status: getValue(formData, "status"),
    pillarName: getValue(formData, "pillarName") || undefined,
    targetAction: getValue(formData, "targetAction") || undefined,
    plannedFor: getValue(formData, "plannedFor") || undefined,
    approvalRequired: getValue(formData, "approvalRequired") === "on",
    needsClientApproval: getValue(formData, "needsClientApproval") === "on",
  };

  const response = await fetch(`${apiBaseUrl}/api/content-items/${contentItemId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Content item could not be updated.");
  }

  revalidatePath("/content-calendar");
  revalidatePath("/approval-center");
};

export const sendToApproval = async (formData: FormData) => {
  const contentItemId = getValue(formData, "contentItemId");

  if (!contentItemId) {
    throw new Error("Content item id is required.");
  }

  const response = await fetch(`${apiBaseUrl}/api/content-items/${contentItemId}/send-approval`, {
    method: "POST",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Content item could not be sent to approval.");
  }

  revalidatePath("/content-calendar");
  revalidatePath("/approval-center");
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

  revalidatePath("/content-calendar");
  revalidatePath("/approval-center");
  revalidatePath("/generation-pipeline");
};
