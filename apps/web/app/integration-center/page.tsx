import Link from "next/link";
import { startMetaOAuth, updateInstagramIntegration } from "./actions";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

type WorkspaceResponse = {
  businesses: Array<{
    id: string;
    name: string;
  }>;
};

type IntegrationResponse = {
  id: string;
  provider: string;
  accountName: string;
  externalAccountId: string | null;
  status: string;
  metadata: {
    mode?: string;
    username?: string;
    pageId?: string;
    igBusinessId?: string;
    notes?: string;
  };
  envReady: {
    metaAppId: boolean;
    metaAppSecret: boolean;
    metaRedirectUri: boolean;
    publicAssetBaseUrl: boolean;
  };
  tokenReady: boolean;
  tokenPreview: string;
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

const getInstagramIntegration = async (businessId: string) => {
  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/integrations/instagram`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Instagram integration could not be loaded.");
  }

  return (await response.json()) as IntegrationResponse;
};

export default async function IntegrationCenterPage() {
  const workspace = await getWorkspace();
  const business = workspace.businesses[0];
  const integration = await getInstagramIntegration(business.id);

  return (
    <main className="profile-shell">
      <header className="profile-topbar">
        <div>
          <div className="eyebrow">Connector Setup</div>
          <h1>Integration Center</h1>
          <p className="muted">
            Burasi simule publish adapter ile gercek Meta connector arasindaki gecis katmani.
            Hesap bilgisini, connector modunu ve gerekli external ID alanlarini burada tutuyoruz.
          </p>
        </div>

        <div className="topbar-actions">
          <Link className="link-chip" href="/">
            Dashboard
          </Link>
          <Link className="link-chip" href="/publishing-center">
            Publishing Center
          </Link>
          <Link className="link-chip" href="/approval-center">
            Approval Center
          </Link>
        </div>
      </header>

      <section className="asset-layout">
        <section className="profile-card profile-form">
          <div className="card-head">
            <div>
              <div className="eyebrow">Instagram Connector</div>
              <h2>Account ve adapter ayarlari</h2>
            </div>
          </div>

          <form action={updateInstagramIntegration} className="form-grid">
            <input name="businessId" type="hidden" value={business.id} />

            <label className="span-2">
              <span>Account name</span>
              <input defaultValue={integration.accountName} name="accountName" required />
            </label>
            <label>
              <span>Status</span>
              <select defaultValue={integration.status} name="status">
                <option value="CONNECTED">Connected</option>
                <option value="PENDING">Pending</option>
                <option value="DISCONNECTED">Disconnected</option>
              </select>
            </label>
            <label>
              <span>Connector mode</span>
              <select defaultValue={integration.metadata.mode || "SIMULATED"} name="connectorMode">
                <option value="SIMULATED">Simulated</option>
                <option value="META_API_READY">Meta API Ready</option>
              </select>
            </label>
            <label>
              <span>Username</span>
              <input defaultValue={integration.metadata.username || ""} name="username" placeholder="@brand" />
            </label>
            <label>
              <span>External account id</span>
              <input defaultValue={integration.externalAccountId || ""} name="externalAccountId" />
            </label>
            <label>
              <span>Facebook page id</span>
              <input defaultValue={integration.metadata.pageId || ""} name="pageId" />
            </label>
            <label>
              <span>Instagram business id</span>
              <input defaultValue={integration.metadata.igBusinessId || ""} name="igBusinessId" />
            </label>
            <label className="span-2">
              <span>Connector notes</span>
              <textarea defaultValue={integration.metadata.notes || ""} name="notes" rows={4} />
            </label>
            <div className="span-2">
              <div className="calendar-actions">
                <button className="primary-submit" type="submit">
                  Save Integration Settings
                </button>
                <button className="ghost-action" formAction={startMetaOAuth} type="submit">
                  Start Meta OAuth
                </button>
              </div>
            </div>
          </form>
        </section>

        <aside className="profile-sidebar">
          <section className="profile-card info-card">
            <div className="eyebrow">Environment Check</div>
            <h2>Meta env durumu</h2>
            <ul className="info-list">
              <li>META_APP_ID: {integration.envReady.metaAppId ? "hazir" : "eksik"}</li>
              <li>META_APP_SECRET: {integration.envReady.metaAppSecret ? "hazir" : "eksik"}</li>
              <li>META_REDIRECT_URI: {integration.envReady.metaRedirectUri ? "hazir" : "eksik"}</li>
              <li>PUBLIC_ASSET_BASE_URL: {integration.envReady.publicAssetBaseUrl ? "hazir" : "eksik"}</li>
              <li>Provider: {integration.provider}</li>
              <li>Token: {integration.tokenReady ? integration.tokenPreview : "bagli degil"}</li>
            </ul>
          </section>

          <section className="profile-card info-card">
            <div className="eyebrow">Transition Plan</div>
            <h2>Gercek connector icin gerekli olanlar</h2>
            <ul className="info-list">
              <li>Instagram business hesap baglantisi</li>
              <li>Page id ve IG business id</li>
              <li>Token refresh / access token akisi</li>
              <li>Media upload ve publish adapter&apos;i</li>
            </ul>
          </section>
        </aside>
      </section>
    </main>
  );
}
