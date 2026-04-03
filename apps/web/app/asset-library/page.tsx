import Link from "next/link";
import { createAsset } from "./actions";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

type WorkspaceResponse = {
  businesses: Array<{
    id: string;
    name: string;
  }>;
};

type AssetResponse = {
  id: string;
  name: string;
  assets: Array<{
    id: string;
    fileName: string;
    storageKey: string;
    mimeType: string;
    mediaType: string;
    source: string;
    qualityScore: number | null;
    isFeatured: boolean;
    createdAt: string;
    tags: Array<{
      id: string;
      tag: string;
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

const getAssets = async (businessId: string) => {
  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/assets`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Assets could not be loaded.");
  }

  return (await response.json()) as AssetResponse;
};

export default async function AssetLibraryPage() {
  const workspace = await getWorkspace();
  const business = workspace.businesses[0];
  const assetLibrary = await getAssets(business.id);

  return (
    <main className="customer-shell">
      <header className="customer-topbar">
        <div>
          <div className="eyebrow">Adım 2 / 3</div>
          <h1>Görsellerini yükle.</h1>
          <p>
            Burada sadece işletmeni anlatan görselleri eklersin. Karmaşık ayarları arkada biz
            hallediyoruz; sen sadece doğru fotoğrafları yükle.
          </p>
        </div>
      </header>

      <section className="single-flow-shell">
        <section className="customer-card simple-upload-card single-flow-card">
          <div className="section-heading compact-heading">
            <div>
              <div className="eyebrow">Yeni Yükleme</div>
              <h2>Yeni görsel veya video ekle</h2>
            </div>
          </div>

          <form action={createAsset} className="form-grid">
            <input type="hidden" name="businessId" value={business.id} />
            <input type="hidden" name="mimeType" value="image/jpeg" />
            <input type="hidden" name="source" value="panel_upload" />
            <input type="hidden" name="qualityScore" value="80" />
            <label>
              <span>Dosya yükle</span>
              <input accept="image/*,video/*" name="assetFile" type="file" />
            </label>
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
              <div className="flow-actions">
                <Link className="ghost-action" href="/business-profile">
                  Önceki adım: İşletme Kartı
                </Link>
                <button className="solid-action" type="submit">
                  Görseli Yükle
                </button>
                <Link className="ghost-action" href="/telegram-center">
                  Görselleri yükledim, Telegram’a geç
                </Link>
              </div>
            </div>
          </form>
        </section>
      </section>

      <section className="section-heading simple-gallery-heading">
        <div>
          <div className="eyebrow">Son Yüklenenler</div>
          <h2>Kütüphanendeki görseller</h2>
          <p>Yüklediklerin burada görünür. Beğenmediklerini sonra birlikte düzenleyebiliriz.</p>
        </div>
      </section>

      <section className="simple-gallery-grid">
        {assetLibrary.assets.map((asset) => (
          <article className="customer-card simple-asset-card" key={asset.id}>
            <div className="simple-asset-visual">
              {asset.mediaType === "IMAGE" ? (
                <img alt={asset.fileName} className="asset-preview" src={asset.storageKey} />
              ) : (
                <div className="asset-video-placeholder">
                  <span>VIDEO</span>
                  <strong>{asset.fileName}</strong>
                </div>
              )}
            </div>

            <div className="simple-asset-body">
              <div className="simple-asset-head">
                <strong>{asset.fileName}</strong>
                {asset.isFeatured ? <span className="customer-card-tag">Öne çıkan</span> : null}
              </div>
              <p className="muted">
                {asset.mediaType === "IMAGE" ? "Görsel" : "Video"} ·{" "}
                {asset.source === "telegram_upload"
                  ? "Telegram'dan geldi"
                  : asset.source === "openai_generated"
                    ? "Yapay zekâ tarafından üretildi"
                    : "Panelden yüklendi"}
              </p>
              <div className="asset-tag-row">
                {asset.tags.map((tag) => (
                  <span className="asset-tag" key={tag.id}>
                    {tag.tag}
                  </span>
                ))}
              </div>
              <span className="simple-asset-date">
                {new Date(asset.createdAt).toLocaleDateString("tr-TR")}
              </span>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
