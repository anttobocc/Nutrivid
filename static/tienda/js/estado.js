// Datos compartidos entre módulos. Se completan con las respuestas de /api/.
import { STOCK_BAJO } from "./config.js";

export const estado = {
  productos: [],
  categorias: [],
  sucursales: [],
  sucursalActual: null,
  catalogoCargado: false,
};

export function buscarProducto(id) {
  return estado.productos.find((item) => item.id === Number(id)) || null;
}

export function sucursalActual() {
  return estado.sucursales.find((s) => s.id === estado.sucursalActual) || null;
}

export function nombreSucursal() {
  return sucursalActual()?.name || "tu sucursal";
}

// Stock según la sucursal elegida: 0 = sin stock, 1 a STOCK_BAJO = últimas.
export function estadoStock(producto) {
  const stock = Number(producto?.stock) || 0;
  if (stock <= 0) return { clase: "sin", texto: "Sin stock", disponible: false, maximo: 0 };
  if (stock <= STOCK_BAJO) {
    return { clase: "bajo", texto: stock === 1 ? "Última unidad" : `Últimas ${stock}`, disponible: true, maximo: stock };
  }
  return { clase: "ok", texto: "Disponible", disponible: true, maximo: stock };
}

export function descuento(producto) {
  if (!producto.oldPrice || producto.oldPrice <= producto.price) return 0;
  return Math.round((1 - producto.price / producto.oldPrice) * 100);
}

export function esOferta(producto) {
  return Boolean(producto.oferta || descuento(producto));
}
