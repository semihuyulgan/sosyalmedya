import Link from "next/link";
import { regenerateAutopilotWeek, updateAutopilotPolicy } from "./actions";

const apiBaseUrl = process.env.API_BASE_URL || "http://127.0.0.1:4000";

type WorkspaceResponse = {
  businesses: Array<{
    id: string;
    name: string;
  }>;
};

type AutopilotResponse = {
  id: string;
  name: string;
  category: string;
  primaryGoal: string;
  publishMode: string;
  settings: {
    peakHoursJson: string | null;
  } | null;
  autopilotPolicy: null | {
    id: string;
    status: string;
    planningMode: string;
    approvalMode: string;
    publishEnabled: boolean;
    allowAutoVisualGeneration: boolean;
    allowAutoPublishing: boolean;
    weeklyCadenceJson: string | null;
    preferredTimeWindowsJson: string | null;
    agendaSensitivityJson: string | null;
    seasonalPriorityJson: string | null;
    contentMixJson: string | null;
    generationGuardrailsJson: string | null;
    lastPlannedAt: string | null;
  };
  autopilotPlans: Array<{
    id: string;
    title: string;
    theme: string | null;
    contentType: string;
    generationMode: string;
    objective: string | null;
    scheduledFor: string;
    status: string;
    source: string;
    reasoning: string | null;
    sceneRecipe: null | {
      id: string;
      title: string;
    };
  }>;
  visualWorldProfile: null | {
    sceneRecipes: Array<{
      id: string;
      title: string;
    }>;
  };
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

const getAutopilot = async (businessId: string) => {
  const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/autopilot`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Autopilot could not be loaded.");
  }

  return (await response.json()) as AutopilotResponse;
};

const prettyJson = (value: string | null | undefined) => {
  if (!value) return "";

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

const formatSlot = (value: string) =>
  new Date(value).toLocaleString("tr-TR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export default async function AutopilotControlPage() {
  const workspace = await getWorkspace();
  const business = workspace.businesses[0];
  const autopilot = await getAutopilot(business.id);
  const policy = autopilot.autopilotPolicy;

  return (
    <main className="profile-shell">
      <header className="profile-topbar">
        <div>
          <div className="eyebrow">Zero-Touch Ops</div>
          <h1>Autopilot Control Center</h1>
          <p className="muted">
            Ilk kurulumdan sonra sistemin gun gun, saat saat ve sahne sahne kendi karar vermesi
            icin gereken politika ve haftalik AI plani burada duruyor.
          </p>
        </div>

        <div className="topbar-actions">
          <Link className="link-chip" href="/">
            Dashboard
          </Link>
          <Link className="link-chip" href="/visual-world">
            Visual World
          </Link>
          <Link className="link-chip" href="/generate-studio">
            Generate Studio
          </Link>
        </div>
      </header>

      <section className="visual-hero">
        <div className="profile-card visual-hero-card">
          <div className="eyebrow">Autonomy Status</div>
          <h2>{autopilot.name}</h2>
          <p className="muted">
            Bu katman aktif oldugunda ekip brief yazmaz; sistem scene recipe, peak hour, hedef aksiyon
            ve publish moduna gore kendi haftalik planini uretir.
          </p>
          <div className="visual-stat-row">
            <div className="visual-stat">
              <strong>{autopilot.autopilotPlans.length}</strong>
              <span>Upcoming AI slots</span>
            </div>
            <div className="visual-stat">
              <strong>{autopilot.autopilotPlans.filter((item) => item.contentType === "REEL").length}</strong>
              <span>Reel decisions</span>
            </div>
            <div className="visual-stat">
              <strong>{policy?.allowAutoPublishing ? "ON" : "OFF"}</strong>
              <span>Auto publish</span>
            </div>
            <div className="visual-stat">
              <strong>{policy?.approvalMode || autopilot.publishMode}</strong>
              <span>Approval mode</span>
            </div>
          </div>
        </div>
      </section>

      <section className="visual-grid">
        <form action={updateAutopilotPolicy} className="profile-card profile-form">
          <input type="hidden" name="businessId" value={business.id} />

          <div className="card-head">
            <div>
              <div className="eyebrow">System Policy</div>
              <h2>AI kendi kararlarini nasil verecek?</h2>
            </div>
            <button className="primary-submit" type="submit">
              Save Policy
            </button>
          </div>

          <div className="form-grid">
            <label>
              <span>Status</span>
              <select defaultValue={policy?.status || "ACTIVE"} name="status">
                <option value="ACTIVE">ACTIVE</option>
                <option value="PAUSED">PAUSED</option>
              </select>
            </label>
            <label>
              <span>Planning mode</span>
              <select defaultValue={policy?.planningMode || "FULL_AUTO"} name="planningMode">
                <option value="FULL_AUTO">FULL_AUTO</option>
                <option value="SMART_AUTO">SMART_AUTO</option>
              </select>
            </label>
            <label>
              <span>Approval mode</span>
              <select defaultValue={policy?.approvalMode || "SMART"} name="approvalMode">
                <option value="MANUAL">MANUAL</option>
                <option value="SMART">SMART</option>
                <option value="AUTO">AUTO</option>
              </select>
            </label>
            <label className="asset-checkbox">
              <input defaultChecked={policy?.publishEnabled ?? true} name="publishEnabled" type="checkbox" />
              <span>Publish pipeline aktif</span>
            </label>
            <label className="asset-checkbox">
              <input
                defaultChecked={policy?.allowAutoVisualGeneration ?? true}
                name="allowAutoVisualGeneration"
                type="checkbox"
              />
              <span>AI gorsel uretimi otomatik</span>
            </label>
            <label className="asset-checkbox">
              <input
                defaultChecked={policy?.allowAutoPublishing ?? false}
                name="allowAutoPublishing"
                type="checkbox"
              />
              <span>Onaydan sonra otomatik yayinla</span>
            </label>
            <label className="span-2">
              <span>Weekly cadence JSON</span>
              <textarea defaultValue={prettyJson(policy?.weeklyCadenceJson)} name="weeklyCadenceJson" rows={6} />
            </label>
            <label>
              <span>Preferred time windows JSON</span>
              <textarea
                defaultValue={prettyJson(policy?.preferredTimeWindowsJson || autopilot.settings?.peakHoursJson)}
                name="preferredTimeWindowsJson"
                rows={6}
              />
            </label>
            <label>
              <span>Content mix JSON</span>
              <textarea defaultValue={prettyJson(policy?.contentMixJson)} name="contentMixJson" rows={6} />
            </label>
            <label className="span-2">
              <span>Agenda sensitivity JSON</span>
              <textarea
                defaultValue={prettyJson(policy?.agendaSensitivityJson)}
                name="agendaSensitivityJson"
                rows={6}
              />
            </label>
            <label className="span-2">
              <span>Seasonal priority JSON</span>
              <textarea
                defaultValue={prettyJson(policy?.seasonalPriorityJson)}
                name="seasonalPriorityJson"
                rows={6}
              />
            </label>
            <label className="span-2">
              <span>Generation guardrails JSON</span>
              <textarea
                defaultValue={prettyJson(policy?.generationGuardrailsJson)}
                name="generationGuardrailsJson"
                rows={6}
              />
            </label>
          </div>
        </form>

        <aside className="profile-sidebar">
          <section className="profile-card info-card">
            <div className="eyebrow">Scale Logic</div>
            <h2>Neden bu katman lazim?</h2>
            <ul className="info-list">
              <li>Kurulum ekipte kalir, tekrar eden karar verme AI&apos;a gecer.</li>
              <li>Yuz musteri olsa da saat secimi, format secimi ve sahne secimi sistem tarafinda olur.</li>
              <li>Operator sadece hata, kampanya degisikligi veya istisna durumda devreye girer.</li>
            </ul>
          </section>

          <section className="profile-card info-card">
            <div className="eyebrow">Planner State</div>
            <h2>Haftalik AI plani</h2>
            <p className="muted">
              Son planlama:
              {" "}
              {policy?.lastPlannedAt
                ? new Date(policy.lastPlannedAt).toLocaleString("tr-TR")
                : "Henuz planlanmadi"}
            </p>
            <form action={regenerateAutopilotWeek}>
              <input type="hidden" name="businessId" value={business.id} />
              <button className="ghost-action" type="submit">
                Next 7 Days Regenerate
              </button>
            </form>
          </section>
        </aside>
      </section>

      <section className="autopilot-plan-grid">
        {autopilot.autopilotPlans.map((plan) => (
          <article className="profile-card autopilot-plan-card" key={plan.id}>
            <div className="calendar-card-head">
              <div>
                <strong>{plan.title}</strong>
                <p className="muted">
                  {formatSlot(plan.scheduledFor)} · {plan.contentType} · {plan.generationMode}
                </p>
              </div>
              <span className="soft-pill">{plan.status}</span>
            </div>

            <div className="detail-stack">
              <div>
                <strong>Theme</strong>
                <p className="muted">{plan.theme || "No theme"}</p>
              </div>
              <div>
                <strong>Recipe</strong>
                <p className="muted">{plan.sceneRecipe?.title || "AI selected free mode"}</p>
              </div>
              <div>
                <strong>Objective</strong>
                <p className="muted">{plan.objective || autopilot.primaryGoal}</p>
              </div>
              <div>
                <strong>Reasoning</strong>
                <p className="muted">{plan.reasoning || "No reasoning yet."}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
