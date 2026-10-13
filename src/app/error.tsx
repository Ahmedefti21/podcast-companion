"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <h1>Let’s get your reading desk back.</h1>
      <p>Something interrupted the page. Try opening it again.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
