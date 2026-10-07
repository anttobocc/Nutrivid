from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase
from PIL import Image

from .forms import ProductoGlobalForm


def _archivo(formato, modo="RGB", tamano=(1600, 900), nombre="foto.jpg"):
    buffer = BytesIO()
    Image.new(modo, tamano, (200, 120, 80, 128) if modo == "RGBA" else (200, 120, 80)).save(buffer, formato)
    tipo = {"JPEG": "image/jpeg", "PNG": "image/png"}[formato]
    return SimpleUploadedFile(nombre, buffer.getvalue(), content_type=tipo)


class ImagenWebpTests(SimpleTestCase):
    def _limpiar(self, archivo):
        form = ProductoGlobalForm(
            data={"nombre": "Prueba", "precio": "100"},
            files={"imagen": archivo},
        )
        form.is_valid()
        return form

    def test_jpg_se_guarda_como_webp_y_se_achica(self):
        form = self._limpiar(_archivo("JPEG"))
        self.assertNotIn("imagen", form.errors)
        imagen = form.cleaned_data["imagen"]
        self.assertEqual(imagen.name, "foto.webp")
        foto = Image.open(imagen)
        self.assertEqual(foto.format, "WEBP")
        self.assertEqual(max(foto.size), ProductoGlobalForm.IMAGEN_LADO_MAXIMO)

    def test_png_con_transparencia_la_conserva(self):
        form = self._limpiar(_archivo("PNG", modo="RGBA", tamano=(400, 400), nombre="recorte.png"))
        foto = Image.open(form.cleaned_data["imagen"])
        self.assertIn("A", foto.getbands())
