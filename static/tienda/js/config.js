// Configuración de la tienda. Los datos que dependen del servidor (número de
// WhatsApp, URLs, rutas de imágenes) llegan desde Django en
// <script id="config-tienda"> (ver productos/views.py::_config_tienda).
const servidor = JSON.parse(document.getElementById("config-tienda")?.textContent || "{}");

export const CONFIG = {
  whatsapp: servidor.whatsapp || "",
  urls: servidor.urls || {},
  iconos: servidor.iconos || "",
  imagenes: servidor.imagenes || {},
};

export const CART_KEY = "nutrivid-cart";
// Nombre y notas del pedido, para no tener que escribirlos de nuevo.
export const DATOS_PEDIDO_KEY = "nutrivid-pedido";
export const SUCURSAL_KEY = "sucursalSeleccionada";
// Nombre de la sucursal guardada, para avisar si deja de estar disponible.
export const SUCURSAL_NOMBRE_KEY = "sucursalSeleccionadaNombre";

export const CAROUSEL_INTERVAL_MS = 6000;
// Hasta cuántas unidades se muestra "Últimas N". Lo define el servidor
// (productos/constantes.py), igual que en el panel.
export const STOCK_BAJO = Number(servidor.stockBajo) || 5;
