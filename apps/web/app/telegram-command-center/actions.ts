"use server";

import { revalidatePath } from "next/cache";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

const getValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

export const interpretTelegramCommand = async (formData: FormData) => {
  const businessId = getValue(formData, "businessId");
  const command = getValue(formData, "command");

  if (!businessId || !command) {
    throw new Error("Business id and command are required.");
  }

  const response = await fetch(
    `${apiBaseUrl}/api/businesses/${businessId}/telegram-command-center/interpret`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ command, source: "dashboard" }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Telegram command could not be applied.");
  }

  revalidatePath("/telegram-command-center");
  revalidatePath("/business-profile");
};
