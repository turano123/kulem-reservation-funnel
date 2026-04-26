# Kulem Reservation Funnel

Kule Sapanca için hazırlanmış mobil öncelikli rezervasyon keşif akışı.

## İçerik

- **Karşılama ekranı**
  - `Kesin Tarihle Ara`
  - `Esnek Keşfet`
- **Sonuç listesi**
  - net müsaitlik / net fiyat
  - esnek mod için önerilen dönemler / başlayan fiyat
- **Ev detay sayfası**
  - büyük galeri
  - sekmeler: Ev Bilgileri / Açıklama / Takvim / Yorumlar
  - alt sabit rezervasyon alanı
- **WhatsApp kapanış akışı**
  - quote oluşturma
  - hazır mesajla Kulem'e geçiş

## Başlatma

```bash
npm install
npm run dev
```

## Canlı veri entegrasyonu

Şu an proje **mock veriyle** çalışır. Yapı hazırdır. Canlıya geçmek için:

### 1) Google Sheets
`lib/integrations/googleSheets.ts`

Burada şu verileri çek:
- tarih
- müsaitlik durumu
- fiyat
- minimum konaklama
- kahvaltı / not alanları

### 2) Google Yorumları
`lib/integrations/googleReviews.ts`

Burada şu verileri çek:
- ortalama puan
- toplam yorum sayısı
- son / öne çıkan yorumlar

### 3) WhatsApp numarası
`.env` dosyasında:
```bash
NEXT_PUBLIC_WHATSAPP_NUMBER=9053XXXXXXXX
```

## Mimari

```text
app/
  page.tsx                -> giriş / arama ekranı
  results/page.tsx        -> sonuç listesi
  properties/[slug]/      -> ev detay sayfası
  api/quote/route.ts      -> quote üretip WhatsApp linki döner

components/
  SearchShell.tsx
  PropertyCard.tsx
  DetailTabs.tsx
  AvailabilityCalendar.tsx
  StickyBookingBar.tsx
  ReserveButton.tsx

lib/
  search.ts
  pricing.ts
  whatsapp.ts
  quote.ts
  mock-data.ts
  integrations/
    googleSheets.ts
    googleReviews.ts
```

## Notlar

- Bu zip içinde **pro bir temel yapı** kuruldu.
- Google Sheets ve Google yorum bağlantıları için adapter noktaları hazır.
- UI dili Türkiye kullanıcı alışkanlıklarına göre tanıdık, ama emlak hissinden uzak tutuldu.
- `Takvim` sekmesi yıllık müsaitlik görünümü için hazırlandı.
