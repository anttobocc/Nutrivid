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


# ---------- Ajustes de la etapa 3: categoría repetida, stock bajo y mensajes ----------

from django.contrib.auth import get_user_model  # noqa: E402
from django.contrib.messages import get_messages  # noqa: E402
from django.test import TestCase, override_settings  # noqa: E402
from django.urls import reverse  # noqa: E402

from productos.constantes import STOCK_BAJO  # noqa: E402
from productos.models import Categoria, InventarioSucursal, Producto  # noqa: E402
from sucursales.models import Sucursal  # noqa: E402

STORAGE_SIN_MANIFIESTO = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}


@override_settings(STORAGES=STORAGE_SIN_MANIFIESTO)
class PanelAjustesTests(TestCase):
    def setUp(self):
        # La migración de datos ya crea "Sucursal Central".
        self.sucursal, _ = Sucursal.objects.get_or_create(nombre="Sucursal Central")
        self.usuario = get_user_model().objects.create_user("caja", password="Lapacho-Rosado-77")
        self.sucursal.usuarios.add(self.usuario)
        self.client.force_login(self.usuario)
        self.categoria = Categoria.objects.create(sucursal=self.sucursal, nombre="Frutos secos")

    def _mensajes(self, response):
        return [(m.level_tag, str(m)) for m in get_messages(response.wsgi_request)]

    def test_categoria_repetida_muestra_error_en_vez_de_500(self):
        response = self.client.post(reverse("panel:categorias"), {"nombre": "frutos SECOS"})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Ya existe una categoría «frutos SECOS» en Sucursal Central.")
        self.assertEqual(Categoria.objects.filter(sucursal=self.sucursal).count(), 1)

    def test_editar_categoria_con_nombre_de_otra_muestra_error(self):
        otra = Categoria.objects.create(sucursal=self.sucursal, nombre="Harinas")
        response = self.client.post(reverse("panel:categoria_editar", args=[otra.pk]), {"nombre": "Frutos secos"})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Ya existe una categoría")
        otra.refresh_from_db()
        self.assertEqual(otra.nombre, "Harinas")

    def test_la_misma_categoria_puede_existir_en_otra_sucursal(self):
        norte = Sucursal.objects.create(nombre="Sucursal Norte")
        self.sucursal.usuarios.remove(self.usuario)
        norte.usuarios.add(self.usuario)
        response = self.client.post(reverse("panel:categorias"), {"nombre": "Frutos secos"})
        self.assertRedirects(response, reverse("panel:categorias"))
        self.assertTrue(Categoria.objects.filter(sucursal=norte, nombre="Frutos secos").exists())

    def test_desactivar_categoria_con_productos_avisa_con_advertencia(self):
        producto = Producto.objects.create(nombre="Almendras", precio=100)
        InventarioSucursal.objects.create(producto=producto, sucursal=self.sucursal, categoria=self.categoria, stock=3)
        response = self.client.post(reverse("panel:categoria_toggle_activo", args=[self.categoria.pk]))
        self.assertEqual(self._mensajes(response), [("warning", '"Frutos secos" fue desactivada. Sus 1 producto sigue publicado en la tienda.')])

    def test_stock_bajo_unificado_en_el_panel_y_la_tienda(self):
        self.assertEqual(STOCK_BAJO, 5)
        producto = Producto.objects.create(nombre="Almendras", precio=100)
        InventarioSucursal.objects.create(producto=producto, sucursal=self.sucursal, categoria=self.categoria, stock=STOCK_BAJO)
        response = self.client.get(reverse("panel:dashboard"))
        self.assertContains(response, f"{STOCK_BAJO} · bajo")
        self.assertEqual(response.context["resumen"]["bajos"], 1)
        tienda = self.client.get(reverse("productos:home"))
        self.assertEqual(tienda.context["config_tienda"]["stockBajo"], STOCK_BAJO)

    def test_cambiar_de_sucursal_confirma_con_mensaje(self):
        norte = Sucursal.objects.create(nombre="Sucursal Norte")
        norte.usuarios.add(self.usuario)
        response = self.client.post(reverse("panel:sucursal_activa"), {"sucursal_id": norte.pk})
        self.assertEqual(self._mensajes(response), [("success", "Ahora estás trabajando en Sucursal Norte.")])
