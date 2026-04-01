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
          <div className="eyebrow">Media System</div>
          <h1>Asset Library</h1>
          <p className="muted">
            Bu modulde artik iki akış var: istersen dogrudan dosya yuklersin, istersen harici bir
            medya URL / storage key girersin. Yuklenen dosyalar lokal gelistirme ortaminda
            `public/uploads` altina kaydediliyor.
          </p>
        </div>

        <div className="topbar-actions">
          <Link className="link-chip" href="/">
            Dashboard
          </Link>
          <Link className="link-chip" href="/business-profile">
            Business Profile
          </Link>
        </div>
      </header>

      <section className="asset-layout">
        <section className="profile-card profile-form">
          <div className="card-head">
            <div>
              <div className="eyebrow">Create Asset</div>
              <h2>Yeni medya ekle</h2>
            </div>
          </div>

          <form action={createAsset} className="form-grid">
            <input type="hidden" name="businessId" value={business.id} />

            <label>
              <span>File name</span>
              <input name="fileName" placeholder="signature-burger.jpg" required />
            </label>
            <label>
              <span>Upload file</span>
              <input accept="image/*,video/*" name="assetFile" type="file" />
            </label>
            <label>
              <span>Media type</span>
              <select defaultValue="IMAGE" name="mediaType">
                <option value="IMAGE">Image</option>
                <option value="VIDEO">Video</option>
              </select>
            </label>
            <label className="span-2">
              <span>Storage key / media URL</span>
              <input name="storageKey" placeholder="/uploads/... veya https://..." />
            </label>
            <label>
              <span>MIME type</span>
              <input defaultValue="image/jpeg" name="mimeType" required />
            </label>
            <label>
              <span>Source</span>
              <input defaultValue="operator_upload" name="source" />
            </label>
            <label>
              <span>Quality score</span>
              <input defaultValue="80" name="qualityScore" type="number" min="0" max="100" />
            </label>
            <label className="span-2">
              <span>Tags</span>
              <input name="tags" placeholder="product, hero-shot, signature" />
            </label>
            <div className="span-2">
              <button className="primary-submit" type="submit">
                Add Asset
              </button>
            </div>
          </form>
        </section>

        <aside className="profile-sidebar">
          <section className="profile-card info-card">
            <div className="eyebrow">Library Snapshot</div>
            <h2>{assetLibrary.assets.length} medya kaydi aktif</h2>
            <ul className="info-list">
              <li>Featured asset sayisi: {assetLibrary.assets.filter((asset) => asset.isFeatured).length}</li>
              <li>Image adet: {assetLibrary.assets.filter((asset) => asset.mediaType === "IMAGE").length}</li>
              <li>Video adet: {assetLibrary.assets.filter((asset) => asset.mediaType === "VIDEO").length}</li>
            </ul>
          </section>

          <section className="profile-card info-card">
            <div className="eyebrow">Why This Matters</div>
            <h2>Content engine icin temel</h2>
            <ul className="info-list">
              <li>Tag yapisi sayesinde AI hangi gorselin hangi icerik tipine uygun oldugunu anlayacak.</li>
              <li>Featured medya, marka icin one cikarilacak kahraman varliklari belirliyor.</li>
              <li>Reel b-roll, hero shot ve atmosphere gibi etiketler sonraki modullerde kullanilacak.</li>
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
                    {asset.mediaType} · {asset.source}
                  </p>
                </div>
                {asset.isFeatured ? <span className="soft-pill">Featured</span> : null}
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
                  <span>File name</span>
                  <input defaultValue={asset.fileName} name="fileName" required />
                </label>
                <label>
                  <span>Replace file</span>
                  <input accept="image/*,video/*" name="assetFile" type="file" />
                </label>
                <label>
                  <span>Media type</span>
                  <select defaultValue={asset.mediaType} name="mediaType">
                    <option value="IMAGE">Image</option>
                    <option value="VIDEO">Video</option>
                  </select>
                </label>
                <label className="span-2">
                  <span>Storage key / media URL</span>
                  <input defaultValue={asset.storageKey} name="storageKey" required />
                </label>
                <label>
                  <span>MIME type</span>
                  <input defaultValue={asset.mimeType} name="mimeType" required />
                </label>
                <label>
                  <span>Source</span>
                  <input defaultValue={asset.source} name="source" />
                </label>
                <label>
                  <span>Quality score</span>
                  <input
                    defaultValue={asset.qualityScore ?? 0}
                    name="qualityScore"
                    type="number"
                    min="0"
                    max="100"
                  />
                </label>
                <label className="span-2">
                  <span>Tags</span>
                  <input defaultValue={tagText(asset.tags)} name="tags" />
                </label>
                <label className="asset-checkbox span-2">
                  <input defaultChecked={asset.isFeatured} name="isFeatured" type="checkbox" />
                  <span>Set as featured asset</span>
                </label>
                <div className="span-2">
                  <button className="ghost-action" type="submit">
                    Update Asset
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
