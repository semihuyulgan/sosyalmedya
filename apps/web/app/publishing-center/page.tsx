import Link from "next/link";
import { materializePublishJobs, runDuePublishJobs } from "./actions";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

type WorkspaceResponse = {
  businesses: Array<{
    id: string;
    name: string;
  }>;
};

type PublishingCenterResponse = {
  id: string;
  name: string;
  publishMode: string;
  integrationAccounts: Array<{
    id: string;
    provider: string;
    accountName: string;
    status: string;
  }>;
  contentItems: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    plannedFor: string | null;
    assets: Array<{
      id: string;
      role: string;
      isSelected: boolean;
      asset: {
        id: string;
        storageKey: string;
        fileName: string;
        mediaType: string;
        source: string | null;
      };
    }>;
  }>;
  publishJobs: Array<{
    id: string;
    status: string;
    scheduledFor: string;
    lastError: string | null;
    retryCount: number;
    connectorMode: string;
    payloadPreview: null | Record<string, unknown>;
    integrationAccount: {
      provider: string;
      accountName: string;
    };
    attempts: Array<{
      id: string;
      status: string;
      attemptedAt: string;
      responseSummary: string | null;
    }>;
    contentItem: {
      id: string;
      title: string;
      type: string;
      status: string;
      assets: Array<{
        id: string;
        role: string;
        isSelected: boolean;
        asset: {
          id: string;
          storageKey: string;
          fileName: string;
          mediaType: string;
          source: string | null;
        };
      }>;
    };
  }>;
  externalPosts: Array<{
    id: string;
    provider: string;
    externalPostId: string;
    externalPermalink: string | null;
    publishedAt: string;
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

const getPublishingCenter = async (businessId: string) => {
  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/publishing-center`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Publishing center could not be loaded.");
  }

  return (await response.json()) as PublishingCenterResponse;
};

const formatDate = (value: string | null) => {
  if (!value) return "Planlanmadi";

  return new Date(value).toLocaleString("tr-TR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
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
      mediaType: string;
      source: string | null;
    };
  }>,
) => assets.find((item) => item.isSelected)?.asset || assets.find((item) => item.asset.mediaType === "IMAGE")?.asset || null;

export default async function PublishingCenterPage() {
  const workspace = await getWorkspace();
  const business = workspace.businesses[0];
  const center = await getPublishingCenter(business.id);

  return (
    <main className="profile-shell">
      <header className="profile-topbar">
        <div>
          <div className="eyebrow">Publishing Connector</div>
          <h1>Publishing Center</h1>
          <p className="muted">
            Secili final output&apos;lari publish queue&apos;ya alir, due olanlari calistirir ve
            sonucunda simulated external post kaydi olusturur.
          </p>
        </div>

        <div className="topbar-actions">
          <Link className="link-chip" href="/">
            Dashboard
          </Link>
          <Link className="link-chip" href="/integration-center">
            Integration Center
          </Link>
          <Link className="link-chip" href="/generation-pipeline">
            Generation Pipeline
          </Link>
          <Link className="link-chip" href="/content-calendar">
            Content Calendar
          </Link>
          <Link className="link-chip" href="/approval-center">
            Approval Center
          </Link>
        </div>
      </header>

      <section className="visual-hero">
        <div className="profile-card visual-hero-card">
          <div className="eyebrow">Connector Health</div>
          <h2>{center.name}</h2>
          <p className="muted">
            Bu katman simdilik Instagram publish davranisini taklit ediyor. Meta entegrasyonu
            geldiginde ayni queue mantigi uzerinden ilerleyecegiz.
          </p>
          <div className="visual-stat-row">
            <div className="visual-stat">
              <strong>{center.integrationAccounts.length}</strong>
              <span>Connected accounts</span>
            </div>
            <div className="visual-stat">
              <strong>{center.publishJobs.filter((job) => job.status === "QUEUED").length}</strong>
              <span>Queued publish jobs</span>
            </div>
            <div className="visual-stat">
              <strong>{center.externalPosts.length}</strong>
              <span>Published posts</span>
            </div>
            <div className="visual-stat">
              <strong>{center.contentItems.filter((item) => item.status === "SCHEDULED").length}</strong>
              <span>Scheduled items</span>
            </div>
          </div>
        </div>
      </section>

      <section className="visual-grid">
        <section className="profile-card profile-form">
          <div className="card-head">
            <div>
              <div className="eyebrow">Queue Builder</div>
              <h2>Ready item&apos;lari publish queue&apos;ya al</h2>
            </div>
          </div>

          <form action={materializePublishJobs} className="form-grid">
            <input name="businessId" type="hidden" value={business.id} />
            <label>
              <span>Ready limit</span>
              <input defaultValue="10" min="1" max="30" name="limit" type="number" />
            </label>
            <div className="span-2">
              <button className="primary-submit" type="submit">
                Queue Ready Content
              </button>
            </div>
          </form>

          <div className="card-head compact">
            <div>
              <div className="eyebrow">Run Due</div>
              <h2>Vakti gelen publish job&apos;lari calistir</h2>
            </div>
          </div>

          <form action={runDuePublishJobs} className="form-grid">
            <input name="businessId" type="hidden" value={business.id} />
            <label>
              <span>Run limit</span>
              <input defaultValue="5" min="1" max="30" name="limit" type="number" />
            </label>
            <div className="span-2">
              <button className="ghost-action" type="submit">
                Run Due Publish Jobs
              </button>
            </div>
          </form>
        </section>

        <aside className="profile-sidebar">
          <section className="profile-card info-card">
            <div className="eyebrow">Connected</div>
            <h2>Publish account</h2>
            <ul className="info-list">
              {center.integrationAccounts.map((account) => (
                <li key={account.id}>
                  {account.accountName} · {account.provider} · {account.status}
                </li>
              ))}
            </ul>
          </section>

          <section className="profile-card info-card">
            <div className="eyebrow">Rules</div>
            <h2>Queue neye gore ilerler?</h2>
            <ul className="info-list">
              <li>Secili final output olmadan publish job olusmaz.</li>
              <li>Approval sonrasi auto publish aciksa icerik schedule olur.</li>
              <li>Due job calisinca icerik PUBLISHED durumuna gecer.</li>
            </ul>
          </section>
        </aside>
      </section>

      <section className="autopilot-plan-grid">
        {center.publishJobs.map((job) => {
          const previewAsset = getPreviewAsset(job.contentItem.assets);

          return (
            <article className="profile-card autopilot-plan-card" key={job.id}>
              <div className="calendar-card-head">
                <div>
                  <strong>{job.contentItem.title}</strong>
                  <p className="muted">
                    {job.integrationAccount.accountName} · {formatDate(job.scheduledFor)}
                  </p>
                </div>
                <span className="soft-pill">{job.status}</span>
              </div>

              {previewAsset ? (
                <div className="content-preview-shell compact">
                  <img alt={job.contentItem.title} className="content-preview-image" src={previewAsset.storageKey} />
                  <div className="content-preview-meta">
                    <span className="asset-tag">{previewAsset.source || "asset"}</span>
                    <span className="asset-tag">{job.contentItem.status}</span>
                  </div>
                </div>
              ) : null}

              <div className="detail-stack">
              <div>
                <strong>Retry / Error</strong>
                <p className="muted">
                  {job.retryCount} retry · {job.lastError || "No error"}
                </p>
              </div>
              <div>
                <strong>Connector Mode</strong>
                <p className="muted">{job.connectorMode}</p>
              </div>
              <div>
                <strong>Attempts</strong>
                <p className="muted">
                  {job.attempts.length
                    ? `${job.attempts[0].status} · ${formatDate(job.attempts[0].attemptedAt)}`
                      : "No attempts yet"}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="calendar-list">
        {center.publishJobs.map((job) => (
          <article className="profile-card calendar-card" key={`${job.id}-payload`}>
            <div className="card-head">
              <div>
                <div className="eyebrow">Payload Preview</div>
                <h2>{job.contentItem.title}</h2>
              </div>
            </div>

            <pre className="telegram-preview-pre">{JSON.stringify(job.payloadPreview, null, 2)}</pre>
          </article>
        ))}
      </section>

      <section className="calendar-list">
        <article className="profile-card calendar-card">
          <div className="card-head">
            <div>
              <div className="eyebrow">Published Feed</div>
              <h2>Simulated external posts</h2>
            </div>
          </div>

          <div className="history-list">
            {center.externalPosts.map((post) => (
              <div className="history-item" key={post.id}>
                <strong>{post.provider}</strong>
                <span>{formatDate(post.publishedAt)}</span>
                <p className="muted">{post.externalPermalink || post.externalPostId}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
