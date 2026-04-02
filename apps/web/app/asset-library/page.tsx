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
  const featuredCount = assetLibrary.assets.filter((asset) => asset.isFeatured).length;
  const imageCount = assetLibrary.assets.filter((asset) => asset.mediaType === "IMAGE").length;
  const videoCount = assetLibrary.assets.filter((asset) => asset.mediaType === "VIDEO").length;

  return (
    <main className="customer-shell">
      <header className="customer-topbar">
        <div>
          <div className="eyebrow">Görsel Sistemi</div>
          <h1>Görsel Kütüphanesi</h1>
          <p>
            Burada sadece işletmeni anlatan görselleri eklersin. Karmaşık ayarları arkada biz
            hallediyoruz; sen sadece doğru fotoğrafları yükle.
          </p>
        </div>

        <div className="customer-topbar-actions">
          <Link className="ghost-action" href="/musteri-paneli">
            Müşteri Paneli
          </Link>
          <Link className="ghost-action" href="/">
            Ana Sayfa
          </Link>
          <Link className="solid-action" href="/generate-studio">
            Sonraki Adım: Üretime Geç
          </Link>
        </div>
      </header>

      <section className="customer-summary-grid simple-summary-grid">
        <article className="customer-summary-card">
          <span>Toplam kayıt</span>
          <strong>{assetLibrary.assets.length}</strong>
          <p>Kütüphanedeki tüm görsel ve video sayısı.</p>
        </article>
        <article className="customer-summary-card">
          <span>Öne çıkan</span>
          <strong>{featuredCount}</strong>
          <p>Markanı en iyi anlatan seçili görseller.</p>
        </article>
        <article className="customer-summary-card">
          <span>Görsel</span>
          <strong>{imageCount}</strong>
          <p>Yapay zekânın üretimde kullanacağı fotoğraflar.</p>
        </article>
        <article className="customer-summary-card">
          <span>Video</span>
          <strong>{videoCount}</strong>
          <p>Kısa video ve reels kaynakları.</p>
        </article>
      </section>

      <section className="workflow-strip">
        <div className="workflow-step current">
          <strong>1. Görsellerini ekle</strong>
          <p>Mekân, ürün, detay ve atmosfer fotoğraflarını yükle.</p>
        </div>
        <div className="workflow-step">
          <strong>2. Telegram&apos;ı bağla</strong>
          <p>İstersen güncellemeleri Telegram üzerinden yap.</p>
        </div>
        <div className="workflow-step">
          <strong>3. İlk üretimi başlat</strong>
          <p>Yapay zekâ işletmene uygun yeni görseller oluştursun.</p>
        </div>
      </section>

      <section className="simple-library-layout">
        <section className="customer-card simple-upload-card">
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
              <button className="solid-action" type="submit">
                Görseli Yükle
              </button>
            </div>
          </form>
        </section>

        <aside className="customer-card simple-help-card">
          <span className="customer-card-tag">Nasıl seçmeliyim?</span>
          <h2>En iyi sonuç için bunları yükle</h2>
          <p>Mekânın genel görünümü, ürün yakın planları, masa düzeni ve atmosfer fotoğrafları en çok işimize yarar.</p>
          <ul className="simple-help-list">
            <li>İşletmenin dışı veya giriş alanı</li>
            <li>En çok satan ürünlerin net fotoğrafları</li>
            <li>Mekân içinden birkaç farklı açı</li>
            <li>Işık ve ambiyansı gösteren kareler</li>
          </ul>
          <div className="customer-hero-actions">
            <Link className="ghost-action" href="/business-profile">
              İşletme Kartını Aç
            </Link>
            <Link className="solid-action" href="/generate-studio">
              Üretime Geç
            </Link>
          </div>
        </aside>
      </section>

      <section className="section-heading simple-gallery-heading">
        <div>
          <div className="eyebrow">Son Yüklenenler</div>
          <h2>Kütüphanendeki görseller</h2>
          <p>Burada sadece yüklediğin görselleri görürsün. Karmaşık ayar alanlarını gizledik.</p>
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
