import Link from "next/link";
import { savePublishingPreferences } from "./actions";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

type WorkspaceResponse = {
  businesses: Array<{
    id: string;
    name: string;
    publishMode: string;
    settings: {
      peakHoursJson: string | null;
    } | null;
  }>;
};

type ContentResponse = {
  id: string;
  name: string;
  contentItems: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    plannedFor: string | null;
    assets: Array<{
      id: string;
      isSelected: boolean;
      asset: {
        id: string;
        storageKey: string;
        fileName: string;
        mediaType: string;
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

const parsePeakHour = (value: string | null | undefined) => {
  if (!value) return "18:00";

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.length ? String(parsed[0]) : "18:00";
  } catch {
    return "18:00";
  }
};

const contentStatusLabel = (value: string) => {
  switch (value) {
    case "WAITING_APPROVAL":
      return "Onay bekliyor";
    case "APPROVED":
      return "Onaylandı";
    case "SCHEDULED":
      return "Planlandı";
    case "PUBLISHED":
      return "Yayınlandı";
    default:
      return "Hazırlanıyor";
  }
};

const getPreviewAsset = (
  assets: Array<{
    id: string;
    isSelected: boolean;
    asset: {
      id: string;
      storageKey: string;
      fileName: string;
      mediaType: string;
    };
  }>,
) => assets.find((item) => item.isSelected)?.asset || assets.find((item) => item.asset.mediaType === "IMAGE")?.asset || null;

const saatler = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2)
    .toString()
    .padStart(2, "0");
  const minute = index % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

export default async function ContentCalendarPage() {
  const workspace = await getWorkspace();
  const business = workspace.businesses[0];
  const contentData = await getContentItems(business.id);
  const selectedHour = parsePeakHour(business.settings?.peakHoursJson);
  const approvalPreference = business.publishMode === "AUTO" ? "AUTO" : "MANUAL";

  return (
    <main className="customer-shell">
      <header className="customer-topbar">
        <div>
          <div className="eyebrow">Adım 4 / 4</div>
          <h1>Yayın saatini seç.</h1>
          <p>
            Sen sadece saati ve onay şeklini seç. Hangi gün paylaşım yapılacağını sistem, en uygun
            zamanlara göre otomatik planlasın.
          </p>
        </div>
      </header>

      <section className="single-flow-shell narrow-flow-shell">
        <article className="customer-card simple-upload-card single-flow-card">
          <div className="section-heading compact-heading">
            <div>
              <div className="eyebrow">Yayın Tercihi</div>
              <h2>Paylaşımlar saat kaçta yayınlansın?</h2>
              <p>Günleri sistem seçer. Sen sadece yayın saatini ve onay isteyip istemediğini belirle.</p>
            </div>
          </div>

          <form action={savePublishingPreferences} className="form-grid">
            <input name="businessId" type="hidden" value={business.id} />

            <label>
              <span>Yayın saati</span>
              <select defaultValue={selectedHour} name="peakHoursJson">
                {saatler.map((saat) => (
                  <option key={saat} value={saat}>
                    {saat}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Onay tercihi</span>
              <select defaultValue={approvalPreference} name="approvalPreference">
                <option value="MANUAL">Her paylaşımda benden onay iste</option>
                <option value="AUTO">Onay almadan otomatik devam et</option>
              </select>
            </label>

            <div className="span-2">
              <div className="flow-actions">
                <Link className="ghost-action" href="/telegram-center">
                  Önceki adım: Telegram bağlantısı
                </Link>
                <button className="solid-action" type="submit">
                  Kaydet ve takvimi göster
                </button>
              </div>
            </div>
          </form>

          <p className="muted" style={{ marginTop: 18 }}>
            Bu adımdan sonra paneli kullanmana gerek yoktur. Tüm onayları ve güncellemeleri Telegram üzerinden yönetebilirsin.
          </p>
        </article>
      </section>

      <section className="single-flow-shell narrow-flow-shell">
        <article className="customer-card simple-upload-card single-flow-card">
          <div className="section-heading compact-heading">
            <div>
              <div className="eyebrow">Takvim</div>
              <h2>Önümüzdeki paylaşımlar</h2>
              <p>Hazırlanan içerikler burada görünür. Günleri sistem belirler, seçtiğin saat esas alınır.</p>
            </div>
          </div>

          {contentData.contentItems.length ? (
            <div className="single-column-schedule">
              {contentData.contentItems.slice(0, 6).map((item) => {
                const previewAsset = getPreviewAsset(item.assets);

                return (
                  <article className="customer-card simple-asset-card schedule-card" key={item.id}>
                    {previewAsset ? (
                      <div className="simple-asset-visual">
                        <img alt={item.title} className="asset-preview" src={previewAsset.storageKey} />
                      </div>
                    ) : null}

                    <div className="simple-asset-body">
                      <div className="simple-asset-head">
                        <strong>{item.title}</strong>
                        <span className="customer-card-tag">{contentStatusLabel(item.status)}</span>
                      </div>
                      <p className="muted">
                        {item.plannedFor
                          ? new Date(item.plannedFor).toLocaleString("tr-TR")
                          : "Günü sistem planlıyor"}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="customer-card simple-upload-card">
              <p className="muted">
                İlk plan birkaç dakika içinde burada görünür. Sistem, işletme bilgilerini ve yüklediğin
                görselleri kullanarak paylaşım günlerini otomatik oluşturur.
              </p>
            </div>
          )}

          <div className="flow-actions" style={{ marginTop: 24 }}>
            <Link className="solid-action" href="/musteri-paneli">
              Tamam
            </Link>
          </div>

          <p className="muted" style={{ marginTop: 18 }}>
            Buradan sonra paneli düzenli kullanmana gerek yok. Yeni onaylar, eklemeler ve yönlendirmeler için Telegram yeterli olacaktır.
          </p>
        </article>
      </section>
    </main>
  );
}
