import Link from "next/link";
import { createAsset, updateAsset } from "./actions";

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

const tagText = (tags: Array<{ tag: string }>) => tags.map((tag) => tag.tag).join(", ");

export default async function AssetLibraryPage() {
  const workspace = await getWorkspace();
  const business = workspace.businesses[0];
  const assetLibrary = await getAssets(business.id);

  return (
    <main className="profile-shell">
      <header className="profile-topbar">
        <div>
          <div className="eyebrow">Görsel Sistemi</div>
          <h1>Görsel Kütüphanesi</h1>
          <p className="muted">
            Buraya işletmeni anlatan görselleri ekliyorsun. Mekân, ürün, detay ve atmosfer
            fotoğrafları ne kadar iyi olursa yapay zekâ da o kadar iyi üretim yapar.
          </p>
        </div>

        <div className="topbar-actions">
          <Link className="link-chip" href="/">
            Ana Sayfa
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
              <div className="eyebrow">Yeni Kayıt</div>
              <h2>Yeni görsel veya video ekle</h2>
            </div>
          </div>

          <form action={createAsset} className="form-grid">
            <input type="hidden" name="businessId" value={business.id} />

            <label>
              <span>Dosya adı</span>
              <input name="fileName" placeholder="imza-burger.jpg" required />
            </label>
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
            <label className="span-2">
              <span>Medya bağlantısı</span>
              <input name="storageKey" placeholder="/uploads/... veya https://..." />
            </label>
            <label>
              <span>Dosya tipi</span>
              <input defaultValue="image/jpeg" name="mimeType" required />
            </label>
            <label>
              <span>Kaynak</span>
              <input defaultValue="operator_upload" name="source" />
            </label>
            <label>
              <span>Kalite puanı</span>
              <input defaultValue="80" name="qualityScore" type="number" min="0" max="100" />
            </label>
            <label className="span-2">
              <span>Etiketler</span>
              <input name="tags" placeholder="ürün, menü, mekân, detay, atmosfer" />
            </label>
            <div className="span-2">
              <button className="primary-submit" type="submit">
                Kaydı Ekle
              </button>
            </div>
          </form>
        </section>

        <aside className="profile-sidebar">
          <section className="profile-card info-card">
            <div className="eyebrow">Kütüphane Özeti</div>
            <h2>{assetLibrary.assets.length} medya kaydı aktif</h2>
            <ul className="info-list">
              <li>Öne çıkan kayıt: {assetLibrary.assets.filter((asset) => asset.isFeatured).length}</li>
              <li>Görsel sayısı: {assetLibrary.assets.filter((asset) => asset.mediaType === "IMAGE").length}</li>
              <li>Video sayısı: {assetLibrary.assets.filter((asset) => asset.mediaType === "VIDEO").length}</li>
            </ul>
          </section>

          <section className="profile-card info-card">
            <div className="eyebrow">Neden Önemli?</div>
            <h2>Üretim için temel alan</h2>
            <ul className="info-list">
              <li>Etiketler sayesinde yapay zekâ hangi görselin hangi içerikte kullanılacağını anlar.</li>
              <li>Öne çıkan kayıtlar markanın ana görsel hafızasını oluşturur.</li>
              <li>Ürün, mekân, detay ve atmosfer gibi etiketler üretimde kullanılır.</li>
            </ul>
          </section>
        </aside>
      </section>

      <section className="asset-grid">
        {assetLibrary.assets.map((asset) => (
          <article className="profile-card asset-card" key={asset.id}>
            <div className="asset-preview-wrap">
              {asset.mediaType === "IMAGE" ? (
                <img alt={asset.fileName} className="asset-preview" src={asset.storageKey} />
              ) : (
                <div className="asset-video-placeholder">
                  <span>VIDEO</span>
                  <strong>{asset.fileName}</strong>
                </div>
              )}
            </div>

            <div className="asset-card-body">
              <div className="asset-card-top">
                <div>
                  <strong>{asset.fileName}</strong>
                  <p className="muted">
                    {asset.mediaType === "IMAGE" ? "Görsel" : "Video"} · {asset.source}
                  </p>
                </div>
                {asset.isFeatured ? <span className="soft-pill">Öne Çıkan</span> : null}
              </div>

              <div className="asset-tag-row">
                {asset.tags.map((tag) => (
                  <span className="asset-tag" key={tag.id}>
                    {tag.tag}
                  </span>
                ))}
              </div>

              <form action={updateAsset} className="asset-form">
                <input type="hidden" name="assetId" value={asset.id} />
                <label>
                  <span>Dosya adı</span>
                  <input defaultValue={asset.fileName} name="fileName" required />
                </label>
                <label>
                  <span>Dosyayı değiştir</span>
                  <input accept="image/*,video/*" name="assetFile" type="file" />
                </label>
                <label>
                  <span>Medya türü</span>
                  <select defaultValue={asset.mediaType} name="mediaType">
                    <option value="IMAGE">Görsel</option>
                    <option value="VIDEO">Video</option>
                  </select>
                </label>
                <label className="span-2">
                  <span>Medya bağlantısı</span>
                  <input defaultValue={asset.storageKey} name="storageKey" required />
                </label>
                <label>
                  <span>Dosya tipi</span>
                  <input defaultValue={asset.mimeType} name="mimeType" required />
                </label>
                <label>
                  <span>Kaynak</span>
                  <input defaultValue={asset.source} name="source" />
                </label>
                <label>
                  <span>Kalite puanı</span>
                  <input
                    defaultValue={asset.qualityScore ?? 0}
                    name="qualityScore"
                    type="number"
                    min="0"
                    max="100"
                  />
                </label>
                <label className="span-2">
                  <span>Etiketler</span>
                  <input defaultValue={tagText(asset.tags)} name="tags" />
                </label>
                <label className="asset-checkbox span-2">
                  <input defaultChecked={asset.isFeatured} name="isFeatured" type="checkbox" />
                  <span>Öne çıkan görsel yap</span>
                </label>
                <div className="span-2">
                  <button className="ghost-action" type="submit">
                    Kaydı Güncelle
                  </button>
                </div>
              </form>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
