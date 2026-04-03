import { TelegramControls } from "./telegram-controls";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

type WorkspaceResponse = {
  businesses: Array<{
    id: string;
    name: string;
  }>;
};

type TelegramStatusResponse = {
  businessId: string;
  businessName: string;
  botConfigured: boolean;
  bot?: {
    username: string;
    displayName: string;
    connectUrl: string;
    ready: boolean;
    message: string;
  };
  webhook?: {
    configured: boolean;
    message: string;
  };
  link: {
    id: string;
    chatId: string;
    chatTitle: string | null;
    status: string;
    createdAt: string;
  } | null;
  pendingApprovalCount: number;
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

const getTelegramStatus = async (businessId: string) => {
  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/telegram-status`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Telegram status could not be loaded.");
  }

  return (await response.json()) as TelegramStatusResponse;
};

export default async function TelegramCenterPage() {
  let workspace: WorkspaceResponse | null = null;
  let telegram: TelegramStatusResponse | null = null;
  let pageError = "";

  try {
    workspace = await getWorkspace();

    if (!workspace.businesses.length) {
      pageError = "Bu çalışma alanı için henüz işletme bulunamadı.";
    } else {
      telegram = await getTelegramStatus(workspace.businesses[0].id);
    }
  } catch (error) {
    pageError = error instanceof Error ? error.message : "Telegram ekranı yüklenemedi.";
  }

  const business = workspace?.businesses[0];

  if (!business || !telegram) {
    return (
      <main className="customer-shell">
        <header className="customer-topbar">
          <div>
            <div className="eyebrow">Adım 3 / 4</div>
            <h1>Telegram bağlantısı açılamadı.</h1>
            <p>Bu ekran şu an yüklenemedi. Birkaç dakika sonra tekrar deneyebilirsin.</p>
          </div>
        </header>

        <section className="single-flow-shell narrow-flow-shell">
          <article className="customer-card simple-upload-card single-flow-card">
            <div className="section-heading compact-heading">
              <div>
                <div className="eyebrow">Teknik Durum</div>
                <h2>Bağlantı verisi alınamadı</h2>
              </div>
            </div>
            <p className="muted">{pageError || "Bilinmeyen bir hata oluştu."}</p>
          </article>
        </section>
      </main>
    );
  }

  const bot = telegram.bot || {
    username: "",
    displayName: "",
    connectUrl: "",
    ready: false,
    message: "",
  };

  return (
    <main className="customer-shell">
      <header className="customer-topbar">
        <div>
          <div className="eyebrow">Adım 3 / 4</div>
          <h1>Telegram bağlantını tamamla.</h1>
          <p>
            Bu adımdan sonra paneli sık kullanmana gerek kalmayacak. Onaylar ve güncellemeler
            Telegram üzerinden gelecek.
          </p>
        </div>
      </header>

      <section className="single-flow-shell narrow-flow-shell">
        <article className="customer-card simple-upload-card single-flow-card">
          <div className="section-heading compact-heading">
            <div>
              <div className="eyebrow">Bağlantı</div>
              <h2>Telegram hesabını bağla</h2>
              <p>Sadece bir kez bağlaman yeterli. Sonrasında onaylar ve güncellemeler Telegram üzerinden gelir.</p>
            </div>
          </div>

          <div className="history-list">
            <div className="history-item">
              <strong>1. Telegram bağlantısını hazırla</strong>
              <span>Aşağıdaki buton, bağlantını ve Telegram komutlarını senin için hazırlar.</span>
            </div>
            <div className="history-item">
              <strong>2. Telegram’da bağlantıyı başlat</strong>
              <span>Butona tıkla, botu aç ve <code>/start</code> yaz.</span>
            </div>
            <div className="history-item">
              <strong>3. İçerik takvimine geç</strong>
              <span>Bağlantıdan sonra paylaşım saatini seçip takvimini gör.</span>
            </div>
          </div>

          <div className="flow-actions" style={{ marginTop: 22 }}>
            {bot.connectUrl ? (
              <a className="solid-action" href={bot.connectUrl} rel="noreferrer" target="_blank">
                Telegram’da bağlantıyı başlat
              </a>
            ) : null}
            <TelegramControls apiBaseUrl={apiBaseUrl} />
          </div>

          <div className="customer-summary-grid simple-summary-grid" style={{ marginTop: 22 }}>
            <article className="customer-summary-card">
              <span>Bağlantı durumu</span>
              <strong>{telegram.link?.status === "ACTIVE" ? "Bağlandı" : "Bekliyor"}</strong>
              <p>{telegram.link?.chatTitle || "Henüz Telegram sohbeti bağlanmadı."}</p>
            </article>
            <article className="customer-summary-card">
              <span>Bekleyen onay</span>
              <strong>{telegram.pendingApprovalCount}</strong>
              <p>Yeni onaylar doğrudan Telegram üzerinden sana gelir.</p>
            </article>
          </div>
          <p className="muted" style={{ marginTop: 18 }}>
            Bu adımdan sonra paneli sık kullanmana gerek yoktur. Yeni ürün, güncelleme ve onayları Telegram üzerinden yönetebilirsin.
          </p>
        </article>
      </section>
    </main>
  );
}
