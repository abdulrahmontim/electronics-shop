#!/usr/bin/env python3
"""
fetch_product_images.py
-----------------------
Put this file in the root of the electronics-shop project and run:

    python fetch_product_images.py

What it does
  1. Reads your Supabase URL and anon key from .env.local.
  2. Lists the products in your database (products are public, so the anon key works).
  3. Searches for a photo of each product and downloads it to
     public/products/<slug>.jpg (or .png).
  4. Writes supabase/set_images.sql. Paste it into the Supabase SQL Editor to
     link every product to its image.
  5. Writes IMAGE_CREDITS.md with the author and licence of each photo.

Image sources (both free to use)
  - Pexels   : better photos. Needs a free API key from pexels.com/api.
               Add  PEXELS_API_KEY=your-key  to .env.local to use it.
  - Wikimedia Commons : no key needed. Works for common parts, but results can
               be hit or miss, and many photos require crediting the author.

Useful options
    python fetch_product_images.py --dry-run               show picks, download nothing
    python fetch_product_images.py --force                 replace images that already exist
    python fetch_product_images.py --only esp32-devkit-v1 --pick 2
                                                           redo one product with the 2nd result
    python fetch_product_images.py --source commons        force a source

Only the Python standard library is used. Nothing to install.
Always look at the downloaded images. Search results can be wrong.
"""

import argparse
import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT_DIR = ROOT / "public" / "products"
CREDITS_JSON = ROOT / "image_credits.json"
CREDITS_MD = ROOT / "IMAGE_CREDITS.md"
SQL_FILE = ROOT / "supabase" / "set_images.sql"

USER_AGENT = "electronics-shop-image-fetcher/1.0 (student project; python-urllib)"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"

# Search phrase for each product. The first rule that matches the product's
# slug or name wins. Edit freely if a search gives bad photos.
QUERY_RULES = [
    (r"servo|sg90", "SG90 micro servo motor"),
    (r"ultrasonic|hc-?sr04", "HC-SR04 ultrasonic sensor"),
    (r"arduino", "Arduino Uno board"),
    (r"esp32", "ESP32 development board"),
    (r"breadboard", "solderless breadboard"),
    (r"jumper", "jumper wire"),
    (r"resistor", "resistors"),
    (r"capacitor", "electrolytic capacitors"),
    (r"\bled\b", "assorted LEDs"),
    (r"555|timer", "555 timer chip"),
    (r"solder", "electric soldering iron"),
    (r"multimeter", "digital multimeter"),
]

# Skip Commons results whose file name suggests a diagram instead of a photo.
BAD_TITLE_WORDS = (
    "diagram", "schematic", "logo", "pinout", "icon", "map", "drawing",
    "circuit.", "symbol", "screenshot", "chart", "graph",
)


# ----------------------------------------------------------------- helpers

def log(msg=""):
    print(msg, flush=True)


def load_env():
    """Read KEY=VALUE lines from .env and .env.local (the latter wins)."""
    env = {}
    for name in (".env", ".env.local"):
        path = ROOT / name
        if not path.exists():
            continue
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def http_get(url, headers=None, attempts=3):
    request_headers = {"User-Agent": USER_AGENT}
    if headers:
        request_headers.update(headers)
    last_error = None
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers=request_headers)
            with urllib.request.urlopen(req, timeout=40) as resp:
                return resp.read()
        except urllib.error.HTTPError as err:
            last_error = err
            if err.code in (429, 500, 502, 503, 504):
                time.sleep(2 * (attempt + 1))
                continue
            raise
        except urllib.error.URLError as err:
            last_error = err
            time.sleep(2 * (attempt + 1))
    raise last_error


def strip_html(value):
    return re.sub(r"<[^>]+>", "", html.unescape(value or "")).strip()


def query_for(product):
    text = f"{product.get('slug', '')} {product.get('name', '')}".lower()
    for pattern, query in QUERY_RULES:
        if re.search(pattern, text):
            return query
    return product.get("name") or product.get("slug")


def find_existing(slug):
    for ext in ("jpg", "png"):
        if (OUT_DIR / f"{slug}.{ext}").exists():
            return ext
    return None


# --------------------------------------------------------------- data in/out

def fetch_products(supabase_url, anon_key):
    url = supabase_url.rstrip("/") + "/rest/v1/products?select=slug,name,category&order=created_at.asc"
    headers = {"apikey": anon_key, "Authorization": f"Bearer {anon_key}"}
    return json.loads(http_get(url, headers))


def commons_candidates(query):
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": f"{query} filetype:bitmap",
        "gsrnamespace": "6",
        "gsrlimit": "20",
        "prop": "imageinfo",
        "iiprop": "url|mime|size|extmetadata",
        "iiurlwidth": "800",
    }
    data = json.loads(http_get(COMMONS_API + "?" + urllib.parse.urlencode(params)))
    pages = (data.get("query") or {}).get("pages") or {}
    results = []
    for page in sorted(pages.values(), key=lambda p: p.get("index", 9999)):
        info = (page.get("imageinfo") or [None])[0]
        if not info:
            continue
        title = page.get("title", "")
        mime = info.get("mime", "")
        if mime not in ("image/jpeg", "image/png"):
            continue
        if (info.get("width") or 0) < 600:
            continue
        if any(word in title.lower() for word in BAD_TITLE_WORDS):
            continue
        meta = info.get("extmetadata") or {}
        results.append({
            "url": info.get("thumburl") or info.get("url"),
            "ext": "png" if mime == "image/png" else "jpg",
            "title": title.replace("File:", ""),
            "author": strip_html((meta.get("Artist") or {}).get("value")) or "Unknown author",
            "license": strip_html((meta.get("LicenseShortName") or {}).get("value")) or "See source page",
            "page": info.get("descriptionurl", ""),
            "source": "Wikimedia Commons",
        })
    return results


def pexels_candidates(query, api_key):
    params = {"query": query, "per_page": "10", "orientation": "landscape"}
    url = "https://api.pexels.com/v1/search?" + urllib.parse.urlencode(params)
    data = json.loads(http_get(url, {"Authorization": api_key}))
    results = []
    for photo in data.get("photos", []):
        src = photo.get("src") or {}
        image_url = src.get("large") or src.get("original")
        if not image_url:
            continue
        results.append({
            "url": image_url,
            "ext": "jpg",
            "title": photo.get("alt") or f"Pexels photo {photo.get('id')}",
            "author": photo.get("photographer") or "Unknown photographer",
            "license": "Pexels License",
            "page": photo.get("url", ""),
            "source": "Pexels",
        })
    return results


def write_credits(credits):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    CREDITS_JSON.write_text(json.dumps(credits, indent=2, ensure_ascii=False), encoding="utf-8")
    lines = [
        "# Image credits",
        "",
        "Product photos were downloaded with fetch_product_images.py.",
        "Licences are listed as reported by each source. Check the linked page if unsure.",
        "",
    ]
    for slug in sorted(credits):
        c = credits[slug]
        # Collapse author whitespace so a multi-line credit cannot break the list.
        author = " ".join((c["author"] or "").split())
        title = " ".join((c["title"] or "").split())
        lines.append(f"- **{slug}**: \"{title}\" by {author}, {c['license']} ({c['source']}). {c['page']}")
    CREDITS_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_sql(rows):
    SQL_FILE.parent.mkdir(parents=True, exist_ok=True)
    lines = ["-- Generated by fetch_product_images.py. Run in the Supabase SQL Editor.", ""]
    for slug, ext in rows:
        safe_slug = slug.replace("'", "''")
        lines.append(
            f"update public.products set image_url = '/products/{safe_slug}.{ext}' where slug = '{safe_slug}';"
        )
    SQL_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")


# --------------------------------------------------------------------- main

def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description="Download product photos for the shop.")
    parser.add_argument("--source", choices=["pexels", "commons"], help="image source (default: pexels if a key is set, else commons)")
    parser.add_argument("--force", action="store_true", help="replace images that already exist")
    parser.add_argument("--only", help="only process this product slug")
    parser.add_argument("--pick", type=int, default=1, help="use the Nth search result (default 1)")
    parser.add_argument("--dry-run", action="store_true", help="show picks without downloading or writing files")
    args = parser.parse_args()

    env = load_env()
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    anon_key = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not supabase_url or not anon_key:
        sys.exit("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local")

    pexels_key = env.get("PEXELS_API_KEY")
    source = args.source or ("pexels" if pexels_key else "commons")
    if source == "pexels" and not pexels_key:
        sys.exit("PEXELS_API_KEY is not set in .env.local. Add it, or run with --source commons.")

    log(f"Source: {source}")
    try:
        products = fetch_products(supabase_url, anon_key)
    except Exception as err:  # noqa: BLE001
        sys.exit(f"Could not read products from Supabase: {err}")

    if args.only:
        products = [p for p in products if p["slug"] == args.only]
    if not products:
        sys.exit("No products found. Did you run schema.sql and seed.sql? Does --only match a slug?")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    credits = {}
    if CREDITS_JSON.exists():
        try:
            credits = json.loads(CREDITS_JSON.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            credits = {}

    used_urls = set()
    sql_rows = []
    failed = []

    for product in products:
        slug = product["slug"]
        existing = find_existing(slug)
        if existing and not args.force:
            log(f"[skip] {slug}: {slug}.{existing} already exists (use --force to replace)")
            sql_rows.append((slug, existing))
            continue

        query = query_for(product)
        log(f"[find] {slug}: searching \"{query}\"")
        try:
            if source == "pexels":
                candidates = pexels_candidates(query, pexels_key)
            else:
                candidates = commons_candidates(query)
        except Exception as err:  # noqa: BLE001
            log(f"       search failed: {err}")
            failed.append(slug)
            continue

        candidates = [c for c in candidates if c["url"] not in used_urls]
        start = max(args.pick - 1, 0)
        ordered = candidates[start:] + candidates[:start]
        if not ordered:
            log("       no usable results")
            failed.append(slug)
            continue

        saved = False
        for cand in ordered[:5]:
            log(f"       trying: {cand['title']} ({cand['author']}, {cand['license']})")
            if args.dry_run:
                saved = True
                break
            try:
                data = http_get(cand["url"])
            except Exception as err:  # noqa: BLE001
                log(f"       download failed: {err}")
                continue
            if len(data) < 5000:
                log("       file too small, trying the next result")
                continue
            for old_ext in ("jpg", "png"):
                old = OUT_DIR / f"{slug}.{old_ext}"
                if old.exists():
                    old.unlink()
            (OUT_DIR / f"{slug}.{cand['ext']}").write_bytes(data)
            used_urls.add(cand["url"])
            credits[slug] = {k: cand[k] for k in ("title", "author", "license", "source", "page")}
            sql_rows.append((slug, cand["ext"]))
            log(f"       saved public/products/{slug}.{cand['ext']} ({len(data) // 1024} KB)")
            saved = True
            break

        if not saved:
            failed.append(slug)
        time.sleep(1)  # be polite to the APIs

    if not args.dry_run:
        write_credits(credits)
        if sql_rows:
            write_sql(sql_rows)

    log()
    log(f"Done. {len(sql_rows)} linked, {len(failed)} failed.")
    if failed:
        log("Failed: " + ", ".join(failed))
        log("Retry one with:  python fetch_product_images.py --only <slug> --pick 2")
        log("Or save your own photo as public/products/<slug>.jpg")
    if not args.dry_run and sql_rows:
        log()
        log(f"Next: open {SQL_FILE.relative_to(ROOT)} and run it in the Supabase SQL Editor.")
        log("Then look at every image in public/products/ and re-roll bad ones with --pick.")
        log("Credits are in IMAGE_CREDITS.md. Keep them, and link them from your README or footer.")


if __name__ == "__main__":
    main()
