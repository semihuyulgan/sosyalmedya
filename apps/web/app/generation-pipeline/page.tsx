import Link from "next/link";
import { materializeAutopilotJobs, runQueuedGenerationJobs, selectFinalOutput } from "./actions";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

type WorkspaceResponse = {
  businesses: Array<{
    id: string;
    name: string;
  }>;
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
  generationJobs: Array<{
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

const getPreviewAsset = (
  assets:
    | Array<{
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
      }>
    | undefined,
) => assets?.find((item) => item.isSelected)?.asset || assets?.find((item) => item.asset.mediaType === "IMAGE")?.asset || null;

const sortJobsForDisplay = (jobs: PipelineResponse["generationJobs"]) =>
  [...jobs].sort((left, right) => {
    const leftTelegram = left.title.toLowerCase().includes("telegram") || left.provider === "telegram_intake";
    const rightTelegram = right.title.toLowerCase().includes("telegram") || right.provider === "telegram_intake";

    if (leftTelegram !== rightTelegram) {
      return leftTelegram ? -1 : 1;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });

export default async function GenerationPipelinePage() {
  const workspace = await getWorkspace();
  const business = workspace.businesses[0];
  const pipeline = await getPipeline(business.id);
  const sortedJobs = sortJobsForDisplay(pipeline.generationJobs);
  const latestTelegramJob = sortedJobs.find(
    (job) => job.title.toLowerCase().includes("telegram") || job.provider === "telegram_intake",
  );

  return (
    <main className="profile-shell">
      <header className="profile-topbar">
        <div>
          <div className="eyebrow">Execution Queue</div>
          <h1>Generation Pipeline</h1>
          <p className="muted">
            Autopilot planlarinin job, brief ve content itema donustugu ana kuyruk burasi. Yani
            sistemin “gercekten calismaya basladigi” operasyon katmani.
          </p>
        </div>

        <div className="topbar-actions">
          <Link className="link-chip" href="/">
            Dashboard
          </Link>
          <Link className="link-chip" href="/autopilot-control">
            Autopilot
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
          <div className="eyebrow">Queue Health</div>
          <h2>{pipeline.name}</h2>
          <p className="muted">
            Sistem simdi autopilot planlarini somut is nesnelerine ceviriyor. Bu kuyruk daha sonra
            gercek gorsel model entegrasyonu ve publish katmanina baglanacak.
          </p>
          <div className="visual-stat-row">
            <div className="visual-stat">
              <strong>{pipeline.autopilotPlans.length}</strong>
              <span>Total AI plans</span>
            </div>
            <div className="visual-stat">
              <strong>{pipeline.generationBriefs.length}</strong>
              <span>Available briefs</span>
            </div>
            <div className="visual-stat">
              <strong>{pipeline.generationJobs.length}</strong>
              <span>Total jobs</span>
            </div>
            <div className="visual-stat">
              <strong>{pipeline.generationJobs.filter((job) => job.contentItem?.status === "WAITING_APPROVAL").length}</strong>
              <span>Approval-bound items</span>
            </div>
          </div>
        </div>
      </section>

      <section className="visual-grid">
        <section className="profile-card profile-form">
          <div className="card-head">
            <div>
              <div className="eyebrow">Materialize Autopilot</div>
              <h2>AI planlarini kuyruga donustur</h2>
            </div>
          </div>

          <form action={materializeAutopilotJobs} className="form-grid">
            <input type="hidden" name="businessId" value={business.id} />

            <label>
              <span>Plan limit</span>
              <input defaultValue="14" min="1" max="30" name="limit" type="number" />
            </label>
            <div className="span-2">
              <button className="primary-submit" type="submit">
                Materialize Next Jobs
              </button>
            </div>
          </form>

          <div className="card-head compact">
            <div>
              <div className="eyebrow">Run Queue</div>
              <h2>Queued joblari calistir</h2>
            </div>
          </div>

          <form action={runQueuedGenerationJobs} className="form-grid">
            <input type="hidden" name="businessId" value={business.id} />

            <label>
              <span>Run limit</span>
              <input defaultValue="6" min="1" max="30" name="limit" type="number" />
            </label>
            <div className="span-2">
              <button className="ghost-action" type="submit">
                Run Queued Jobs
              </button>
            </div>
          </form>
        </section>

        <aside className="profile-sidebar">
          {latestTelegramJob ? (
            <section className="profile-card info-card">
              <div className="eyebrow">Latest Telegram Run</div>
              <h2>{latestTelegramJob.title}</h2>
              <ul className="info-list">
                <li>Durum: {latestTelegramJob.status}</li>
                <li>Saglayici: {latestTelegramJob.provider}</li>
                <li>Zaman: {formatDate(latestTelegramJob.queuedFor || latestTelegramJob.createdAt)}</li>
                <li>
                  Cikti:
                  {" "}
                  {latestTelegramJob.contentItem?.assets.length
                    ? `${latestTelegramJob.contentItem.assets.length} asset`
                    : "Henuz olusmadi"}
                </li>
              </ul>
              {latestTelegramJob.errorMessage ? (
                <p className="muted" style={{ color: "#ffb4b4" }}>
                  Hata: {latestTelegramJob.errorMessage}
                </p>
              ) : null}
            </section>
          ) : null}

          <section className="profile-card info-card">
            <div className="eyebrow">System Decision</div>
            <h2>Pipeline neyi otomatik yapiyor?</h2>
            <ul className="info-list">
              <li>Her plan icin uygun brief yoksa kendisi olusturuyor.</li>
              <li>Plan slotunu gercek bir content itema donusturuyor.</li>
              <li>Approval mode&apos;a gore ilk statusu kendisi belirliyor.</li>
              <li>Generation job icine prompt ve referans snapshot yaziyor.</li>
            </ul>
          </section>

          <section className="profile-card info-card">
            <div className="eyebrow">Current Policy</div>
            <h2>Execution mode</h2>
            <ul className="info-list">
              <li>Approval: {pipeline.autopilotPolicy?.approvalMode || pipeline.publishMode}</li>
              <li>Auto publish: {pipeline.autopilotPolicy?.allowAutoPublishing ? "Acik" : "Kapali"}</li>
              <li>Queued plan: {pipeline.autopilotPlans.filter((plan) => plan.status === "PLANNED").length}</li>
              <li>Queued job: {pipeline.generationJobs.filter((job) => job.status === "QUEUED").length}</li>
              <li>
                Materialized plan:
                {" "}
                {pipeline.autopilotPlans.filter((plan) => plan.status === "QUEUED_FOR_GENERATION").length}
              </li>
            </ul>
          </section>
        </aside>
      </section>

      <section className="autopilot-plan-grid">
        {sortedJobs.map((job) => {
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
                {isPublishReady ? "Publish ready" : "Final output missing"}
              </span>
            </div>

            {job.errorMessage ? (
              <div className="readiness-row">
                <span className="soft-pill readiness-bad">{job.errorMessage}</span>
              </div>
            ) : null}

            {previewAsset ? (
              <div className="content-preview-shell">
                <img alt={job.title} className="content-preview-image" src={previewAsset.storageKey} />
                <div className="content-preview-meta">
                  <span className="asset-tag">{previewAsset.source || "generated"}</span>
                  <span className="asset-tag">{job.provider}</span>
                </div>
              </div>
            ) : null}

            <div className="detail-stack">
              <div>
                <strong>Autopilot Plan</strong>
                <p className="muted">
                  {job.autopilotPlan
                    ? `${job.autopilotPlan.title} · ${job.autopilotPlan.status}`
                    : "No plan connected"}
                </p>
              </div>
              <div>
                <strong>Generation Brief</strong>
                <p className="muted">
                  {job.generationBrief
                    ? `${job.generationBrief.title} · ${job.generationBrief.outputType} · ${job.generationBrief.variationCount} varyasyon`
                    : "No brief connected"}
                </p>
              </div>
              <div>
                <strong>Content Item</strong>
                <p className="muted">
                  {job.contentItem
                    ? `${job.contentItem.title} · ${job.contentItem.type} · ${job.contentItem.status}`
                    : "No content item created"}
                </p>
              </div>
              <div>
                <strong>Generated Outputs</strong>
                <p className="muted">
                  {job.contentItem ? `${job.contentItem.assets.length} asset baglandi` : "No outputs yet"}
                </p>
              </div>
              {job.contentItem && job.contentItem.assets.length ? (
                (() => {
                  const contentItem = job.contentItem;

                  return (
                    <div>
                      <strong>Output Picker</strong>
                      <div className="output-gallery">
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
                                  Use As Final
                                </button>
                              </form>
                            ) : (
                              <div className="output-selected-label">Final output</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()
              ) : null}
              <div>
                <strong>Planned Publish Slot</strong>
                <p className="muted">{formatDate(job.contentItem?.plannedFor || job.autopilotPlan?.scheduledFor || null)}</p>
              </div>
            </div>
          </article>
        )})}
      </section>
    </main>
  );
}
