import Link from "next/link";
import { interpretTelegramCommand } from "./actions";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

type WorkspaceResponse = {
  businesses: Array<{
    id: string;
    name: string;
  }>;
};

type CommandCenterResponse = {
  id: string;
  name: string;
  operatingMode: string;
  dashboardAccessEnabled: boolean;
  telegramControlEnabled: boolean;
  publishMode: string;
  telegramChatLinks: Array<{
    id: string;
    chatId: string;
    chatTitle: string | null;
    status: string;
  }>;
  autopilotPolicy: {
    approvalMode: string;
    contentMixJson: string | null;
  } | null;
  telegramCommandRuns: Array<{
    id: string;
    source: string;
    commandText: string;
    intent: string;
    actionType: string;
    status: string;
    summary: string | null;
    resultJson: string | null;
    createdAt: string;
  }>;
  presets: string[];
  presetInterpretations: Array<{
    command: string;
    interpretation: {
      intent: string;
      summary: string;
      suggestedAction: {
        type: string;
        payload: Record<string, string | boolean>;
      };
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

const getCommandCenter = async (businessId: string) => {
  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/telegram-command-center`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Telegram command center could not be loaded.");
  }

  return (await response.json()) as CommandCenterResponse;
};

export default async function TelegramCommandCenterPage() {
  const workspace = await getWorkspace();
  const business = workspace.businesses[0];
  const commandCenter = await getCommandCenter(business.id);

  return (
    <main className="profile-shell">
      <header className="profile-topbar">
        <div>
          <div className="eyebrow">Telegram-First Ops</div>
          <h1>Telegram Command Center</h1>
          <p className="muted">
            Bu ekran managed ve hybrid musteriler icin Telegram komut yuzeyini modeller. Hazir komutlar
            ve serbest dil komutlari burada intent&apos;e donusturulur.
          </p>
        </div>

        <div className="topbar-actions">
          <Link className="link-chip" href="/">
            Dashboard
          </Link>
          <Link className="link-chip" href="/telegram-center">
            Telegram Center
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
              <div className="eyebrow">Free Command</div>
              <h2>Serbest komut yorumu</h2>
            </div>
          </div>

          <form action={interpretTelegramCommand} className="form-grid">
            <input name="businessId" type="hidden" value={business.id} />
            <label className="span-2">
              <span>Command</span>
              <textarea
                defaultValue="bu hafta tatliyi one cikar"
                name="command"
                rows={4}
              />
            </label>
            <div className="span-2">
              <button className="primary-submit" type="submit">
                Apply Command
              </button>
            </div>
          </form>

          <div className="card-head compact">
            <div>
              <div className="eyebrow">Preset Library</div>
              <h2>Hazir Telegram komutlari</h2>
            </div>
          </div>

          <div className="history-list">
            {commandCenter.presetInterpretations.map((preset) => (
              <div className="history-item" key={preset.command}>
                <strong>{preset.command}</strong>
                <span>{preset.interpretation.intent}</span>
                <p className="muted">{preset.interpretation.summary}</p>
                <pre className="telegram-preview-pre">
                  {JSON.stringify(preset.interpretation.suggestedAction, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </section>

        <aside className="profile-sidebar">
          <section className="profile-card info-card">
            <div className="eyebrow">Access Policy</div>
            <h2>Bu musteri nasil calisiyor?</h2>
            <ul className="info-list">
              <li>Operating mode: {commandCenter.operatingMode}</li>
              <li>Dashboard access: {commandCenter.dashboardAccessEnabled ? "acik" : "kapali"}</li>
              <li>Telegram control: {commandCenter.telegramControlEnabled ? "acik" : "kapali"}</li>
              <li>Publish mode: {commandCenter.publishMode}</li>
              <li>Approval mode: {commandCenter.autopilotPolicy?.approvalMode || "SMART"}</li>
            </ul>
          </section>

          <section className="profile-card info-card">
            <div className="eyebrow">Linked Chat</div>
            <h2>Aktif Telegram baglantisi</h2>
            <ul className="info-list">
              {commandCenter.telegramChatLinks.length ? (
                commandCenter.telegramChatLinks.map((link) => (
                  <li key={link.id}>
                    {link.chatTitle || link.chatId} · {link.status}
                  </li>
                ))
              ) : (
                <li>Henuz bagli chat yok</li>
              )}
            </ul>
          </section>

          <section className="profile-card info-card">
            <div className="eyebrow">Recent Effects</div>
            <h2>Son uygulanan komutlar</h2>
            <ul className="info-list">
              {commandCenter.telegramCommandRuns.length ? (
                commandCenter.telegramCommandRuns.map((run) => (
                  <li key={run.id}>
                    <strong>{run.commandText}</strong>
                    <br />
                    {run.status} · {run.intent} · {run.actionType}
                  </li>
                ))
              ) : (
                <li>Henuz uygulanmis komut yok</li>
              )}
            </ul>
          </section>
        </aside>
      </section>
    </main>
  );
}
