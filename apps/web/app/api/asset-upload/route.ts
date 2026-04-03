import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

const resolveUploadDir = () => path.join(process.cwd(), "public", "uploads");

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

const parseTags = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const businessId = String(formData.get("businessId") || "").trim();
    const source = String(formData.get("source") || "panel_upload").trim();
    const mediaType = String(formData.get("mediaType") || "IMAGE").trim();
    const fileName = String(formData.get("fileName") || "").trim();
    const tags = parseTags(String(formData.get("tags") || ""));
    const qualityScore = Number(String(formData.get("qualityScore") || "80")) || 80;
    const files = formData
      .getAll("assetFile")
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (!businessId) {
      return NextResponse.json({ message: "Business id is required." }, { status: 400 });
    }

    if (!files.length) {
      return NextResponse.json({ message: "En az bir dosya seçmelisin." }, { status: 400 });
    }

    for (const [index, file] of files.entries()) {
      const uploaded = await saveUploadedFile(file);
      const payload = {
        businessId,
        fileName:
          fileName && files.length === 1
            ? fileName
            : fileName && files.length > 1
              ? `${fileName} ${index + 1}`
              : uploaded.fileName,
        storageKey: uploaded.storageKey,
        mimeType: uploaded.mimeType,
        mediaType: uploaded.mediaType || mediaType,
        source,
        qualityScore,
        tags,
      };

      const response = await fetch(`${apiBaseUrl}/api/assets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        return NextResponse.json(
          { message: payload?.message || "Görseller yüklenemedi." },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ message: "Görseller başarıyla yüklendi." });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Yükleme sırasında bir hata oluştu.",
      },
      { status: 500 },
    );
  }
}
