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
          <div className="eyebrow">Publishing System</div>
          <h1>Content Calendar</h1>
          <p className="muted">
            Bu ekran gercek content item kayitlariyla calisiyor. Burada uretilen veya planlanan
            icerikler daha sonra approval ve publishing katmanina baglanacak.
          </p>
        </div>

        <div className="topbar-actions">
          <Link className="link-chip" href="/">
            Dashboard
          </Link>
          <Link className="link-chip" href="/telegram-center">
            Telegram Center
          </Link>
          <Link className="link-chip" href="/approval-center">
            Approval Center
          </Link>
          <Link className="link-chip" href="/asset-library">
            Asset Library
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
              <div className="eyebrow">Plan New Item</div>
              <h2>Takvime yeni icerik ekle</h2>
            </div>
          </div>

          <form action={createContentItem} className="form-grid">
            <input name="businessId" type="hidden" value={business.id} />

            <label className="span-2">
              <span>Title</span>
              <input name="title" placeholder="Hafta sonu brunch carousel" required />
            </label>
            <label>
              <span>Type</span>
              <select defaultValue="POST" name="type">
                <option value="POST">Post</option>
                <option value="REEL">Reel</option>
                <option value="STORY">Story</option>
              </select>
            </label>
            <label>
              <span>Status</span>
              <select defaultValue="DRAFT" name="status">
                <option value="DRAFT">Draft</option>
                <option value="GENERATED">Generated</option>
                <option value="NEEDS_REVIEW">Needs review</option>
                <option value="WAITING_APPROVAL">Waiting approval</option>
                <option value="APPROVED">Approved</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="PUBLISHED">Published</option>
                <option value="FAILED">Failed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
            <label>
              <span>Content pillar</span>
              <select defaultValue="" name="pillarName">
                <option value="">No pillar</option>
                {contentData.contentPillars.map((pillar) => (
                  <option key={pillar.id} value={pillar.name}>
                    {pillar.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Target action</span>
              <input name="targetAction" placeholder="RESERVATION" />
            </label>
            <label>
              <span>Planned for</span>
              <input name="plannedFor" type="datetime-local" />
            </label>
            <label className="asset-checkbox">
              <input defaultChecked name="approvalRequired" type="checkbox" />
              <span>Approval required</span>
            </label>
            <label className="asset-checkbox">
              <input defaultChecked name="needsClientApproval" type="checkbox" />
              <span>Needs client approval</span>
            </label>
            <div className="span-2">
              <button className="primary-submit" type="submit">
                Create Content Item
              </button>
            </div>
          </form>
        </section>

        <aside className="profile-sidebar">
          <section className="profile-card info-card">
            <div className="eyebrow">Calendar Snapshot</div>
            <h2>{contentData.contentItems.length} aktif icerik kaydi</h2>
            <ul className="info-list">
              <li>Approval bekleyen: {contentData.contentItems.filter((item) => item.status === "WAITING_APPROVAL").length}</li>
              <li>Scheduled: {contentData.contentItems.filter((item) => item.status === "SCHEDULED").length}</li>
              <li>Draft/Generated: {contentData.contentItems.filter((item) => ["DRAFT", "GENERATED", "NEEDS_REVIEW"].includes(item.status)).length}</li>
            </ul>
          </section>

          <section className="profile-card info-card">
            <div className="eyebrow">System Role</div>
            <h2>Takvim neden cekirdek modul?</h2>
            <ul className="info-list">
              <li>Asset Library ve Business Profile verileri burada yayina donusur.</li>
              <li>Telegram approval katmani bu kayitlar uzerinden calisacak.</li>
              <li>Publishing ve analytics baglantisi icin tek kaynak bu takvim olacak.</li>
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
                  {item.type} · {item.pillarName || "No pillar"} · {item.targetAction || "No target action"}
                </p>
              </div>
              <span className={`soft-pill ${item.status === "WAITING_APPROVAL" ? "calendar-warn" : ""}`}>
                {item.status}
              </span>
            </div>

            <div className="readiness-row">
              <span className={`soft-pill ${isPublishReady ? "readiness-good" : "readiness-bad"}`}>
                {isPublishReady ? "Publish ready" : "Final output missing"}
              </span>
            </div>

            {previewAsset ? (
              <div className="content-preview-shell">
                <img alt={item.title} className="content-preview-image" src={previewAsset.storageKey} />
                <div className="content-preview-meta">
                  <span className="asset-tag">{previewAsset.source || "asset"}</span>
                  <span className="asset-tag">{item.assets.length} output</span>
                </div>
              </div>
            ) : null}

            {item.assets.length ? (
              <div className="output-gallery">
                {item.assets.map((link) => (
                  <div className={`output-card ${link.isSelected ? "selected" : ""}`} key={link.id}>
                    <img alt={link.asset.fileName} className="output-thumb" src={link.asset.storageKey} />
                    <div className="output-card-meta">
                      <span className="asset-tag">{link.asset.source || "asset"}</span>
                      {link.isSelected ? <span className="asset-tag">final</span> : null}
                    </div>
                    {!link.isSelected ? (
                      <form action={selectFinalOutput}>
                        <input name="contentItemId" type="hidden" value={item.id} />
                        <input name="contentItemAssetId" type="hidden" value={link.id} />
                        <button className="ghost-action output-select-button" type="submit">
                          Use As Final
                        </button>
                      </form>
                    ) : (
                      <div className="output-selected-label">Final output</div>
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            <form action={updateContentItem} className="asset-form">
              <input name="contentItemId" type="hidden" value={item.id} />

              <label className="span-2">
                <span>Title</span>
                <input defaultValue={item.title} name="title" required />
              </label>
              <label>
                <span>Type</span>
                <select defaultValue={item.type} name="type">
                  <option value="POST">Post</option>
                  <option value="REEL">Reel</option>
                  <option value="STORY">Story</option>
                </select>
              </label>
              <label>
                <span>Status</span>
                <select defaultValue={item.status} name="status">
                  <option value="DRAFT">Draft</option>
                  <option value="GENERATED">Generated</option>
                  <option value="NEEDS_REVIEW">Needs review</option>
                  <option value="WAITING_APPROVAL">Waiting approval</option>
                  <option value="APPROVED">Approved</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="FAILED">Failed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </label>
              <label>
                <span>Content pillar</span>
                <select defaultValue={item.pillarName || ""} name="pillarName">
                  <option value="">No pillar</option>
                  {contentData.contentPillars.map((pillar) => (
                    <option key={pillar.id} value={pillar.name}>
                      {pillar.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Target action</span>
                <input defaultValue={item.targetAction || ""} name="targetAction" />
              </label>
              <label>
                <span>Planned for</span>
                <input defaultValue={toDateValue(item.plannedFor)} name="plannedFor" type="datetime-local" />
              </label>
              <label className="asset-checkbox">
                <input defaultChecked={item.approvalRequired} name="approvalRequired" type="checkbox" />
                <span>Approval required</span>
              </label>
              <label className="asset-checkbox">
                <input
                  defaultChecked={item.needsClientApproval}
                  name="needsClientApproval"
                  type="checkbox"
                />
                <span>Needs client approval</span>
              </label>
              <div className="span-2">
                <div className="calendar-actions">
                  <button className="ghost-action" type="submit">
                    Update Content Item
                  </button>
                  <button className="ghost-action" formAction={sendToApproval} name="contentItemId" type="submit" value={item.id}>
                    Send To Approval
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
