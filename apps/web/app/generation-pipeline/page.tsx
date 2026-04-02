import Link from "next/link";
import { materializeAutopilotJobs, runQueuedGenerationJobs, selectFinalOutput } from "./actions";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

type WorkspaceResponse = {
  businesses: Array<{
    id: string;
    name: string;
  }>;
};

type AssetLink = {
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
};

type GenerationJob = {
  id: string;
  title: string;
  jobType: string;
  status: string;
  provider: string;
  errorMessage: string | null;
  queuedFor: string | null;
  createdAt: string;
  autopilotPlan: null | {
    id: string;
    title: string;
    status: string;
    scheduledFor: string;
  };
  generationBrief: null | {
    id: string;
    title: string;
    outputType: string;
    variationCount: number;
  };
  contentItem: null | {
    id: string;
    title: string;
    type: string;
    status: string;
    plannedFor: string | null;
    assets: AssetLink[];
  };
};

type PipelineResponse = {
  id: string;
  name: string;
  category: string;
  publishMode: string;
  autopilotPolicy: null | {
    approvalMode: string;
    allowAutoPublishing: boolean;
  };
  autopilotPlans: Array<{
    id: string;
    title: string;
    scheduledFor: string;
    status: string;
    generationMode: string;
  }>;
  generationBriefs: Array<{
    id: string;
  }>;
  generationJobs: GenerationJob[];
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

const getPipeline = async (businessId: string) => {
  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/generation-pipeline`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Generation pipeline could not be loaded.");
  }

  return (await response.json()) as PipelineResponse;
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

const getPreviewAsset = (assets: AssetLink[] | undefined) =>
  assets?.find((item) => item.isSelected)?.asset ||
  assets?.find((item) => item.asset.mediaType === "IMAGE")?.asset ||
  null;

const isTelegramJob = (job: GenerationJob) =>
  job.title.toLowerCase().includes("telegram") || job.provider === "telegram_intake";

const sortByNewest = (jobs: GenerationJob[]) =>
  [...jobs].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

const renderOutputPicker = (contentItem: NonNullable<GenerationJob["contentItem"]>) => {
  if (!contentItem.assets.length) {
    return null;
  }

  return (
    <div>
      <strong>Varyasyonlar</strong>
      <div className="output-gallery compact">
        {contentItem.assets.map((link) => (
          <div className={`output-card ${link.isSelected ? "selected" : ""}`} key={link.id}>
            <img alt={link.asset.fileName} className="output-thumb" src={link.asset.storageKey} />
            <div className="output-card-meta">
              <span className="asset-tag">{link.asset.source || "asset"}</span>
              {link.isSelected ? <span className="asset-tag">final</span> : null}
            </div>
            {!link.isSelected ? (
              <form action={selectFinalOutput}>
                <input name="contentItemId" type="hidden" value={contentItem.id} />
                <input name="contentItemAssetId" type="hidden" value={link.id} />
                <button className="ghost-action output-select-button" type="submit">
                  Final Yap
                </button>
              </form>
            ) : (
              <div className="output-selected-label">Final secildi</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const renderSummaryCard = (input: {
  eyebrow: string;
  title: string;
  description: string;
  job: GenerationJob | null;
}) => {
  if (!input.job) {
    return (
      <section className="profile-card info-card">
        <div className="eyebrow">{input.eyebrow}</div>
        <h2>{input.title}</h2>
        <p className="muted">{input.description}</p>
      </section>
    );
  }

  const previewAsset = getPreviewAsset(input.job.contentItem?.assets);

  return (
    <section className="profile-card info-card">
      <div className="eyebrow">{input.eyebrow}</div>
      <h2>{input.title}</h2>
      <p className="muted">{input.job.title}</p>
      <ul className="info-list">
        <li>Durum: {input.job.status}</li>
        <li>Zaman: {formatDate(input.job.queuedFor || input.job.createdAt)}</li>
        <li>
          Cikti:
          {" "}
          {input.job.contentItem?.assets.length ? `${input.job.contentItem.assets.length} gorsel` : "Henuz yok"}
        </li>
      </ul>
      {input.job.errorMessage ? <p className="muted" style={{ color: "#ffb4b4" }}>Hata: {input.job.errorMessage}</p> : null}
      {previewAsset ? (
        <div className="content-preview-shell compact">
          <img alt={input.job.title} className="content-preview-image" src={previewAsset.storageKey} />
          <div className="content-preview-meta">
            <span className="asset-tag">{previewAsset.source || "generated"}</span>
            <span className="asset-tag">{input.job.provider}</span>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default async function GenerationPipelinePage() {
  const workspace = await getWorkspace();
  const business = workspace.businesses[0];
  const pipeline = await getPipeline(business.id);

  const telegramJobs = sortByNewest(pipeline.generationJobs.filter(isTelegramJob));
  const latestCompletedTelegramJob = telegramJobs.find((job) => job.status === "COMPLETED") || null;
  const latestQueuedTelegramJob = telegramJobs.find((job) => job.status === "QUEUED" || job.status === "RUNNING") || null;
  const latestFailedTelegramJob = telegramJobs.find((job) => job.status === "FAILED") || null;
  const recentJobs = sortByNewest(pipeline.generationJobs).slice(0, 6);

  return (
    <main className="profile-shell">
      <header className="profile-topbar">
        <div>
          <div className="eyebrow">Execution Queue</div>
          <h1>Generation Pipeline</h1>
          <p className="muted">
            Burasi artik teknik kuyruk degil, “son gorsel uretimi ne oldu?” ekranı. En ustte sadece
            ihtiyac duydugun seyleri goruyorsun.
          </p>
        </div>

        <div className="topbar-actions">
          <Link className="link-chip" href="/">
            Dashboard
          </Link>
          <Link className="link-chip" href="/telegram-center">
            Telegram Center
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
          <div className="eyebrow">Durum Ozeti</div>
          <h2>{pipeline.name}</h2>
          <div className="visual-stat-row">
            <div className="visual-stat">
              <strong>{telegramJobs.filter((job) => job.status === "COMPLETED").length}</strong>
              <span>Basarili Telegram uretimi</span>
            </div>
            <div className="visual-stat">
              <strong>{telegramJobs.filter((job) => job.status === "QUEUED" || job.status === "RUNNING").length}</strong>
              <span>Bekleyen Telegram isi</span>
            </div>
            <div className="visual-stat">
              <strong>{pipeline.generationJobs.filter((job) => job.status === "QUEUED").length}</strong>
              <span>Toplam bekleyen job</span>
            </div>
            <div className="visual-stat">
              <strong>{pipeline.generationJobs.filter((job) => job.contentItem?.status === "WAITING_APPROVAL").length}</strong>
              <span>Onay bekleyen icerik</span>
            </div>
          </div>
        </div>
      </section>

      <section className="visual-reference-grid">
        {renderSummaryCard({
          eyebrow: "Son Basarili Uretim",
          title: latestCompletedTelegramJob ? "Gorsel hazir" : "Henuz hazir gorsel yok",
          description: "Son tamamlanan Telegram uretimi burada gorunur.",
          job: latestCompletedTelegramJob,
        })}

        {renderSummaryCard({
          eyebrow: "Siradaki Is",
          title: latestQueuedTelegramJob ? "Kuyrukta bekliyor" : "Bekleyen Telegram isi yok",
          description: "Yeni gelen Telegram uretimi varsa burada gorunur.",
          job: latestQueuedTelegramJob,
        })}
      </section>

      {latestFailedTelegramJob ? (
        <section className="profile-card info-card" style={{ marginBottom: 28 }}>
          <div className="eyebrow">Son Hata</div>
          <h2>Duzenlenmesi gereken son Telegram isi</h2>
          <p className="muted">{latestFailedTelegramJob.title}</p>
          <p className="muted" style={{ color: "#ffb4b4" }}>
            {latestFailedTelegramJob.errorMessage}
          </p>
        </section>
      ) : null}

      <section className="visual-grid">
        <section className="profile-card profile-form">
          <div className="card-head">
            <div>
              <div className="eyebrow">Hizli Aksiyon</div>
              <h2>Kuyrugu calistir</h2>
            </div>
          </div>

          <form action={runQueuedGenerationJobs} className="form-grid">
            <input type="hidden" name="businessId" value={business.id} />

            <label>
              <span>Bir seferde kac is calissin?</span>
              <input defaultValue="3" min="1" max="30" name="limit" type="number" />
            </label>
            <div className="span-2">
              <button className="primary-submit" type="submit">
                Bekleyen Gorselleri Calistir
              </button>
            </div>
          </form>

          <div className="card-head compact">
            <div>
              <div className="eyebrow">Gerekirse</div>
              <h2>Autopilot planlarini tekrar kuyruga al</h2>
            </div>
          </div>

          <form action={materializeAutopilotJobs} className="form-grid">
            <input type="hidden" name="businessId" value={business.id} />

            <label>
              <span>Plan limit</span>
              <input defaultValue="14" min="1" max="30" name="limit" type="number" />
            </label>
            <div className="span-2">
              <button className="ghost-action" type="submit">
                Planlari Yeniden Kuyruga Al
              </button>
            </div>
          </form>
        </section>

        <aside className="profile-sidebar">
          <section className="profile-card info-card">
            <div className="eyebrow">Calisma Modu</div>
            <h2>Su an sistem nasil davraniyor?</h2>
            <ul className="info-list">
              <li>Approval: {pipeline.autopilotPolicy?.approvalMode || pipeline.publishMode}</li>
              <li>Auto publish: {pipeline.autopilotPolicy?.allowAutoPublishing ? "Acik" : "Kapali"}</li>
              <li>Toplam brief: {pipeline.generationBriefs.length}</li>
              <li>Toplam job: {pipeline.generationJobs.length}</li>
            </ul>
          </section>
        </aside>
      </section>

      <section className="autopilot-plan-grid">
        {recentJobs.map((job) => {
          const previewAsset = getPreviewAsset(job.contentItem?.assets);
          const isPublishReady = Boolean(job.contentItem?.assets.some((link) => link.isSelected));

          return (
            <article className="profile-card autopilot-plan-card" key={job.id}>
              <div className="calendar-card-head">
                <div>
                  <strong>{job.title}</strong>
                  <p className="muted">
                    {job.jobType} · {job.provider} · {formatDate(job.queuedFor || job.createdAt)}
                  </p>
                </div>
                <span className="soft-pill">{job.status}</span>
              </div>

              <div className="readiness-row">
                <span className={`soft-pill ${isPublishReady ? "readiness-good" : "readiness-bad"}`}>
                  {isPublishReady ? "Yayina hazir" : "Final secimi bekleniyor"}
                </span>
              </div>

              {job.errorMessage ? (
                <div className="readiness-row">
                  <span className="soft-pill readiness-bad">{job.errorMessage}</span>
                </div>
              ) : null}

              {previewAsset ? (
                <div className="content-preview-shell compact">
                  <img alt={job.title} className="content-preview-image" src={previewAsset.storageKey} />
                  <div className="content-preview-meta">
                    <span className="asset-tag">{previewAsset.source || "generated"}</span>
                    <span className="asset-tag">{job.provider}</span>
                  </div>
                </div>
              ) : null}

              <div className="detail-stack">
                <div>
                  <strong>Icerik</strong>
                  <p className="muted">
                    {job.contentItem
                      ? `${job.contentItem.title} · ${job.contentItem.type} · ${job.contentItem.status}`
                      : "Icerik olusmadi"}
                  </p>
                </div>
                <div>
                  <strong>Planlanan zaman</strong>
                  <p className="muted">{formatDate(job.contentItem?.plannedFor || job.autopilotPlan?.scheduledFor || null)}</p>
                </div>
                {job.contentItem ? renderOutputPicker(job.contentItem) : null}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
