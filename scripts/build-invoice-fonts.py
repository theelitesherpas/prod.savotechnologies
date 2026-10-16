"""Build static PDF-safe instances from the existing self-hosted Inter font.
Requires fonttools (tested with 4.60.2). No network requests.
Run: python3 scripts/build-invoice-fonts.py
PDF viewers cannot reliably render a subsetted variable font's outlines.
The public web fonts remain unchanged; these two instances are PDF-only.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

folder = Path(__file__).resolve().parent.parent / "public/fonts/inter"
source = folder / "Inter-VariableFont_opsz,wght.ttf"
for style, weight in [("Regular", 400), ("SemiBold", 600)]:
    font = TTFont(source, recalcTimestamp=False)
    axes = {axis.axisTag: axis.defaultValue for axis in font["fvar"].axes}
    axes["wght"] = weight
    instantiateVariableFont(font, axes, inplace=True, updateFontNames=True)
    font.save(folder / f"Inter-PDF-{style}.ttf")
    print(f"Built static Inter-PDF-{style}.ttf ({axes})")
