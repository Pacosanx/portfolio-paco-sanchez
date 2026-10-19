"""Generate committed WebP hover variants. Requires Pillow; CI uses the output files."""
import hashlib
import json
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parents[1]
selections = json.loads((root / "preview-selection.json").read_text(encoding="utf-8"))
sources = {}
for pieces in selections.values():
    for piece in pieces:
        for asset in [piece, *piece.get("layers", [])]:
            src = asset.get("src", "")
            if not src.startswith("/assets/previews/") or not src.endswith(".png"):
                continue
            geometry = piece.get("geometry")
            crop = asset.get("crop", piece.get("crop", {}))
            # Three source pixels per authored CSS pixel keep small lettering sharp.
            needed = (max(geometry["width"] / crop.get("width", 1) / asset["width"],
                          geometry["height"] / crop.get("height", 1) / asset["height"]) * 3
                      if geometry else 1400 / max(asset["width"], asset["height"]))
            sources[src] = max(sources.get(src, 0), min(1, needed))

manifest = {}
before = after = 0
for src, scale in sorted(sources.items()):
    source = root / src.lstrip("/")
    relative = source.relative_to(root / "assets/previews")
    target = root / "assets/previews/optimized" / relative.with_suffix(".webp")
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as original:
        image = original.convert("RGBA" if "A" in original.getbands() else "RGB")
        size = tuple(max(1, round(n * scale)) for n in image.size)
        if size != image.size:
            image = image.resize(size, Image.Resampling.LANCZOS)
        image.save(target, "WEBP", quality=88, method=6, exact=True)
    if target.stat().st_size >= source.stat().st_size:
        target.unlink()
        continue
    before += source.stat().st_size
    after += target.stat().st_size
    manifest[src] = {
        "src": "/" + target.relative_to(root).as_posix(),
        "width": size[0], "height": size[1],
        "sourceHash": hashlib.sha256(source.read_bytes()).hexdigest(),
    }
(root / "preview-optimized.json").write_text(
    json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"files": len(manifest), "beforeBytes": before, "afterBytes": after,
                  "reductionPercent": round((1 - after / before) * 100, 1)}))
