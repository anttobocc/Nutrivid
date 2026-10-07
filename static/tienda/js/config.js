// Configuración de la tienda. Los datos que dependen del servidor (número de
// WhatsApp, URLs) llegan desde Django en <script id="config-tienda"> (ver
// templates/tienda/base.html y productos/views.py::_config_tienda).
const servidor = JSON.parse(document.getElementById("config-tienda")?.textContent || "{}");

export const CONFIG = {
  whatsapp: servidor.whatsapp || "",
  urls: servidor.urls || {},
  imagenes: servidor.imagenes || {},
};

export const CART_KEY = "nutrivid-cart";
// Claves usadas por versiones anteriores del sitio: se migran una sola vez.
export const LEGACY_CART_KEYS = ["grandiet-cart"];
export const SUCURSAL_KEY = "sucursalSeleccionada";

export const CAROUSEL_INTERVAL_MS = 5200;
// Hasta cuántas unidades se muestra "Últimas unidades".
export const STOCK_BAJO = 5;
