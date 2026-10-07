# 🥗 Nutrivid

### Tienda Online para Dietética | Django · Python · JavaScript

---

## 👩‍💻 About the Project

**Nutrivid** es una tienda online desarrollada para una dietética con múltiples sucursales, pensada para facilitar la consulta de productos y la realización de pedidos de forma rápida y sencilla.

El proyecto surge a partir de una situación real de una dietética de la **provincia de Corrientes, Argentina**, que cuenta con varias sucursales pero no dispone de una página web propia.

A partir de esta necesidad, se desarrolló una propuesta digital que busca centralizar la información de los productos, facilitar su consulta y mejorar la experiencia de compra de los clientes.

---

## 🚀 Currently

- 🛍️ Desarrollando una tienda online para una dietética.
- 🏪 Trabajando con múltiples sucursales.
- 📦 Implementando un catálogo de productos.
- 🛒 Desarrollando el carrito de compras.
- 📱 Integrando pedidos mediante WhatsApp.
- ⚙️ Desarrollando un panel de administración.
- 👥 Gestionando diferentes roles de usuario.
- 🗄️ Trabajando con bases de datos.
- 🎨 Mejorando continuamente la interfaz y experiencia de usuario.

---

## 🛠️ Languages and Tools

### Languages

![Python](https://skillicons.dev/icons?i=python,js)

### Web Development

![Web Development](https://skillicons.dev/icons?i=html,css,django)

### Database

![Database](https://skillicons.dev/icons?i=sqlite)

### Tools

![Tools](https://skillicons.dev/icons?i=git,github,vscode)

---

## 📋 Main Features

### 🛍️ Product Catalog

- Visualización del catálogo de productos.
- Búsqueda de productos.
- Filtrado por categorías.
- Productos en oferta.
- Productos destacados.
- Productos nuevos.
- Ordenamiento por destacados, precio, novedades o nombre.
- Detalle de cada producto, con un enlace para compartir.
- Visualización de precios y descripciones.
- Stock según la sucursal: disponible, últimas unidades o sin stock.

### 🛒 Shopping Cart

- Agregar productos al carrito.
- Modificar cantidades.
- Eliminar productos.
- Visualizar los productos seleccionados.
- Calcular el total del pedido.
- Agregar notas al pedido (horario de retiro, envío, aclaraciones).
- Revisar el mensaje exacto antes de enviarlo.

### 📱 WhatsApp Orders

El sistema permite preparar un pedido desde el carrito y enviarlo mediante **WhatsApp**.

Esto facilita la comunicación entre el cliente y la dietética para coordinar la compra.

### 🏪 Branch Management

Nutrivid está pensado para trabajar con una dietética que cuenta con múltiples sucursales.

Cada sucursal puede manejar información relacionada con:

- Productos disponibles.
- Stock.
- Disponibilidad.
- Categorías.
- Ofertas.
- Productos destacados.

### ⚙️ Administration Panel

El sistema cuenta con un panel de administración para gestionar:

- Productos.
- Categorías.
- Sucursales.
- Usuarios.
- Stock.
- Disponibilidad.
- Ofertas.
- Productos destacados.
- Productos nuevos.

---

## 👥 User Roles

### 🔐 Administrator

Cuenta con acceso a las principales funcionalidades de administración del sistema.

Puede gestionar productos, categorías, sucursales, usuarios y stock.

### 👤 Panel User

Puede acceder a las funcionalidades administrativas correspondientes según sus permisos y sucursales asignadas.

### 🛍️ Customer

Puede:

- Consultar el catálogo.
- Seleccionar una sucursal.
- Buscar productos.
- Filtrar productos.
- Agregar productos al carrito.
- Preparar un pedido.
- Enviar el pedido mediante WhatsApp.

---

## 📚 Technologies

### Backend

- Python
- Django

### Frontend

- HTML5
- CSS3
- JavaScript

### Database

- SQLite

### Version Control

- Git
- GitHub

---

## 📂 Project Structure

```text
Nutrivid/
├── config/            # Settings (leídos de variables de entorno), URLs, storage de estáticos
├── productos/         # Modelos de producto/categoría/inventario, API pública, vistas de la tienda
├── sucursales/        # Sucursales y permisos por sucursal del panel
├── panel/             # Panel de administración propio (/panel/)
├── templates/
│   ├── tienda/        # Tienda pública: base común, inicio, catálogo y parciales
│   └── panel/
├── static/
│   ├── tienda/        # CSS por partes, módulos JS, fuentes, íconos y fotos
│   └── css/panel.css
├── herramientas/      # Herramientas de desarrollo (recorte de fondos de fotos)
├── media/             # Fotos de producto (no se versiona, ver "Instalación")
├── .env.example
├── requirements.txt
├── requirements-dev.txt
└── manage.py
```

---

## ⚙️ Instalación

Requiere Python 3.12 o superior.

```bash
git clone https://github.com/anttobocc/dietshop-demo.git
cd dietshop-demo
python -m venv .venv
.venv\Scripts\activate          # en Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
```

Copiá `.env.example` como `.env` y completá los valores:

| Variable | Para qué sirve |
| --- | --- |
| `DJANGO_SECRET_KEY` | Clave secreta de Django. Obligatoria con `DEBUG` apagado. |
| `DJANGO_DEBUG` | `true` en desarrollo, `false` en producción. Si no se define, queda en `false`. |
| `DJANGO_ALLOWED_HOSTS` | Dominios separados por comas. |
| `WHATSAPP_NUMBER` | Número que recibe los pedidos, en formato internacional sin `+` ni espacios. |

Después, creá la base de datos y cargá los productos:

```bash
python manage.py migrate
python manage.py importar_productos
python manage.py createsuperuser   # para entrar al panel en /panel/
python manage.py runserver
```

**`importar_productos` hay que correrlo después de clonar.** La carpeta `media/` no está en el repositorio: el comando crea las categorías y los productos de la Sucursal Central y copia sus fotos desde `static/tienda/img/productos/` a `media/productos/`. Se puede volver a correr sin duplicar datos; no pisa el stock cargado desde el panel.

---

## 🚀 Producción

- Con `DJANGO_DEBUG=false`, los estáticos los sirve WhiteNoise. Antes de arrancar hay que correr `python manage.py collectstatic`.
- Las fotos de `/media/` se sirven desde Django con una ruta propia, algo aceptable para un proyecto de portfolio con poco tráfico. En un despliegue real, `/media/` lo tiene que servir el servidor web (nginx, Caddy) o un storage externo, y esa ruta se saca de `config/urls.py`.
- Las fotos que se suben desde el panel se guardan en WebP.

---

## 🧰 Herramientas

`herramientas/recortar_fondos.py` quita el fondo de las fotos de producto para mostrarlas recortadas sobre el fondo de las tarjetas. Es una herramienta de desarrollo y necesita las dependencias de `requirements-dev.txt`:

```bash
pip install -r requirements-dev.txt
python herramientas/recortar_fondos.py
```

Lee las fotos originales de `static/tienda/img/productos/` y deja los recortes en `herramientas/recortes/` para revisarlos. Los aprobados se guardan como WebP en `static/tienda/img/productos/recortadas/`. Para envases con rótulos blancos grandes, la opción `--rellenar-huecos` evita que el rótulo quede transparente.

---

## ✅ Tests

```bash
python manage.py test
```
