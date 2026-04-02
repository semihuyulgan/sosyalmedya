import Link from "next/link";

const adimlar = [
  {
    sıra: "1",
    baslik: "İşletme bilgilerini tamamla",
    aciklama: "İşletmenin ne yaptığını, tarzını ve hedefini sisteme anlat.",
    href: "/business-profile",
    cta: "İşletme Kartını Aç",
  },
  {
    sıra: "2",
    baslik: "Görsellerini yükle",
    aciklama: "Mekân, ürün ve atmosfer fotoğraflarını tek ekrandan ekle.",
    href: "/asset-library",
    cta: "Görselleri Yükle",
  },
  {
    sıra: "3",
    baslik: "Telegram’ı bağla",
    aciklama: "İstersen onayları ve hızlı komutları Telegram’dan yönet.",
    href: "/telegram-center",
    cta: "Telegram’ı Bağla",
  },
  {
    sıra: "4",
    baslik: "İlk üretimi başlat",
    aciklama: "Yapay zekâ senin için ilk içerik görsellerini oluştursun.",
    href: "/generate-studio",
    cta: "Üretime Geç",
  },
];

const yardimciBaglantilar = [
  {
    baslik: "Onaylar",
    aciklama: "Yayına çıkmadan önce son onayı burada verirsin.",
    href: "/approval-center",
  },
  {
    baslik: "İçerik Takvimi",
    aciklama: "Hazırlanan içeriklerin yayın sırasını burada görürsün.",
    href: "/content-calendar",
  },
];

export default function MusteriPaneliPage() {
  return (
    <main className="customer-shell">
      <header className="customer-topbar">
        <div>
          <div className="eyebrow">Müşteri Paneli</div>
          <h1>Hoş geldin. Buradan adım adım ilerleyebilirsin.</h1>
          <p>
            Karmaşık ayarları arkaya aldık. Aşağıdaki 4 adımı sırayla tamamlaman yeterli.
          </p>
        </div>

        <div className="customer-topbar-actions">
          <Link className="ghost-action" href="/">
            Ana Sayfa
          </Link>
          <Link className="solid-action" href="/business-profile">
            İşletme Kartını Düzenle
          </Link>
        </div>
      </header>

      <section className="customer-hero-grid">
        <article className="customer-hero-card">
          <span className="customer-hero-kicker">Hızlı Başlangıç</span>
          <h2>Önce işletmeni tanıtalım, sonra yapay zekâ senin için üretmeye başlasın.</h2>
          <p>
            İşletme bilgilerini ve görsellerini ekledikten sonra sistem senin yerine içerik ve
            görsel üretmeye başlar.
          </p>

          <div className="customer-hero-actions">
            <Link className="solid-action" href="/business-profile">
              1. Adımı Başlat
            </Link>
            <Link className="ghost-action" href="/asset-library">
              Görselleri Yükle
            </Link>
          </div>
        </article>

        <aside className="customer-progress-card">
          <span className="customer-progress-title">Sırayla yap</span>
          <div className="customer-progress-list">
            {adimlar.map((adim) => (
              <div className="customer-progress-item" key={adim.baslik}>
                <span>{adim.sıra}</span>
                <p>{adim.baslik}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="customer-summary-grid">
        <article className="customer-summary-card">
          <span>Durum</span>
          <strong>Kurulum hazır</strong>
          <p>Dört temel adım tamamlandığında sistem tam çalışmaya başlar.</p>
        </article>
        <article className="customer-summary-card">
          <span>Yönetim</span>
          <strong>Panel + Telegram</strong>
          <p>İstersen panelden, istersen Telegram’dan yönetebilirsin.</p>
        </article>
        <article className="customer-summary-card">
          <span>Sonraki adım</span>
          <strong>İşletme kartı</strong>
          <p>İlk olarak işletme kartını doldur; sonra sistem seni sırayla yönlendirsin.</p>
        </article>
      </section>

      <section className="setup-card-grid">
        {adimlar.map((adim) => (
          <article className="customer-card setup-card" key={adim.baslik}>
            <span className="setup-step-badge">Adım {adim.sıra}</span>
            <h2>{adim.baslik}</h2>
            <p>{adim.aciklama}</p>
            <Link className="solid-action" href={adim.href}>
              {adim.cta}
            </Link>
          </article>
        ))}
      </section>

      <section className="support-links-strip">
        {yardimciBaglantilar.map((item) => (
          <article className="customer-card support-link-card" key={item.baslik}>
            <div>
              <span className="customer-card-tag">Yardımcı ekran</span>
              <h2>{item.baslik}</h2>
              <p>{item.aciklama}</p>
            </div>
            <Link className="ghost-action" href={item.href}>
              Aç
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
