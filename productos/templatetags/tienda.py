from django import template
from django.templatetags.static import static
from django.utils.html import format_html

register = template.Library()


@register.simple_tag
def icono(nombre, clase="i"):
    """Ícono del sprite de Phosphor (static/comun/img/iconos.svg)."""
    return format_html(
        '<svg class="{}" aria-hidden="true" focusable="false"><use href="{}#i-{}"></use></svg>',
        clase,
        static("comun/img/iconos.svg"),
        nombre,
    )


@register.filter
def campo(field, clases="entrada"):
    """Dibuja un campo de formulario con las clases del diseño y aria-invalid
    si tiene errores. Uso: {{ form.nombre|campo }} o {{ form.precio|campo:"entrada entrada--media" }}."""
    attrs = {"class": clases}
    if field.errors:
        attrs["aria-invalid"] = "true"
    return field.as_widget(attrs=attrs)
