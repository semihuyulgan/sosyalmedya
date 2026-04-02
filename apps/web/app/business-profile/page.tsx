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
  }>;
};

const sektorler = [
  "Restoran",
  "Kafe",
  "Pastane",
  "Fırın",
  "Otel",
  "Güzellik Merkezi",
  "Kuaför",
  "Diş Kliniği",
  "Sağlık Kliniği",
  "Spor Salonu",
  "Butik Mağaza",
  "Emlak Ofisi",
  "Ajans",
  "Eğitim Kurumu",
];

const fiyatSegmentleri = [
  { value: "Ekonomik", label: "Ekonomik" },
  { value: "Orta", label: "Orta" },
  { value: "Orta-Üst", label: "Orta-Üst" },
  { value: "Premium", label: "Premium" },
  { value: "Lüks", label: "Lüks" },
];

const hedefler = [
  { value: "RESERVATION", label: "Rezervasyon" },
  { value: "ORDER", label: "Sipariş" },
  { value: "PROFILE_TRAFFIC", label: "Profil ziyareti" },
  { value: "AWARENESS", label: "Bilinirlik" },
];

const yayinModlari = [
  { value: "MANUAL", label: "Ben onaylayayım" },
  { value: "SMART", label: "Akıllı onay" },
  { value: "AUTO", label: "Otomatik yayın" },
];

const calismaModlari = [
  { value: "SELF_SERVE", label: "Kendim kullanacağım" },
  { value: "MANAGED", label: "İşletme yönetimini firmaya bırakıyorum" },
];

const saatler = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2)
    .toString()
    .padStart(2, "0");
  const minute = index % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

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

const parseJsonLines = (value: string | null | undefined) => {
  if (!value) return "";

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).join("\n") : "";
  } catch {
    return value;
  }
};

const firstJsonValue = (value: string | null | undefined) => {
  if (!value) return "";

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.length ? String(parsed[0]) : "";
  } catch {
    return "";
  }
};

const goalLabel = (value: string) => hedefler.find((item) => item.value === value)?.label || value;

export default async function BusinessProfilePage() {
  const business = await getWorkspaceBusiness();
  const brandProfile = business.brandProfiles[0];
  const settings = business.settings;

  return (
    <main className="customer-shell">
      <header className="customer-topbar">
        <div>
          <div className="eyebrow">İşletme Kartı</div>
          <h1>İşletmeni birkaç adımda tanıtalım.</h1>
          <p>
            Bu bilgiler sayesinde sistem işletmeni daha iyi tanır, daha doğru içerik üretir ve
            sosyal medyanı daha doğru yönetir.
          </p>
        </div>

        <div className="customer-topbar-actions">
          <Link className="ghost-action" href="/musteri-paneli">
            Müşteri Paneli
          </Link>
          <Link className="ghost-action" href="/asset-library">
            Görseller
          </Link>
          <Link className="solid-action" href="/generate-studio">
            Sonraki Adım: Üretim
          </Link>
        </div>
      </header>

      <section className="customer-summary-grid simple-summary-grid">
        <article className="customer-summary-card">
          <span>İşletme</span>
          <strong>{business.name}</strong>
          <p>İşletmenin temel kimliği ve hedefi burada tanımlanır.</p>
        </article>
        <article className="customer-summary-card">
          <span>Sektör</span>
          <strong>{business.category}</strong>
          <p>Sistemin seni hangi örneklerle kıyaslayacağını belirler.</p>
        </article>
        <article className="customer-summary-card">
          <span>Ana hedef</span>
          <strong>{goalLabel(business.primaryGoal)}</strong>
          <p>İçeriklerin hangi sonuca hizmet edeceğini buradan anlarız.</p>
        </article>
        <article className="customer-summary-card">
          <span>İletişim</span>
          <strong>{business.telegramControlEnabled ? "Telegram açık" : "Panel odaklı"}</strong>
          <p>İstersen panelden, istersen Telegram üzerinden ilerleyebilirsin.</p>
        </article>
      </section>

      <section className="workflow-strip">
        <div className="workflow-step current">
          <strong>1. İşletmeni anlat</strong>
          <p>İşletmenin ne olduğunu ve nasıl konuştuğunu seç.</p>
        </div>
        <div className="workflow-step">
          <strong>2. İletişim bilgilerini ekle</strong>
          <p>Müşterilerin sana nasıl ulaşacağını belirt.</p>
        </div>
        <div className="workflow-step">
          <strong>3. Yayın tercihlerini seç</strong>
          <p>Yayın saati ve kullanım şeklini belirle.</p>
        </div>
      </section>

      <section className="simple-library-layout">
        <form action={updateBusinessProfile} className="customer-card simple-upload-card">
          <input name="businessId" type="hidden" value={business.id} />
          <input name="seasonalNotesJson" type="hidden" value="" />

          <div className="section-heading compact-heading">
            <div>
              <div className="eyebrow">1. Temel Bilgiler</div>
              <h2>İşletmeni tanımla</h2>
              <p>Bu bölüm, sistemin senin ne tür bir işletme olduğunu anlamasını sağlar.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              <span>İşletme adı</span>
              <input defaultValue={business.name} name="name" required />
            </label>

            <label>
              <span>Sektör</span>
              <select defaultValue={business.category} name="category" required>
                {sektorler.map((sektor) => (
                  <option key={sektor} value={sektor}>
                    {sektor}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Fiyat segmenti</span>
              <select defaultValue={business.priceSegment || "Orta"} name="priceSegment">
                {fiyatSegmentleri.map((segment) => (
                  <option key={segment.value} value={segment.value}>
                    {segment.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Ana hedef</span>
              <select defaultValue={business.primaryGoal} name="primaryGoal">
                {hedefler.map((hedef) => (
                  <option key={hedef.value} value={hedef.value}>
                    {hedef.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="span-2">
              <span>İşletmeyi kısaca anlat</span>
              <textarea
                defaultValue={business.description || ""}
                name="description"
                placeholder="Örnek: Modern şehir restoranı. Akşam yemeği ve hafta sonu brunch için tercih ediliyor."
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

          <div className="section-heading compact-heading business-section-gap">
            <div>
              <div className="eyebrow">2. Müşteri ve Üslup</div>
              <h2>Nasıl konuşalım?</h2>
              <p>Burada yapay zekâya nasıl bir dil kullanması gerektiğini anlatırsın.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="span-2">
              <span>Ton özeti</span>
              <textarea
                defaultValue={settings?.toneSummary || ""}
                name="toneSummary"
                rows={3}
                placeholder="Örnek: Samimi, şehirli, premium ama ulaşılabilir."
              />
            </label>

            <label className="span-2">
              <span>Kime hitap ediyoruz?</span>
              <textarea
                defaultValue={parseJsonLines(settings?.targetAudienceJson)}
                name="targetAudienceJson"
                rows={4}
                placeholder={"Her satıra bir örnek yaz.\nÖrnek:\n25-40 yaş çalışan profesyoneller\nHafta sonu çiftleri\nAileler"}
              />
            </label>

            <label className="span-2">
              <span>Kullanmak istediğin çağrılar</span>
              <textarea
                defaultValue={parseJsonLines(settings?.ctaPreferencesJson)}
                name="ctaPreferencesJson"
                rows={4}
                placeholder={"Her satıra bir örnek yaz.\nÖrnek:\nHemen rezervasyon oluştur\nDM ile bilgi al\nArkadaşınla paylaş"}
              />
            </label>

            <label className="span-2">
              <span>Kullanmak istemediğin ifadeler</span>
              <textarea
                defaultValue={parseJsonLines(settings?.forbiddenPhrasesJson)}
                name="forbiddenPhrasesJson"
                rows={4}
                placeholder={"Her satıra bir örnek yaz.\nÖrnek:\nSon şans\nİnanılmaz fırsat\nKaçırma"}
              />
            </label>
          </div>

          <div className="section-heading compact-heading business-section-gap">
            <div>
              <div className="eyebrow">3. Marka Notları</div>
              <h2>Yapay zekâ bu markayı nasıl hatırlasın?</h2>
              <p>Burada markanın özünü ve içeriklerde korunmasını istediğin hissi anlatırsın.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="span-2">
              <span>Marka özeti</span>
              <textarea
                defaultValue={brandProfile?.summary || ""}
                name="brandSummary"
                rows={4}
                placeholder="Örnek: Günün her saatinde rahat hissettiren, kaliteli ama ulaşılabilir bir mekân. İnsanlar lezzet, servis ve atmosfer için geliyor."
              />
            </label>

            <label className="span-2">
              <span>Yazı dili notları</span>
              <textarea
                defaultValue={brandProfile?.voiceGuidelines || ""}
                name="voiceGuidelines"
                rows={4}
                placeholder="Örnek: Kısa cümleler kullan. Samimi ama özensiz olma. Çağrı cümleleri net olsun."
              />
            </label>

            <label className="span-2">
              <span>Görsel dil notları</span>
              <textarea
                defaultValue={brandProfile?.visualGuidelines || ""}
                name="visualGuidelines"
                rows={4}
                placeholder="Örnek: Sıcak ışık, temiz kadraj, yakın plan ürün çekimi ve doğal masa düzeni öne çıksın."
              />
            </label>
          </div>

          <div className="section-heading compact-heading business-section-gap">
            <div>
              <div className="eyebrow">4. İletişim ve Yayın</div>
              <h2>İletişim bilgileri ve kullanım şekli</h2>
              <p>Burada müşterilerin sana nasıl ulaşacağını ve sistemin nasıl çalışacağını seçersin.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              <span>Tercih edilen dil</span>
              <select defaultValue="tr" name="preferredLanguage">
                <option value="tr">Türkçe</option>
                <option value="en" disabled>
                  İngilizce (yakında)
                </option>
              </select>
            </label>

            <label>
              <span>Yayın modu</span>
              <select defaultValue={business.publishMode} name="publishMode">
                {yayinModlari.map((mod) => (
                  <option key={mod.value} value={mod.value}>
                    {mod.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Çalışma modu</span>
              <select defaultValue={business.operatingMode === "MANAGED" ? "MANAGED" : "SELF_SERVE"} name="operatingMode">
                {calismaModlari.map((mod) => (
                  <option key={mod.value} value={mod.value}>
                    {mod.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Telefon numarası</span>
              <input defaultValue={business.phone || ""} name="phone" placeholder="+90 5.." />
            </label>

            <label>
              <span>Web sitesi</span>
              <input defaultValue={business.websiteUrl || ""} name="websiteUrl" placeholder="Varsa ekle" />
            </label>

            <label>
              <span>Rezervasyon linki</span>
              <input defaultValue={business.reservationUrl || ""} name="reservationUrl" placeholder="Varsa ekle" />
            </label>

            <label>
              <span>WhatsApp numarası</span>
              <input
                defaultValue={
                  business.whatsappUrl?.replace("https://wa.me/", "").replace(/\D/g, "") ||
                  business.phone ||
                  ""
                }
                name="whatsappUrl"
                placeholder="90555..."
              />
            </label>

            <label>
              <span>Yayın saati</span>
              <select defaultValue={firstJsonValue(settings?.peakHoursJson) || "19:00"} name="peakHoursJson">
                {saatler.map((saat) => (
                  <option key={saat} value={saat}>
                    {saat}
                  </option>
                ))}
              </select>
            </label>

            <label className="asset-checkbox">
              <input
                defaultChecked={business.telegramControlEnabled}
                name="telegramControlEnabled"
                type="checkbox"
              />
              <span>Telegram üzerinden yönetebileyim</span>
            </label>

            <label className="asset-checkbox">
              <input
                defaultChecked={business.dashboardAccessEnabled}
                name="dashboardAccessEnabled"
                type="checkbox"
              />
              <span>Paneli de kullanabileyim</span>
            </label>
          </div>

          <div className="business-form-footer">
            <button className="solid-action" type="submit">
              Kaydet ve devam et
            </button>
          </div>
        </form>

        <aside className="customer-card simple-help-card">
          <span className="customer-card-tag">Bu bilgiler ne işe yarar?</span>
          <h2>Sistem bu karttan ne öğrenir?</h2>
          <p>Bu kart sayesinde yapay zekâ işletmenin tarzını, hedefini ve müşterisini tanır.</p>
          <ul className="simple-help-list">
            <li>Hangi sektörde olduğunu anlar</li>
            <li>Nasıl bir dil kullanması gerektiğini öğrenir</li>
            <li>Hangi hedefe odaklanacağını bilir</li>
            <li>Yayınlarda hangi iletişim bilgisini kullanacağını görür</li>
          </ul>

          <div className="section-heading compact-heading business-side-note">
            <div>
              <div className="eyebrow">Sonraki Adım</div>
              <h2>Buradan sonra ne yapacaksın?</h2>
              <p>Bu kartı kaydettikten sonra önce görsellerini yükle, sonra ilk üretimi başlat.</p>
            </div>
          </div>

          <div className="customer-hero-actions">
            <Link className="ghost-action" href="/asset-library">
              Görselleri Yükle
            </Link>
            <Link className="solid-action" href="/generate-studio">
              Üretime Geç
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
