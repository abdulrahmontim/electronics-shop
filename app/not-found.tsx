import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container page">
      <h1>Page not found</h1>
      <div className="empty">
        <p>
          We could not find that page. It may have moved, or the link may be
          wrong.
        </p>
        <Link href="/#shop" className="btn btn-primary">
          Browse parts
        </Link>
      </div>
    </div>
  );
}