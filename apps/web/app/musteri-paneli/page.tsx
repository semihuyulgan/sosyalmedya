import Link from "next/link";

const kartlar = [
  {
    baslik: "Isletme Karti",
    aciklama: "Isletmenin temel bilgilerini, marka dilini ve hedefini duzenle.",
    href: "/business-profile",
    cta: "Karti Ac",
  },
  {
    baslik: "Gorsel Kutuphanesi",
    aciklama: "Mekan ve urun fotograflarini ekle, duzenle ve kullanima hazirla.",
    href: "/asset-library",
    cta: "Gorselleri Yonet",
  },
  {
    baslik: "Gorsel Uret",
    aciklama: "Yapay zekadan bu isletmeye uygun yeni gorseller uretmesini iste.",
    href: "/generate-studio",
    cta: "Uretime Git",
  },
  {
    baslik: "Onaylar",
    aciklama: "Yayinlanmadan once sana gelen icerikleri tek yerden onayla.",
    href: "/approval-center",
    cta: "Onaylari Gor",
  },
  {
    baslik: "Icerik Takvimi",
    aciklama: "Hazirlanan ve yayinlanacak icerikleri sade bir takvimde gor.",
    href: "/content-calendar",
    cta: "Takvimi Ac",
  },
  {
    baslik: "Telegram Baglantisi",
    aciklama: "Telegram komutlarini ve hizli yonetim baglantisini buradan ac.",
    href: "/telegram-center",
    cta: "Telegram'i Ac",
  },
];

export default function MusteriPaneliPage() {
  return (
    <main className="customer-shell">
      <header className="customer-topbar">
        <div>
          <div className="eyebrow">Musteri Paneli</div>
          <h1>Hos geldin. Burada sadece ihtiyac duyacagin seyler var.</h1>
          <p>
            Teknik detaylari arkada tuttuk. Isletmeni yonetmek icin bu alandaki temel adimlar
            yeterli.
          </p>
        </div>

        <div className="customer-topbar-actions">
          <Link className="ghost-action" href="/">
            Ana Sayfa
          </Link>
          <Link className="solid-action" href="/business-profile">
            Isletme Kartini Duzenle
          </Link>
        </div>
      </header>

      <section className="customer-summary-grid">
        <article className="customer-summary-card">
          <span>Durum</span>
          <strong>Kurulum hazir</strong>
          <p>Temel alanlar doldurulduktan sonra ilk uretime gecilebilir.</p>
        </article>
        <article className="customer-summary-card">
          <span>Yonetim</span>
          <strong>Panel + Telegram</strong>
          <p>Istersen panelden, istersen Telegram'dan yonetebilirsin.</p>
        </article>
        <article className="customer-summary-card">
          <span>Sonraki adim</span>
          <strong>Gorsel ekle</strong>
          <p>Mekan ve urun fotograflarini ekleyip ilk gorseli uret.</p>
        </article>
      </section>

      <section className="customer-card-grid">
        {kartlar.map((kart) => (
          <article className="customer-card" key={kart.baslik}>
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
