import Link from "next/link";
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
    envReady: boolean;
    configured: boolean;
    targetUrl: string;
    currentUrl?: string;
    pendingUpdateCount?: number;
    lastErrorMessage?: string;
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
  recentTelegramResponses: Array<{
    id: string;
    source: string;
    commandText: string;
    intent: string;
    actionType: string;
    status: string;
    responseText: string;
    createdAt: string;
  }>;
  recentMediaUpdates: Array<{
    id: string;
    fileName: string;
    storageKey: string;
    source: string;
    createdAt: string;
    tags: Array<{
      id: string;
      tag: string;
    }>;
  }>;
  recentGenerationBriefs: Array<{
    id: string;
    title: string;
    generationMode: string;
    createdAt: string;
    sceneRecipe: {
      id: string;
      title: string;
    } | null;
  }>;
  autopilotLastPlannedAt: string | null;
  preview: {
    text: string;
    callbacks: string[];
  } | null;
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
      pageError = "Bu workspace icin henuz isletme bulunamadi.";
    } else {
      telegram = await getTelegramStatus(workspace.businesses[0].id);
    }
  } catch (error) {
    pageError = error instanceof Error ? error.message : "Telegram Center yuklenemedi.";
  }

  const business = workspace?.businesses[0];

  if (!business || !telegram) {
    return (
      <main className="profile-shell">
        <header className="profile-topbar">
          <div>
            <div className="eyebrow">Telegram Integration</div>
            <h1>Telegram Center</h1>
            <p className="muted">
              Bu ekran gecici olarak acilamadi. Asagidaki teknik durumu gorup tekrar deneyebiliriz.
            </p>
          </div>
        </header>

        <section className="profile-card info-card">
          <div className="eyebrow">Runtime Error</div>
          <h2>Ekran verisi yuklenemedi</h2>
          <p className="muted">
            {pageError || "Bilinmeyen bir hata olustu."}
          </p>
          <p className="muted">
            API base URL:
            <br />
            <code>{apiBaseUrl}</code>
          </p>
        </section>
      </main>
    );
  }

  const bot = telegram.bot || {
    username: "",
    displayName: "",
    connectUrl: "",
    ready: false,
    message: "Bot bilgisi henuz API tarafindan donmedi.",
  };

  const webhook = telegram.webhook || {
    envReady: false,
    configured: false,
    targetUrl: "",
    currentUrl: "",
    pendingUpdateCount: 0,
    lastErrorMessage: "",
    message: "Webhook bilgisi henuz API tarafindan donmedi.",
  };

  const recentTelegramResponses = telegram.recentTelegramResponses || [];
  const recentMediaUpdates = telegram.recentMediaUpdates || [];
  const recentGenerationBriefs = telegram.recentGenerationBriefs || [];

  return (
    <main className="profile-shell">
      <header className="profile-topbar">
        <div>
          <div className="eyebrow">Telegram Integration</div>
          <h1>Telegram Center</h1>
          <p className="muted">
            Bu ekran bot hazirligini, bagli chat bilgisini ve onaya giden mesaj formatini
            gosteriyor. Gercek bot token eklendiginde ayni approval motoru Telegram callback ile
            calisacak.
          </p>
        </div>

        <div className="topbar-actions">
          <Link className="link-chip" href="/">
            Dashboard
          </Link>
          <Link className="link-chip" href="/approval-center">
            Approval Center
          </Link>
          <Link className="link-chip" href="/content-calendar">
            Content Calendar
          </Link>
        </div>
      </header>

      <section className="asset-layout">
        <section className="profile-card profile-form">
          <div className="card-head">
            <div>
              <div className="eyebrow">Quick Connect</div>
              <h2>Telegram hesabini bagla</h2>
            </div>
          </div>

          <p className="muted">
            Müşteriden chat id istemiyoruz. Bu işletmeye özel bağlantı linkiyle bota gidip
            <code> /start</code> demesi yeterli; sistem özel sohbeti otomatik bağlar.
          </p>

          {bot.connectUrl ? (
            <div className="span-2">
              <a className="primary-submit" href={bot.connectUrl} rel="noreferrer" target="_blank">
                Telegram&apos;da baglanti baslat
              </a>
            </div>
          ) : (
            <p className="muted">
              Bot kullanıcı adı henüz okunamadı. Önce webhook&apos;u senkronize edip sayfayı yenilemeyi dene.
            </p>
          )}

          <div className="history-list">
            <div className="history-item">
              <strong>1. Adim</strong>
              <span>Bağlantı linkine tıkla ve bot sohbetini aç.</span>
            </div>
            <div className="history-item">
              <strong>2. Adim</strong>
              <span>Botta <code>/start</code> mesajını gönder.</span>
            </div>
            <div className="history-item">
              <strong>3. Adim</strong>
              <span>Sayfayı yenile; linked chat alanı otomatik dolacak.</span>
            </div>
          </div>

          <div className="card-head">
            <div>
              <div className="eyebrow">Advanced Fallback</div>
              <h2>Manuel baglanti</h2>
            </div>
          </div>

          <TelegramControls
            apiBaseUrl={apiBaseUrl}
            businessId={business.id}
            defaultChatId={telegram.link?.chatId || ""}
            defaultChatTitle={telegram.link?.chatTitle || ""}
          />
        </section>

        <aside className="profile-sidebar">
          <section className="profile-card info-card">
            <div className="eyebrow">Integration State</div>
            <h2>{telegram.botConfigured ? "Bot token hazir" : "Bot token eksik"}</h2>
            <ul className="info-list">
              <li>Bot username: {bot.username ? `@${bot.username}` : "Henuz okunamadi"}</li>
              <li>Linked chat: {telegram.link?.chatTitle || telegram.link?.chatId || "Bagli degil"}</li>
              <li>Pending approvals: {telegram.pendingApprovalCount}</li>
              <li>Status: {telegram.link?.status || "NOT_LINKED"}</li>
              <li>Webhook: {webhook.configured ? "bagli" : "bagli degil"}</li>
              <li>
                Last auto replan:{" "}
                {telegram.autopilotLastPlannedAt
                  ? new Date(telegram.autopilotLastPlannedAt).toLocaleString("tr-TR")
                  : "Henuz yok"}
              </li>
            </ul>
          </section>

          <section className="profile-card info-card">
            <div className="eyebrow">Webhook Route</div>
            <h2>Hazir endpoint</h2>
            <p className="muted">
              Telegram callback'leri icin backend endpoint'i hazir:
              <br />
              <code>/api/telegram/webhook</code>
            </p>
            <p className="muted">
              Target webhook URL:
              <br />
              <code>{webhook.targetUrl || "once Railway public API URL girilmeli"}</code>
            </p>
            <p className="muted">
              Connect URL:
              <br />
              <code>{bot.connectUrl || "bot username hazir oldugunda olusacak"}</code>
            </p>
            <p className="muted">
              Webhook state: {webhook.message}
              {webhook.currentUrl ? (
                <>
                  <br />
                  Current: <code>{webhook.currentUrl}</code>
                </>
              ) : null}
            </p>
            <p className="muted">
              Ornek medya captionlari:
              <br />
              <code>yeni urun ekle San Sebastian cheesecake 220 TL</code>
              <br />
              <code>mekan guncelleme masa sandalye degisti</code>
            </p>
          </section>
        </aside>
      </section>

      <section className="calendar-list">
        <article className="profile-card approval-center-card">
          <div className="card-head">
            <div>
              <div className="eyebrow">Bot Responses</div>
              <h2>Telegram'a donulecek son cevaplar</h2>
            </div>
          </div>

          {recentTelegramResponses.length ? (
            <div className="history-list">
              {recentTelegramResponses.map((item) => (
                <div className="history-item" key={item.id}>
                  <strong>{item.commandText}</strong>
                  <span>
                    {item.intent} · {item.status}
                  </span>
                  <p className="muted">{item.responseText}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Komut veya medya geldikce sistemin cevap ozetleri burada gorunecek.</p>
          )}
        </article>

        <article className="profile-card approval-center-card">
          <div className="card-head">
            <div>
              <div className="eyebrow">Outgoing Message</div>
              <h2>Telegram preview</h2>
            </div>
          </div>

          {telegram.preview ? (
            <div className="telegram-preview">
              <pre>{telegram.preview.text}</pre>
              <div className="asset-tag-row">
                {telegram.preview.callbacks.map((callback) => (
                  <span className="asset-tag" key={callback}>
                    {callback}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="muted">Bekleyen approval olmadiginda Telegram preview burada gorunecek.</p>
          )}
        </article>

        <article className="profile-card approval-center-card">
          <div className="card-head">
            <div>
              <div className="eyebrow">Media Intake</div>
              <h2>Telegram ile gelen son gorseller</h2>
            </div>
          </div>

          {recentMediaUpdates.length ? (
            <div className="history-list">
              {recentMediaUpdates.map((asset) => (
                <div className="history-item" key={asset.id}>
                  <strong>{asset.fileName}</strong>
                  <span>{new Date(asset.createdAt).toLocaleString("tr-TR")}</span>
                  <p className="muted">{asset.storageKey}</p>
                  <div className="asset-tag-row">
                    {asset.tags.map((tag) => (
                      <span className="asset-tag" key={tag.id}>
                        {tag.tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">
              Telegram uzerinden gorsel gelince burada yeni urun veya mekan guncellemesi olarak listelenecek.
            </p>
          )}
        </article>

        <article className="profile-card approval-center-card">
          <div className="card-head">
            <div>
              <div className="eyebrow">Auto Effects</div>
              <h2>Son olusan intake briefleri</h2>
            </div>
          </div>

          {recentGenerationBriefs.length ? (
            <div className="history-list">
              {recentGenerationBriefs.map((brief) => (
                <div className="history-item" key={brief.id}>
                  <strong>{brief.title}</strong>
                  <span>{brief.generationMode}</span>
                  <p className="muted">
                    {brief.sceneRecipe?.title || "Scene recipe yok"} ·{" "}
                    {new Date(brief.createdAt).toLocaleString("tr-TR")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">
              Telegram ile gelen urun veya mekan guncellemesi sonrasinda otomatik olusan briefler burada gorunecek.
            </p>
          )}
        </article>
      </section>
    </main>
  );
}
