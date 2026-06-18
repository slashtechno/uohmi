#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["Pillow"]
# ///
"""
Generate a fake restaurant/cafe receipt PNG for testing the AI receipt parser.

Usage:
  ./gen-test-receipt.py                  # default output: test-receipt.png
  ./gen-test-receipt.py -o my-receipt.png
  ./gen-test-receipt.py --tip 20         # custom tip percentage
"""

import argparse
from datetime import datetime
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


# ── Font loading ──────────────────────────────────────────────────────────────

MONO_CANDIDATES = [
    # macOS
    "/System/Library/Fonts/Supplemental/Courier New.ttf",
    "/Library/Fonts/Courier New.ttf",
    # Linux
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
    # Windows
    "C:/Windows/Fonts/cour.ttf",
]

def find_mono() -> str | None:
    for p in MONO_CANDIDATES:
        if Path(p).exists():
            return p
    return None

def load(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    path = find_mono()
    if path is None:
        return ImageFont.load_default()
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


# ── Receipt content ───────────────────────────────────────────────────────────

ITEMS = [
    ("Caesar Salad",       14_50),
    ("Grilled Salmon",     28_00),
    ("2x Craft Lager",     16_00),
    ("Sparkling Water",     4_50),
    ("Sourdough Bread",     6_00),
]

STORE_NAME   = "PINES CAFE & MARKET"
STORE_ADDR1  = "123 Oak Street"
STORE_ADDR2  = "Portland, OR 97201"
STORE_PHONE  = "(503) 555-0182"


# ── Drawing ───────────────────────────────────────────────────────────────────

W        = 420
BG       = (252, 250, 245)
INK      = (30,  30,  30)
RULE_CLR = (180, 175, 165)
FONT_SM  = 18
FONT_MD  = 22
FONT_LG  = 28
PAD      = 24
COL_R    = W - PAD   # right-align amounts to this x


def text_w(draw: ImageDraw.ImageDraw, text: str, font) -> int:
    return draw.textlength(text, font=font)


def rline(draw: ImageDraw.ImageDraw, y: int, char="─") -> int:
    """Draw a full-width rule and return new y."""
    font = load(FONT_SM)
    w_char = text_w(draw, char, font)
    n = max(1, int((W - PAD * 2) / w_char))
    draw.text((PAD, y), char * n, font=font, fill=RULE_CLR)
    return y + FONT_SM + 6


def row(draw: ImageDraw.ImageDraw, y: int, label: str, amount: str, font, bold_amt=False) -> int:
    """Draw a left-label / right-amount row and return new y."""
    draw.text((PAD, y), label,  font=font, fill=INK)
    draw.text((COL_R, y), amount, font=font, fill=INK, anchor="ra")
    return y + FONT_MD + 8


def build(tip_pct: int) -> Image.Image:
    # ── Pass 1: measure total height ─────────────────────────────────────────
    # We draw onto a throwaway image to calculate height, then draw for real.
    subtotal = sum(amt for _, amt in ITEMS)
    tax      = round(subtotal * 0.095)
    tip      = round(subtotal * tip_pct / 100)
    total    = subtotal + tax + tip

    def fmt(cents: int) -> str:
        return f"${cents / 100:.2f}"

    now = datetime.now()
    date_str = now.strftime("%b %-d, %Y")
    time_str = now.strftime("%-I:%M %p")

    # Estimate height: header ~160 + rules + items + footer
    est_h = 800
    img   = Image.new("RGB", (W, est_h), BG)
    draw  = ImageDraw.Draw(img)

    y = PAD

    # Header
    fn_lg = load(FONT_LG)
    fn_md = load(FONT_MD)
    fn_sm = load(FONT_SM)

    draw.text((W // 2, y), STORE_NAME,  font=fn_lg, fill=INK, anchor="mt"); y += FONT_LG + 6
    draw.text((W // 2, y), STORE_ADDR1, font=fn_sm, fill=INK, anchor="mt"); y += FONT_SM + 4
    draw.text((W // 2, y), STORE_ADDR2, font=fn_sm, fill=INK, anchor="mt"); y += FONT_SM + 4
    draw.text((W // 2, y), STORE_PHONE, font=fn_sm, fill=INK, anchor="mt"); y += FONT_SM + 12

    y = rline(draw, y)

    draw.text((PAD, y), f"Date: {date_str}",  font=fn_sm, fill=INK); y += FONT_SM + 4
    draw.text((PAD, y), f"Time: {time_str}",  font=fn_sm, fill=INK); y += FONT_SM + 4
    draw.text((PAD, y), "Table: 7  Server: Maya", font=fn_sm, fill=INK); y += FONT_SM + 10

    y = rline(draw, y)
    draw.text((PAD, y), "ITEMS", font=fn_sm, fill=RULE_CLR); y += FONT_SM + 8
    y = rline(draw, y, "·")

    for label, cents in ITEMS:
        y = row(draw, y, label, fmt(cents), fn_md)

    y = rline(draw, y)

    y = row(draw, y, "Subtotal",        fmt(subtotal), fn_md)
    y = row(draw, y, f"Tax (9.5%)",     fmt(tax),      fn_md)
    if tip:
        y = row(draw, y, f"Tip ({tip_pct}%)", fmt(tip), fn_md)

    y = rline(draw, y, "═")

    fn_tot = load(FONT_LG)
    draw.text((PAD, y),   "TOTAL",   font=fn_tot, fill=INK)
    draw.text((COL_R, y), fmt(total), font=fn_tot, fill=INK, anchor="ra")
    y += FONT_LG + 16

    y = rline(draw, y)

    draw.text((W // 2, y), "Thank you for dining with us!", font=fn_sm, fill=RULE_CLR, anchor="mt"); y += FONT_SM + 4
    draw.text((W // 2, y), "Please come again :)",          font=fn_sm, fill=RULE_CLR, anchor="mt"); y += FONT_SM + PAD

    # ── Crop to actual content height ────────────────────────────────────────
    return img.crop((0, 0, W, y))


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(description="Generate a test receipt PNG for the AI receipt parser.")
    p.add_argument("-o", "--output", default="test-receipt.png", help="Output path (default: test-receipt.png)")
    p.add_argument("--tip", type=int, default=18, help="Tip percentage (default: 18)")
    args = p.parse_args()

    img = build(args.tip)
    img.save(args.output, "PNG")

    subtotal = sum(amt for _, amt in ITEMS)
    tax      = round(subtotal * 0.095)
    tip      = round(subtotal * args.tip / 100)
    total    = subtotal + tax + tip

    print(f"✓ {args.output}  ({img.width}x{img.height}px)")
    print(f"  items:    {len(ITEMS)}")
    print(f"  subtotal: ${subtotal/100:.2f}  tax: ${tax/100:.2f}  tip: ${tip/100:.2f}")
    print(f"  total:    ${total/100:.2f}")
    print()
    print("Test with:")
    print(f"  curl -X POST http://localhost:3000/api/receipts/parse \\")
    print(f"    -H 'Cookie: uohmi_session=<your-session>' \\")
    print(f"    -F receipt=@{args.output}")


if __name__ == "__main__":
    main()
