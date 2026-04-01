import Link from "next/link";
import { selectFinalOutput, takeApprovalAction } from "./actions";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

type WorkspaceResponse = {
  businesses: Array<{
    id: string;
    name: string;
  }>;
};

type ApprovalQueueResponse = {
  id: string;
  name: string;
  contentItems: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    pillarName: string | null;
    targetAction: string | null;
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
    approvals: Array<{
      id: string;
      channel: string;
      status: string;
      requestedAt: string;
      resolvedAt: string | null;
      actions: Array<{
        id: string;
        action: string;
        note: string | null;
        createdAt: string;
      }>;
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

const getApprovalQueue = async (businessId: string) => {
  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/approval-queue`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Approval queue could not be loaded.");
  }

  return (await response.json()) as ApprovalQueueResponse;
};

const formatDate = (value: string | null) => {
  if (!value) return "No date";
  return new Date(value).toLocaleString("tr-TR");
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

export default async function ApprovalCenterPage() {
  const workspace = await getWorkspace();
  const business = workspace.businesses[0];
  const approvalQueue = await getApprovalQueue(business.id);

  return (
    <main className="profile-shell">
      <header className="profile-topbar">
        <div>
          <div className="eyebrow">Approval Layer</div>
          <h1>Approval Center</h1>
          <p className="muted">
            Bu sayfa Telegram akisini simule ediyor. Buradaki aksiyonlar approval request ve content
            item durumlarini gercek veritabaninda guncelliyor.
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
        </div>
      </header>

      <section className="calendar-list">
        {approvalQueue.contentItems.map((item) => {
          const latestApproval = item.approvals[0];
          const previewAsset = getPreviewAsset(item.assets);
          const isPublishReady = item.assets.some((link) => link.isSelected);

          return (
            <article className="profile-card approval-center-card" key={item.id}>
              <div className="calendar-card-head">
                <div>
                  <strong>{item.title}</strong>
                  <p className="muted">
                    {item.type} · {item.pillarName || "No pillar"} · {item.targetAction || "No target action"}
                  </p>
                </div>
                <div className="approval-status-stack">
                  <span className={`soft-pill ${item.status === "WAITING_APPROVAL" ? "calendar-warn" : ""}`}>
                    {item.status}
                  </span>
                  <span className="soft-pill">{latestApproval?.status || "NO_REQUEST"}</span>
                </div>
              </div>

              <div className="readiness-row">
                <span className={`soft-pill ${isPublishReady ? "readiness-good" : "readiness-bad"}`}>
                  {isPublishReady ? "Publish ready" : "Final output missing"}
                </span>
              </div>

              <div className="approval-metadata">
                <div>
                  <span className="meta-label">Requested</span>
                  <strong>{formatDate(latestApproval?.requestedAt || null)}</strong>
                </div>
                <div>
                  <span className="meta-label">Channel</span>
                  <strong>{latestApproval?.channel || "web"}</strong>
                </div>
                <div>
                  <span className="meta-label">Planned publish</span>
                  <strong>{formatDate(item.plannedFor)}</strong>
                </div>
              </div>

              {previewAsset ? (
                <div className="content-preview-shell compact">
                  <img alt={item.title} className="content-preview-image" src={previewAsset.storageKey} />
                  <div className="content-preview-meta">
                    <span className="asset-tag">{previewAsset.source || "asset"}</span>
                    <span className="asset-tag">{item.assets.length} output</span>
                  </div>
                </div>
              ) : null}

              {item.assets.length ? (
                <div className="output-gallery compact">
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

              <form action={takeApprovalAction} className="approval-action-form">
                <input name="approvalRequestId" type="hidden" value={latestApproval?.id || ""} />
                <label className="span-2">
                  <span>Review note</span>
                  <textarea name="note" placeholder="Revizyon notu ya da onay notu..." rows={3} />
                </label>
                <div className="approval-button-row span-2">
                  <button className="solid-action" name="action" type="submit" value="APPROVE">
                    Approve
                  </button>
                  <button className="ghost-action" name="action" type="submit" value="REVISE">
                    Request Revision
                  </button>
                  <button className="ghost-action" name="action" type="submit" value="REJECT">
                    Reject
                  </button>
                </div>
              </form>

              {latestApproval?.actions.length ? (
                <div className="approval-history">
                  <div className="eyebrow">Action History</div>
                  <div className="history-list">
                    {latestApproval.actions.map((action) => (
                      <div className="history-item" key={action.id}>
                        <strong>{action.action}</strong>
                        <span>{formatDate(action.createdAt)}</span>
                        <p className="muted">{action.note || "No note"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </main>
  );
}
