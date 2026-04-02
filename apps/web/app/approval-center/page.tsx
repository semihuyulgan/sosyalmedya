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
  if (!value) return "Tarih yok";
  return new Date(value).toLocaleString("tr-TR");
};

const contentTypeLabel = (value: string) => {
  switch (value) {
    case "POST":
      return "Post";
    case "REEL":
      return "Reel";
    case "STORY":
      return "Story";
    default:
      return value;
  }
};

const statusLabel = (value: string) => {
  switch (value) {
    case "WAITING_APPROVAL":
      return "Onay bekliyor";
    case "DRAFT":
      return "Taslak";
    case "GENERATED":
      return "Üretildi";
    case "NEEDS_REVIEW":
      return "Kontrol bekliyor";
    case "APPROVED":
      return "Onaylandı";
    case "SCHEDULED":
      return "Planlandı";
    case "PUBLISHED":
      return "Yayınlandı";
    case "FAILED":
      return "Başarısız";
    case "REJECTED":
      return "Reddedildi";
    default:
      return value;
  }
};

const approvalActionLabel = (value: string) => {
  switch (value) {
    case "APPROVE":
      return "Onayla";
    case "REVISE":
      return "Revize iste";
    case "REJECT":
      return "Reddet";
    default:
      return value;
  }
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
          <div className="eyebrow">Onay Akışı</div>
          <h1>Onay Merkezi</h1>
          <p className="muted">
            Burada yayına çıkmadan önce son kontrolü yaparsın. Beğendiğin içeriği onaylar,
            gerekirse düzenleme notu bırakırsın.
          </p>
        </div>

        <div className="topbar-actions">
          <Link className="link-chip" href="/">
            Ana Sayfa
          </Link>
          <Link className="link-chip" href="/telegram-center">
            Telegram
          </Link>
          <Link className="link-chip" href="/content-calendar">
            İçerik Takvimi
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
                    {contentTypeLabel(item.type)} · {item.pillarName || "Kategori yok"} ·{" "}
                    {item.targetAction || "Hedef yok"}
                  </p>
                </div>
                <div className="approval-status-stack">
                  <span className={`soft-pill ${item.status === "WAITING_APPROVAL" ? "calendar-warn" : ""}`}>
                    {statusLabel(item.status)}
                  </span>
                  <span className="soft-pill">{statusLabel(latestApproval?.status || "NO_REQUEST")}</span>
                </div>
              </div>

              <div className="readiness-row">
                <span className={`soft-pill ${isPublishReady ? "readiness-good" : "readiness-bad"}`}>
                  {isPublishReady ? "Yayına hazır" : "Seçili final görsel yok"}
                </span>
              </div>

              <div className="approval-metadata">
                <div>
                  <span className="meta-label">İstek zamanı</span>
                  <strong>{formatDate(latestApproval?.requestedAt || null)}</strong>
                </div>
                <div>
                  <span className="meta-label">Kanal</span>
                  <strong>{latestApproval?.channel || "web"}</strong>
                </div>
                <div>
                  <span className="meta-label">Planlanan yayın</span>
                  <strong>{formatDate(item.plannedFor)}</strong>
                </div>
              </div>

              {previewAsset ? (
                <div className="content-preview-shell compact">
                  <img alt={item.title} className="content-preview-image" src={previewAsset.storageKey} />
                  <div className="content-preview-meta">
                    <span className="asset-tag">{previewAsset.source || "görsel"}</span>
                    <span className="asset-tag">{item.assets.length} varyasyon</span>
                  </div>
                </div>
              ) : null}

              {item.assets.length ? (
                <div className="output-gallery compact">
                  {item.assets.map((link) => (
                    <div className={`output-card ${link.isSelected ? "selected" : ""}`} key={link.id}>
                      <img alt={link.asset.fileName} className="output-thumb" src={link.asset.storageKey} />
                    <div className="output-card-meta">
                      <span className="asset-tag">{link.asset.source || "görsel"}</span>
                      {link.isSelected ? <span className="asset-tag">seçili</span> : null}
                    </div>
                    {!link.isSelected ? (
                      <form action={selectFinalOutput}>
                          <input name="contentItemId" type="hidden" value={item.id} />
                        <input name="contentItemAssetId" type="hidden" value={link.id} />
                        <button className="ghost-action output-select-button" type="submit">
                          Final olarak seç
                        </button>
                      </form>
                    ) : (
                      <div className="output-selected-label">Final görsel</div>
                    )}
                  </div>
                ))}
                </div>
              ) : null}

              <form action={takeApprovalAction} className="approval-action-form">
                <input name="approvalRequestId" type="hidden" value={latestApproval?.id || ""} />
                <label className="span-2">
                  <span>Not</span>
                  <textarea name="note" placeholder="Revizyon notu ya da onay notu..." rows={3} />
                </label>
                <div className="approval-button-row span-2">
                  <button className="solid-action" name="action" type="submit" value="APPROVE">
                    Onayla
                  </button>
                  <button className="ghost-action" name="action" type="submit" value="REVISE">
                    Düzeltme iste
                  </button>
                  <button className="ghost-action" name="action" type="submit" value="REJECT">
                    Reddet
                  </button>
                </div>
              </form>

              {latestApproval?.actions.length ? (
                <div className="approval-history">
                  <div className="eyebrow">Geçmiş</div>
                  <div className="history-list">
                    {latestApproval.actions.map((action) => (
                      <div className="history-item" key={action.id}>
                        <strong>{approvalActionLabel(action.action)}</strong>
                        <span>{formatDate(action.createdAt)}</span>
                        <p className="muted">{action.note || "Not bırakılmadı"}</p>
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
