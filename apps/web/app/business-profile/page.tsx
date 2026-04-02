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

const countJsonItems = (value: string | null | undefined) => {
  if (!value) return 0;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
};

export default async function BusinessProfilePage() {
  const business = await getWorkspaceBusiness();
  const brandProfile = business.brandProfiles[0];
  const settings = business.settings;

  const setupScore = [
    business.name,
    business.category,
    business.description,
    settings?.toneSummary,
    brandProfile?.summary,
    settings?.targetAudienceJson,
  ].filter(Boolean).length;

  return (
    <main className="profile-shell">
      <header className="profile-topbar">
        <div>
          <div className="eyebrow">İşletme Kartı</div>
          <h1>İşletme kartını oluştur</h1>
          <p className="muted">
            Burası artık teknik bir ayar sayfası değil. Önce işletmeni net tarif ediyoruz, sonra
            görselleri ve ürünleri ekleyip gerçek üretim testlerine geçiyoruz.
          </p>
        </div>

        <div className="topbar-actions">
          <Link className="link-chip" href="/">
            Ana Sayfa
          </Link>
          <Link className="link-chip" href="/asset-library">
            Görsel Kütüphanesi
          </Link>
          <Link className="link-chip" href="/generate-studio">
            Üretim Stüdyosu
          </Link>
        </div>
      </header>

      <section className="visual-hero">
        <div className="profile-card visual-hero-card">
          <div className="eyebrow">Kurulum Durumu</div>
          <h2>{business.name}</h2>
          <p className="muted">
            İlk hedefimiz bu işletmenin kim olduğunu, kime hitap ettiğini ve nasıl görünmesi
            gerektiğini netleştirmek. Ondan sonra görsel yükleyip yapay zekâ üretimine geçeceğiz.
          </p>
          <div className="visual-stat-row">
            <div className="visual-stat">
              <strong>{setupScore}/6</strong>
              <span>Ana bilgiler tamam</span>
            </div>
            <div className="visual-stat">
              <strong>{business.contentPillars.length}</strong>
              <span>İçerik ayağı</span>
            </div>
            <div className="visual-stat">
              <strong>{countJsonItems(settings?.targetAudienceJson)}</strong>
              <span>Hedef kitle notu</span>
            </div>
            <div className="visual-stat">
              <strong>{countJsonItems(settings?.peakHoursJson)}</strong>
              <span>Önemli saat</span>
            </div>
          </div>
        </div>
      </section>

      <section className="profile-grid">
        <form action={updateBusinessProfile} className="profile-card profile-form">
          <input name="businessId" type="hidden" value={business.id} />

          <div className="card-head">
            <div>
              <div className="eyebrow">1. Kim Bu İşletme?</div>
              <h2>Temel işletme bilgileri</h2>
            </div>
            <button className="primary-submit" type="submit">
              Kaydet
            </button>
          </div>

          <div className="form-grid">
            <label>
              <span>İşletme adı</span>
              <input defaultValue={business.name} name="name" required />
            </label>
            <label>
              <span>Sektör</span>
              <input defaultValue={business.category} name="category" required />
            </label>
            <label>
              <span>Fiyat segmenti</span>
              <input defaultValue={business.priceSegment || ""} name="priceSegment" placeholder="Orta, premium, butik..." />
            </label>
            <label>
              <span>Ana hedef</span>
              <select defaultValue={business.primaryGoal} name="primaryGoal">
                <option value="RESERVATION">Rezervasyon</option>
                <option value="ORDER">Sipariş</option>
                <option value="PROFILE_TRAFFIC">Profil trafiği</option>
                <option value="AWARENESS">Bilinirlik</option>
              </select>
            </label>
            <label className="span-2">
              <span>İşletmeyi kısaca anlat</span>
              <textarea
                defaultValue={business.description || ""}
                name="description"
                placeholder="Bu işletme nasıl bir yer, ne satıyor, neden tercih ediliyor?"
                rows={4}
              />
            </label>
            <label className="span-2">
              <span>Adres</span>
              <input defaultValue={business.address || ""} name="address" />
            </label>
            <label>
              <span>Şehir</span>
              <input defaultValue={business.city} name="city" required />
            </label>
            <label>
              <span>Ülke</span>
              <input defaultValue={business.country} name="country" required />
            </label>
          </div>

          <div className="card-head compact">
            <div>
              <div className="eyebrow">2. Müşteri ve Ton</div>
              <h2>Kime konuşuyoruz?</h2>
            </div>
          </div>

          <div className="form-grid">
            <label className="span-2">
              <span>Ton özeti</span>
              <textarea
                defaultValue={settings?.toneSummary || ""}
                name="toneSummary"
                rows={3}
                placeholder="Samimi, premium, enerjik, rahat, mahalle hissi..."
              />
            </label>
            <label className="span-2">
              <span>Hedef kitle</span>
              <textarea
                defaultValue={prettyJson(settings?.targetAudienceJson)}
                name="targetAudienceJson"
                rows={6}
                placeholder='["25-35 beyaz yaka", "hafta sonu brunch çiftleri"]'
              />
            </label>
            <label className="span-2">
              <span>Kullanmak istediğin çağrılar</span>
              <textarea
                defaultValue={prettyJson(settings?.ctaPreferencesJson)}
                name="ctaPreferencesJson"
                rows={5}
                placeholder='["Hemen rezervasyon oluştur", "DM ile bilgi al"]'
              />
            </label>
            <label className="span-2">
              <span>Kullanmak istemediğin ifadeler</span>
              <textarea
                defaultValue={prettyJson(settings?.forbiddenPhrasesJson)}
                name="forbiddenPhrasesJson"
                rows={5}
                placeholder='["son şans", "inanılmaz fırsat"]'
              />
            </label>
          </div>

          <div className="card-head compact">
            <div>
              <div className="eyebrow">3. Marka Hafızası</div>
              <h2>Yapay zekâ bu markayı nasıl hatırlasın?</h2>
            </div>
          </div>

          <div className="form-grid">
            <label className="span-2">
              <span>Marka özeti</span>
              <textarea
                defaultValue={brandProfile?.summary || ""}
                name="brandSummary"
                rows={4}
                placeholder="Mekanın enerjisi, servis hissi, ürün dünyası, insanların neden geldiği..."
              />
            </label>
            <label className="span-2">
              <span>Yazı dili notları</span>
              <textarea
                defaultValue={brandProfile?.voiceGuidelines || ""}
                name="voiceGuidelines"
                rows={4}
                placeholder="Kısa cümleler, daha sıcak, daha premium, daha net çağrı..."
              />
            </label>
            <label className="span-2">
              <span>Görsel dil notları</span>
              <textarea
                defaultValue={brandProfile?.visualGuidelines || ""}
                name="visualGuidelines"
                rows={4}
                placeholder="Sıcak ışık, yakın plan ürün, koyu ahşap masa, duvar tonu korunmalı..."
              />
            </label>
          </div>

          <div className="card-head compact">
            <div>
              <div className="eyebrow">4. Operasyon Bilgisi</div>
              <h2>Ne zaman ve nasıl yayın yapılsın?</h2>
            </div>
          </div>

          <div className="form-grid">
            <label>
              <span>Tercih edilen dil</span>
              <input defaultValue={settings?.preferredLanguage || "tr"} name="preferredLanguage" />
            </label>
            <label>
              <span>Yayın modu</span>
              <select defaultValue={business.publishMode} name="publishMode">
                <option value="MANUAL">Manuel onay</option>
                <option value="SMART">Akıllı onay</option>
                <option value="AUTO">Otomatik yayın</option>
              </select>
            </label>
            <label>
              <span>Çalışma modu</span>
              <select defaultValue={business.operatingMode} name="operatingMode">
                <option value="SELF_SERVE">Kendi kullanan işletme</option>
                <option value="MANAGED">Bizim yönettiğimiz işletme</option>
                <option value="HYBRID">Hibrit kullanım</option>
              </select>
            </label>
            <label>
              <span>Telefon</span>
              <input defaultValue={business.phone || ""} name="phone" />
            </label>
            <label>
              <span>Website</span>
              <input defaultValue={business.websiteUrl || ""} name="websiteUrl" />
            </label>
            <label>
              <span>Rezervasyon linki</span>
              <input defaultValue={business.reservationUrl || ""} name="reservationUrl" />
            </label>
            <label>
              <span>WhatsApp linki</span>
              <input defaultValue={business.whatsappUrl || ""} name="whatsappUrl" />
            </label>
            <label>
              <span>Önemli saatler</span>
              <textarea
                defaultValue={prettyJson(settings?.peakHoursJson)}
                name="peakHoursJson"
                rows={5}
                placeholder='["12:30", "19:30", "21:00"]'
              />
            </label>
            <label>
              <span>Sezonsal notlar</span>
              <textarea
                defaultValue={prettyJson(settings?.seasonalNotesJson)}
                name="seasonalNotesJson"
                rows={5}
                placeholder='["yazın teras öne çıksın", "hafta sonu brunch vurgusu"]'
              />
            </label>
            <label className="asset-checkbox">
              <input
                defaultChecked={business.dashboardAccessEnabled}
                name="dashboardAccessEnabled"
                type="checkbox"
              />
              <span>Paneli kullanabilsin</span>
            </label>
            <label className="asset-checkbox">
              <input
                defaultChecked={business.telegramControlEnabled}
                name="telegramControlEnabled"
                type="checkbox"
              />
              <span>Telegram üzerinden yönetebilsin</span>
            </label>
          </div>
        </form>

        <aside className="profile-sidebar">
          <section className="profile-card info-card">
            <div className="eyebrow">İşletme Özeti</div>
            <h2>{business.name}</h2>
            <p>{business.description || "İşletme açıklaması henüz girilmedi."}</p>
            <div className="detail-stack">
              <div>
                <strong>Sektör</strong>
                <p className="muted">{business.category}</p>
              </div>
              <div>
                <strong>Ana hedef</strong>
                <p className="muted">{business.primaryGoal}</p>
              </div>
              <div>
                <strong>Ton</strong>
                <p className="muted">{settings?.toneSummary || "Ton özeti henüz yok."}</p>
              </div>
            </div>
          </section>

          <section className="profile-card info-card">
            <div className="eyebrow">İçerik Başlıkları</div>
            <h2>Şu an neyi öne çıkarıyoruz?</h2>
            <div className="pillar-list">
              {business.contentPillars.map((pillar) => (
                <div className="pillar-item" key={pillar.id}>
                  <span className="pillar-order">0{pillar.priority}</span>
                  <div>
                    <strong>{pillar.name}</strong>
                    <p className="muted">{pillar.description || "Açıklama yok."}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="profile-card info-card">
            <div className="eyebrow">Sonraki Adım</div>
            <h2>Şimdi ne yapacağız?</h2>
            <ul className="info-list">
              <li>1. Bu kartı doldur ve kaydet.</li>
              <li>2. [Görsel Kütüphanesi](/Users/semihmacbook/Documents/New%20project/apps/web/app/asset-library/page.tsx) ekranından mekan ve ürün görsellerini ekle.</li>
              <li>3. [Üretim Stüdyosu](/Users/semihmacbook/Documents/New%20project/apps/web/app/generate-studio/page.tsx) ekranından ilk gerçek üretimi başlat.</li>
              <li>4. Sonra gerekirse Telegram ile yeni ürün ve mekân güncellemesi yap.</li>
            </ul>
            <div className="topbar-actions" style={{ marginTop: 16 }}>
              <Link className="ghost-action" href="/asset-library">
                Görsel Yükle
              </Link>
              <Link className="ghost-action" href="/generate-studio">
                Üretime Geç
              </Link>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
