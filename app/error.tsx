"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container page">
      <h1>Something went wrong</h1>
      <div className="empty">
        <p>
          This page could not load: {error?.message || "an unknown error occurred"}
          . Try again, and if it keeps failing reload the page.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </div>
  );
}