import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="page-shell">
      <div className="container">
        <div className="card empty-state">
          <h1>Aradığın ev bulunamadı.</h1>
          <p className="muted">Slug eşleşmedi ya da bu sayfa henüz oluşturulmadı.</p>
          <Link href="/" className="button">Ana Sayfaya Dön</Link>
        </div>
      </div>
    </main>
  );
}
