// Datos compartidos entre módulos. Se completan con las respuestas de /api/.
import { STOCK_BAJO } from "./config.js";

export const estado = {
  productos: [],
  categorias: [],
  sucursales: [],
  sucursalActual: null,
  catalogoCargado: false,
  errorCarga: false,
  sinSucursales: false,
};

export function buscarProducto(id, productos = estado.productos) {
  return productos.find((item) => item.id === Number(id)) || null;
}

export function sucursalActual() {
  return estado.sucursales.find((s) => s.id === estado.sucursalActual) || null;
}

export function nombreSucursal() {
  return sucursalActual()?.name || "tu sucursal";
}

// Stock según la sucursal elegida: 0 = sin stock, 1 a STOCK_BAJO = últimas.
export function estadoStock(producto, sucursal = nombreSucursal()) {
  const stock = Number(producto?.stock) || 0;
  if (stock <= 0) return { clase: "agotado", texto: "Sin stock", largo: `Sin stock en ${sucursal}`, disponible: false, maximo: 0 };
  if (stock === 1) return { clase: "bajo", texto: "Última unidad", largo: `Última unidad en ${sucursal}`, disponible: true, maximo: 1 };
  if (stock <= STOCK_BAJO) return { clase: "bajo", texto: `Últimas ${stock}`, largo: `Últimas ${stock} en ${sucursal}`, disponible: true, maximo: stock };
  return { clase: "ok", texto: "Disponible", largo: `Disponible en ${sucursal}`, disponible: true, maximo: stock };
}

export function descuento(producto) {
  if (!producto.oldPrice || producto.oldPrice <= producto.price) return 0;
  return Math.round((1 - producto.price / producto.oldPrice) * 100);
}

export function esOferta(producto) {
  return Boolean(producto.oferta || descuento(producto));
}

const porNombre = (a, b) => a.name.localeCompare(b.name, "es");
const disponiblesPrimero = (a, b) => (b.stock > 0) - (a.stock > 0);

export const ORDENES = {
  destacados: (a, b) => disponiblesPrimero(a, b) || b.destacado - a.destacado || porNombre(a, b),
  "precio-asc": (a, b) => a.price - b.price || porNombre(a, b),
  "precio-desc": (a, b) => b.price - a.price || porNombre(a, b),
  nuevos: (a, b) => b.nuevo - a.nuevo || b.id - a.id,
  nombre: porNombre,
};
