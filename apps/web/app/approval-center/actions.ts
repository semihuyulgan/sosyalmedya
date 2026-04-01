"use server";

import { revalidatePath } from "next/cache";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

const getValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

export const takeApprovalAction = async (formData: FormData) => {
  const approvalRequestId = getValue(formData, "approvalRequestId");
  const action = getValue(formData, "action");
  const note = getValue(formData, "note") || undefined;

  if (!approvalRequestId || !action) {
    throw new Error("Approval request id and action are required.");
  }

  const response = await fetch(`${apiBaseUrl}/api/approval-requests/${approvalRequestId}/action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, note }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Approval action could not be completed.");
  }

  revalidatePath("/approval-center");
  revalidatePath("/content-calendar");
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

  revalidatePath("/approval-center");
  revalidatePath("/content-calendar");
  revalidatePath("/generation-pipeline");
};
