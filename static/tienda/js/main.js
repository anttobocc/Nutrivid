// Punto de entrada de la tienda pública.
import { cargarCatalogo } from "./api.js";
import { cargarCarrito, carrito } from "./carrito.js";
import { actualizarPromos, iniciarCarrusel, renderCarrusel } from "./carrusel.js";
import { iniciarCatalogo, leerFiltrosURL, mostrarErrorCarga, renderListados } from "./catalogo.js";
import { abrirDetalle, abrirDetalleDesdeURL, iniciarDetalle } from "./detalle.js";
import { buscarProducto, estado, estadoStock, nombreSucursal } from "./estado.js";
import { abrirPedido, iniciarPedido, renderPedido } from "./pedido.js";
import { iniciarSucursales, renderSucursales, resolverSucursal } from "./sucursales.js";
import { actualizarAcciones } from "./tarjetas.js";
import { aviso, cerrarDialogo, iniciarUI } from "./ui.js";

// Suma o resta unidades respetando el stock de la sucursal.
function cambiarCantidad(id, delta) {
  const producto = buscarProducto(id);
  if (!producto) {
    if (delta < 0) carrito.quitar(id);
    return;
  }
  const { maximo } = estadoStock(producto);
  const nueva = Math.min(carrito.cantidad(id) + delta, maximo);
  carrito.poner(producto, Math.max(nueva, 0));
}

function escucharAcciones() {
  document.addEventListener("click", (event) => {
    const objetivo = event.target.closest("[data-agregar], [data-sumar], [data-restar], [data-quitar], [data-detalle], [data-abrir-carrito]");
    if (!objetivo) return;
    const { agregar, sumar, restar, quitar, detalle } = objetivo.dataset;

    if (detalle !== undefined) {
      // Ctrl/Cmd + clic abre el link en otra pestaña, como cualquier enlace.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      if (abrirDetalle(detalle)) event.preventDefault();
      return;
    }
    if (objetivo.hasAttribute("data-abrir-carrito")) {
      document.querySelectorAll("dialog[open]").forEach((d) => { if (d.id !== "dialogoCarrito") cerrarDialogo(d); });
      abrirPedido();
      return;
    }
    if (agregar !== undefined) cambiarCantidad(agregar, 1);
    else if (sumar !== undefined) cambiarCantidad(sumar, 1);
    else if (restar !== undefined) cambiarCantidad(restar, -1);
    else if (quitar !== undefined) carrito.quitar(quitar);
  });
}

async function cargarDatosSucursal() {
  const { productos, categorias } = await cargarCatalogo(estado.sucursalActual);
  estado.productos = productos;
  estado.categorias = categorias;
  estado.catalogoCargado = true;
}

function renderTodo() {
  renderListados();
  renderCarrusel();
  renderPedido();
}

async function alCambiarSucursal() {
  try {
    await cargarDatosSucursal();
  } catch (error) {
    console.error("Error al cambiar de sucursal:", error);
    mostrarErrorCarga();
    return;
  }
  renderTodo();
  aviso(`Ahora ves precios y stock de ${nombreSucursal()}.`, { icono: "storefront" });
}

async function init() {
  cargarCarrito();
  iniciarUI();
  iniciarPedido();
  iniciarCatalogo();
  iniciarDetalle();
  iniciarCarrusel();
  iniciarSucursales({ onCambio: alCambiarSucursal });
  escucharAcciones();
  carrito.onChange(() => {
    actualizarAcciones();
    actualizarPromos();
    renderPedido();
  });

  leerFiltrosURL();
  renderPedido();

  try {
    await resolverSucursal();
    renderSucursales();
    if (!estado.sucursalActual) {
      mostrarErrorCarga("No hay sucursales disponibles en este momento.");
      return;
    }
    await cargarDatosSucursal();
  } catch (error) {
    console.error("Error al cargar el catálogo:", error);
    mostrarErrorCarga();
    return;
  }

  renderTodo();
  abrirDetalleDesdeURL();
}

init();
