// Punto de entrada de la tienda pública.
import { aviso, cerrarCapa } from "../../comun/js/interfaz.js";
import { cargarCatalogo } from "./api.js";
import { cargarCarrito, carrito } from "./carrito.js";
import { actualizarPromos, iniciarCarrusel, renderCarrusel } from "./carrusel.js";
import { iniciarCatalogo, leerFiltrosURL, mostrarCargando, mostrarErrorCarga, renderListados } from "./catalogo.js";
import { abrirDetalle, abrirDetalleDesdeURL, iniciarDetalle, refrescarDetalle } from "./detalle.js";
import { buscarProducto, estado, estadoStock } from "./estado.js";
import { abrirPedido, iniciarPedido, renderPedido } from "./pedido.js";
import { iniciarSucursales, renderSucursales, resolverSucursal } from "./sucursales.js";
import { actualizarAcciones } from "./tarjetas.js";

// Suma o resta unidades respetando el stock de la sucursal. Si había más
// unidades guardadas que stock, se parte de lo que se puede pedir.
function cambiarCantidad(id, delta) {
  const producto = buscarProducto(id);
  if (!producto) {
    if (delta < 0) carrito.quitar(id);
    return;
  }
  const { maximo } = estadoStock(producto);
  const actual = Math.min(carrito.cantidad(id), maximo);
  carrito.poner(producto, Math.max(0, Math.min(maximo, actual + delta)));
}

async function verPedido() {
  const abiertas = [...document.querySelectorAll("dialog.capa[open]")].filter((d) => d.id !== "dialogoCarrito");
  await Promise.all(abiertas.map((d) => cerrarCapa(d)));
  abrirPedido();
}

function escucharAcciones() {
  document.addEventListener("click", (event) => {
    const objetivo = event.target.closest("[data-agregar], [data-sumar], [data-restar], [data-quitar], [data-detalle], [data-abrir-carrito], [data-ver-pedido], [data-sin-whatsapp]");
    if (!objetivo) return;
    const { agregar, sumar, restar, quitar, detalle } = objetivo.dataset;

    if (detalle !== undefined) {
      // Ctrl/Cmd + clic abre el link en otra pestaña, como cualquier enlace.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      if (abrirDetalle(detalle)) event.preventDefault();
      return;
    }
    if (objetivo.hasAttribute("data-abrir-carrito") || objetivo.hasAttribute("data-ver-pedido")) {
      verPedido();
      return;
    }
    if (objetivo.hasAttribute("data-sin-whatsapp")) {
      aviso("No hay un número de WhatsApp configurado.", "error");
      return;
    }
    if (agregar !== undefined) cambiarCantidad(agregar, 1);
    else if (sumar !== undefined) cambiarCantidad(sumar, 1);
    else if (restar !== undefined) cambiarCantidad(restar, -1);
    else if (quitar !== undefined) carrito.quitar(quitar);
  });
}

function usarDatos({ productos, categorias }) {
  estado.productos = productos;
  estado.categorias = categorias;
  estado.catalogoCargado = true;
  estado.errorCarga = false;
}

function renderTodo() {
  renderListados();
  renderCarrusel();
  renderPedido();
  refrescarDetalle();
}

function alCambiarSucursal(datos) {
  usarDatos(datos);
  mostrarCargando();
  // Breve estado de carga, como al entrar: deja ver que cambió el stock.
  setTimeout(renderTodo, 250);
}

function sinSucursales() {
  estado.sinSucursales = true;
  renderPedido();
  document.getElementById("contenidoTienda").hidden = true;
  document.getElementById("sinSucursales").hidden = false;
}

async function init() {
  cargarCarrito();
  iniciarPedido();
  iniciarCatalogo();
  iniciarDetalle();
  iniciarCarrusel({ agregar: (id) => cambiarCantidad(id, 1), restar: (id) => cambiarCantidad(id, -1), verPedido });
  iniciarSucursales({ onCambio: alCambiarSucursal });
  escucharAcciones();
  carrito.onChange(() => {
    actualizarAcciones();
    actualizarPromos();
    renderPedido();
  });

  leerFiltrosURL();
  renderPedido();

  let avisoSucursal = "";
  try {
    avisoSucursal = await resolverSucursal();
    renderSucursales();
    if (!estado.sucursalActual) {
      sinSucursales();
      return;
    }
    usarDatos(await cargarCatalogo(estado.sucursalActual));
  } catch (error) {
    console.error("Error al cargar el catálogo:", error);
    estado.errorCarga = true;
    renderSucursales();
    mostrarErrorCarga();
    return;
  }

  renderTodo();
  if (avisoSucursal) aviso(avisoSucursal);
  abrirDetalleDesdeURL();
}

init();
