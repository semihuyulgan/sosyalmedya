import Link from "next/link";
import { createGenerationBrief, updateGenerationBrief } from "./actions";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

type WorkspaceResponse = {
  businesses: Array<{
    id: string;
    name: string;
  }>;
};

type GenerateStudioResponse = {
  id: string;
  name: string;
  category: string;
  assets: Array<{
    id: string;
    fileName: string;
    mediaType: string;
    storageKey: string;
    isFeatured: boolean;
    tags: Array<{ id: string; tag: string }>;
  }>;
  visualWorldProfile: null | {
    id: string;
    keepElementsJson: string | null;
    references: Array<{
      id: string;
      role: string;
      zone: string | null;
      isAnchor: boolean;
      asset: {
        id: string;
        fileName: string;
      };
    }>;
    sceneRecipes: Array<{
      id: string;
      title: string;
      sceneType: string;
      objective: string | null;
      promptFrame: string | null;
      subjectNotes: string | null;
      compositionNotes: string | null;
      variationNotes: string | null;
      active: boolean;
    }>;
  };
  generationBriefs: Array<{
    id: string;
    title: string;
    generationMode: string;
    objective: string | null;
    outputType: string;
    aspectRatio: string;
    status: string;
    variationCount: number;
    promptDirection: string | null;
    subjectDirection: string | null;
    remixInstruction: string | null;
    selectedReferenceIdsJson: string | null;
    selectedAssetIdsJson: string | null;
    keepElementsJson: string | null;
    sceneRecipe: null | {
      id: string;
      title: string;
    };
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

const getGenerateStudio = async (businessId: string) => {
  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/generate-studio`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Generate Studio could not be loaded.");
  }

  return (await response.json()) as GenerateStudioResponse;
};

const parseJsonArray = (value: string | null | undefined) => {
  if (!value) return [] as string[];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const prettyJson = (value: string | null | undefined) => {
  if (!value) return "";

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

export default async function GenerateStudioPage() {
  const workspace = await getWorkspace();
  const business = workspace.businesses[0];
  const studio = await getGenerateStudio(business.id);
  const profile = studio.visualWorldProfile;

  return (
    <main className="profile-shell">
      <header className="profile-topbar">
        <div>
          <div className="eyebrow">Yapay Zeka Üretimi</div>
          <h1>Üretim Stüdyosu</h1>
          <p className="muted">
            Burası prompt yazma alanı değil; mekan hafızası, referans görseller ve sahne reçeteleri
            ile kontrollü üretim talepleri oluşturduğun yer.
          </p>
        </div>

        <div className="topbar-actions">
          <Link className="link-chip" href="/">
            Ana Sayfa
          </Link>
          <Link className="link-chip" href="/visual-world">
            Görsel Dünya
          </Link>
          <Link className="link-chip" href="/asset-library">
            Görsel Kütüphanesi
          </Link>
        </div>
      </header>

      <section className="visual-hero">
        <div className="profile-card visual-hero-card">
          <div className="eyebrow">Üretim Özeti</div>
          <h2>{studio.name}</h2>
          <p className="muted">
            Bir üretim talebi; sahne reçetesi, referans seçimi, görsel seçimi ve korunacak
            öğeleri aynı yerde birleştirir.
          </p>
          <div className="visual-stat-row">
            <div className="visual-stat">
              <strong>{studio.generationBriefs.length}</strong>
              <span>Toplam üretim talebi</span>
            </div>
            <div className="visual-stat">
              <strong>{studio.generationBriefs.filter((item) => item.status === "READY_FOR_GENERATION").length}</strong>
              <span>Üretime hazır</span>
            </div>
            <div className="visual-stat">
              <strong>{profile?.references.filter((item) => item.isAnchor).length || 0}</strong>
              <span>Ana referans</span>
            </div>
            <div className="visual-stat">
              <strong>{profile?.sceneRecipes.length || 0}</strong>
              <span>Sahne reçetesi</span>
            </div>
          </div>
        </div>
      </section>

      <section className="visual-grid">
        <form action={createGenerationBrief} className="profile-card profile-form">
          <input type="hidden" name="businessId" value={business.id} />

          <div className="card-head">
            <div>
              <div className="eyebrow">Yeni Talep</div>
              <h2>Yeni üretim isteği oluştur</h2>
            </div>
            <button className="primary-submit" type="submit">
              Talep Oluştur
            </button>
          </div>

          <div className="form-grid">
            <label className="span-2">
              <span>Başlık</span>
              <input defaultValue="Mekan içinde premium ürün hikayesi" name="title" required />
            </label>
            <label>
              <span>Üretim türü</span>
              <select defaultValue="PRODUCT_IN_CONTEXT" name="generationMode">
                <option value="REMIX">Mevcut görseli geliştir</option>
                <option value="SCENE_EXPANSION">Sahneyi genişlet</option>
                <option value="PRODUCT_IN_CONTEXT">Ürünü mekan içinde göster</option>
                <option value="NARRATIVE_LIFESTYLE">Yaşam tarzı sahnesi üret</option>
              </select>
            </label>
            <label>
              <span>Sahne reçetesi</span>
              <select defaultValue="" name="sceneRecipeId">
                <option value="">Reçete seçilmedi</option>
                {profile?.sceneRecipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Hedef</span>
              <input defaultValue="PROFILE_TRAFFIC" name="objective" />
            </label>
            <label>
              <span>Durum</span>
              <select defaultValue="DRAFT" name="status">
                <option value="DRAFT">Taslak</option>
                <option value="READY_FOR_GENERATION">Üretime hazır</option>
                <option value="GENERATING">Üretiliyor</option>
                <option value="COMPLETED">Tamamlandı</option>
              </select>
            </label>
            <label>
              <span>Çıktı türü</span>
              <select defaultValue="IMAGE_SET" name="outputType">
                <option value="IMAGE_SET">Görsel seti</option>
                <option value="REEL_STORYBOARD">Reels storyboard</option>
                <option value="STORY_SERIES">Story serisi</option>
              </select>
            </label>
            <label>
              <span>Boyut oranı</span>
              <select defaultValue="4:5" name="aspectRatio">
                <option value="4:5">4:5</option>
                <option value="1:1">1:1</option>
                <option value="9:16">9:16</option>
                <option value="16:9">16:9</option>
              </select>
            </label>
            <label>
              <span>Varyasyon sayısı</span>
              <input defaultValue="4" min="1" max="12" name="variationCount" type="number" />
            </label>
            <label className="span-2">
              <span>Genel yönlendirme</span>
              <textarea name="promptDirection" rows={4} />
            </label>
            <label className="span-2">
              <span>Konu yönlendirmesi</span>
              <textarea name="subjectDirection" rows={4} />
            </label>
            <label className="span-2">
              <span>Ek talimat</span>
              <textarea name="remixInstruction" rows={4} />
            </label>
            <label className="span-2">
              <span>Korunacak öğeler</span>
              <textarea
                defaultValue={prettyJson(profile?.keepElementsJson)}
                name="keepElementsJson"
                rows={6}
              />
            </label>
            <label className="span-2">
              <span>Referans görseller</span>
              <select multiple className="multi-select" name="selectedReferenceIds" size={Math.max(profile?.references.length || 2, 2)}>
                {profile?.references.map((reference) => (
                  <option key={reference.id} value={reference.id}>
                    {reference.asset.fileName} · {reference.role} {reference.isAnchor ? "· ana referans" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="span-2">
              <span>Kullanılacak görseller</span>
              <select multiple className="multi-select" name="selectedAssetIds" size={Math.max(studio.assets.length, 3)}>
                {studio.assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.fileName} {asset.isFeatured ? "· öne çıkan" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </form>

        <aside className="profile-sidebar">
          <section className="profile-card info-card">
            <div className="eyebrow">Nasıl Düşünmeli?</div>
            <h2>Talep mantığı</h2>
            <ul className="info-list">
              <li>Sahne reçetesi, üretimin hangi mantıkla yapılacağını belirler.</li>
              <li>Referans görseller, mekanın korunması gereken tarafını tanımlar.</li>
              <li>Kullanılacak görseller, ürünü veya sahneyi taşır.</li>
              <li>Korunacak öğeler listesi modelin neyi bozmaması gerektiğini söyler.</li>
            </ul>
          </section>

          <section className="profile-card info-card">
            <div className="eyebrow">Sonraki Katman</div>
            <h2>Buradan sonra ne olacak?</h2>
            <ul className="info-list">
              <li>Gerçek görsel üretim çağrıları burada devreye girer.</li>
              <li>Talebe göre prompt ve referanslar birlikte kullanılır.</li>
              <li>Üretilen varyasyonlar onay ve içerik takvimine bağlanır.</li>
            </ul>
          </section>
        </aside>
      </section>

      <section className="recipe-list">
        {studio.generationBriefs.map((brief) => {
          const selectedReferenceIds = parseJsonArray(brief.selectedReferenceIdsJson);
          const selectedAssetIds = parseJsonArray(brief.selectedAssetIdsJson);

          return (
            <article className="profile-card recipe-card" key={brief.id}>
              <div className="calendar-card-head">
                <div>
                  <strong>{brief.title}</strong>
                  <p className="muted">
                    {brief.generationMode} · {brief.sceneRecipe?.title || "No recipe"} · {brief.outputType}
                  </p>
                </div>
                <span className="soft-pill">{brief.status}</span>
              </div>

              <form action={updateGenerationBrief} className="asset-form">
                <input type="hidden" name="briefId" value={brief.id} />
                <label className="span-2">
                  <span>Title</span>
                  <input defaultValue={brief.title} name="title" required />
                </label>
                <label>
                  <span>Generation mode</span>
                  <select defaultValue={brief.generationMode} name="generationMode">
                    <option value="REMIX">REMIX</option>
                    <option value="SCENE_EXPANSION">SCENE_EXPANSION</option>
                    <option value="PRODUCT_IN_CONTEXT">PRODUCT_IN_CONTEXT</option>
                    <option value="NARRATIVE_LIFESTYLE">NARRATIVE_LIFESTYLE</option>
                  </select>
                </label>
                <label>
                  <span>Scene recipe</span>
                  <select defaultValue={brief.sceneRecipe?.id || ""} name="sceneRecipeId">
                    <option value="">No recipe</option>
                    {profile?.sceneRecipes.map((recipe) => (
                      <option key={recipe.id} value={recipe.id}>
                        {recipe.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Objective</span>
                  <input defaultValue={brief.objective || ""} name="objective" />
                </label>
                <label>
                  <span>Status</span>
                  <select defaultValue={brief.status} name="status">
                    <option value="DRAFT">DRAFT</option>
                    <option value="READY_FOR_GENERATION">READY_FOR_GENERATION</option>
                    <option value="GENERATING">GENERATING</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </label>
                <label>
                  <span>Output type</span>
                  <select defaultValue={brief.outputType} name="outputType">
                    <option value="IMAGE_SET">IMAGE_SET</option>
                    <option value="REEL_STORYBOARD">REEL_STORYBOARD</option>
                    <option value="STORY_SERIES">STORY_SERIES</option>
                  </select>
                </label>
                <label>
                  <span>Aspect ratio</span>
                  <select defaultValue={brief.aspectRatio} name="aspectRatio">
                    <option value="4:5">4:5</option>
                    <option value="1:1">1:1</option>
                    <option value="9:16">9:16</option>
                    <option value="16:9">16:9</option>
                  </select>
                </label>
                <label>
                  <span>Variation count</span>
                  <input defaultValue={brief.variationCount} min="1" max="12" name="variationCount" type="number" />
                </label>
                <label className="span-2">
                  <span>Prompt direction</span>
                  <textarea defaultValue={brief.promptDirection || ""} name="promptDirection" rows={4} />
                </label>
                <label className="span-2">
                  <span>Subject direction</span>
                  <textarea defaultValue={brief.subjectDirection || ""} name="subjectDirection" rows={4} />
                </label>
                <label className="span-2">
                  <span>Remix instruction</span>
                  <textarea defaultValue={brief.remixInstruction || ""} name="remixInstruction" rows={4} />
                </label>
                <label className="span-2">
                  <span>Keep elements JSON</span>
                  <textarea defaultValue={prettyJson(brief.keepElementsJson)} name="keepElementsJson" rows={6} />
                </label>
                <label className="span-2">
                  <span>Reference assets</span>
                  <select
                    multiple
                    className="multi-select"
                    name="selectedReferenceIds"
                    defaultValue={selectedReferenceIds}
                    size={Math.max(profile?.references.length || 2, 2)}
                  >
                    {profile?.references.map((reference) => (
                      <option key={reference.id} value={reference.id}>
                        {reference.asset.fileName} · {reference.role}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="span-2">
                  <span>Content assets</span>
                  <select
                    multiple
                    className="multi-select"
                    name="selectedAssetIds"
                    defaultValue={selectedAssetIds}
                    size={Math.max(studio.assets.length, 3)}
                  >
                    {studio.assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.fileName}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="span-2">
                  <button className="ghost-action" type="submit">
                    Update Brief
                  </button>
                </div>
              </form>
            </article>
          );
        })}
      </section>
    </main>
  );
}
