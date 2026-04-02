import Link from "next/link";
import { createContentItem, sendToApproval, selectFinalOutput, updateContentItem } from "./actions";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

type WorkspaceResponse = {
  businesses: Array<{
    id: string;
    name: string;
  }>;
};

type ContentResponse = {
  id: string;
  name: string;
  contentPillars: Array<{
    id: string;
    name: string;
  }>;
  contentItems: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    pillarName: string | null;
    targetAction: string | null;
    plannedFor: string | null;
    approvalRequired: boolean;
    needsClientApproval: boolean;
    assets: Array<{
      id: string;
      role: string;
      isSelected: boolean;
      asset: {
        id: string;
        storageKey: string;
        fileName: string;
        mimeType: string;
        mediaType: string;
        source: string | null;
      };
    }>;
  }>;
};

const getWorkspace = async () => {
  const response = await fetch(`${apiBaseUrl}/api/workspaces/demo-studio/businesses`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Workspace could not be loaded.");
  }

  return (await response.json()) as WorkspaceResponse;
};

const getContentItems = async (businessId: string) => {
  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/content-items`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Content items could not be loaded.");
  }

  return (await response.json()) as ContentResponse;
};

const toDateValue = (value: string | null) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 16);
};

const contentTypeLabel = (value: string) => {
  switch (value) {
    case "POST":
      return "Post";
    case "REEL":
      return "Reel";
    case "STORY":
      return "Story";
    default:
      return value;
  }
};

const contentStatusLabel = (value: string) => {
  switch (value) {
    case "DRAFT":
      return "Taslak";
    case "GENERATED":
      return "Üretildi";
    case "NEEDS_REVIEW":
      return "Kontrol bekliyor";
    case "WAITING_APPROVAL":
      return "Onay bekliyor";
    case "APPROVED":
      return "Onaylandı";
    case "SCHEDULED":
      return "Planlandı";
    case "PUBLISHED":
      return "Yayınlandı";
    case "FAILED":
      return "Başarısız";
    case "ARCHIVED":
      return "Arşivlendi";
    default:
      return value;
  }
};

const getPreviewAsset = (
  assets: Array<{
    id: string;
    role: string;
    isSelected: boolean;
    asset: {
      id: string;
      storageKey: string;
      fileName: string;
      mimeType: string;
      mediaType: string;
      source: string | null;
    };
  }>,
) => assets.find((item) => item.isSelected)?.asset || assets.find((item) => item.asset.mediaType === "IMAGE")?.asset || null;

export default async function ContentCalendarPage() {
  const workspace = await getWorkspace();
  const business = workspace.businesses[0];
  const contentData = await getContentItems(business.id);

  return (
    <main className="profile-shell">
      <header className="profile-topbar">
        <div>
          <div className="eyebrow">İçerik Planı</div>
          <h1>İçerik Takvimi</h1>
          <p className="muted">
            Burada hangi içeriğin ne zaman çıkacağını görürsün. Üretilen içerikler, onay süreci ve
            yayın planı bu akışta birleşir.
          </p>
        </div>

        <div className="topbar-actions">
          <Link className="link-chip" href="/">
            Ana Sayfa
          </Link>
          <Link className="link-chip" href="/telegram-center">
            Telegram
          </Link>
          <Link className="link-chip" href="/approval-center">
            Onay Merkezi
          </Link>
          <Link className="link-chip" href="/asset-library">
            Görsel Kütüphanesi
          </Link>
          <Link className="link-chip" href="/business-profile">
            İşletme Kartı
          </Link>
        </div>
      </header>

      <section className="asset-layout">
        <section className="profile-card profile-form">
          <div className="card-head">
            <div>
              <div className="eyebrow">Yeni İçerik</div>
              <h2>Takvime yeni içerik ekle</h2>
            </div>
          </div>

          <form action={createContentItem} className="form-grid">
            <input name="businessId" type="hidden" value={business.id} />

            <label className="span-2">
              <span>Başlık</span>
              <input name="title" placeholder="Hafta sonu brunch paylaşımı" required />
            </label>
            <label>
              <span>İçerik türü</span>
              <select defaultValue="POST" name="type">
                <option value="POST">Post</option>
                <option value="REEL">Reel</option>
                <option value="STORY">Story</option>
              </select>
            </label>
            <label>
              <span>Durum</span>
              <select defaultValue="DRAFT" name="status">
                <option value="DRAFT">Taslak</option>
                <option value="GENERATED">Üretildi</option>
                <option value="NEEDS_REVIEW">Kontrol bekliyor</option>
                <option value="WAITING_APPROVAL">Onay bekliyor</option>
                <option value="APPROVED">Onaylandı</option>
                <option value="SCHEDULED">Planlandı</option>
                <option value="PUBLISHED">Yayınlandı</option>
                <option value="FAILED">Başarısız</option>
                <option value="ARCHIVED">Arşivlendi</option>
              </select>
            </label>
            <label>
              <span>İçerik başlığı</span>
              <select defaultValue="" name="pillarName">
                <option value="">Seçilmedi</option>
                {contentData.contentPillars.map((pillar) => (
                  <option key={pillar.id} value={pillar.name}>
                    {pillar.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Hedef</span>
              <input name="targetAction" placeholder="RESERVATION" />
            </label>
            <label>
              <span>Yayın zamanı</span>
              <input name="plannedFor" type="datetime-local" />
            </label>
            <label className="asset-checkbox">
              <input defaultChecked name="approvalRequired" type="checkbox" />
              <span>Önce onaya gitsin</span>
            </label>
            <label className="asset-checkbox">
              <input defaultChecked name="needsClientApproval" type="checkbox" />
              <span>Müşteri onayı istensin</span>
            </label>
            <div className="span-2">
              <button className="primary-submit" type="submit">
                İçeriği Oluştur
              </button>
            </div>
          </form>
        </section>

        <aside className="profile-sidebar">
          <section className="profile-card info-card">
            <div className="eyebrow">Takvim Özeti</div>
            <h2>{contentData.contentItems.length} aktif içerik kaydı</h2>
            <ul className="info-list">
              <li>Onay bekleyen: {contentData.contentItems.filter((item) => item.status === "WAITING_APPROVAL").length}</li>
              <li>Planlanan: {contentData.contentItems.filter((item) => item.status === "SCHEDULED").length}</li>
              <li>Taslak ve üretim aşaması: {contentData.contentItems.filter((item) => ["DRAFT", "GENERATED", "NEEDS_REVIEW"].includes(item.status)).length}</li>
            </ul>
          </section>

          <section className="profile-card info-card">
            <div className="eyebrow">Bu Ekran Ne İşe Yarar?</div>
            <h2>Takvim neden önemli?</h2>
            <ul className="info-list">
              <li>İşletme bilgileri ve görseller burada içeriğe dönüşür.</li>
              <li>Telegram onay akışı bu kayıtlar üzerinden çalışır.</li>
              <li>Yayın planı için merkez ekran burasıdır.</li>
            </ul>
          </section>
        </aside>
      </section>

      <section className="calendar-list">
        {contentData.contentItems.map((item) => {
          const previewAsset = getPreviewAsset(item.assets);
          const isPublishReady = item.assets.some((link) => link.isSelected);

          return (
          <article className="profile-card calendar-card" key={item.id}>
            <div className="calendar-card-head">
              <div>
                <strong>{item.title}</strong>
                <p className="muted">
                  {contentTypeLabel(item.type)} · {item.pillarName || "Kategori yok"} ·{" "}
                  {item.targetAction || "Hedef yok"}
                </p>
              </div>
              <span className={`soft-pill ${item.status === "WAITING_APPROVAL" ? "calendar-warn" : ""}`}>
                {contentStatusLabel(item.status)}
              </span>
            </div>

            <div className="readiness-row">
              <span className={`soft-pill ${isPublishReady ? "readiness-good" : "readiness-bad"}`}>
                {isPublishReady ? "Yayına hazır" : "Seçili final görsel yok"}
              </span>
            </div>

            {previewAsset ? (
              <div className="content-preview-shell">
                <img alt={item.title} className="content-preview-image" src={previewAsset.storageKey} />
                <div className="content-preview-meta">
                  <span className="asset-tag">{previewAsset.source || "görsel"}</span>
                  <span className="asset-tag">{item.assets.length} varyasyon</span>
                </div>
              </div>
            ) : null}

            {item.assets.length ? (
              <div className="output-gallery">
                {item.assets.map((link) => (
                  <div className={`output-card ${link.isSelected ? "selected" : ""}`} key={link.id}>
                    <img alt={link.asset.fileName} className="output-thumb" src={link.asset.storageKey} />
                    <div className="output-card-meta">
                      <span className="asset-tag">{link.asset.source || "görsel"}</span>
                      {link.isSelected ? <span className="asset-tag">seçili</span> : null}
                    </div>
                    {!link.isSelected ? (
                      <form action={selectFinalOutput}>
                        <input name="contentItemId" type="hidden" value={item.id} />
                        <input name="contentItemAssetId" type="hidden" value={link.id} />
                        <button className="ghost-action output-select-button" type="submit">
                          Final olarak seç
                        </button>
                      </form>
                    ) : (
                      <div className="output-selected-label">Final görsel</div>
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            <form action={updateContentItem} className="asset-form">
              <input name="contentItemId" type="hidden" value={item.id} />

              <label className="span-2">
                <span>Başlık</span>
                <input defaultValue={item.title} name="title" required />
              </label>
              <label>
                <span>İçerik türü</span>
                <select defaultValue={item.type} name="type">
                  <option value="POST">Post</option>
                  <option value="REEL">Reel</option>
                  <option value="STORY">Story</option>
                </select>
              </label>
              <label>
                <span>Durum</span>
                <select defaultValue={item.status} name="status">
                  <option value="DRAFT">Taslak</option>
                  <option value="GENERATED">Üretildi</option>
                  <option value="NEEDS_REVIEW">Kontrol bekliyor</option>
                  <option value="WAITING_APPROVAL">Onay bekliyor</option>
                  <option value="APPROVED">Onaylandı</option>
                  <option value="SCHEDULED">Planlandı</option>
                  <option value="PUBLISHED">Yayınlandı</option>
                  <option value="FAILED">Başarısız</option>
                  <option value="ARCHIVED">Arşivlendi</option>
                </select>
              </label>
              <label>
                <span>İçerik başlığı</span>
                <select defaultValue={item.pillarName || ""} name="pillarName">
                  <option value="">Seçilmedi</option>
                  {contentData.contentPillars.map((pillar) => (
                    <option key={pillar.id} value={pillar.name}>
                      {pillar.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Hedef</span>
                <input defaultValue={item.targetAction || ""} name="targetAction" />
              </label>
              <label>
                <span>Yayın zamanı</span>
                <input defaultValue={toDateValue(item.plannedFor)} name="plannedFor" type="datetime-local" />
              </label>
              <label className="asset-checkbox">
                <input defaultChecked={item.approvalRequired} name="approvalRequired" type="checkbox" />
                <span>Önce onaya gitsin</span>
              </label>
              <label className="asset-checkbox">
                <input
                  defaultChecked={item.needsClientApproval}
                  name="needsClientApproval"
                  type="checkbox"
                />
                <span>Müşteri onayı istensin</span>
              </label>
              <div className="span-2">
                <div className="calendar-actions">
                  <button className="ghost-action" type="submit">
                    İçeriği Güncelle
                  </button>
                  <button className="ghost-action" formAction={sendToApproval} name="contentItemId" type="submit" value={item.id}>
                    Onaya Gönder
                  </button>
                </div>
              </div>
            </form>
          </article>
        )})}
      </section>
    </main>
  );
}
