import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { CartProvider } from "@/components/CartProvider";

export const metadata: Metadata = {
  title: "Bench Supply - Electronics parts shop",
  description: "Boards, sensors, tools, components from Bench Supply",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=IBM+Plex+Sans:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <CartProvider>
          <Header />
          <main id="main">{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
