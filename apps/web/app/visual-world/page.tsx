import Link from "next/link";
import {
  createSceneRecipe,
  createVisualReference,
  updateSceneRecipe,
  updateVisualReference,
  updateVisualWorld,
} from "./actions";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

type WorkspaceResponse = {
  businesses: Array<{
    id: string;
    name: string;
  }>;
};

type VisualWorldResponse = {
  id: string;
  name: string;
  category: string;
  assets: Array<{
    id: string;
    fileName: string;
    storageKey: string;
    mediaType: string;
    isFeatured: boolean;
    tags: Array<{ id: string; tag: string }>;
  }>;
  visualWorldProfile: null | {
    id: string;
    conceptSummary: string | null;
    sectorLens: string | null;
    ambienceNotes: string | null;
    lightingStyle: string | null;
    materialPalette: string | null;
    heroAnglesJson: string | null;
    keepElementsJson: string | null;
    bannedElementsJson: string | null;
    references: Array<{
      id: string;
      role: string;
      zone: string | null;
      notes: string | null;
      isAnchor: boolean;
      sortOrder: number;
      asset: {
        id: string;
        fileName: string;
        storageKey: string;
        mediaType: string;
        tags: Array<{ id: string; tag: string }>;
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

const getVisualWorld = async (businessId: string) => {
  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/visual-world`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Visual world could not be loaded.");
  }

  return (await response.json()) as VisualWorldResponse;
};

const prettyJson = (value: string | null | undefined) => {
  if (!value) return "";

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

const tagText = (tags: Array<{ tag: string }>) => tags.map((tag) => tag.tag).join(", ");

export default async function VisualWorldPage() {
  const workspace = await getWorkspace();
  const business = workspace.businesses[0];
  const visualWorldData = await getVisualWorld(business.id);
  const profile = visualWorldData.visualWorldProfile;

  return (
    <main className="profile-shell">
      <header className="profile-topbar">
        <div>
          <div className="eyebrow">Visual Identity Engine</div>
          <h1>Visual World Studio</h1>
          <p className="muted">
            Bu ekran mekanin gorsel hafizasini tutuyor. Hangi asset&apos;ler anchor referans, hangi
            sabit ogeler korunacak ve her sektor icin hangi sahneler uretilecek burada
            tanimlaniyor.
          </p>
        </div>

        <div className="topbar-actions">
          <Link className="link-chip" href="/">
            Dashboard
          </Link>
          <Link className="link-chip" href="/asset-library">
            Asset Library
          </Link>
          <Link className="link-chip" href="/content-calendar">
            Content Calendar
          </Link>
        </div>
      </header>

      <section className="visual-hero">
        <div className="profile-card visual-hero-card">
          <div className="eyebrow">Brand World</div>
          <h2>{visualWorldData.name}</h2>
          <p className="muted">
            {profile?.conceptSummary ||
              "Mekanin sahne dili, arka plan sabitleri ve sahne varyasyonlari burada toplanir."}
          </p>
          <div className="visual-stat-row">
            <div className="visual-stat">
              <strong>{profile?.references.length || 0}</strong>
              <span>Reference assets</span>
            </div>
            <div className="visual-stat">
              <strong>{profile?.references.filter((item) => item.isAnchor).length || 0}</strong>
              <span>Anchor frames</span>
            </div>
            <div className="visual-stat">
              <strong>{profile?.sceneRecipes.length || 0}</strong>
              <span>Scene recipes</span>
            </div>
            <div className="visual-stat">
              <strong>{visualWorldData.assets.length}</strong>
              <span>Total assets</span>
            </div>
          </div>
        </div>
      </section>

      <section className="visual-grid">
        <form action={updateVisualWorld} className="profile-card profile-form">
          <input type="hidden" name="businessId" value={business.id} />

          <div className="card-head">
            <div>
              <div className="eyebrow">World Profile</div>
              <h2>Mekanin sabit dili</h2>
            </div>
            <button className="primary-submit" type="submit">
              Save World
            </button>
          </div>

          <div className="form-grid">
            <label className="span-2">
              <span>Concept Summary</span>
              <textarea defaultValue={profile?.conceptSummary || ""} name="conceptSummary" rows={4} />
            </label>
            <label className="span-2">
              <span>Sector Lens</span>
              <textarea defaultValue={profile?.sectorLens || ""} name="sectorLens" rows={4} />
            </label>
            <label className="span-2">
              <span>Ambience Notes</span>
              <textarea defaultValue={profile?.ambienceNotes || ""} name="ambienceNotes" rows={4} />
            </label>
            <label>
              <span>Lighting Style</span>
              <textarea defaultValue={profile?.lightingStyle || ""} name="lightingStyle" rows={4} />
            </label>
            <label>
              <span>Material Palette</span>
              <textarea defaultValue={profile?.materialPalette || ""} name="materialPalette" rows={4} />
            </label>
            <label className="span-2">
              <span>Hero Angles JSON</span>
              <textarea defaultValue={prettyJson(profile?.heroAnglesJson)} name="heroAnglesJson" rows={6} />
            </label>
            <label className="span-2">
              <span>Keep Elements JSON</span>
              <textarea defaultValue={prettyJson(profile?.keepElementsJson)} name="keepElementsJson" rows={6} />
            </label>
            <label className="span-2">
              <span>Banned Elements JSON</span>
              <textarea
                defaultValue={prettyJson(profile?.bannedElementsJson)}
                name="bannedElementsJson"
                rows={6}
              />
            </label>
          </div>
        </form>

        <aside className="profile-sidebar">
          <section className="profile-card info-card">
            <div className="eyebrow">Generation Modes</div>
            <h2>Bu modul neyi besliyor?</h2>
            <ul className="info-list">
              <li>Remix Mode: var olan kareyi bozmayip daha iyi varyasyonlar uretir.</li>
              <li>Scene Expansion: ayni mekani farkli acilardan yeniden kurar.</li>
              <li>Product In Context: urunu mekanin kendi dunyasi icine yerlestirir.</li>
              <li>Narrative Lifestyle: markaya uygun sosyal anlar kurar.</li>
            </ul>
          </section>

          <section className="profile-card info-card">
            <div className="eyebrow">Reference Logic</div>
            <h2>Neyi anchor yapiyoruz?</h2>
            <ul className="info-list">
              <li>Duvar tonu, masa-sandalye dili ve aydinlatma gibi sabitler anchor assetlerle korunur.</li>
              <li>Her anchor, gelecek remix ve generation islemlerinde referans agirligi tasir.</li>
              <li>Role alanlari daha sonra prompt orchestration ve recipe seciminde kullanilacak.</li>
            </ul>
          </section>
        </aside>
      </section>

      <section className="visual-grid">
        <section className="profile-card profile-form">
          <div className="card-head">
            <div>
              <div className="eyebrow">Reference Assets</div>
              <h2>Yeni referans ekle</h2>
            </div>
          </div>

          <form action={createVisualReference} className="form-grid">
            <input type="hidden" name="businessId" value={business.id} />

            <label className="span-2">
              <span>Asset</span>
              <select name="assetId" required defaultValue="">
                <option value="" disabled>
                  Referans asset sec
                </option>
                {visualWorldData.assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.fileName} {asset.isFeatured ? "· featured" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Role</span>
              <input defaultValue="interior_anchor" name="role" required />
            </label>
            <label>
              <span>Zone</span>
              <input defaultValue="main_floor" name="zone" />
            </label>
            <label>
              <span>Sort order</span>
              <input defaultValue="0" min="0" name="sortOrder" type="number" />
            </label>
            <label className="asset-checkbox">
              <input name="isAnchor" type="checkbox" defaultChecked />
              <span>Use as anchor frame</span>
            </label>
            <label className="span-2">
              <span>Notes</span>
              <textarea
                name="notes"
                rows={4}
                placeholder="Korunacak duvar, renk, masa, kadraj hissi gibi detaylari yaz."
              />
            </label>
            <div className="span-2">
              <button className="primary-submit" type="submit">
                Add Reference
              </button>
            </div>
          </form>
        </section>

        <section className="profile-card profile-form">
          <div className="card-head">
            <div>
              <div className="eyebrow">Scene Recipes</div>
              <h2>Yeni sahne recetesi</h2>
            </div>
          </div>

          <form action={createSceneRecipe} className="form-grid">
            <input type="hidden" name="businessId" value={business.id} />

            <label className="span-2">
              <span>Title</span>
              <input defaultValue="Mekan icinde samimi servis ani" name="title" required />
            </label>
            <label>
              <span>Scene type</span>
              <select defaultValue="NARRATIVE_LIFESTYLE" name="sceneType">
                <option value="REMIX">REMIX</option>
                <option value="SCENE_EXPANSION">SCENE_EXPANSION</option>
                <option value="PRODUCT_IN_CONTEXT">PRODUCT_IN_CONTEXT</option>
                <option value="NARRATIVE_LIFESTYLE">NARRATIVE_LIFESTYLE</option>
              </select>
            </label>
            <label>
              <span>Objective</span>
              <input defaultValue="RESERVATION" name="objective" />
            </label>
            <label className="span-2">
              <span>Prompt Frame</span>
              <textarea name="promptFrame" rows={4} />
            </label>
            <label className="span-2">
              <span>Subject Notes</span>
              <textarea name="subjectNotes" rows={4} />
            </label>
            <label className="span-2">
              <span>Composition Notes</span>
              <textarea name="compositionNotes" rows={4} />
            </label>
            <label className="span-2">
              <span>Variation Notes</span>
              <textarea name="variationNotes" rows={4} />
            </label>
            <label className="asset-checkbox span-2">
              <input name="active" type="checkbox" defaultChecked />
              <span>Recipe aktif olsun</span>
            </label>
            <div className="span-2">
              <button className="primary-submit" type="submit">
                Add Scene Recipe
              </button>
            </div>
          </form>
        </section>
      </section>

      <section className="visual-reference-grid">
        {profile?.references.map((reference) => (
          <article className="profile-card visual-reference-card" key={reference.id}>
            <div className="visual-reference-preview">
              {reference.asset.mediaType === "IMAGE" ? (
                <img alt={reference.asset.fileName} className="asset-preview" src={reference.asset.storageKey} />
              ) : (
                <div className="asset-video-placeholder">
                  <span>VIDEO</span>
                  <strong>{reference.asset.fileName}</strong>
                </div>
              )}
            </div>

            <div className="asset-card-body">
              <div className="asset-card-top">
                <div>
                  <strong>{reference.asset.fileName}</strong>
                  <p className="muted">
                    {reference.role} · {reference.zone || "no zone"}
                  </p>
                </div>
                {reference.isAnchor ? <span className="soft-pill">Anchor</span> : null}
              </div>

              <div className="asset-tag-row">
                {reference.asset.tags.map((tag) => (
                  <span className="asset-tag" key={tag.id}>
                    {tag.tag}
                  </span>
                ))}
              </div>

              <form action={updateVisualReference} className="asset-form">
                <input type="hidden" name="referenceId" value={reference.id} />

                <label className="span-2">
                  <span>Asset</span>
                  <select defaultValue={reference.asset.id} name="assetId">
                    {visualWorldData.assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.fileName}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Role</span>
                  <input defaultValue={reference.role} name="role" required />
                </label>
                <label>
                  <span>Zone</span>
                  <input defaultValue={reference.zone || ""} name="zone" />
                </label>
                <label>
                  <span>Sort order</span>
                  <input defaultValue={reference.sortOrder} min="0" name="sortOrder" type="number" />
                </label>
                <label className="asset-checkbox">
                  <input defaultChecked={reference.isAnchor} name="isAnchor" type="checkbox" />
                  <span>Anchor frame</span>
                </label>
                <label className="span-2">
                  <span>Notes</span>
                  <textarea defaultValue={reference.notes || ""} name="notes" rows={4} />
                </label>
                <div className="span-2">
                  <button className="ghost-action" type="submit">
                    Update Reference
                  </button>
                </div>
              </form>
            </div>
          </article>
        ))}
      </section>

      <section className="recipe-list">
        {profile?.sceneRecipes.map((recipe) => (
          <article className="profile-card recipe-card" key={recipe.id}>
            <div className="calendar-card-head">
              <div>
                <strong>{recipe.title}</strong>
                <p className="muted">
                  {recipe.sceneType} · {recipe.objective || "No objective"}
                </p>
              </div>
              <span className="soft-pill">{recipe.active ? "ACTIVE" : "PAUSED"}</span>
            </div>

            <form action={updateSceneRecipe} className="asset-form">
              <input type="hidden" name="recipeId" value={recipe.id} />
              <label className="span-2">
                <span>Title</span>
                <input defaultValue={recipe.title} name="title" required />
              </label>
              <label>
                <span>Scene type</span>
                <select defaultValue={recipe.sceneType} name="sceneType">
                  <option value="REMIX">REMIX</option>
                  <option value="SCENE_EXPANSION">SCENE_EXPANSION</option>
                  <option value="PRODUCT_IN_CONTEXT">PRODUCT_IN_CONTEXT</option>
                  <option value="NARRATIVE_LIFESTYLE">NARRATIVE_LIFESTYLE</option>
                </select>
              </label>
              <label>
                <span>Objective</span>
                <input defaultValue={recipe.objective || ""} name="objective" />
              </label>
              <label className="span-2">
                <span>Prompt Frame</span>
                <textarea defaultValue={recipe.promptFrame || ""} name="promptFrame" rows={4} />
              </label>
              <label className="span-2">
                <span>Subject Notes</span>
                <textarea defaultValue={recipe.subjectNotes || ""} name="subjectNotes" rows={4} />
              </label>
              <label className="span-2">
                <span>Composition Notes</span>
                <textarea
                  defaultValue={recipe.compositionNotes || ""}
                  name="compositionNotes"
                  rows={4}
                />
              </label>
              <label className="span-2">
                <span>Variation Notes</span>
                <textarea defaultValue={recipe.variationNotes || ""} name="variationNotes" rows={4} />
              </label>
              <label className="asset-checkbox span-2">
                <input defaultChecked={recipe.active} name="active" type="checkbox" />
                <span>Recipe aktif olsun</span>
              </label>
              <div className="span-2">
                <button className="ghost-action" type="submit">
                  Update Recipe
                </button>
              </div>
            </form>
          </article>
        ))}
      </section>

      <section className="profile-card visual-asset-shelf">
        <div className="card-head">
          <div>
            <div className="eyebrow">Available Inputs</div>
            <h2>Referansa cekebilecegin asset havuzu</h2>
          </div>
        </div>

        <div className="visual-asset-grid">
          {visualWorldData.assets.map((asset) => (
            <article className="visual-mini-asset" key={asset.id}>
              {asset.mediaType === "IMAGE" ? (
                <img alt={asset.fileName} className="visual-mini-image" src={asset.storageKey} />
              ) : (
                <div className="asset-video-placeholder mini">
                  <span>VIDEO</span>
                </div>
              )}
              <div>
                <strong>{asset.fileName}</strong>
                <p className="muted">{tagText(asset.tags) || "untagged"}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
