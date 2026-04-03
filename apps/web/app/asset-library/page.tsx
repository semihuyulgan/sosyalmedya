import Link from "next/link";
import { UploadPanel } from "./upload-panel";

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

const resolveAssetSrc = (storageKey: string) => {
  if (!storageKey) return null;
  if (storageKey.startsWith("http://") || storageKey.startsWith("https://") || storageKey.startsWith("/")) {
    return storageKey;
  }
  return null;
};

const getAssetCategory = (asset: AssetResponse["assets"][number]) => {
  const tags = asset.tags.map((tag) => tag.tag.toLocaleLowerCase("tr-TR"));
  if (tags.includes("urun")) return "urun";
  if (tags.includes("mekan")) return "mekan";
  return "diger";
};

export default async function AssetLibraryPage() {
  const workspace = await getWorkspace();
  const business = workspace.businesses[0];
  const assetLibrary = await getAssets(business.id);
  const mekanAssets = assetLibrary.assets.filter((asset) => getAssetCategory(asset) === "mekan");
  const urunAssets = assetLibrary.assets.filter((asset) => getAssetCategory(asset) === "urun");
  const otherGroups = assetLibrary.assets
    .filter((asset) => getAssetCategory(asset) === "diger")
    .reduce<Record<string, typeof assetLibrary.assets>>((groups, asset) => {
      const customTag =
        asset.tags
          .map((tag) => tag.tag)
          .find((tag) => !["mekan", "urun"].includes(tag.toLocaleLowerCase("tr-TR"))) || "diger";
      groups[customTag] = [...(groups[customTag] || []), asset];
      return groups;
    }, {});

  return (
    <main className="customer-shell">
      <header className="customer-topbar">
        <div>
          <div className="eyebrow">Adım 2 / 3</div>
          <h1>Görsellerini yükle.</h1>
          <p>
            Burada görselleri kategori kategori yüklersin. Böylece sistem, hangi fotoğrafın mekânı
            anlattığını hangi fotoğrafın ürünü anlattığını daha doğru öğrenir.
          </p>
        </div>
      </header>

      <section className="single-flow-shell narrow-flow-shell">
        <section className="customer-card simple-upload-card single-flow-card">
          <div className="section-heading compact-heading">
            <div>
              <div className="eyebrow">Yeni Yükleme</div>
              <h2>Görselleri kategorisine göre yükle</h2>
            </div>
          </div>

          <UploadPanel businessId={business.id} />
        </section>
      </section>

      <section className="section-heading simple-gallery-heading">
        <div>
          <div className="eyebrow">Son Yüklenenler</div>
          <h2>Kütüphanendeki görseller</h2>
          <p>Yüklediklerin kategori kategori görünür. Böylece neyin mekânı neyin ürünü anlattığı net olur.</p>
        </div>
      </section>

      <section className="single-flow-shell narrow-flow-shell grouped-library-shell">
        <div className="grouped-library-section">
          <div className="section-heading compact-heading">
            <div>
              <div className="eyebrow">Mekân</div>
              <h2>Mekân görselleri</h2>
            </div>
          </div>
          <div className="mini-thumb-grid">
            {mekanAssets.map((asset) => {
              const previewSrc = resolveAssetSrc(asset.storageKey);
              return (
                <article className="mini-thumb-card" key={asset.id}>
                  {previewSrc ? <img alt={asset.fileName} className="mini-thumb-image" src={previewSrc} /> : null}
                </article>
              );
            })}
          </div>
        </div>

        <div className="grouped-library-section">
          <div className="section-heading compact-heading">
            <div>
              <div className="eyebrow">Ürün</div>
              <h2>Ürün görselleri</h2>
            </div>
          </div>
          <div className="mini-thumb-grid">
            {urunAssets.map((asset) => {
              const previewSrc = resolveAssetSrc(asset.storageKey);
              return (
                <article className="mini-thumb-card" key={asset.id}>
                  {previewSrc ? <img alt={asset.fileName} className="mini-thumb-image" src={previewSrc} /> : null}
                </article>
              );
            })}
          </div>
        </div>

        {Object.entries(otherGroups).map(([groupName, assets]) => (
          <div className="grouped-library-section" key={groupName}>
            <div className="section-heading compact-heading">
              <div>
                <div className="eyebrow">Ek kategori</div>
                <h2>{groupName}</h2>
              </div>
            </div>
            <div className="mini-thumb-grid">
              {assets.map((asset) => {
                const previewSrc = resolveAssetSrc(asset.storageKey);
                return (
                  <article className="mini-thumb-card" key={asset.id}>
                    {previewSrc ? <img alt={asset.fileName} className="mini-thumb-image" src={previewSrc} /> : null}
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
