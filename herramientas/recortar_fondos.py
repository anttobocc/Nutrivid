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

from PIL import Image, ImageChops
from rembg import new_session, remove

BASE_DIR = Path(__file__).resolve().parent.parent
ORIGEN = BASE_DIR / "static" / "tienda" / "img" / "productos"
DESTINO = BASE_DIR / "herramientas" / "recortes"
LADO_MAXIMO = 1000


def rellenar_huecos(original: Image.Image, recorte: Image.Image) -> Image.Image:
    """
    Vuelve opaco, fila por fila, todo lo que queda entre el borde izquierdo y
    el derecho del producto. Sirve para envases con rótulos blancos grandes,
    que el modelo a veces toma como fondo aunque estén dentro del paquete.
    No conviene para formas cóncavas (un bowl con cuchara), por eso es una
    opción. Los colores salen de la foto original, porque el modelo también
    altera los de las zonas que descarta.
    """
    alfa = recorte.getchannel("A")
    ancho, alto = alfa.size
    datos = alfa.load()
    relleno = Image.new("L", (ancho, alto), 0)
    pix = relleno.load()
    for y in range(alto):
        solidos = [x for x in range(ancho) if datos[x, y] > 128]
        if len(solidos) < 2:
            continue
        for x in range(solidos[0], solidos[-1] + 1):
            pix[x, y] = 255
    resultado = original.convert("RGBA")
    resultado.putalpha(ImageChops.lighter(alfa, relleno))
    return resultado


def recortar(origen: Path, destino: Path, modelo: str, huecos: bool = False) -> None:
    destino.mkdir(parents=True, exist_ok=True)
    sesion = new_session(modelo)
    fotos = sorted(p for p in origen.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"})
    for i, foto in enumerate(fotos, 1):
        imagen = Image.open(foto).convert("RGB")
        imagen.thumbnail((LADO_MAXIMO, LADO_MAXIMO))
        recorte = remove(imagen, session=sesion, post_process_mask=True)
        if huecos:
            recorte = rellenar_huecos(imagen, recorte)
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
    parser.add_argument("--rellenar-huecos", action="store_true", help="Vuelve opaco, fila por fila, lo que queda dentro del producto (envases con rótulos blancos).")
    args = parser.parse_args()
    recortar(args.origen, args.destino, args.modelo, huecos=args.rellenar_huecos)
    return 0


if __name__ == "__main__":
    sys.exit(main())
