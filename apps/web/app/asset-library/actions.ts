"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

const getValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const getFile = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
};

const parseTags = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const resolveUploadDir = () => {
  if (path.basename(process.cwd()) === "web") {
    return path.join(process.cwd(), "public", "uploads");
  }

  return path.join(process.cwd(), "apps", "web", "public", "uploads");
};

const guessExtension = (file: File) => {
  const fromName = file.name.split(".").pop();

  if (fromName && fromName !== file.name) {
    return fromName.toLowerCase();
  }

  const mimeMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
  };

  return mimeMap[file.type] || "bin";
};

const saveUploadedFile = async (file: File) => {
  const uploadsDir = resolveUploadDir();
  await mkdir(uploadsDir, { recursive: true });

  const extension = guessExtension(file);
  const fileName = `${randomUUID()}.${extension}`;
  const absolutePath = path.join(uploadsDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(absolutePath, buffer);

  return {
    storageKey: `/uploads/${fileName}`,
    mimeType: file.type || "application/octet-stream",
    mediaType: file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
    fileName: file.name,
  };
};

export const createAsset = async (formData: FormData) => {
  const uploadedFile = getFile(formData, "assetFile");
  const uploaded = uploadedFile ? await saveUploadedFile(uploadedFile) : null;

  const payload = {
    businessId: getValue(formData, "businessId"),
    fileName: getValue(formData, "fileName") || uploaded?.fileName || "uploaded-asset",
    storageKey: getValue(formData, "storageKey") || uploaded?.storageKey || "",
    mimeType: getValue(formData, "mimeType") || uploaded?.mimeType || "application/octet-stream",
    mediaType: getValue(formData, "mediaType") || uploaded?.mediaType || "IMAGE",
    source: getValue(formData, "source") || (uploaded ? "local_upload" : undefined),
    qualityScore: Number(getValue(formData, "qualityScore") || 0) || undefined,
    tags: parseTags(getValue(formData, "tags")),
  };

  if (!payload.storageKey) {
    throw new Error("Either a file upload or a storage key is required.");
  }

  const response = await fetch(`${apiBaseUrl}/api/assets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Asset could not be created.");
  }

  revalidatePath("/asset-library");
};

export const updateAsset = async (formData: FormData) => {
  const assetId = getValue(formData, "assetId");

  if (!assetId) {
    throw new Error("Asset id is required.");
  }

  const uploadedFile = getFile(formData, "assetFile");
  const uploaded = uploadedFile ? await saveUploadedFile(uploadedFile) : null;

  const payload = {
    fileName: getValue(formData, "fileName") || uploaded?.fileName || "updated-asset",
    storageKey: getValue(formData, "storageKey") || uploaded?.storageKey || "",
    mimeType: getValue(formData, "mimeType") || uploaded?.mimeType || "application/octet-stream",
    mediaType: getValue(formData, "mediaType") || uploaded?.mediaType || "IMAGE",
    source: getValue(formData, "source") || (uploaded ? "local_upload" : undefined),
    qualityScore: Number(getValue(formData, "qualityScore") || 0) || undefined,
    isFeatured: getValue(formData, "isFeatured") === "on",
    tags: parseTags(getValue(formData, "tags")),
  };

  if (!payload.storageKey) {
    throw new Error("Storage key cannot be empty.");
  }

  const response = await fetch(`${apiBaseUrl}/api/assets/${assetId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Asset could not be updated.");
  }

  revalidatePath("/asset-library");
};
