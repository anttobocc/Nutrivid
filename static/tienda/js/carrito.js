// Estado del carrito, persistido en localStorage. No toca el DOM: la vista
// del carrito vive en pedido.js y se suscribe con onChange().
import { CART_KEY, LEGACY_CART_KEYS } from "./config.js";
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
  agregar(producto, cantidad = 1) {
    const key = String(producto.id);
    const actual = items.get(key);
    items.set(key, { product: producto, quantity: (actual?.quantity || 0) + cantidad });
    avisar();
  },
  cambiarCantidad(id, delta) {
    const key = String(id);
    const item = items.get(key);
    if (!item) return;
    const nueva = item.quantity + delta;
    if (nueva <= 0) items.delete(key);
    else items.set(key, { ...item, quantity: nueva });
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
  totales() {
    return carrito.items().reduce((acc, item) => {
      acc.cantidad += item.quantity;
      acc.subtotal += item.quantity * item.product.price;
      return acc;
    }, { cantidad: 0, subtotal: 0 });
  },
  onChange(fn) {
    listeners.add(fn);
  },
};
