// Líneas del pedido cruzadas con el catálogo de una sucursal. El carrito no
// se borra al cambiar de sucursal: se recalcula qué entra y cuánto.
import { carrito } from "./carrito.js";
import { buscarProducto, estado, nombreSucursal } from "./estado.js";
import { unidadesLabel } from "./utils.js";

// tono: "ok" entra completo, "warn" entra con menos unidades, "fuera" no entra.
export function lineasPara(productos = estado.productos, sucursal = nombreSucursal()) {
  return carrito.items().map(({ product, quantity }) => {
    const vigente = buscarProducto(product.id, productos);
    if (!vigente) {
      return { producto: product, cantidad: quantity, efectiva: 0, incluida: false, tono: "fuera", motivo: "no-esta", nota: `No está en ${sucursal}. No se incluye en el pedido.` };
    }
    const stock = Number(vigente.stock) || 0;
    if (stock <= 0) {
      return { producto: vigente, cantidad: quantity, efectiva: 0, incluida: false, tono: "fuera", motivo: "sin-stock", nota: `Sin stock en ${sucursal}. No se incluye en el pedido.` };
    }
    if (quantity > stock) {
      return { producto: vigente, cantidad: quantity, efectiva: stock, incluida: true, tono: "warn", nota: `Hay ${unidadesLabel(stock)} en ${sucursal}. Pedimos esa cantidad.` };
    }
    return { producto: vigente, cantidad: quantity, efectiva: quantity, incluida: true, tono: "ok", nota: "" };
  });
}

export function resumen(lineas) {
  return lineas.filter((l) => l.incluida).reduce((acc, l) => {
    acc.unidades += l.efectiva;
    acc.total += l.efectiva * l.producto.price;
    return acc;
  }, { unidades: 0, total: 0 });
}
