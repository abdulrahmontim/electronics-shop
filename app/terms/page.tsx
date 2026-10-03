import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms - Bench Supply",
  description: "Bench Supply is a demonstration shop built as a learning project.",
};

export default function TermsPage() {
  return (
    <div className="container page">
      <div className="prose">
        <h1>Terms</h1>
      <p>
        Bench Supply is a demonstration shop. It was built as a learning project
        to show how a shop works end to end, and it is not a trading business.
      </p>

      <h2>Orders are for demonstration</h2>
      <p>
        Placing an order here exercises the real checkout flow, but nothing is
        dispatched. Orders are stored so you can see how order history works,
        and no goods will ever arrive.
      </p>

      <h2>No payment is taken</h2>
      <p>
        The site has no payment step. No card details are collected, and no money
        is charged. Prices are shown for illustration only.
      </p>

      <h2>Provided as is</h2>
      <p>
        The shop, its products and its content are provided as is, without
        warranty of any kind. We do not promise that the site will always be
        available or free of errors, and we are not liable for anything lost or
        damaged as a result of using it.
      </p>

      <h2>Product information</h2>
      <p>
        Product names, descriptions and prices may be inaccurate or out of date,
        and are placeholders for the demonstration. Check the real specification
        before buying anything.
      </p>

      <h2>Your details</h2>
      <p>
        We store only what is needed to show an order. The{" "}
        <Link href="/privacy">privacy page</Link> explains exactly what that is.
      </p>
      </div>
    </div>
  );
}