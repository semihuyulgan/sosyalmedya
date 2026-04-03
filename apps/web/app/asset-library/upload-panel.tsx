"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Props = {
  businessId: string;
};

type PreviewItem = {
  id: string;
  name: string;
  previewUrl: string | null;
  file: File;
};

type CustomGroup = {
  id: string;
  name: string;
  previews: PreviewItem[];
};

const toPreviewItems = (files: FileList | null): PreviewItem[] => {
  if (!files?.length) return [];

  return Array.from(files).map((file) => ({
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    file,
  }));
};

const revokePreviews = (items: PreviewItem[]) => {
  items.forEach((item) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  });
};

const createCustomGroup = (): CustomGroup => ({
  id: crypto.randomUUID(),
  name: "",
  previews: [],
});

export function UploadPanel({ businessId }: Props) {
  const router = useRouter();
  const [mekanPreviews, setMekanPreviews] = useState<PreviewItem[]>([]);
  const [urunPreviews, setUrunPreviews] = useState<PreviewItem[]>([]);
  const [customGroups, setCustomGroups] = useState<CustomGroup[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "idle" | "success" | "error"; message: string }>({
    kind: "idle",
    message: "",
  });

  const totalSelected = useMemo(
    () =>
      mekanPreviews.length +
      urunPreviews.length +
      customGroups.reduce((sum, group) => sum + group.previews.length, 0),
    [customGroups, mekanPreviews.length, urunPreviews.length],
  );

  const updateMekanFiles = (files: FileList | null) => {
    revokePreviews(mekanPreviews);
    setMekanPreviews(toPreviewItems(files));
  };

  const updateUrunFiles = (files: FileList | null) => {
    revokePreviews(urunPreviews);
    setUrunPreviews(toPreviewItems(files));
  };

  const addCustomGroup = () => {
    setCustomGroups((current) => [...current, createCustomGroup()]);
  };

  const removeCustomGroup = (groupId: string) => {
    setCustomGroups((current) => {
      const target = current.find((item) => item.id === groupId);
      if (target) revokePreviews(target.previews);
      return current.filter((item) => item.id !== groupId);
    });
  };

  const updateCustomGroupName = (groupId: string, value: string) => {
    setCustomGroups((current) =>
      current.map((item) => (item.id === groupId ? { ...item, name: value } : item)),
    );
  };

  const updateCustomGroupFiles = (groupId: string, files: FileList | null) => {
    setCustomGroups((current) =>
      current.map((item) => {
        if (item.id !== groupId) return item;
        revokePreviews(item.previews);
        return { ...item, previews: toPreviewItems(files) };
      }),
    );
  };

  const uploadGroup = async (category: string, files: PreviewItem[], customCategoryName?: string) => {
    if (!files.length) return;

    const formData = new FormData();
    formData.set("businessId", businessId);
    formData.set("source", "panel_upload");
    formData.set("qualityScore", "80");
    formData.set("category", category);

    if (customCategoryName) {
      formData.set("customCategoryName", customCategoryName);
    }

    files.forEach((item) => {
      formData.append("assetFile", item.file);
    });

    const response = await fetch("/api/asset-upload", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json().catch(() => null)) as { message?: string } | null;

    if (!response.ok) {
      throw new Error(payload?.message || "Görseller yüklenemedi.");
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setFeedback({ kind: "idle", message: "" });

    try {
      if (!totalSelected) {
        throw new Error("En az bir görsel seçmelisin.");
      }

      await uploadGroup("MEKAN", mekanPreviews);
      await uploadGroup("URUN", urunPreviews);

      for (const group of customGroups) {
        if (group.name.trim() && group.previews.length) {
          await uploadGroup("CUSTOM", group.previews, group.name.trim());
        }
      }

      revokePreviews(mekanPreviews);
      revokePreviews(urunPreviews);
      customGroups.forEach((group) => revokePreviews(group.previews));
      setMekanPreviews([]);
      setUrunPreviews([]);
      setCustomGroups([]);
      setFeedback({ kind: "success", message: "Görseller başarıyla yüklendi." });
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
    <div className="upload-flow-shell">
      <section className="upload-section-card">
        <div className="upload-section-head">
          <div>
            <div className="eyebrow">1. Ana kategori</div>
            <h3>Mekân görselleri</h3>
            <p>Dış cephe, iç alan, masa düzeni ve işletmenin genel görünümünü anlatan kareleri yükle.</p>
          </div>
          <span className="customer-card-tag">{mekanPreviews.length} görsel</span>
        </div>

        <label className="upload-dropzone">
          <div className="upload-dropzone-card">
            <strong>Mekân fotoğraflarını seç</strong>
            <p>Birden fazla görsel seçebilirsin.</p>
            <input accept="image/*" multiple onChange={(event) => updateMekanFiles(event.target.files)} type="file" />
          </div>
        </label>

        {mekanPreviews.length ? (
          <div className="upload-thumb-grid">
            {mekanPreviews.map((item) => (
              <div className="upload-thumb-card" key={item.id}>
                {item.previewUrl ? <img alt={item.name} className="upload-thumb-image" src={item.previewUrl} /> : null}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="upload-section-card">
        <div className="upload-section-head">
          <div>
            <div className="eyebrow">2. Ana kategori</div>
            <h3>Ürün görselleri</h3>
            <p>İmza ürünler, yakın plan tabaklar, içecekler ve satışa odaklı ürün fotoğraflarını yükle.</p>
          </div>
          <span className="customer-card-tag">{urunPreviews.length} görsel</span>
        </div>

        <label className="upload-dropzone">
          <div className="upload-dropzone-card">
            <strong>Ürün fotoğraflarını seç</strong>
            <p>Birden fazla görsel seçebilirsin.</p>
            <input accept="image/*" multiple onChange={(event) => updateUrunFiles(event.target.files)} type="file" />
          </div>
        </label>

        {urunPreviews.length ? (
          <div className="upload-thumb-grid">
            {urunPreviews.map((item) => (
              <div className="upload-thumb-card" key={item.id}>
                {item.previewUrl ? <img alt={item.name} className="upload-thumb-image" src={item.previewUrl} /> : null}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="upload-section-card">
        <div className="upload-section-head">
          <div>
            <div className="eyebrow">3. İsteğe bağlı</div>
            <h3>Ek kategori ekle</h3>
            <p>Atmosfer, ekip, servis gibi ekstra bir grup açmak istersen burada ekleyebilirsin.</p>
          </div>
          <button className="ghost-action" onClick={addCustomGroup} type="button">
            Yeni kategori ekle
          </button>
        </div>

        {customGroups.length ? (
          <div className="custom-category-list">
            {customGroups.map((group, index) => (
              <article className="custom-category-card" key={group.id}>
                <div className="upload-section-head compact">
                  <strong>Ek kategori {index + 1}</strong>
                  <button className="ghost-action" onClick={() => removeCustomGroup(group.id)} type="button">
                    Kaldır
                  </button>
                </div>

                <label>
                  <span>Kategori adı</span>
                  <input
                    onChange={(event) => updateCustomGroupName(group.id, event.target.value)}
                    placeholder="Örnek: Atmosfer detayları"
                    value={group.name}
                  />
                </label>

                <label className="upload-dropzone">
                  <div className="upload-dropzone-card">
                    <strong>Bu kategoriye ait görselleri seç</strong>
                    <input
                      accept="image/*"
                      multiple
                      onChange={(event) => updateCustomGroupFiles(group.id, event.target.files)}
                      type="file"
                    />
                  </div>
                </label>

                {group.previews.length ? (
                  <div className="upload-thumb-grid">
                    {group.previews.map((item) => (
                      <div className="upload-thumb-card" key={item.id}>
                        {item.previewUrl ? <img alt={item.name} className="upload-thumb-image" src={item.previewUrl} /> : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            Ek kategori eklemek istemiyorsan bu bölümü boş bırakabilirsin.
          </p>
        )}
      </section>

      <div className="flow-actions">
        <Link className="ghost-action" href="/business-profile">
          Önceki adım: İşletme Kartı
        </Link>
        <button className="solid-action" disabled={isSubmitting} onClick={handleSubmit} type="button">
          {isSubmitting ? "Yükleniyor..." : "Seçilen görselleri yükle"}
        </button>
        <Link className="ghost-action" href="/telegram-center">
          Görselleri yükledim, Telegram’a geç
        </Link>
      </div>

      {feedback.message ? (
        <p
          className="muted"
          style={{
            color: feedback.kind === "error" ? "#c4543d" : "#45613b",
            margin: 0,
          }}
        >
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}
