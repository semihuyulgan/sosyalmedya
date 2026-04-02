import Link from "next/link";

const paketler = [
  {
    ad: "Baslangic",
    fiyat: "7.900 TL",
    detay: "Gunde 1 post ureten ve onay ile ilerleyen giris paketi.",
    maddeler: [
      "Gunluk 1 icerik",
      "Telegram uzerinden onay",
      "Temel gorsel uretimi",
      "Aylik performans ozeti",
    ],
  },
  {
    ad: "Buyume",
    fiyat: "14.900 TL",
    detay: "Gunde 2 post ve daha hizli operasyon isteyen isletmeler icin.",
    maddeler: [
      "Gunluk 2 icerik",
      "Reels + post karmasi",
      "Oncelikli gorsel uretimi",
      "Telegram uzerinden hizli komutlar",
    ],
  },
  {
    ad: "Tam Otomasyon",
    fiyat: "24.900 TL",
    detay: "Yuksek tempo ve otomatik yayin akisi isteyen markalar icin.",
    maddeler: [
      "Gunluk 3+ icerik",
      "Otomatik yayin secenegi",
      "Kampanya ve yeni urun akisi",
      "Kurulum ve operator destegi",
    ],
  },
];

const ozellikler = [
  {
    baslik: "Isletmeni taniyor",
    aciklama:
      "Mekanin tonu, urunlerin, hedef kitlen ve marka dili tek bir isletme kartinda toplanir.",
  },
  {
    baslik: "Gorsel uretir",
    aciklama:
      "Ekledigin mekan ve urun gorsellerine gore sana o isletmeye uygun yeni gorseller uretir.",
  },
  {
    baslik: "Telegram'dan yonetilir",
    aciklama:
      "Yeni urun ekleme, onay verme ve hizli yonlendirme gibi isleri panel acmadan halledebilirsin.",
  },
  {
    baslik: "Onayli veya otomatik calisir",
    aciklama:
      "Istersen her paylasim once sana gelir, istersen otomatik yayin moduna gecersin.",
  },
];

const adimlar = [
  "Isletme kartini doldur.",
  "Mekan ve urun gorsellerini ekle.",
  "Yapay zekadan ilk gorselleri uretmesini iste.",
  "Onay ver ya da Telegram'dan duzenle.",
];

const guvenBasliklari = [
  "Restoranlar ve kafeler icin tasarlandi",
  "Turkce panel ve Telegram deneyimi",
  "Kurulumdan sonra hizli kullanim",
];

export default function HomePage() {
  return (
    <main className="marketing-shell">
      <header className="marketing-topbar">
        <Link className="marketing-brand" href="/">
          <span className="marketing-mark">A</span>
          <div>
            <strong>AI Social Autopilot</strong>
            <span>Isletmeler icin sosyal medya otomasyonu</span>
          </div>
        </Link>

        <nav className="marketing-nav">
          <a href="#neler-yapar">Neler Yapar?</a>
          <a href="#kanallar">Kanallar</a>
          <a href="#paketler">Paketler</a>
          <a href="#nasil-calisir">Nasil Calisir?</a>
          <Link className="ghost-action" href="/musteri-paneli">
            Giris Yap
          </Link>
          <Link className="solid-action" href="/business-profile">
            Kayit Ol
          </Link>
        </nav>
      </header>

      <section className="marketing-hero">
        <div className="marketing-copy">
          <div className="marketing-kicker">YAYINLA</div>
          <h1>Isletmen icin sosyal medyayi tek yerden yonet.</h1>
          <p>
            Mekanini tanir, urunlerini ogrenir ve sana uygun gorseller hazirlar. Icerik planlama,
            onay ve Telegram yonetimi tek bir sade panelde bulusur.
          </p>

          <div className="marketing-actions">
            <Link className="solid-action" href="/business-profile">
              Ucretsiz Basla
            </Link>
            <Link className="ghost-action" href="/musteri-paneli">
              Nasil Gorundugunu Gor
            </Link>
          </div>

          <div className="marketing-pills">
            <span>Turkce arayuz</span>
            <span>Telegram yonetimi</span>
            <span>Gercek gorsel uretimi</span>
          </div>

          <div className="marketing-trust-row">
            {guvenBasliklari.map((madde) => (
              <span key={madde}>{madde}</span>
            ))}
          </div>
        </div>

        <aside className="marketing-showcase">
          <div className="marketing-screen">
            <div className="marketing-screen-topbar">
              <span className="screen-badge">Tum Kanallar</span>
              <span className="screen-tab active">Takvim</span>
              <span className="screen-tab">Liste</span>
            </div>

            <div className="marketing-screen-body">
              <div className="screen-sidebar">
                <span className="screen-dot active"></span>
                <span className="screen-dot"></span>
                <span className="screen-dot"></span>
                <span className="screen-dot"></span>
                <span className="screen-dot brand"></span>
              </div>

              <div className="screen-calendar">
                <div className="calendar-head">
                  <strong>Bu hafta</strong>
                  <span>Instagram + Telegram onay akisi</span>
                </div>

                <div className="calendar-grid">
                  <div className="calendar-card tall">
                    <div className="calendar-badge">Post</div>
                    <strong>Yeni urun paylasimi</strong>
                    <p>Bugun 18:30</p>
                  </div>
                  <div className="calendar-card">
                    <div className="calendar-badge teal">Story</div>
                    <strong>Tatli vitrin serisi</strong>
                    <p>Yarin 12:00</p>
                  </div>
                  <div className="calendar-card wide">
                    <div className="calendar-badge gold">Onay</div>
                    <strong>Telegram uzerinden onay bekliyor</strong>
                    <p>Isletme sahibine gonderildi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="marketing-strip" id="kanallar">
        <span>Instagram</span>
        <span>Telegram</span>
        <span>Yapay zeka gorsel uretimi</span>
        <span>Onay ve yayin akisi</span>
      </section>

      <section className="marketing-section" id="neler-yapar">
        <div className="section-heading">
          <div className="eyebrow">Neler Yapar?</div>
          <h2>Karmasik panel yerine net ve anlasilir bir deneyim.</h2>
        </div>

        <div className="marketing-feature-grid">
          {ozellikler.map((ozellik) => (
            <article className="marketing-feature-card" key={ozellik.baslik}>
              <h3>{ozellik.baslik}</h3>
              <p>{ozellik.aciklama}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section" id="paketler">
        <div className="section-heading">
          <div className="eyebrow">Paketler</div>
          <h2>Isletmenin ihtiyacina gore basit paket secenekleri.</h2>
        </div>

        <div className="marketing-pricing-grid">
          {paketler.map((paket) => (
            <article className="marketing-price-card" key={paket.ad}>
              <div>
                <h3>{paket.ad}</h3>
                <strong>{paket.fiyat}</strong>
                <p>{paket.detay}</p>
              </div>

              <ul className="marketing-list">
                {paket.maddeler.map((madde) => (
                  <li key={madde}>{madde}</li>
                ))}
              </ul>

              <Link className="solid-action" href="/business-profile">
                Bu Paketle Basla
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section" id="nasil-calisir">
        <div className="section-heading">
          <div className="eyebrow">Nasil Calisir?</div>
          <h2>Ilk kurulumdan ilk gorsel uretimine kadar 4 basit adim.</h2>
        </div>

        <div className="marketing-step-grid">
          {adimlar.map((adim, index) => (
            <article className="marketing-step-card" key={adim}>
              <span>{index + 1}</span>
              <p>{adim}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-cta">
        <div>
          <div className="eyebrow">Hazirsan Baslayalim</div>
          <h2>Once isletme kartini olustur, sonra ilk gorselleri birlikte uretelim.</h2>
        </div>

        <div className="marketing-actions">
          <Link className="solid-action" href="/business-profile">
            Hemen Basla
          </Link>
          <Link className="ghost-action" href="/musteri-paneli">
            Paneli Ac
          </Link>
        </div>
      </section>
    </main>
  );
}
