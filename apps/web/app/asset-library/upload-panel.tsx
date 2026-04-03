"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  businessId: string;
};

type PreviewItem = {
  id: string;
  name: string;
  type: string;
  previewUrl: string | null;
};

const toPreviewItems = (files: FileList | null): PreviewItem[] => {
  if (!files?.length) return [];

  return Array.from(files).map((file) => ({
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    type: file.type,
    previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
  }));
};

export function UploadPanel({ businessId }: Props) {
  const router = useRouter();
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "idle" | "success" | "error"; message: string }>({
    kind: "idle",
    message: "",
  });

  const selectedLabel = useMemo(() => {
    if (!previews.length) return "Henüz dosya seçilmedi";
    if (previews.length === 1) return "1 dosya seçildi";
    return `${previews.length} dosya seçildi`;
  }, [previews.length]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    previews.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });

    setPreviews(toPreviewItems(event.target.files));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback({ kind: "idle", message: "" });

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/asset-upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.message || "Görseller yüklenemedi.");
      }

      setFeedback({
        kind: "success",
        message: payload?.message || "Görseller başarıyla yüklendi.",
      });
      event.currentTarget.reset();
      previews.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      setPreviews([]);
      router.refresh();
    } catch (error) {
      setFeedback({
        kind: "error",
        message: error instanceof Error ? error.message : "Yükleme sırasında bir hata oluştu.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <input name="businessId" type="hidden" value={businessId} />
      <input name="mimeType" type="hidden" value="image/jpeg" />
      <input name="source" type="hidden" value="panel_upload" />
      <input name="qualityScore" type="hidden" value="80" />

      <label className="span-2 upload-dropzone">
        <span>Dosya yükle</span>
        <div className="upload-dropzone-card">
          <strong>Birden fazla görsel seçebilirsin</strong>
          <p>Dosyalarını seç, küçük önizlemeleri aşağıda gör ve tek seferde yükle.</p>
          <input accept="image/*,video/*" multiple name="assetFile" onChange={handleFileChange} type="file" />
          <div className="upload-dropzone-meta">{selectedLabel}</div>
        </div>
      </label>

      {previews.length ? (
        <div className="span-2 upload-preview-grid">
          {previews.map((item) => (
            <article className="upload-preview-card" key={item.id}>
              {item.previewUrl ? (
                <img alt={item.name} className="upload-preview-image" src={item.previewUrl} />
              ) : (
                <div className="asset-video-placeholder mini">
                  <span>VIDEO</span>
                </div>
              )}
              <strong>{item.name}</strong>
            </article>
          ))}
        </div>
      ) : null}

      <label>
        <span>Medya türü</span>
        <select defaultValue="IMAGE" name="mediaType">
          <option value="IMAGE">Görsel</option>
          <option value="VIDEO">Video</option>
        </select>
      </label>
      <label>
        <span>Kısa ad</span>
        <input name="fileName" placeholder="örn. imza kahve, salon, vitrin" />
      </label>
      <label className="span-2">
        <span>Etiketler</span>
        <input name="tags" placeholder="ürün, menü, mekân, detay, atmosfer" />
      </label>
      <div className="span-2">
        <p className="muted" style={{ margin: 0 }}>
          Aynı anda birden fazla görsel seçebilirsin. Hepsi tek seferde yüklenecek.
        </p>
      </div>
      <div className="span-2">
        <div className="flow-actions">
          <Link className="ghost-action" href="/business-profile">
            Önceki adım: İşletme Kartı
          </Link>
          <button className="solid-action" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Yükleniyor..." : "Görselleri Yükle"}
          </button>
          <Link className="ghost-action" href="/telegram-center">
            Görselleri yükledim, Telegram’a geç
          </Link>
        </div>
      </div>

      {feedback.message ? (
        <div className="span-2">
          <p
            className="muted"
            style={{
              color: feedback.kind === "error" ? "#c4543d" : "#45613b",
              margin: 0,
            }}
          >
            {feedback.message}
          </p>
        </div>
      ) : null}
    </form>
  );
}
