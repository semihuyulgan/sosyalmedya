import Link from "next/link";
import { createGenerationBrief, updateGenerationBrief } from "./actions";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

type WorkspaceResponse = {
  businesses: Array<{
    id: string;
    name: string;
    primaryGoal: string;
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

const generationModeLabel = (value: string) => {
  switch (value) {
    case "REMIX":
      return "Mevcut görseli geliştir";
    case "SCENE_EXPANSION":
      return "Sahneyi genişlet";
    case "PRODUCT_IN_CONTEXT":
      return "Ürünü mekân içinde göster";
    case "NARRATIVE_LIFESTYLE":
      return "Yaşam tarzı sahnesi üret";
    default:
      return value;
  }
};

const outputTypeLabel = (value: string) => {
  switch (value) {
    case "IMAGE_SET":
      return "Görsel seti";
    case "REEL_STORYBOARD":
      return "Reels taslağı";
    case "STORY_SERIES":
      return "Story serisi";
    default:
      return value;
  }
};

const statusLabel = (value: string) => {
  switch (value) {
    case "DRAFT":
      return "Taslak";
    case "READY_FOR_GENERATION":
      return "Üretime hazır";
    case "GENERATING":
      return "Üretiliyor";
    case "COMPLETED":
      return "Tamamlandı";
    default:
      return value;
  }
};

export default async function GenerateStudioPage() {
  const workspace = await getWorkspace();
  const business = workspace.businesses[0];
  const studio = await getGenerateStudio(business.id);
  const profile = studio.visualWorldProfile;

  return (
    <main className="customer-shell">
      <header className="customer-topbar">
        <div>
          <div className="eyebrow">Adım 3 / 3</div>
          <h1>İlk üretimini başlat.</h1>
          <p>
            Burada yapay zekâya ne üretmesini istediğini seçersin. Formu doldur, kaydet ve üretim
            isteğini oluştur.
          </p>
        </div>
      </header>

      <section className="single-flow-shell">
        <form action={createGenerationBrief} className="customer-card simple-upload-card single-flow-card">
          <input type="hidden" name="businessId" value={business.id} />

          <div className="section-heading compact-heading">
            <div>
              <div className="eyebrow">Yeni Talep</div>
              <h2>Yeni görsel üretim isteği oluştur</h2>
              <p>İstediğin görsel türünü seç, notlarını ekle ve talebi kaydet.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="span-2">
              <span>Başlık</span>
              <input defaultValue="Mekân içinde premium ürün hikâyesi" name="title" required />
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
              <span>Sahne kurgusu</span>
              <select defaultValue="" name="sceneRecipeId">
                <option value="">Sahne kurgusu seçilmedi</option>
                {profile?.sceneRecipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Amaç</span>
              <select defaultValue={business.primaryGoal} name="objective">
                <option value="RESERVATION">Rezervasyon</option>
                <option value="ORDER">Sipariş</option>
                <option value="PROFILE_TRAFFIC">Profil ziyareti</option>
                <option value="AWARENESS">Bilinirlik</option>
              </select>
            </label>
            <label>
              <span>Durum</span>
              <select defaultValue="READY_FOR_GENERATION" name="status">
                <option value="READY_FOR_GENERATION">Üretime hazır</option>
                <option value="DRAFT">Taslak olarak kalsın</option>
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
              <span>Genel anlatım yönü</span>
              <textarea
                name="promptDirection"
                rows={4}
                placeholder="Örnek: Daha premium, temiz ve iştah açıcı bir görünüm istiyorum."
              />
            </label>
            <label className="span-2">
              <span>Konu ve odak</span>
              <textarea
                name="subjectDirection"
                rows={4}
                placeholder="Örnek: Ürün net görünsün, arka planda mekân hissi kalsın."
              />
            </label>
            <label className="span-2">
              <span>Ek not</span>
              <textarea
                name="remixInstruction"
                rows={4}
                placeholder="Örnek: Sıcak ışık kullan, doğal tonları koru."
              />
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
            <div className="span-2">
              <div className="flow-actions">
                <Link className="ghost-action" href="/asset-library">
                  Önceki adım: Görseller
                </Link>
                <button className="solid-action" type="submit">
                  Kaydet ve üretim isteğini oluştur
                </button>
                <Link className="ghost-action" href="/content-calendar">
                  Kaydettim, takvime geç
                </Link>
              </div>
            </div>
          </div>
        </form>
      </section>

      <section className="section-heading simple-gallery-heading">
        <div>
          <div className="eyebrow">Son İstekler</div>
          <h2>Oluşturduğun üretim istekleri</h2>
          <p>İstersen aşağıdan mevcut isteklerini güncelleyebilirsin.</p>
        </div>
      </section>

      <section className="recipe-list single-column-list">
        {studio.generationBriefs.map((brief) => {
          const selectedReferenceIds = parseJsonArray(brief.selectedReferenceIdsJson);
          const selectedAssetIds = parseJsonArray(brief.selectedAssetIdsJson);

          return (
            <article className="customer-card recipe-card simple-flow-card" key={brief.id}>
              <div className="calendar-card-head">
                <div>
                  <strong>{brief.title}</strong>
                  <p className="muted">
                    {generationModeLabel(brief.generationMode)} ·{" "}
                    {brief.sceneRecipe?.title || "Sahne kurgusu yok"} ·{" "}
                    {outputTypeLabel(brief.outputType)}
                  </p>
                </div>
                <span className="soft-pill">{statusLabel(brief.status)}</span>
              </div>

              <form action={updateGenerationBrief} className="asset-form">
                <input type="hidden" name="briefId" value={brief.id} />
                <label className="span-2">
                  <span>Başlık</span>
                  <input defaultValue={brief.title} name="title" required />
                </label>
                <label>
                  <span>Üretim türü</span>
                  <select defaultValue={brief.generationMode} name="generationMode">
                    <option value="REMIX">Mevcut görseli geliştir</option>
                    <option value="SCENE_EXPANSION">Sahneyi genişlet</option>
                    <option value="PRODUCT_IN_CONTEXT">Ürünü mekân içinde göster</option>
                    <option value="NARRATIVE_LIFESTYLE">Yaşam tarzı sahnesi üret</option>
                  </select>
                </label>
                <label>
                  <span>Sahne kurgusu</span>
                  <select defaultValue={brief.sceneRecipe?.id || ""} name="sceneRecipeId">
                    <option value="">Sahne kurgusu yok</option>
                    {profile?.sceneRecipes.map((recipe) => (
                      <option key={recipe.id} value={recipe.id}>
                        {recipe.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Amaç</span>
                  <input defaultValue={brief.objective || ""} name="objective" />
                </label>
                <label>
                  <span>Durum</span>
                  <select defaultValue={brief.status} name="status">
                    <option value="DRAFT">Taslak</option>
                    <option value="READY_FOR_GENERATION">Üretime hazır</option>
                    <option value="GENERATING">Üretiliyor</option>
                    <option value="COMPLETED">Tamamlandı</option>
                  </select>
                </label>
                <label>
                  <span>Çıktı türü</span>
                  <select defaultValue={brief.outputType} name="outputType">
                    <option value="IMAGE_SET">Görsel seti</option>
                    <option value="REEL_STORYBOARD">Reels taslağı</option>
                    <option value="STORY_SERIES">Story serisi</option>
                  </select>
                </label>
                <label>
                  <span>Boyut oranı</span>
                  <select defaultValue={brief.aspectRatio} name="aspectRatio">
                    <option value="4:5">4:5</option>
                    <option value="1:1">1:1</option>
                    <option value="9:16">9:16</option>
                    <option value="16:9">16:9</option>
                  </select>
                </label>
                <label>
                  <span>Varyasyon sayısı</span>
                  <input defaultValue={brief.variationCount} min="1" max="12" name="variationCount" type="number" />
                </label>
                <label className="span-2">
                  <span>Genel anlatım yönü</span>
                  <textarea defaultValue={brief.promptDirection || ""} name="promptDirection" rows={4} />
                </label>
                <label className="span-2">
                  <span>Konu ve odak</span>
                  <textarea defaultValue={brief.subjectDirection || ""} name="subjectDirection" rows={4} />
                </label>
                <label className="span-2">
                  <span>Ek not</span>
                  <textarea defaultValue={brief.remixInstruction || ""} name="remixInstruction" rows={4} />
                </label>
                <label className="span-2">
                  <span>Korunacak öğeler</span>
                  <textarea defaultValue={prettyJson(brief.keepElementsJson)} name="keepElementsJson" rows={6} />
                </label>
                <label className="span-2">
                  <span>Referans görseller</span>
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
                  <span>Kullanılacak görseller</span>
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
                    Talebi Güncelle
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
