from django.urls import path
from django.views.generic import RedirectView

from . import views

app_name = 'productos'

urlpatterns = [
    path('', views.home, name='home'),
    path('catalogo/', views.catalogo, name='catalogo'),
    # Direcciones viejas del sitio estático: redirección permanente (301),
    # conservando los filtros de la URL (?category=, ?tag=, ?q=).
    path('index.html', RedirectView.as_view(pattern_name='productos:home', permanent=True, query_string=True)),
    path('catalogo.html', RedirectView.as_view(pattern_name='productos:catalogo', permanent=True, query_string=True)),
    path('api/productos/', views.api_productos, name='api_productos'),
    path('api/categorias/', views.api_categorias, name='api_categorias'),
    path('api/sucursales/', views.api_sucursales, name='api_sucursales'),
]
