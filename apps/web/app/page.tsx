import Link from "next/link";

const özellikler = [
  {
    başlık: "İşletmeni tanır",
    açıklama:
      "Mekânının tarzını, ürünlerini, hedef kitleni ve iletişim dilini tek bir işletme kartında toplar.",
  },
  {
    başlık: "Görsel üretir",
    açıklama:
      "Eklediğin ürün ve mekân görsellerine göre sana uygun yeni sosyal medya görselleri üretir.",
  },
  {
    başlık: "Telegram’dan yönetilir",
    açıklama:
      "Yeni ürün ekleme, onay verme ve hızlı yönlendirme gibi işlemleri panel açmadan yapabilirsin.",
  },
  {
    başlık: "Onaylı veya otomatik çalışır",
    açıklama:
      "İstersen her paylaşım önce sana gelir, istersen otomatik yayın moduna geçersin.",
  },
];

const paketler = [
  {
    ad: "Başlangıç",
    fiyat: "7.900 TL",
    dönem: "/ ay",
    açıklama: "İlk kez düzenli içerik üretmek isteyen işletmeler için sade başlangıç paketi.",
    öneÇıkan: false,
    maddeler: [
      "Günde 1 içerik üretimi",
      "Telegram üzerinden onay",
      "Temel görsel üretimi",
      "İçerik takvimi görünümü",
    ],
  },
  {
    ad: "Büyüme",
    fiyat: "14.900 TL",
    dönem: "/ ay",
    açıklama: "Daha sık paylaşım yapan ve içerik ritmini büyütmek isteyen işletmeler için.",
    öneÇıkan: true,
    maddeler: [
      "Günde 2 içerik üretimi",
      "Reels + post kombinasyonu",
      "Öncelikli görsel üretimi",
      "Telegram hızlı komutları",
    ],
  },
  {
    ad: "Tam Otomasyon",
    fiyat: "24.900 TL",
    dönem: "/ ay",
    açıklama: "Yoğun çalışan ve süreci mümkün olduğunca otomatik yürütmek isteyen markalar için.",
    öneÇıkan: false,
    maddeler: [
      "Günde 3+ içerik üretimi",
      "Otomatik yayın seçeneği",
      "Kampanya ve yeni ürün akışı",
      "Kurulum ve operasyon desteği",
    ],
  },
];

const karşılaştırma = [
  {
    başlık: "Günlük içerik sayısı",
    başlangıç: "1",
    büyüme: "2",
    tam: "3+",
  },
  {
    başlık: "Telegram onayı",
    başlangıç: "Var",
    büyüme: "Var",
    tam: "Var",
  },
  {
    başlık: "Gerçek görsel üretimi",
    başlangıç: "Temel",
    büyüme: "Gelişmiş",
    tam: "Sınırsız akış",
  },
  {
    başlık: "Otomatik yayın",
    başlangıç: "Yok",
    büyüme: "İsteğe bağlı",
    tam: "Var",
  },
  {
    başlık: "Operasyon desteği",
    başlangıç: "Standart",
    büyüme: "Öncelikli",
    tam: "Tam destek",
  },
];

const sıkSorulanlar = [
  "Kurulum ne kadar sürer?",
  "Telegram olmadan da kullanılabilir mi?",
  "Üretilen görselleri ben onaylıyor muyum?",
  "Yeni ürün geldiğinde sistemi nasıl güncelliyorum?",
];

const örnekSektörler = [
  {
    sektör: "Restoran",
    etiket: "Yemek ve içecek",
    başlık: "Yeni menü görseli ve akşam rezervasyon postu",
    açıklama: "Mekân fotoğrafları ve ürün detaylarına göre sıcak, iştah açıcı bir seri oluşturur.",
    ton: "peach",
  },
  {
    sektör: "Güzellik Merkezi",
    etiket: "Hizmet sektörü",
    başlık: "Bakım paketi tanıtımı ve kampanya duyurusu",
    açıklama: "Premium, temiz ve güven veren bir görsel dil ile hizmeti öne çıkarır.",
    ton: "lilac",
  },
  {
    sektör: "Diş Kliniği",
    etiket: "Sağlık",
    başlık: "Bilgilendirici carousel ve güven odaklı paylaşım",
    açıklama: "Kurumsal ama soğuk olmayan bir anlatımla uzmanlık ve güven hissi üretir.",
    ton: "blue",
  },
  {
    sektör: "Butik Otel",
    etiket: "Turizm",
    başlık: "Hafta sonu konaklama paketi için ilgi çekici görseller",
    açıklama: "Mekân atmosferi, oda detayları ve deneyim hissi öne çıkarılır.",
    ton: "green",
  },
];

export default function HomePage() {
  return (
    <main className="landing-shell">
      <header className="landing-topbar">
        <Link className="landing-brand" href="/">
          <span className="landing-brand-mark">A</span>
          <span>AI Social Autopilot</span>
        </Link>

        <nav className="landing-nav">
          <a href="#özellikler">Özellikler</a>
          <a href="#paketler">Paketler</a>
          <a href="#karşılaştırma">Karşılaştırma</a>
          <a href="#sss">Sık Sorulanlar</a>
          <Link className="landing-nav-link" href="/musteri-paneli">
            Giriş yap
          </Link>
          <Link className="landing-primary-button" href="/business-profile">
            Ücretsiz olarak başlayın
          </Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="landing-kicker">YAYINLA</span>
          <h1>Senin yerine düşünen, karar veren ve sosyal medyanı yöneten otomatik sistem.</h1>
          <p>
            İşletmeni tanır, ürünlerini öğrenir, hedef kitleni anlar. Sana uygun içerikleri ve
            görselleri üretir, en doğru akışla sosyal medyanı en iyi şekilde yürütür.
          </p>

          <div className="landing-hero-actions">
            <Link className="landing-primary-button landing-large-button" href="/business-profile">
              Ücretsiz olarak başlayın
            </Link>
            <Link className="landing-secondary-button landing-large-button" href="/musteri-paneli">
              Müşteri panelini görün
            </Link>
          </div>

          <ul className="landing-hero-points">
            <li>İşletmeni öğrenir</li>
            <li>İçeriğe kendi karar verir</li>
            <li>Görselleri yapay zekâ ile üretir</li>
          </ul>
        </div>

        <div className="landing-hero-visual">
          <div className="landing-app-window">
            <div className="landing-app-toolbar">
              <span className="landing-app-chip">Tüm Kanallar</span>
              <span className="landing-app-tab active">Takvim</span>
              <span className="landing-app-tab">Liste</span>
            </div>

            <div className="landing-app-content">
              <aside className="landing-app-sidebar">
                <span className="landing-app-icon active"></span>
                <span className="landing-app-icon"></span>
                <span className="landing-app-icon"></span>
                <span className="landing-app-icon"></span>
                <span className="landing-app-icon brand"></span>
              </aside>

              <div className="landing-app-board">
                <div className="landing-app-board-head">
                  <div>
                    <strong>Bu hafta</strong>
                    <p>Instagram + Telegram onay akışı</p>
                  </div>
                  <span className="landing-board-status">Hazır</span>
                </div>

                <div className="landing-app-cards">
                  <article className="landing-app-card tall">
                    <span className="landing-card-badge">Post</span>
                    <strong>Yeni ürün paylaşımı</strong>
                    <p>Bugün 18:30</p>
                  </article>
                  <article className="landing-app-card">
                    <span className="landing-card-badge teal">Story</span>
                    <strong>Tatlı vitrini serisi</strong>
                    <p>Yarın 12:00</p>
                  </article>
                  <article className="landing-app-card wide">
                    <span className="landing-card-badge gold">Onay</span>
                    <strong>İşletme sahibine Telegram üzerinden gönderildi</strong>
                    <p>Tek dokunuşla onay veya revize isteği</p>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-logo-strip">
        <span>Instagram</span>
        <span>Telegram</span>
        <span>İçerik Takvimi</span>
        <span>Görsel Üretimi</span>
        <span>Onay ve Yayın Akışı</span>
      </section>

      <section className="landing-feature-section" id="özellikler">
        <div className="landing-section-heading">
          <span className="landing-section-kicker">ÖZELLİKLER</span>
          <h2>Karışık araçlar yerine daha anlaşılır bir deneyim.</h2>
          <p>
            Müşterinin göreceği yer sade kalır. Arka plandaki teknik detaylar sistem tarafından
            yönetilir.
          </p>
        </div>

        <div className="landing-feature-grid">
          {özellikler.map((özellik) => (
            <article className="landing-feature-card" key={özellik.başlık}>
              <h3>{özellik.başlık}</h3>
              <p>{özellik.açıklama}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-gallery-section">
        <div className="landing-section-heading">
          <span className="landing-section-kicker">ÖRNEK ÜRETİMLER</span>
          <h2>Farklı sektörler için üretilmiş örnek görsel dünyaları.</h2>
          <p>
            Sadece restoranlar için değil; güzellik, sağlık, konaklama ve daha birçok sektöre uygun
            yapay zekâ görselleri oluşturabilir.
          </p>
        </div>

        <div className="landing-gallery-grid">
          {örnekSektörler.map((örnek) => (
            <article className={`landing-gallery-card ${örnek.ton}`} key={örnek.sektör}>
              <div className="landing-gallery-visual">
                <div className="gallery-main-shot"></div>
                <div className="gallery-side-stack">
                  <div className="gallery-mini-shot"></div>
                  <div className="gallery-mini-shot alt"></div>
                </div>
              </div>

              <div className="landing-gallery-copy">
                <span>{örnek.etiket}</span>
                <h3>{örnek.sektör}</h3>
                <strong>{örnek.başlık}</strong>
                <p>{örnek.açıklama}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-band">
        <div className="landing-band-visual">
          <div className="landing-band-panel">
            <div className="landing-band-floating-card">
              <strong>Yapay zekâ asistanı</strong>
              <p>Yeni ürün için hızlıca görsel üretim isteği oluşturur.</p>
              <button type="button">Fikir üret</button>
            </div>
          </div>
        </div>

        <div className="landing-band-copy">
          <span className="landing-section-kicker">YAPAY ZEKÂ DESTEĞİ</span>
          <h2>Daha hızlı üret, daha kolay onayla.</h2>
          <p>
            İşletme kartı ve görsel kütüphanesi oluşturulduktan sonra sistem, markana uygun yeni
            görseller üretir. Gerekirse önce sana onaya gönderir.
          </p>
          <Link className="landing-primary-button" href="/musteri-paneli">
            Müşteri akışını gör
          </Link>
        </div>
      </section>

      <section className="landing-pricing-section" id="paketler">
        <div className="landing-section-heading">
          <span className="landing-section-kicker">PAKETLER</span>
          <h2>İşletmenin ihtiyacına uygun sade paketler.</h2>
          <p>Günlük içerik temposuna göre seçim yap. Sonradan yükseltmek mümkün.</p>
        </div>

        <div className="landing-pricing-grid">
          {paketler.map((paket) => (
            <article
              className={`landing-pricing-card${paket.öneÇıkan ? " recommended" : ""}`}
              key={paket.ad}
            >
              {paket.öneÇıkan ? <span className="landing-recommended">Önerilen</span> : null}
              <h3>{paket.ad}</h3>
              <div className="landing-price-row">
                <strong>{paket.fiyat}</strong>
                <span>{paket.dönem}</span>
              </div>
              <p>{paket.açıklama}</p>

              <ul className="landing-check-list">
                {paket.maddeler.map((madde) => (
                  <li key={madde}>{madde}</li>
                ))}
              </ul>

              <Link className="landing-primary-button" href="/business-profile">
                Bu paketle başla
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-comparison-section" id="karşılaştırma">
        <div className="landing-section-heading">
          <span className="landing-section-kicker">KARŞILAŞTIRMA</span>
          <h2>Hangi pakette ne var, tek bakışta görün.</h2>
        </div>

        <div className="landing-comparison-table">
          <div className="landing-comparison-head">
            <span>Özellik</span>
            <span>Başlangıç</span>
            <span>Büyüme</span>
            <span>Tam Otomasyon</span>
          </div>

          {karşılaştırma.map((satır) => (
            <div className="landing-comparison-row" key={satır.başlık}>
              <strong>{satır.başlık}</strong>
              <span>{satır.başlangıç}</span>
              <span>{satır.büyüme}</span>
              <span>{satır.tam}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-testimonial">
        <blockquote>
          “İçerik üretimi, onay ve Telegram yönetimi aynı yerde olduğu için ekip içi karmaşa ciddi
          şekilde azalıyor.”
        </blockquote>
        <p>Bu sistem, özellikle restoranlar, kafeler ve yerel işletmeler için sadeleştirilmiş bir akış sunar.</p>
      </section>

      <section className="landing-faq-section" id="sss">
        <div className="landing-faq-shell">
          <div className="landing-faq-title">Sık Sorulanlar</div>
          <div className="landing-faq-list">
            {sıkSorulanlar.map((soru) => (
              <div className="landing-faq-item" key={soru}>
                <span>{soru}</span>
                <span>+</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
