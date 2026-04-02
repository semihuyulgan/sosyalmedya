import Link from "next/link";

const kartlar = [
  {
    baslik: "İşletme Kartı",
    aciklama: "İşletmenin temel bilgilerini, marka dilini ve hedefini düzenle.",
    href: "/business-profile",
    cta: "Kartı Aç",
    etiket: "Kurulum",
  },
  {
    baslik: "Görsel Kütüphanesi",
    aciklama: "Mekân ve ürün fotoğraflarını ekle, düzenle ve kullanıma hazırla.",
    href: "/asset-library",
    cta: "Görselleri Yönet",
    etiket: "Görseller",
  },
  {
    baslik: "Görsel Üret",
    aciklama: "Yapay zekâdan bu işletmeye uygun yeni görseller üretmesini iste.",
    href: "/generate-studio",
    cta: "Üretime Git",
    etiket: "Yapay zekâ",
  },
  {
    baslik: "Onaylar",
    aciklama: "Yayınlanmadan önce sana gelen içerikleri tek yerden onayla.",
    href: "/approval-center",
    cta: "Onayları Gör",
    etiket: "Kontrol",
  },
  {
    baslik: "İçerik Takvimi",
    aciklama: "Hazırlanan ve yayınlanacak içerikleri sade bir takvimde gör.",
    href: "/content-calendar",
    cta: "Takvimi Aç",
    etiket: "Plan",
  },
  {
    baslik: "Telegram Bağlantısı",
    aciklama: "Telegram komutlarını ve hızlı yönetim bağlantısını buradan aç.",
    href: "/telegram-center",
    cta: "Telegram’ı Aç",
    etiket: "İletişim",
  },
];

const akış = [
  "Önce işletme kartını tamamla.",
  "Sonra görsellerini ekle.",
  "Ardından ilk üretimi başlat.",
];

export default function MusteriPaneliPage() {
  return (
    <main className="customer-shell">
      <header className="customer-topbar">
        <div>
          <div className="eyebrow">Müşteri Paneli</div>
          <h1>Hoş geldin. İşletmen için gerekli olan her şey burada.</h1>
          <p>
            Teknik detayları arkada tuttuk. Buradan işletme kartını düzenleyebilir, görsellerini
            ekleyebilir ve ilk üretimi başlatabilirsin.
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
          <span className="customer-hero-kicker">Hazırsın</span>
          <h2>İlk görsel üretimine geçmek için sadece birkaç adım kaldı.</h2>
          <p>
            Sistem işletmeni tanıdıktan sonra içerik fikirlerini ve görselleri senin yerine
            oluşturmaya başlar.
          </p>

          <div className="customer-hero-actions">
            <Link className="solid-action" href="/generate-studio">
              İlk Üretimi Başlat
            </Link>
            <Link className="ghost-action" href="/asset-library">
              Görselleri Ekle
            </Link>
          </div>
        </article>

        <aside className="customer-progress-card">
          <span className="customer-progress-title">Hızlı başlangıç</span>
          <div className="customer-progress-list">
            {akış.map((adım, index) => (
              <div className="customer-progress-item" key={adım}>
                <span>{index + 1}</span>
                <p>{adım}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="customer-summary-grid">
        <article className="customer-summary-card">
          <span>Durum</span>
          <strong>Kurulum hazır</strong>
          <p>Temel alanlar tamamlanınca ilk görsel üretimine hemen geçilir.</p>
        </article>
        <article className="customer-summary-card">
          <span>Yönetim</span>
          <strong>Panel + Telegram</strong>
          <p>İstersen panelden, istersen Telegram’dan yönetebilirsin.</p>
        </article>
        <article className="customer-summary-card">
          <span>Sonraki adım</span>
          <strong>Görsel ekle</strong>
          <p>Mekân ve ürün fotoğraflarını ekle, sonra yapay zekâya ilk üretimi yaptır.</p>
        </article>
      </section>

      <section className="customer-card-grid">
        {kartlar.map((kart) => (
          <article className="customer-card" key={kart.baslik}>
            <span className="customer-card-tag">{kart.etiket}</span>
            <h2>{kart.baslik}</h2>
            <p>{kart.aciklama}</p>
            <Link className="ghost-action" href={kart.href}>
              {kart.cta}
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
