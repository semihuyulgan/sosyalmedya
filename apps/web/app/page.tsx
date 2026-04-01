import Link from "next/link";

const upcomingItems = [
  {
    time: "Bugün · 18:30",
    title: "Yeni tatli reels",
    detail: "3 sahneli servis akisi ve aksama rezervasyon CTA",
    status: "Onay bekliyor",
  },
  {
    time: "Yarin · 12:00",
    title: "Oglen menusu carousel",
    detail: "Hizli servis ve ofis kitlesine odakli 5 slide plan",
    status: "Planlandi",
  },
  {
    time: "Cumartesi · 19:00",
    title: "Aksam rezervasyon push",
    detail: "Story + feed senkronlu kampanya duyurusu",
    status: "Hazirlaniyor",
  },
];

const approvals = [
  {
    title: "Izgara tabak tanitimi",
    subtitle: "Telegram onayi bekliyor",
    owner: "@luna_owner",
    mode: "Manual",
  },
  {
    title: "Mekan atmosferi story serisi",
    subtitle: "Smart approval tetiklendi",
    owner: "@luna_manager",
    mode: "Smart",
  },
];

const insights = [
  {
    label: "Reels moment",
    body: "Aksam servisinden 35 dakika once yayinlanan reels icerikleri daha fazla profil ziyareti getiriyor.",
  },
  {
    label: "Save magnet",
    body: "Tatli ve brunch odakli carousel'ler kaydetme tarafinda ana yemek iceriklerini geciyor.",
  },
  {
    label: "Approval rule",
    body: "Fiyat veya kampanya mention olan iceriklerde smart approval yerine manual approval korunmali.",
  },
];

const channels = [
  { label: "Instagram", value: "Connected", tone: "good" },
  { label: "Telegram", value: "Live approval", tone: "cool" },
  { label: "Meta Publish", value: "Queue healthy", tone: "neutral" },
];

export default function HomePage() {
  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">A</div>
          <div>
            <strong>Autopilot Studio</strong>
            <span>AI social commerce ops</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <a className="active" href="/">
            Overview
          </a>
          <a href="/content-calendar">Calendar</a>
          <a href="/">Content Ops</a>
          <a href="/approval-center">Approvals</a>
          <a href="/telegram-center">Telegram</a>
          <a href="/autopilot-control">Autopilot</a>
          <a href="/generation-pipeline">Pipeline</a>
          <a href="/generate-studio">Generate Studio</a>
          <a href="/">Campaigns</a>
          <a href="/">Analytics</a>
          <a href="/asset-library">Asset Library</a>
          <a href="/visual-world">Visual World</a>
          <a href="/business-profile">Business Profile</a>
          <a href="/">Settings</a>
        </nav>

        <section className="sidebar-card">
          <div className="eyebrow">Current Client</div>
          <h3>Luna Bistro</h3>
          <p>Besiktas aksami, premium ama ulasilabilir sehir restoranı.</p>
          <div className="sidebar-pills">
            <span>Smart publish</span>
            <span>TR tone</span>
          </div>
        </section>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <div className="eyebrow">Operations Cockpit</div>
            <h1>Social media artik bir yayin paneli degil, gelir motoru gibi gorunmeli.</h1>
            <p className="dashboard-intro">
              Haftalik icerik ritmi, Telegram approval, marka hafizasi ve kampanya basincini tek
              bakista yoneten daha premium bir operasyon katmani.
            </p>
          </div>

          <div className="topbar-rail">
            <div className="rail-card">
              <span className="rail-label">Workspace</span>
              <strong>Demo Studio</strong>
            </div>
            <div className="rail-card">
              <span className="rail-label">Focus</span>
              <strong>Dinner rush</strong>
            </div>
          </div>
        </header>

        <section className="hero-stage">
          <article className="hero-primary card-sheen">
            <div className="hero-badges">
              <span>Instagram-first</span>
              <span>Telegram loop</span>
              <span>Smart approvals</span>
            </div>

            <div className="hero-copy">
              <div className="hero-label">This week</div>
              <h2>9 icerik hazir, 2 tanesi onay kuyrugunda, kampanya akisi stabil.</h2>
              <p>
                Sistem mantigi artik daha net: operator icerigi set ediyor, isletme tek tikla onay
                veriyor, yayinlama katmani planli sekilde ilerliyor.
              </p>
            </div>

            <div className="hero-actions">
              <button className="solid-action">Yeni hafta icerigi uret</button>
              <Link className="ghost-action" href="/content-calendar">
                Content Calendar
              </Link>
              <Link className="ghost-action" href="/approval-center">
                Approval Center
              </Link>
              <Link className="ghost-action" href="/telegram-center">
                Telegram Center
              </Link>
              <Link className="ghost-action" href="/asset-library">
                Asset Library
              </Link>
              <Link className="ghost-action" href="/autopilot-control">
                Autopilot Control
              </Link>
              <Link className="ghost-action" href="/generation-pipeline">
                Generation Pipeline
              </Link>
              <Link className="ghost-action" href="/generate-studio">
                Generate Studio
              </Link>
              <Link className="ghost-action" href="/visual-world">
                Visual World
              </Link>
              <Link className="ghost-action" href="/business-profile">
                Marka profilini duzenle
              </Link>
            </div>
          </article>

          <article className="hero-side card-sheen">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">Live Status</div>
                <h3>Channel health</h3>
              </div>
            </div>

            <div className="channel-stack">
              {channels.map((channel) => (
                <div className="channel-row" key={channel.label}>
                  <div>
                    <strong>{channel.label}</strong>
                    <p>{channel.value}</p>
                  </div>
                  <span className={`signal ${channel.tone}`}></span>
                </div>
              ))}
            </div>

            <div className="focus-box">
              <span className="eyebrow">Next publish</span>
              <strong>Bugün 18:30</strong>
              <p>Yeni tatli reels, aksama rezervasyon trafiği icin son boost noktasi.</p>
            </div>
          </article>
        </section>

        <section className="stat-grid">
          <article className="stat-card">
            <span className="stat-label">Bu hafta planlanan</span>
            <strong>9</strong>
            <p>2 post, 4 carousel, 3 reels</p>
          </article>
          <article className="stat-card">
            <span className="stat-label">Approval queue</span>
            <strong>2</strong>
            <p>1 manual, 1 smart escalation</p>
          </article>
          <article className="stat-card">
            <span className="stat-label">Bu ay yayinlanan</span>
            <strong>27</strong>
            <p>Takvim disiplini korunuyor</p>
          </article>
          <article className="stat-card">
            <span className="stat-label">Estimated lift</span>
            <strong>+18%</strong>
            <p>Profil ziyareti trend tahmini</p>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="dashboard-card wide">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">Publishing Timeline</div>
                <h3>Yaklasan icerik akisi</h3>
              </div>
              <span className="soft-pill">7-day view</span>
            </div>

            <div className="timeline-list">
              {upcomingItems.map((item) => (
                <div className="timeline-card" key={item.title}>
                  <div className="timeline-time">{item.time}</div>
                  <div className="timeline-body">
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                  <div className={`timeline-status ${item.status === "Onay bekliyor" ? "warn" : ""}`}>
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-card">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">Approval Layer</div>
                <h3>Telegram queue</h3>
              </div>
            </div>

            <div className="approval-list">
              {approvals.map((item) => (
                <div className="approval-card" key={item.title}>
                  <div className="approval-meta">
                    <strong>{item.title}</strong>
                    <span>{item.subtitle}</span>
                  </div>
                  <div className="approval-foot">
                    <span>{item.owner}</span>
                    <span className="soft-pill">{item.mode}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="dashboard-card">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">Brand Memory</div>
                <h3>Current strategic posture</h3>
              </div>
              <Link className="text-link" href="/business-profile">
                Open profile
              </Link>
            </div>

            <div className="memory-stack">
              <div className="memory-row">
                <span>Tonalite</span>
                <strong>Samimi / sehirli / premium</strong>
              </div>
              <div className="memory-row">
                <span>Pillar focus</span>
                <strong>Signature plates, mood, reservation CTA</strong>
              </div>
              <div className="memory-row">
                <span>Risk guardrail</span>
                <strong>Asiri kampanya dili ve ucuz algisi yasak</strong>
              </div>
            </div>
          </article>

          <article className="dashboard-card wide">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">AI Recommendations</div>
                <h3>Next-week optimization signals</h3>
              </div>
            </div>

            <div className="insight-grid">
              {insights.map((insight) => (
                <div className="insight-card" key={insight.label}>
                  <span>{insight.label}</span>
                  <p>{insight.body}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
