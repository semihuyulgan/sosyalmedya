"use server";

import { revalidatePath } from "next/cache";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

const getValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const getBoolean = (formData: FormData, key: string) => getValue(formData, key) === "on";

export const updateVisualWorld = async (formData: FormData) => {
  const businessId = getValue(formData, "businessId");

  if (!businessId) {
    throw new Error("Business id is required.");
  }

  const payload = {
    conceptSummary: getValue(formData, "conceptSummary") || undefined,
    sectorLens: getValue(formData, "sectorLens") || undefined,
    ambienceNotes: getValue(formData, "ambienceNotes") || undefined,
    lightingStyle: getValue(formData, "lightingStyle") || undefined,
    materialPalette: getValue(formData, "materialPalette") || undefined,
    heroAnglesJson: getValue(formData, "heroAnglesJson") || undefined,
    keepElementsJson: getValue(formData, "keepElementsJson") || undefined,
    bannedElementsJson: getValue(formData, "bannedElementsJson") || undefined,
  };

  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/visual-world`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Visual world could not be updated.");
  }

  revalidatePath("/visual-world");
};

export const createVisualReference = async (formData: FormData) => {
  const businessId = getValue(formData, "businessId");

  if (!businessId) {
    throw new Error("Business id is required.");
  }

  const payload = {
    assetId: getValue(formData, "assetId"),
    role: getValue(formData, "role"),
    zone: getValue(formData, "zone") || undefined,
    notes: getValue(formData, "notes") || undefined,
    isAnchor: getBoolean(formData, "isAnchor"),
    sortOrder: Number(getValue(formData, "sortOrder") || 0),
  };

  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/visual-world/references`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Visual reference could not be created.");
  }

  revalidatePath("/visual-world");
};

export const updateVisualReference = async (formData: FormData) => {
  const referenceId = getValue(formData, "referenceId");

  if (!referenceId) {
    throw new Error("Reference id is required.");
  }

  const payload = {
    assetId: getValue(formData, "assetId") || undefined,
    role: getValue(formData, "role") || undefined,
    zone: getValue(formData, "zone") || undefined,
    notes: getValue(formData, "notes") || undefined,
    isAnchor: getBoolean(formData, "isAnchor"),
    sortOrder: Number(getValue(formData, "sortOrder") || 0),
  };

  const response = await fetch(`${apiBaseUrl}/api/visual-world-references/${referenceId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Visual reference could not be updated.");
  }

  revalidatePath("/visual-world");
};

export const createSceneRecipe = async (formData: FormData) => {
  const businessId = getValue(formData, "businessId");

  if (!businessId) {
    throw new Error("Business id is required.");
  }

  const payload = {
    title: getValue(formData, "title"),
    sceneType: getValue(formData, "sceneType"),
    objective: getValue(formData, "objective") || undefined,
    promptFrame: getValue(formData, "promptFrame") || undefined,
    subjectNotes: getValue(formData, "subjectNotes") || undefined,
    compositionNotes: getValue(formData, "compositionNotes") || undefined,
    variationNotes: getValue(formData, "variationNotes") || undefined,
    active: getBoolean(formData, "active"),
  };

  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/scene-recipes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Scene recipe could not be created.");
  }

  revalidatePath("/visual-world");
};

export const updateSceneRecipe = async (formData: FormData) => {
  const recipeId = getValue(formData, "recipeId");

  if (!recipeId) {
    throw new Error("Recipe id is required.");
  }

  const payload = {
    title: getValue(formData, "title") || undefined,
    sceneType: getValue(formData, "sceneType") || undefined,
    objective: getValue(formData, "objective") || undefined,
    promptFrame: getValue(formData, "promptFrame") || undefined,
    subjectNotes: getValue(formData, "subjectNotes") || undefined,
    compositionNotes: getValue(formData, "compositionNotes") || undefined,
    variationNotes: getValue(formData, "variationNotes") || undefined,
    active: getBoolean(formData, "active"),
  };

  const response = await fetch(`${apiBaseUrl}/api/scene-recipes/${recipeId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Scene recipe could not be updated.");
  }

  revalidatePath("/visual-world");
};
