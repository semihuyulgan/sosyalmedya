import Link from "next/link";
import { updateBusinessProfile } from "./actions";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

type WorkspaceResponse = {
  businesses: Array<{
    id: string;
    name: string;
    category: string;
    description: string | null;
    priceSegment: string | null;
    address: string | null;
    city: string;
    country: string;
    phone: string | null;
    websiteUrl: string | null;
    reservationUrl: string | null;
    whatsappUrl: string | null;
    primaryGoal: string;
    operatingMode: string;
    dashboardAccessEnabled: boolean;
    telegramControlEnabled: boolean;
    publishMode: string;
    settings: {
      preferredLanguage: string;
      toneSummary: string | null;
      ctaPreferencesJson: string | null;
      forbiddenPhrasesJson: string | null;
      targetAudienceJson: string | null;
      peakHoursJson: string | null;
      seasonalNotesJson: string | null;
    } | null;
    brandProfiles: Array<{
      summary: string;
      voiceGuidelines: string | null;
      visualGuidelines: string | null;
    }>;
    contentPillars: Array<{
      id: string;
      name: string;
      description: string | null;
      priority: number;
    }>;
  }>;
};

const getWorkspaceBusiness = async () => {
  const response = await fetch(`${apiBaseUrl}/api/workspaces/demo-studio/businesses`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Business profile could not be loaded.");
  }

  const workspace = (await response.json()) as WorkspaceResponse;
  return workspace.businesses[0];
};

const prettyJson = (value: string | null | undefined) => {
  if (!value) return "";

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

export default async function BusinessProfilePage() {
  const business = await getWorkspaceBusiness();
  const brandProfile = business.brandProfiles[0];
  const settings = business.settings;

  return (
    <main className="profile-shell">
      <header className="profile-topbar">
        <div>
          <div className="eyebrow">Client Workspace</div>
          <h1>Business Profile</h1>
          <p className="muted">
            Bu ekran artik gercek veritabanina bagli. Kaydettigin degisiklikler API uzerinden
            yaziliyor ve sayfa yenilendiginde korunuyor.
          </p>
        </div>

        <div className="topbar-actions">
          <Link className="link-chip" href="/">
            Dashboard
          </Link>
          <span className="link-chip passive">Workspace: Demo Studio</span>
        </div>
      </header>

      <section className="profile-grid">
        <form action={updateBusinessProfile} className="profile-card profile-form">
          <input name="businessId" type="hidden" value={business.id} />

          <div className="card-head">
            <div>
              <div className="eyebrow">Source Of Truth</div>
              <h2>Commercial Identity</h2>
            </div>
            <button className="primary-submit" type="submit">
              Save Changes
            </button>
          </div>

          <div className="form-grid">
            <label>
              <span>Business Name</span>
              <input defaultValue={business.name} name="name" required />
            </label>
            <label>
              <span>Category</span>
              <input defaultValue={business.category} name="category" required />
            </label>
            <label>
              <span>Price Segment</span>
              <input defaultValue={business.priceSegment || ""} name="priceSegment" />
            </label>
            <label>
              <span>Primary Goal</span>
              <select defaultValue={business.primaryGoal} name="primaryGoal">
                <option value="RESERVATION">Reservation</option>
                <option value="ORDER">Order</option>
                <option value="PROFILE_TRAFFIC">Profile Traffic</option>
                <option value="AWARENESS">Awareness</option>
              </select>
            </label>
            <label className="span-2">
              <span>Description</span>
              <textarea defaultValue={business.description || ""} name="description" rows={4} />
            </label>
            <label className="span-2">
              <span>Address</span>
              <input defaultValue={business.address || ""} name="address" />
            </label>
            <label>
              <span>City</span>
              <input defaultValue={business.city} name="city" required />
            </label>
            <label>
              <span>Country</span>
              <input defaultValue={business.country} name="country" required />
            </label>
            <label>
              <span>Phone</span>
              <input defaultValue={business.phone || ""} name="phone" />
            </label>
            <label>
              <span>Website</span>
              <input defaultValue={business.websiteUrl || ""} name="websiteUrl" />
            </label>
            <label>
              <span>Reservation URL</span>
              <input defaultValue={business.reservationUrl || ""} name="reservationUrl" />
            </label>
            <label>
              <span>WhatsApp URL</span>
              <input defaultValue={business.whatsappUrl || ""} name="whatsappUrl" />
            </label>
            <label>
              <span>Operating Mode</span>
              <select defaultValue={business.operatingMode} name="operatingMode">
                <option value="SELF_SERVE">Self-Serve</option>
                <option value="MANAGED">Managed</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </label>
            <label>
              <span>Publish Mode</span>
              <select defaultValue={business.publishMode} name="publishMode">
                <option value="MANUAL">Manual approval</option>
                <option value="SMART">Smart approval</option>
                <option value="AUTO">Auto publish</option>
              </select>
            </label>
            <label className="asset-checkbox">
              <input
                defaultChecked={business.dashboardAccessEnabled}
                name="dashboardAccessEnabled"
                type="checkbox"
              />
              <span>Dashboard access enabled</span>
            </label>
            <label className="asset-checkbox">
              <input
                defaultChecked={business.telegramControlEnabled}
                name="telegramControlEnabled"
                type="checkbox"
              />
              <span>Telegram control enabled</span>
            </label>
            <label>
              <span>Preferred Language</span>
              <input defaultValue={settings?.preferredLanguage || "tr"} name="preferredLanguage" />
            </label>
          </div>

          <div className="card-head compact">
            <div>
              <div className="eyebrow">Brand System</div>
              <h2>Voice And Audience Settings</h2>
            </div>
          </div>

          <div className="form-grid">
            <label className="span-2">
              <span>Tone Summary</span>
              <textarea defaultValue={settings?.toneSummary || ""} name="toneSummary" rows={3} />
            </label>
            <label className="span-2">
              <span>Target Audience JSON</span>
              <textarea
                defaultValue={prettyJson(settings?.targetAudienceJson)}
                name="targetAudienceJson"
                rows={6}
              />
            </label>
            <label className="span-2">
              <span>CTA Preferences JSON</span>
              <textarea
                defaultValue={prettyJson(settings?.ctaPreferencesJson)}
                name="ctaPreferencesJson"
                rows={6}
              />
            </label>
            <label className="span-2">
              <span>Forbidden Phrases JSON</span>
              <textarea
                defaultValue={prettyJson(settings?.forbiddenPhrasesJson)}
                name="forbiddenPhrasesJson"
                rows={6}
              />
            </label>
            <label>
              <span>Peak Hours JSON</span>
              <textarea defaultValue={prettyJson(settings?.peakHoursJson)} name="peakHoursJson" rows={5} />
            </label>
            <label>
              <span>Seasonal Notes JSON</span>
              <textarea
                defaultValue={prettyJson(settings?.seasonalNotesJson)}
                name="seasonalNotesJson"
                rows={5}
              />
            </label>
          </div>
        </form>

        <aside className="profile-sidebar">
          <section className="profile-card info-card">
            <div className="eyebrow">AI Readout</div>
            <h2>Current Brand Memory</h2>
            <p>{brandProfile?.summary}</p>
            <div className="detail-stack">
              <div>
                <strong>Voice guidance</strong>
                <p className="muted">{brandProfile?.voiceGuidelines || "No voice guidance yet."}</p>
              </div>
              <div>
                <strong>Visual guidance</strong>
                <p className="muted">{brandProfile?.visualGuidelines || "No visual guidance yet."}</p>
              </div>
            </div>
          </section>

          <section className="profile-card info-card">
            <div className="eyebrow">Content Strategy</div>
            <h2>Active Content Pillars</h2>
            <div className="pillar-list">
              {business.contentPillars.map((pillar) => (
                <div className="pillar-item" key={pillar.id}>
                  <span className="pillar-order">0{pillar.priority}</span>
                  <div>
                    <strong>{pillar.name}</strong>
                    <p className="muted">{pillar.description || "No description yet."}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="profile-card info-card">
            <div className="eyebrow">Why This Matters</div>
            <h2>Operational Notes</h2>
            <ul className="info-list">
              <li>Bu form artik `business` ve `business_settings` tablolarina kayit yapar.</li>
              <li>Buradaki veriler daha sonra AI prompt context olarak kullanilacak.</li>
              <li>Bir sonraki moduller asset library ve content calendar olacak.</li>
            </ul>
          </section>
        </aside>
      </section>
    </main>
  );
}
