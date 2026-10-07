// Estado del carrito, persistido en localStorage. No toca el DOM: las vistas
// se suscriben con carrito.onChange().
import { CART_KEY, DATOS_PEDIDO_KEY, LEGACY_CART_KEYS } from "./config.js";
import { storage } from "./utils.js";

const items = new Map();
const listeners = new Set();

function leer(key) {
  try {
    const data = JSON.parse(storage.get(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function guardar() {
  storage.set(CART_KEY, JSON.stringify([...items.entries()]));
}

function avisar() {
  guardar();
  listeners.forEach((fn) => fn());
}

export function cargarCarrito() {
  let guardado = leer(CART_KEY);
  // Migración única desde la clave vieja ("grandiet-cart"): si el visitante
  // tenía un carrito armado, lo conserva con la clave nueva.
  for (const legacy of LEGACY_CART_KEYS) {
    const viejo = leer(legacy);
    if (!guardado.length && viejo.length) guardado = viejo;
    storage.remove(legacy);
  }
  items.clear();
  for (const [id, item] of guardado) {
    if (item?.product && item.quantity > 0) items.set(String(id), item);
  }
  guardar();
}

export const carrito = {
  items: () => [...items.values()],
  get size() { return items.size; },
  cantidad(id) {
    return items.get(String(id))?.quantity || 0;
  },
  // Fija la cantidad de un producto (0 lo quita). `producto` es la versión
  // vigente del catálogo: se guarda una copia para mostrarlo aunque cambie
  // de sucursal o se recargue la página.
  poner(producto, cantidad) {
    const key = String(producto.id);
    if (cantidad <= 0) items.delete(key);
    else items.set(key, { product: producto, quantity: cantidad });
    avisar();
  },
  quitar(id) {
    items.delete(String(id));
    avisar();
  },
  vaciar() {
    items.clear();
    avisar();
  },
  onChange(fn) {
    listeners.add(fn);
  },
};

export const datosPedido = {
  leer() {
    try {
      const datos = JSON.parse(storage.get(DATOS_PEDIDO_KEY) || "{}");
      return { nombre: String(datos.nombre || ""), notas: String(datos.notas || "") };
    } catch {
      return { nombre: "", notas: "" };
    }
  },
  guardar(datos) {
    storage.set(DATOS_PEDIDO_KEY, JSON.stringify(datos));
  },
};
