from django import template
from django.templatetags.static import static
from django.utils.html import format_html

register = template.Library()


@register.simple_tag
def icono(nombre, clase="i"):
    """Ícono del sprite de Phosphor (static/tienda/img/iconos.svg)."""
    return format_html(
        '<svg class="{}" aria-hidden="true" focusable="false"><use href="{}#i-{}"></use></svg>',
        clase,
        static("tienda/img/iconos.svg"),
        nombre,
    )
