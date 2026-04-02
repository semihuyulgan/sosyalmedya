"use server";

import { revalidatePath } from "next/cache";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

const getValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

export const saveTelegramLink = async (formData: FormData) => {
  const businessId = getValue(formData, "businessId");

  if (!businessId) {
    throw new Error("Business id is required.");
  }

  const payload = {
    chatId: getValue(formData, "chatId"),
    chatTitle: getValue(formData, "chatTitle") || undefined,
  };

  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/telegram-link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message || "Telegram link could not be saved.");
  }

  revalidatePath("/telegram-center");
  revalidatePath("/approval-center");
  revalidatePath("/content-calendar");
};

export const syncTelegramWebhook = async () => {
  const response = await fetch(`${apiBaseUrl}/api/telegram/webhook/sync`, {
    method: "POST",
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message || "Telegram webhook could not be synced.");
  }

  revalidatePath("/telegram-center");
};
