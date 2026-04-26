import type { Property, Review } from "./types";

export const properties: Property[] = [
  {
    slug: "kule-deluxe",
    name: "Kule Deluxe",
    tagline: "Göl ve doğa manzaralı, geniş aileler için premium konaklama.",
    summary:
      "3 yatak odalı, özel havuzlu, çift jakuzili ve mahremiyet odaklı geniş Kule Sapanca deneyimi.",
    locationLabel: "Sapanca, Sakarya",
    layout: "3+1",
    maxGuests: 8,
    breakfastMode: "opsiyonel",
    heroImage: "/placeholders/deluxe-1.svg",
    gallery: [
      "/placeholders/deluxe-1.svg",
      "/placeholders/deluxe-2.svg",
      "/placeholders/deluxe-3.svg",
      "/placeholders/common-1.svg"
    ],
    amenities: [
      "Max 8 kişi",
      "Özel havuz 3x6 m / 145 cm",
      "2 adet jakuzi",
      "Doğalgaz şöminesi",
      "Kış bahçesi odun şöminesi",
      "Özel otopark",
      "3 yatak odası",
      "1 oturma odası",
      "Park bebek yatağı",
      "Sabah kahvaltısı",
      "Akıllı TV / Netflix",
      "İnternet",
      "Barbekü",
      "Airfryer",
      "Türk kahvesi, nescafe ve bitki çayları",
      "300 m² bahçeli kullanım alanı",
      "Göl ve doğa manzarası",
      "Korunaklı ve mahremiyet odaklı tesis",
      "Sapanca merkeze 10 dakika"
    ],
    reviewScore: 4.9,
    reviewCount: 128,
    idealFor: [
      "Kalabalık aileler",
      "Arkadaş grupları",
      "Göl ve doğa manzarası isteyen misafirler",
      "Mahremiyet arayan misafirler"
    ],
    rules: [
      "Check-in 14:00 sonrası, check-out 11:00 öncesidir.",
      "Müsaitlik ve fiyatlar canlı takvim verilerine göre kontrol edilir.",
      "Kapora onayı sonrası tarih bloklanır.",
      "Organizasyon ve özel etkinlikler için ön onay gerekir.",
      "0-3 yaş için park yatak talebi ayrıca iletilmelidir."
    ],
    story:
      "Kule Deluxe, geniş aileler ve arkadaş grupları için tasarlanmış özel bir konaklama deneyimi sunar. Göl ve doğa manzaralı yatak odaları, çift jakuzi, özel havuz, şömine alanları ve 300 m² bahçeli kullanım alanıyla Sapanca’da konforlu, mahremiyet odaklı ve güçlü bir tatil atmosferi oluşturur.",
    sortOrder: 1,
    rates: { weekday: 14000, weekend: 16000 },
    breakfastPricing: { adultPerNight: 450, childPerNight: 300 },
    bookedRanges: [
      { start: "2026-05-01", end: "2026-05-04" },
      { start: "2026-05-15", end: "2026-05-18" },
      { start: "2026-06-04", end: "2026-06-07", type: "pending" },
      { start: "2026-07-16", end: "2026-07-20" },
      { start: "2026-08-29", end: "2026-09-02" }
    ]
  },
  {
    slug: "kule-suit",
    name: "Kule Suit",
    tagline: "Çiftler ve küçük aileler için şık, korunaklı ve huzurlu kaçış.",
    summary:
      "Özel havuzlu, dış mekan jakuzili, dubleks yapısıyla küçük aileler ve çiftler için premium Suit deneyimi.",
    locationLabel: "Sapanca, Sakarya",
    layout: "1+1 Dubleks",
    maxGuests: 4,
    breakfastMode: "opsiyonel",
    heroImage: "/uploads/kule-suit-dron.jpg",
    gallery: [
      "/uploads/kule-suit-dron.jpg",
      "/placeholders/suit-2.svg",
      "/placeholders/suit-3.svg",
      "/placeholders/common-2.svg"
    ],
    amenities: [
      "Max 4 kişi",
      "Özel havuz 3x6 m / 145 cm",
      "4 kişilik dış mekan jakuzi",
      "Doğalgaz şöminesi",
      "Özel otopark",
      "1 yatak odası",
      "1 oturma odası",
      "Park bebek yatağı",
      "Sabah kahvaltısı",
      "Mikrodalga fırın",
      "Airfryer",
      "Akıllı TV / Netflix",
      "İnternet",
      "Ateş çukuru",
      "Barbekü",
      "Türk kahvesi, nescafe ve bitki çayları",
      "200 m² bahçeli kullanım alanı",
      "70 m² kapalı alan",
      "Göl ve doğa manzarası",
      "Korunaklı ve mahremiyet odaklı tesis",
      "Sapanca merkeze 10 dakika"
    ],
    reviewScore: 4.8,
    reviewCount: 94,
    idealFor: [
      "Çiftler",
      "Küçük aileler",
      "Hafta sonu kaçamakları",
      "Korunaklı özel alan isteyen misafirler"
    ],
    rules: [
      "Check-in 14:00 sonrası, check-out 11:00 öncesidir.",
      "Müsaitlik ve fiyatlar canlı takvim verilerine göre kontrol edilir.",
      "Yoğun dönemlerde minimum konaklama şartı uygulanabilir.",
      "Kapora onayı sonrası tarih bloklanır."
    ],
    story:
      "Kule Suit, kompakt ama güçlü bir konfor isteyen misafirler için hazırlanmış özel bir dubleks evdir. Özel havuzu, dış mekan jakuzisi, şöminesi, bahçesi ve göl-doğa manzarasıyla çiftler ve küçük aileler için sakin, korunaklı ve şık bir Sapanca deneyimi sunar.",
    sortOrder: 2,
    rates: { weekday: 8000, weekend: 9000 },
    breakfastPricing: { adultPerNight: 400, childPerNight: 250 },
    bookedRanges: [
      { start: "2026-05-08", end: "2026-05-10" },
      { start: "2026-05-22", end: "2026-05-24" },
      { start: "2026-06-19", end: "2026-06-22" },
      { start: "2026-07-03", end: "2026-07-06", type: "pending" },
      { start: "2026-08-12", end: "2026-08-15" }
    ]
  },
  {
    slug: "kule-yesil-ev",
    name: "Kule-1 Yeşil Ev",
    tagline: "Doğaya yakın, sade, huzurlu ve size özel minimalist ev.",
    summary:
      "Jakuzi, özel havuz, bahçeli kullanım alanı ve doğa manzarasıyla küçük aileler ve çiftler için sakin konaklama.",
    locationLabel: "Sapanca, Sakarya",
    layout: "1+1",
    maxGuests: 4,
    breakfastMode: "opsiyonel",
    heroImage: "/placeholders/yesil-1.svg",
    gallery: [
      "/placeholders/yesil-1.svg",
      "/placeholders/yesil-2.svg",
      "/placeholders/yesil-3.svg",
      "/placeholders/common-3.svg"
    ],
    amenities: [
      "Max 4 kişi",
      "Özel havuz 3 m daire",
      "Jakuzi",
      "Doğalgaz şöminesi",
      "Özel otopark",
      "1 yatak odası",
      "1 oturma odası",
      "Park bebek yatağı",
      "Sabah kahvaltısı",
      "Fırın",
      "Ütü",
      "Akıllı TV / Netflix",
      "İnternet",
      "Barbekü",
      "Türk kahvesi, nescafe, bitki çayları ve normal çay",
      "120 m² bahçeli kullanım alanı",
      "60 m² kapalı alan",
      "Doğa manzarası",
      "Size özel minimalist Yeşil Ev",
      "Sapanca merkeze 10 dakika"
    ],
    reviewScore: 4.9,
    reviewCount: 111,
    idealFor: [
      "Doğa kaçamağı",
      "Sessizlik arayan misafirler",
      "Küçük aileler",
      "Çiftler"
    ],
    rules: [
      "Check-in 14:00 sonrası, check-out 11:00 öncesidir.",
      "Müsaitlik ve fiyatlar canlı takvim verilerine göre kontrol edilir.",
      "Yoğun dönemlerde minimum konaklama şartı uygulanabilir.",
      "Kapora onayı sonrası tarih bloklanır."
    ],
    story:
      "Kule-1 Yeşil Ev, doğaya yakın, sade ve huzurlu bir konaklama isteyen misafirler için tasarlanmıştır. Özel havuzu, jakuzisi, şöminesi, bahçeli kullanım alanı ve doğa manzarasıyla Sapanca’da sakin, minimalist ve size özel bir kaçış alanı sunar.",
    sortOrder: 3,
    rates: { weekday: 6000, weekend: 7000 },
    breakfastPricing: { adultPerNight: 350, childPerNight: 220 },
    bookedRanges: [
      { start: "2026-05-02", end: "2026-05-05" },
      { start: "2026-05-29", end: "2026-06-01" },
      { start: "2026-06-12", end: "2026-06-14", type: "pending" },
      { start: "2026-07-24", end: "2026-07-27" },
      { start: "2026-08-20", end: "2026-08-23" }
    ]
  }
];

export const reviewsByProperty: Record<string, Review[]> = {
  "kule-deluxe": [
    {
      author: "Google Yorumu",
      rating: 5,
      dateLabel: "Gerçek yorum eklenecek",
      text: "Bu alan gerçek Google yorumlarıyla güncellenmelidir.",
      highlight: "Google"
    }
  ],
  "kule-suit": [
    {
      author: "Google Yorumu",
      rating: 5,
      dateLabel: "Gerçek yorum eklenecek",
      text: "Bu alan gerçek Google yorumlarıyla güncellenmelidir.",
      highlight: "Google"
    }
  ],
  "kule-yesil-ev": [
    {
      author: "Google Yorumu",
      rating: 5,
      dateLabel: "Gerçek yorum eklenecek",
      text: "Bu alan gerçek Google yorumlarıyla güncellenmelidir.",
      highlight: "Google"
    }
  ]
};

export const durationOptions = [
  { value: "1gece", label: "1 gece", nights: 1 },
  { value: "2gece", label: "2 gece", nights: 2 },
  { value: "hafta-sonu", label: "Bir hafta sonu", nights: 2 },
  { value: "3gece", label: "3 gece", nights: 3 },
  { value: "1hafta", label: "Bir hafta", nights: 7 }
];

export const monthOptions = [
  { value: "mayis-2026", label: "Mayıs 2026", month: 5, year: 2026 },
  { value: "haziran-2026", label: "Haziran 2026", month: 6, year: 2026 },
  { value: "temmuz-2026", label: "Temmuz 2026", month: 7, year: 2026 },
  { value: "agustos-2026", label: "Ağustos 2026", month: 8, year: 2026 },
  { value: "eylul-2026", label: "Eylül 2026", month: 9, year: 2026 }
];