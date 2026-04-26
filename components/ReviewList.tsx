import type { Review } from "@/lib/types";

export function ReviewList({ reviews }: { reviews: Review[] }) {
  return (
    <div className="review-list">
      {reviews.map((review) => (
        <article className="review-card" key={`${review.author}-${review.dateLabel}`}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>{review.author}</strong>
            <span className="chip">⭐ {review.rating}</span>
          </div>
          <p style={{ margin: "10px 0 0", lineHeight: 1.6 }}>{review.text}</p>
          <div className="row" style={{ marginTop: 10 }}>
            {review.highlight ? <span className="tag">{review.highlight}</span> : null}
            <span className="muted tiny">{review.dateLabel}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
