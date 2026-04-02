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
          <div className="eyebrow">Business Card</div>
          <h1>Isletme kartini olustur</h1>
          <p className="muted">
            Burasi artik ayar sayfasi degil. Once isletmeyi net tarif ediyoruz, sonra gorselleri ve
            urunleri ekleyip gercek uretim testlerine geciyoruz.
          </p>
        </div>

        <div className="topbar-actions">
          <Link className="link-chip" href="/">
            Dashboard
          </Link>
          <Link className="link-chip" href="/asset-library">
            Asset Library
          </Link>
          <Link className="link-chip" href="/generate-studio">
            Generate Studio
          </Link>
        </div>
      </header>

      <section className="visual-hero">
        <div className="profile-card visual-hero-card">
          <div className="eyebrow">Onboarding Status</div>
          <h2>{business.name}</h2>
          <p className="muted">
            Ilk hedefimiz bu isletmenin kim oldugunu, kime hitap ettigini ve nasil gorunmesi
            gerektigini netlestirmek. Ondan sonra gorsel yukleyip AI uretime gececegiz.
          </p>
          <div className="visual-stat-row">
            <div className="visual-stat">
              <strong>{setupScore}/6</strong>
              <span>Ana alanlar dolu</span>
            </div>
            <div className="visual-stat">
              <strong>{business.contentPillars.length}</strong>
              <span>Icerik ayagi</span>
            </div>
            <div className="visual-stat">
              <strong>{countJsonItems(settings?.targetAudienceJson)}</strong>
              <span>Hedef kitle notu</span>
            </div>
            <div className="visual-stat">
              <strong>{countJsonItems(settings?.peakHoursJson)}</strong>
              <span>Onemli saat</span>
            </div>
          </div>
        </div>
      </section>

      <section className="profile-grid">
        <form action={updateBusinessProfile} className="profile-card profile-form">
          <input name="businessId" type="hidden" value={business.id} />

          <div className="card-head">
            <div>
              <div className="eyebrow">1. Kim Bu Isletme?</div>
              <h2>Temel kart bilgileri</h2>
            </div>
            <button className="primary-submit" type="submit">
              Kaydet
            </button>
          </div>

          <div className="form-grid">
            <label>
              <span>Isletme adi</span>
              <input defaultValue={business.name} name="name" required />
            </label>
            <label>
              <span>Sektor</span>
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
                <option value="ORDER">Siparis</option>
                <option value="PROFILE_TRAFFIC">Profile trafik</option>
                <option value="AWARENESS">Bilinirlik</option>
              </select>
            </label>
            <label className="span-2">
              <span>Isletmeyi kisaca anlat</span>
              <textarea
                defaultValue={business.description || ""}
                name="description"
                placeholder="Bu mekan nasil bir yer, ne satıyor, neden tercih ediliyor?"
                rows={4}
              />
            </label>
            <label className="span-2">
              <span>Adres</span>
              <input defaultValue={business.address || ""} name="address" />
            </label>
            <label>
              <span>Sehir</span>
              <input defaultValue={business.city} name="city" required />
            </label>
            <label>
              <span>Ulke</span>
              <input defaultValue={business.country} name="country" required />
            </label>
          </div>

          <div className="card-head compact">
            <div>
              <div className="eyebrow">2. Musteri Ve Ton</div>
              <h2>Kime konusuyoruz?</h2>
            </div>
          </div>

          <div className="form-grid">
            <label className="span-2">
              <span>Ton ozeti</span>
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
                placeholder='["25-35 beyaz yaka", "hafta sonu brunch ciftleri"]'
              />
            </label>
            <label className="span-2">
              <span>Kullanmak istedigin CTA&apos;lar</span>
              <textarea
                defaultValue={prettyJson(settings?.ctaPreferencesJson)}
                name="ctaPreferencesJson"
                rows={5}
                placeholder='["Hemen rezervasyon olustur", "DM ile bilgi al"]'
              />
            </label>
            <label className="span-2">
              <span>Kullanmak istemedigin kaliplar</span>
              <textarea
                defaultValue={prettyJson(settings?.forbiddenPhrasesJson)}
                name="forbiddenPhrasesJson"
                rows={5}
                placeholder='["son sans", "inanilmaz firsat"]'
              />
            </label>
          </div>

          <div className="card-head compact">
            <div>
              <div className="eyebrow">3. Marka Hafizasi</div>
              <h2>AI bu markayi nasil hatirlasin?</h2>
            </div>
          </div>

          <div className="form-grid">
            <label className="span-2">
              <span>Marka ozeti</span>
              <textarea
                defaultValue={brandProfile?.summary || ""}
                name="brandSummary"
                rows={4}
                placeholder="Mekanin enerjisi, servis hissi, urun dunyasi, insanlarin neden geldigi..."
              />
            </label>
            <label className="span-2">
              <span>Yazi dili notlari</span>
              <textarea
                defaultValue={brandProfile?.voiceGuidelines || ""}
                name="voiceGuidelines"
                rows={4}
                placeholder="Kisa cumleler, daha sicak, daha premium, daha net CTA..."
              />
            </label>
            <label className="span-2">
              <span>Gorsel dil notlari</span>
              <textarea
                defaultValue={brandProfile?.visualGuidelines || ""}
                name="visualGuidelines"
                rows={4}
                placeholder="Sicak isik, yakin plan urun, koyu ahsap masa, duvar tonu korunmali..."
              />
            </label>
          </div>

          <div className="card-head compact">
            <div>
              <div className="eyebrow">4. Operasyon Bilgisi</div>
              <h2>Ne zaman ve nasil yayin yapilsin?</h2>
            </div>
          </div>

          <div className="form-grid">
            <label>
              <span>Tercih edilen dil</span>
              <input defaultValue={settings?.preferredLanguage || "tr"} name="preferredLanguage" />
            </label>
            <label>
              <span>Yayin modu</span>
              <select defaultValue={business.publishMode} name="publishMode">
                <option value="MANUAL">Manuel onay</option>
                <option value="SMART">Akilli onay</option>
                <option value="AUTO">Otomatik yayin</option>
              </select>
            </label>
            <label>
              <span>Calisma modu</span>
              <select defaultValue={business.operatingMode} name="operatingMode">
                <option value="SELF_SERVE">Self-Serve</option>
                <option value="MANAGED">Managed</option>
                <option value="HYBRID">Hybrid</option>
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
              <span>Onemli saatler</span>
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
                placeholder='["yazın teras one ciksin", "hafta sonu brunch vurgusu"]'
              />
            </label>
            <label className="asset-checkbox">
              <input
                defaultChecked={business.dashboardAccessEnabled}
                name="dashboardAccessEnabled"
                type="checkbox"
              />
              <span>Dashboard kullanabilsin</span>
            </label>
            <label className="asset-checkbox">
              <input
                defaultChecked={business.telegramControlEnabled}
                name="telegramControlEnabled"
                type="checkbox"
              />
              <span>Telegram uzerinden yonetebilsin</span>
            </label>
          </div>
        </form>

        <aside className="profile-sidebar">
          <section className="profile-card info-card">
            <div className="eyebrow">Isletme Karti</div>
            <h2>{business.name}</h2>
            <p>{business.description || "Isletme aciklamasi henuz girilmedi."}</p>
            <div className="detail-stack">
              <div>
                <strong>Sektor</strong>
                <p className="muted">{business.category}</p>
              </div>
              <div>
                <strong>Ana hedef</strong>
                <p className="muted">{business.primaryGoal}</p>
              </div>
              <div>
                <strong>Ton</strong>
                <p className="muted">{settings?.toneSummary || "Ton ozeti henuz yok."}</p>
              </div>
            </div>
          </section>

          <section className="profile-card info-card">
            <div className="eyebrow">Icerik Ayaklari</div>
            <h2>Su an neyi one cikariyoruz?</h2>
            <div className="pillar-list">
              {business.contentPillars.map((pillar) => (
                <div className="pillar-item" key={pillar.id}>
                  <span className="pillar-order">0{pillar.priority}</span>
                  <div>
                    <strong>{pillar.name}</strong>
                    <p className="muted">{pillar.description || "Aciklama yok."}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="profile-card info-card">
            <div className="eyebrow">Sonraki Adim</div>
            <h2>Simdi ne yapacagiz?</h2>
            <ul className="info-list">
              <li>1. Bu karti doldur ve kaydet.</li>
              <li>2. [Asset Library](/Users/semihmacbook/Documents/New%20project/apps/web/app/asset-library/page.tsx) ekranindan mekan ve urun gorsellerini ekle.</li>
              <li>3. [Generate Studio](/Users/semihmacbook/Documents/New%20project/apps/web/app/generate-studio/page.tsx) ekranindan ilk gercek uretimi baslat.</li>
              <li>4. Sonra gerekirse Telegram ile yeni urun ve mekan guncellemesi yap.</li>
            </ul>
            <div className="topbar-actions" style={{ marginTop: 16 }}>
              <Link className="ghost-action" href="/asset-library">
                Gorsel Yukle
              </Link>
              <Link className="ghost-action" href="/generate-studio">
                Uretime Gec
              </Link>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
