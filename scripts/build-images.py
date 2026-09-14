"""Builds the site's web images from the full-resolution originals in the archive repo.

Usage (from the repo root):
    python scripts/build-images.py ../ashtray-apparel

Writes public/img/** (WebP at 480/960/1600 px wide, a 1200 px JPEG per sample for link previews,
logo, favicons) and src/data/images.json (original pixel sizes, used for width/height attributes).
Home-grid cut-outs: a transparent PNG next to a sample's first photo (01-*.png, made by the owner) is
trimmed to the garment and saved as cutout-480/960.webp with transparency.
Needs Pillow. Re-run only when photos change; the output is committed.
"""
import json
import sys
from pathlib import Path

from PIL import Image

WIDTHS = (480, 960, 1600)

root = Path(__file__).resolve().parent.parent
archive = Path(sys.argv[1] if len(sys.argv) > 1 else root.parent / "ashtray-apparel").resolve()
# One folder per sample under images/products/<slug>; the folder name is the slug in src/data/catalog.ts.
SAMPLES = sorted(p.name for p in (archive / "images" / "products").iterdir() if p.is_dir())
public = root / "public" / "img"
manifest = {"samples": {}, "cutouts": {}, "pages": {}}


def save_webp(im, path, width, quality=80):
    path.parent.mkdir(parents=True, exist_ok=True)
    w = min(width, im.width)
    h = round(im.height * w / im.width)
    im.resize((w, h), Image.LANCZOS).save(path, "WEBP", quality=quality, method=6)


for slug in SAMPLES:
    folder = archive / "images" / "products" / slug
    # Full photos are JPEGs. A sample that only has a cut-out PNG so far uses the cut-out as its photo.
    files = sorted(folder.glob("*.jpg")) or sorted(folder.glob("01-*.png"))
    if not files:
        sys.exit(f"no photos found for {slug} in {archive}")
    entries = []
    for index, src in enumerate(files, 1):
        im = Image.open(src)
        im = im.convert("RGBA") if src.suffix == ".png" else im.convert("RGB")
        for width in WIDTHS:
            save_webp(im, public / "samples" / slug / f"{index:02d}-{width}.webp", width)
        if index == 1:
            flat = Image.new("RGB", im.size, (7, 7, 7))
            flat.paste(im, (0, 0), im if im.mode == "RGBA" else None)
            og = flat.resize((1200, round(im.height * 1200 / im.width)), Image.LANCZOS)
            og.save(public / "samples" / slug / "share.jpg", "JPEG", quality=82, optimize=True, progressive=True)
        entries.append({"n": index, "w": im.width, "h": im.height})
    manifest["samples"][slug] = entries

    cutouts = sorted((archive / "images" / "products" / slug).glob("01-*.png"))
    if cutouts:
        cut = Image.open(cutouts[0]).convert("RGBA")
        box = cut.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
        margin = round(max(cut.size) * 0.01)
        box = (max(box[0] - margin, 0), max(box[1] - margin, 0), min(box[2] + margin, cut.width), min(box[3] + margin, cut.height))
        cut = cut.crop(box)
        for width in (480, 960):
            path = public / "samples" / slug / f"cutout-{width}.webp"
            w = min(width, cut.width)
            cut.resize((w, round(cut.height * w / cut.width)), Image.LANCZOS).save(path, "WEBP", quality=82, method=6)
        manifest["cutouts"][slug] = {"w": cut.width, "h": cut.height}

story = Image.open(archive / "images" / "pages" / "our-story" / "by-merc-2-ppl.webp").convert("RGB")
for width in (480, 960):
    save_webp(story, public / "pages" / f"our-story-{width}.webp", width)
manifest["pages"]["our-story"] = {"w": story.width, "h": story.height}

brand = public / "brand"
brand.mkdir(parents=True, exist_ok=True)
logo = Image.open(archive / "images" / "brand" / "ashtray_logo_white.png").convert("RGBA")
logo = logo.resize((round(logo.width * 96 / logo.height), 96), Image.LANCZOS)
logo.save(brand / "logo-white.png", "PNG", optimize=True)
manifest["logo"] = {"w": logo.width, "h": logo.height}

emblem = Image.open(archive / "images" / "brand" / "favicon-512px.png").convert("RGBA")
emblem.resize((180, 180), Image.LANCZOS).save(root / "public" / "apple-touch-icon.png", "PNG", optimize=True)
emblem.resize((192, 192), Image.LANCZOS).save(brand / "icon-192.png", "PNG", optimize=True)
emblem.save(root / "public" / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

share = Image.new("RGB", (1200, 630), (7, 7, 7))
big = Image.open(archive / "images" / "brand" / "ashtray_logo_white.png").convert("RGBA")
big = big.resize((round(big.width * 300 / big.height), 300), Image.LANCZOS)
share.paste(big, ((1200 - big.width) // 2, (630 - big.height) // 2), big)
share.save(brand / "share.jpg", "JPEG", quality=85, optimize=True)

(root / "src" / "data" / "images.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8", newline="\n")
total = sum(p.stat().st_size for p in (root / "public").rglob("*") if p.is_file() and p.suffix in {".webp", ".jpg", ".png", ".ico"})
print(f"images written, {total / 1e6:.1f} MB")
