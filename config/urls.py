"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
"""
from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve as serve_static


def _serve_media(request, **kwargs):
    """
    Sirve las fotos subidas desde el panel (MEDIA_ROOT), también con
    DEBUG=False. Es una decisión para un proyecto de portfolio con poco
    tráfico: en un despliegue real, /media/ lo sirve el servidor web
    (nginx, Caddy) o un storage externo, y esta ruta se saca.

    Cache-Control acotado (1 hora + must-revalidate): importar_productos
    puede reemplazar una imagen manteniendo el mismo nombre de archivo.
    """
    response = serve_static(request, **kwargs)
    response["Cache-Control"] = "public, max-age=3600, must-revalidate"
    return response


urlpatterns = [
    path('admin/', admin.site.urls),
    path('panel/', include('panel.urls')),
    path('', include('productos.urls')),
    # /static/ lo sirve WhiteNoise (ver MIDDLEWARE en settings.py).
    re_path(r'^media/(?P<path>.*)$', _serve_media, {'document_root': settings.MEDIA_ROOT}),
]

