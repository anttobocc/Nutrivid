// Punto de entrada de la tienda pública.
import { cargarCatalogo } from "./api.js";
import { cargarCarrito, carrito } from "./carrito.js";
import { productoDePromo, urlDePromo, iniciarCarrusel } from "./carrusel.js";
import { iniciarCatalogo, leerFiltrosURL, mostrarErrorCarga, renderFiltros, renderTodo, validarCategoria } from "./catalogo.js";
import { buscarProducto, estado } from "./estado.js";
import { iniciarPedido, renderCarrito } from "./pedido.js";
import { iniciarSucursales, renderSucursales, resolverSucursal } from "./sucursales.js";
import { abrirCarrito, iniciarUI } from "./ui.js";

function agregarAlCarrito(producto) {
  if (!producto) return;
  carrito.agregar(producto);
  abrirCarrito();
}

function escucharBotonesAgregar() {
  document.addEventListener("click", (event) => {
    const boton = event.target.closest("[data-add]");
    if (boton) agregarAlCarrito(buscarProducto(boton.dataset.add));

    const promo = event.target.closest("[data-slide-add]");
    if (promo) {
      const indice = Number(promo.dataset.slideAdd);
      const producto = productoDePromo(indice);
      if (producto) agregarAlCarrito(producto);
      else window.location.href = urlDePromo(indice);
    }
  });
}

async function cargarDatosSucursal() {
  const { productos, categorias } = await cargarCatalogo(estado.sucursalActual);
  estado.productos = productos;
  estado.categorias = categorias;
}

async function alCambiarSucursal() {
  try {
    await cargarDatosSucursal();
  } catch (error) {
    console.error("Error al cambiar de sucursal:", error);
    mostrarErrorCarga();
    return;
  }
  validarCategoria();
  renderTodo();
  renderCarrito();
}

async function init() {
  cargarCarrito();
  iniciarUI();
  iniciarPedido();
  iniciarCatalogo();
  iniciarCarrusel();
  iniciarSucursales({ onCambio: alCambiarSucursal });
  escucharBotonesAgregar();

  // Lo que no depende del servidor se pinta ya.
  leerFiltrosURL();
  renderFiltros();
  renderCarrito();

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

  leerFiltrosURL({ conCategoria: true });
  renderTodo();
  // Segundo render del carrito: ahora con las imágenes vigentes del catálogo.
  renderCarrito();
  if (window.location.hash === "#categorias") {
    document.querySelector("#categorias")?.scrollIntoView({ behavior: "instant", block: "start" });
  }
}

init();
