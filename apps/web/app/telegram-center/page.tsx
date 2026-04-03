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
      <main className="profile-shell">
        <header className="profile-topbar">
          <div>
            <div className="eyebrow">Telegram Bağlantısı</div>
            <h1>Telegram</h1>
            <p className="muted">
              Bu ekran şu an açılamadı. Aşağıdaki teknik bilgiyi görüp tekrar deneyebiliriz.
            </p>
          </div>
        </header>

        <section className="profile-card info-card">
          <div className="eyebrow">Teknik Durum</div>
          <h2>Ekran verisi yüklenemedi</h2>
          <p className="muted">
            {pageError || "Bilinmeyen bir hata oluştu."}
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
          <div className="eyebrow">Telegram Bağlantısı</div>
          <h1>Telegram</h1>
          <p className="muted">
            Bu ekranda Telegram bağlantını kurarsın. Sonrasında onaylar ve hızlı güncellemeler
            Telegram üzerinden gelir.
          </p>
        </div>

        <div className="topbar-actions">
          <Link className="link-chip" href="/">
            Ana Sayfa
          </Link>
          <Link className="link-chip" href="/approval-center">
            Onay Merkezi
          </Link>
          <Link className="link-chip" href="/content-calendar">
            İçerik Takvimi
          </Link>
          <Link className="link-chip" href="/asset-library">
            Görseller
          </Link>
        </div>
      </header>

      <section className="asset-layout">
        <section className="profile-card profile-form">
          <div className="card-head">
            <div>
              <div className="eyebrow">Hızlı Bağlantı</div>
              <h2>Telegram hesabını bağla</h2>
            </div>
          </div>

          <p className="muted">
            Müşteriden chat kimliği istemiyoruz. Bu işletmeye özel bağlantı linkine tıklayıp
            <code> /start</code> yazması yeterli; özel sohbet otomatik bağlanır.
          </p>

          {bot.connectUrl ? (
            <div className="span-2">
              <a className="primary-submit" href={bot.connectUrl} rel="noreferrer" target="_blank">
                Telegram&apos;da bağlantıyı başlat
              </a>
            </div>
          ) : (
            <p className="muted">
              Bot kullanıcı adı henüz okunamadı. Önce webhook&apos;u senkronize edip sayfayı yenilemeyi dene.
            </p>
          )}

          <div className="history-list">
            <div className="history-item">
              <strong>1. Adım</strong>
              <span>Bağlantı linkine tıkla ve bot sohbetini aç.</span>
            </div>
            <div className="history-item">
              <strong>2. Adım</strong>
              <span>Botta <code>/start</code> mesajını gönder.</span>
            </div>
            <div className="history-item">
              <strong>3. Adım</strong>
              <span>Sayfayı yenile; linked chat alanı otomatik dolacak.</span>
            </div>
          </div>

          <div className="card-head">
            <div>
              <div className="eyebrow">Elle Bağlama</div>
              <h2>Manuel bağlantı</h2>
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
            <div className="eyebrow">Bağlantı Durumu</div>
            <h2>{telegram.botConfigured ? "Bot hazır" : "Bot bağlantısı eksik"}</h2>
            <ul className="info-list">
              <li>Bot kullanıcı adı: {bot.username ? `@${bot.username}` : "Henüz okunamadı"}</li>
              <li>Bağlı sohbet: {telegram.link?.chatTitle || telegram.link?.chatId || "Bağlı değil"}</li>
              <li>Bekleyen onay: {telegram.pendingApprovalCount}</li>
              <li>Durum: {telegram.link?.status || "NOT_LINKED"}</li>
              <li>Webhook: {webhook.configured ? "bağlı" : "bağlı değil"}</li>
              <li>
                Son otomatik planlama:{" "}
                {telegram.autopilotLastPlannedAt
                  ? new Date(telegram.autopilotLastPlannedAt).toLocaleString("tr-TR")
                  : "Henüz yok"}
              </li>
            </ul>
          </section>

          <section className="profile-card info-card">
            <div className="eyebrow">Webhook Bilgisi</div>
            <h2>Hazır bağlantı noktası</h2>
            <p className="muted">
              Telegram mesajlarının sisteme düşeceği adres hazır:
              <br />
              <code>/api/telegram/webhook</code>
            </p>
            <p className="muted">
              Hedef webhook URL:
              <br />
              <code>{webhook.targetUrl || "Önce Railway public API URL girilmeli"}</code>
            </p>
            <p className="muted">
              Bağlantı linki:
              <br />
              <code>{bot.connectUrl || "Bot kullanıcı adı hazır olduğunda oluşacak"}</code>
            </p>
            <p className="muted">
              Webhook durumu: {webhook.message}
              {webhook.currentUrl ? (
                <>
                  <br />
                  Şu anki adres: <code>{webhook.currentUrl}</code>
                </>
              ) : null}
            </p>
            <p className="muted">
              Örnek mesajlar:
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
              <div className="eyebrow">Bot Yanıtları</div>
              <h2>Telegram&apos;a gönderilen son cevaplar</h2>
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
            <p className="muted">Komut veya görsel geldikçe sistemin verdiği cevaplar burada görünür.</p>
          )}
        </article>

        <article className="profile-card approval-center-card">
          <div className="card-head">
            <div>
              <div className="eyebrow">Onay Mesajı</div>
              <h2>Telegram önizlemesi</h2>
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
            <p className="muted">Bekleyen onay olduğunda Telegram önizlemesi burada görünür.</p>
          )}
        </article>

        <article className="profile-card approval-center-card">
          <div className="card-head">
            <div>
              <div className="eyebrow">Gelen Görseller</div>
              <h2>Telegram ile gelen son görseller</h2>
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
              Telegram üzerinden gelen görseller burada yeni ürün ya da mekân güncellemesi olarak listelenir.
            </p>
          )}
        </article>

        <article className="profile-card approval-center-card">
          <div className="card-head">
            <div>
              <div className="eyebrow">Otomatik Üretim Etkisi</div>
              <h2>Son oluşan üretim istekleri</h2>
            </div>
          </div>

          {recentGenerationBriefs.length ? (
            <div className="history-list">
              {recentGenerationBriefs.map((brief) => (
                <div className="history-item" key={brief.id}>
                  <strong>{brief.title}</strong>
                  <span>{brief.generationMode}</span>
                  <p className="muted">
                    {brief.sceneRecipe?.title || "Sahne kurgusu yok"} ·{" "}
                    {new Date(brief.createdAt).toLocaleString("tr-TR")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">
              Telegram ile gelen ürün veya mekân güncellemesi sonrasında oluşan üretim istekleri burada görünür.
            </p>
          )}
        </article>
      </section>
    </main>
  );
}
