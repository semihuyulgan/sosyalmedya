"use server";

import { revalidatePath } from "next/cache";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

const getValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const getAllValues = (formData: FormData, key: string) =>
  formData
    .getAll(key)
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

export const createGenerationBrief = async (formData: FormData) => {
  const businessId = getValue(formData, "businessId");

  if (!businessId) {
    throw new Error("Business id is required.");
  }

  const payload = {
    title: getValue(formData, "title"),
    sceneRecipeId: getValue(formData, "sceneRecipeId") || undefined,
    generationMode: getValue(formData, "generationMode"),
    objective: getValue(formData, "objective") || undefined,
    outputType: getValue(formData, "outputType") || undefined,
    aspectRatio: getValue(formData, "aspectRatio") || undefined,
    status: getValue(formData, "status") || undefined,
    variationCount: Number(getValue(formData, "variationCount") || 4),
    promptDirection: getValue(formData, "promptDirection") || undefined,
    subjectDirection: getValue(formData, "subjectDirection") || undefined,
    remixInstruction: getValue(formData, "remixInstruction") || undefined,
    selectedReferenceIdsJson: JSON.stringify(getAllValues(formData, "selectedReferenceIds")),
    selectedAssetIdsJson: JSON.stringify(getAllValues(formData, "selectedAssetIds")),
    keepElementsJson: getValue(formData, "keepElementsJson") || undefined,
  };

  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/generation-briefs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Generation brief could not be created.");
  }

  revalidatePath("/generate-studio");
};

export const updateGenerationBrief = async (formData: FormData) => {
  const briefId = getValue(formData, "briefId");

  if (!briefId) {
    throw new Error("Brief id is required.");
  }

  const payload = {
    title: getValue(formData, "title") || undefined,
    sceneRecipeId: getValue(formData, "sceneRecipeId") || undefined,
    generationMode: getValue(formData, "generationMode") || undefined,
    objective: getValue(formData, "objective") || undefined,
    outputType: getValue(formData, "outputType") || undefined,
    aspectRatio: getValue(formData, "aspectRatio") || undefined,
    status: getValue(formData, "status") || undefined,
    variationCount: Number(getValue(formData, "variationCount") || 4),
    promptDirection: getValue(formData, "promptDirection") || undefined,
    subjectDirection: getValue(formData, "subjectDirection") || undefined,
    remixInstruction: getValue(formData, "remixInstruction") || undefined,
    selectedReferenceIdsJson: JSON.stringify(getAllValues(formData, "selectedReferenceIds")),
    selectedAssetIdsJson: JSON.stringify(getAllValues(formData, "selectedAssetIds")),
    keepElementsJson: getValue(formData, "keepElementsJson") || undefined,
  };

  const response = await fetch(`${apiBaseUrl}/api/generation-briefs/${briefId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Generation brief could not be updated.");
  }

  revalidatePath("/generate-studio");
};
