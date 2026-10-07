"""
Quita el fondo de las fotos de producto para mostrarlas recortadas sobre el
color "pozo" del catálogo.

Es una herramienta de desarrollo, no corre en el servidor: necesita rembg
(ver requirements-dev.txt), que descarga su modelo la primera vez.

Uso:
    python herramientas/recortar_fondos.py [origen] [destino] [--modelo isnet-general-use]

Por defecto lee las fotos originales de static/tienda/img/productos/ (que no
se modifican nunca) y escribe un PNG con transparencia por foto en
herramientas/recortes/, para revisarlas antes de usarlas en la tienda.
"""
import argparse
import sys
from pathlib import Path

from PIL import Image
from rembg import new_session, remove

BASE_DIR = Path(__file__).resolve().parent.parent
ORIGEN = BASE_DIR / "static" / "tienda" / "img" / "productos"
DESTINO = BASE_DIR / "herramientas" / "recortes"
LADO_MAXIMO = 1000


def recortar(origen: Path, destino: Path, modelo: str) -> None:
    destino.mkdir(parents=True, exist_ok=True)
    sesion = new_session(modelo)
    fotos = sorted(p for p in origen.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"})
    for i, foto in enumerate(fotos, 1):
        imagen = Image.open(foto).convert("RGB")
        imagen.thumbnail((LADO_MAXIMO, LADO_MAXIMO))
        recorte = remove(imagen, session=sesion, post_process_mask=True)
        # Ajusta el lienzo al producto: sin márgenes transparentes de sobra.
        caja = recorte.getbbox()
        if caja:
            recorte = recorte.crop(caja)
        recorte.save(destino / f"{foto.stem}.png", optimize=True)
        print(f"[{i}/{len(fotos)}] {foto.name}", flush=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("origen", nargs="?", type=Path, default=ORIGEN)
    parser.add_argument("destino", nargs="?", type=Path, default=DESTINO)
    parser.add_argument("--modelo", default="isnet-general-use")
    args = parser.parse_args()
    recortar(args.origen, args.destino, args.modelo)
    return 0


if __name__ == "__main__":
    sys.exit(main())
