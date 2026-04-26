"use client";

import { useState } from "react";
import type { Property, Review } from "@/lib/types";
import AvailabilityCalendar from "./AvailabilityCalendar";
import { ReviewList } from "./ReviewList";

const tabs = [
  { id: "bilgiler", label: "Ev Bilgileri" },
  { id: "aciklama", label: "Açıklama" },
  { id: "takvim", label: "Takvim" },
  { id: "yorumlar", label: "Yorumlar" }
] as const;

type TabId = (typeof tabs)[number]["id"];

export function DetailTabs({
  property,
  reviews
}: {
  property: Property;
  reviews: Review[];
}) {
  const [activeTab, setActiveTab] = useState<TabId>("bilgiler");

  return (
    <div className="card detail-tabs-card" id="takvim">
      <div className="tabs premium-tabs">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-body">
        {activeTab === "bilgiler" ? (
          <section className="detail-section">
            <div className="detail-section-head">
              <span className="section-eyebrow">Ev detayları</span>
              <h3>{property.name}</h3>
              <p className="muted">
                Kapasite, konsept, kahvaltı durumu ve konum bilgileri.
              </p>
            </div>

            <div className="info-grid premium-info-grid">
              <div className="info-item highlight">
                <strong>Konsept</strong>
                <span>{property.layout}</span>
              </div>

              <div className="info-item highlight">
                <strong>Maksimum Kapasite</strong>
                <span>{property.maxGuests} kişi</span>
              </div>

              <div className="info-item highlight">
                <strong>Kahvaltı</strong>
                <span>{property.breakfastMode}</span>
              </div>

              <div className="info-item highlight">
                <strong>Konum</strong>
                <span>{property.locationLabel}</span>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "aciklama" ? (
          <section className="detail-section">
            <div className="detail-section-head">
              <span className="section-eyebrow">Genel açıklama</span>
              <h3>{property.name}</h3>
            </div>

            <p className="muted detail-story">{property.story}</p>

            <div className="spacer-24" />

            <div className="info-grid premium-info-grid">
              <div className="info-item">
                <strong>Kimler için uygun?</strong>
                <span>{property.idealFor.join(", ")}</span>
              </div>

              <div className="info-item">
                <strong>Ev kuralları</strong>
                <span>
                  {property.rules[0] ??
                    "Detaylı bilgi için bizimle iletişime geçebilirsiniz."}
                </span>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "takvim" ? (
          <section className="detail-section">
            <div className="detail-section-head">
              <span className="section-eyebrow">Canlı müsaitlik</span>
              <h3>Yıllık Müsaitlik Takvimi</h3>
              <p className="muted">
                Her evin özel müsait günleri ve gün bazlı fiyatları canlı takvim
                verilerine göre gösterilir.
              </p>
            </div>

            <AvailabilityCalendar />
          </section>
        ) : null}

        {activeTab === "yorumlar" ? (
          <section className="detail-section">
            <div className="detail-section-head">
              <span className="section-eyebrow">Misafir deneyimleri</span>
              <h3>Google Yorumları</h3>
              <p className="muted">
                ⭐ {property.reviewScore} · {property.reviewCount} yorum
              </p>
            </div>

            <ReviewList reviews={reviews} />
          </section>
        ) : null}
      </div>
    </div>
  );
}