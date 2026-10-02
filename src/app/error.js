'use client';

export default function ErrorPage({ reset }) {
  return <main className="storefront"><section className="auth-page page-width"><div className="auth-panel"><p className="eyebrow">SOMETHING WENT WRONG</p><h1>We could not load the store</h1><p>Please try again. Your shopping bag is safe.</p><button className="button primary" type="button" onClick={reset}>TRY AGAIN</button></div></section></main>;
}
