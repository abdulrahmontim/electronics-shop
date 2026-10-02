import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy - Bench Supply",
  description: "What Bench Supply collects, why, and how to ask for deletion.",
};

export default function PrivacyPage() {
  return (
    <div className="prose">
      <h1>Privacy</h1>
      <p>
        Bench Supply keeps the personal information it needs to run an order and
        nothing else. This page explains what that is.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          Your name and email address from your Google account. We ask Google to
          sign you in, and we read those two details from the sign-in response.
        </li>
        <li>
          The delivery details you type at checkout: your full name, phone
          number, address, city and state.
        </li>
        <li>
          What you ordered, including the products, quantities and prices at the
          time of the order.
        </li>
      </ul>

      <h2>Why we collect it</h2>
      <p>
        We store these details in Supabase, the database that runs this shop, so
        we can show you your order history and so the shop owner can pick, pack
        and deliver what you bought.
      </p>

      <h2>Who else sees it</h2>
      <p>
        After you place an order we send the confirmation email through Mailgun,
        our email delivery service. The email goes to your own address and
        includes the order and the delivery address. Mailgun passes the message
        along to deliver it and keeps it under its own privacy policy.
      </p>
      <p>
        Google handles the sign-in. Google shares your name and email with us
        when you sign in.
      </p>

      <h2>What we do not do with it</h2>
      <p>
        We do not sell your information. We do not use it for advertising, and
        we do not share it with advertising or profiling companies.
      </p>

      <h2>Asking for deletion</h2>
      <p>
        You can ask us to delete your account and order history. Contact the shop
        owner using the address your order confirmation email came from, and say
        which account you want removed. We will find the account by its Google
        email address and delete what we hold for it.
      </p>

      <h2>Questions</h2>
      <p>
        If anything here is unclear, ask the shop owner before you order. You can
        also read the <Link href="/terms">terms</Link>.
      </p>
    </div>
  );
}