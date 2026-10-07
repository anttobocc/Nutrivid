import tempfile
from io import StringIO

from django.core.management import call_command
from django.test import TestCase, override_settings
from django.urls import reverse

from sucursales.models import Sucursal

from .models import Categoria, InventarioSucursal, Producto

# Los tests no corren collectstatic: se usa el storage simple (sin manifiesto).
STORAGE_SIN_MANIFIESTO = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}


@override_settings(STORAGES=STORAGE_SIN_MANIFIESTO, WHATSAPP_NUMBER="5493790000000")
class PaginasTiendaTests(TestCase):
    def test_inicio_y_catalogo_responden(self):
        for nombre in ("productos:home", "productos:catalogo"):
            with self.subTest(nombre=nombre):
                response = self.client.get(reverse(nombre))
                self.assertEqual(response.status_code, 200)
                self.assertTemplateUsed(response, "tienda/base.html")

    def test_config_de_la_tienda_sale_de_settings(self):
        response = self.client.get(reverse("productos:home"))
        config = response.context["config_tienda"]
        self.assertEqual(config["whatsapp"], "5493790000000")
        self.assertEqual(config["urls"]["catalogo"], "/catalogo/")
        self.assertContains(response, 'id="config-tienda"')

    def test_el_numero_no_esta_hardcodeado_en_el_html(self):
        with self.settings(WHATSAPP_NUMBER="5490000000001"):
            response = self.client.get(reverse("productos:home"))
        self.assertContains(response, "5490000000001")
        self.assertNotContains(response, "5493790000000")

    def test_menu_marca_la_pagina_activa(self):
        response = self.client.get(reverse("productos:catalogo") + "?filtro=ofertas")
        self.assertContains(response, 'data-nav="ofertas" aria-current="page"')

    def test_urls_viejas_redirigen_de_forma_permanente(self):
        response = self.client.get("/index.html")
        self.assertRedirects(response, "/", status_code=301)
        response = self.client.get("/catalogo.html?tag=offer&q=chia")
        self.assertRedirects(response, "/catalogo/?tag=offer&q=chia", status_code=301, fetch_redirect_response=False)

    def test_archivos_del_frontend_viejo_ya_no_se_sirven(self):
        for url in ("/script.js", "/styles.css", "/assets/envios.jpg"):
            with self.subTest(url=url):
                self.assertEqual(self.client.get(url).status_code, 404)


class ApiProductosTests(TestCase):
    """El rediseño del frontend no cambia el contrato de la API."""

    def setUp(self):
        self.sucursal = Sucursal.objects.create(nombre="Sucursal Norte")
        categoria = Categoria.objects.create(sucursal=self.sucursal, nombre="Semillas")
        producto = Producto.objects.create(nombre="Semillas de chía x 1 kg", precio="4300", oferta=True)
        InventarioSucursal.objects.create(producto=producto, sucursal=self.sucursal, categoria=categoria, stock=3)

    def test_campos_de_producto(self):
        response = self.client.get(reverse("productos:api_productos"), {"sucursal": self.sucursal.pk})
        self.assertEqual(response.status_code, 200)
        (producto,) = response.json()
        self.assertEqual(
            set(producto),
            {"id", "name", "price", "oldPrice", "category", "description", "image", "tags", "stock", "destacado", "nuevo", "oferta"},
        )
        self.assertEqual(producto["stock"], 3)
        self.assertTrue(producto["oferta"])


class ImportarProductosTests(TestCase):
    def test_usa_las_fotos_recortadas_en_webp(self):
        with tempfile.TemporaryDirectory() as media, self.settings(MEDIA_ROOT=media):
            call_command("importar_productos", stdout=StringIO())
        producto = Producto.objects.get(nombre="Galletitas de arroz integral")
        self.assertEqual(producto.imagen.name, "productos/galletitas-de-arroz.webp")
        self.assertFalse(Producto.objects.exclude(imagen__endswith=".webp").exists())
