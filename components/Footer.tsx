import Link from "next/link";
import { SHOP_NAME } from "@/lib/config";

export function Footer() {
  return (
    <footer>
      <div className="container footer-inner">
        <p className="footer-name">{SHOP_NAME}</p>
        <nav aria-label="Footer">
          <ul className="footer-links">
            <li>
              <Link href="/privacy">Privacy</Link>
            </li>
            <li>
              <Link href="/terms">Terms</Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}