"""Export Higgsfield stills to web-sized files in public/home/.

- Photos: max 2000px on the long edge, WebP q82.
- Cutouts (charger, app hand): keep alpha, WebP q86.
- Illustration sheet: slice the 3x3 grid into 9 trimmed transparent WebPs.
Run: python -I media-src/export-stills.py  (from chargeops-marketing/)
"""
from pathlib import Path
import sys
from PIL import Image

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "png"
OUT = ROOT.parent / "public" / "home"
OUT.mkdir(parents=True, exist_ok=True)

PHOTOS = {
    "hero": 2200,
    "slide1": 1400,
    "slide2": 1400,
    "slide3": 1400,
    "booking": 1600,
    "about1": 1400,
    "about2": 1200,
    "hanoi": 1200,
    "danang": 1200,
}
CUTOUTS = {"charger": 1100, "apphand": 1100}
ILLOS = [
    "battery-hammock", "map-pin", "kiosk",
    "calendar", "stopwatch", "coffee",
    "leaf-plug", "phone-qr", "bell",
]


def fit(im: Image.Image, long_edge: int) -> Image.Image:
    im = im.copy()
    im.thumbnail((long_edge, long_edge), Image.LANCZOS)
    return im


only = set(sys.argv[1:])
for name, edge in PHOTOS.items():
    if only and name not in only:
        continue
    src = SRC / f"{name}.png"
    if not src.exists():
        continue
    fit(Image.open(src).convert("RGB"), edge).save(OUT / f"{name}.webp", "WEBP", quality=82, method=6)
    print("photo", name)

for name, edge in CUTOUTS.items():
    if only and name not in only:
        continue
    im = Image.open(SRC / f"{name}.png").convert("RGBA")
    im = im.crop(im.getbbox())
    fit(im, edge).save(OUT / f"{name}.webp", "WEBP", quality=86, method=6)
    print("cutout", name)

if not only or "illos" in only:
    sheet = Image.open(SRC / "illos.png").convert("RGBA")
    w, h = sheet.size
    cw, ch = w // 3, h // 3
    for i, name in enumerate(ILLOS):
        r, c = divmod(i, 3)
        cell = sheet.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
        # drop near-transparent fringe before trimming
        alpha = cell.getchannel("A").point(lambda a: 255 if a > 12 else 0)
        box = alpha.getbbox()
        cell = cell.crop(box)
        cell.thumbnail((440, 440), Image.LANCZOS)
        cell.save(OUT / f"illo-{name}.webp", "WEBP", quality=88, method=6)
        print("illo", name, cell.size)
