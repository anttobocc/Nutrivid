// Detalle de producto en una hoja. Se puede compartir con ?producto=<id>.
import { abrirCapa, aviso } from "../../comun/js/interfaz.js";
import { CONFIG } from "./config.js";
import { buscarProducto, estadoStock, nombreSucursal } from "./estado.js";
import { accionHTML, imagenHTML, insigniasHTML, precioHTML, urlProducto } from "./tarjetas.js";
import { esc, icono } from "./utils.js";

const dialogo = document.getElementById("dialogoProducto");
const contenido = document.getElementById("detalleContenido");
let productoAbierto = null;

function render(producto) {
  const stock = estadoStock(producto);
  const ruta = urlProducto(producto.id);
  contenido.innerHTML = `
    <div class="detalle${stock.disponible ? "" : " detalle--agotado"}">
      <div class="detalle__imagen">
        ${imagenHTML(producto, { eager: true }).replace('alt=""', `alt="${esc(producto.name)}"`)}
        <span class="detalle__insignias">${insigniasHTML(producto, { grande: true })}</span>
      </div>
      <div class="detalle__info">
        <p class="detalle__categoria">${esc(producto.category)}</p>
        <h2 class="detalle__nombre" id="detalleTitulo">${esc(producto.name)}</h2>
        <p class="detalle__precio">${precioHTML(producto)}</p>
        <p class="detalle__stock"><span class="punto punto--${stock.clase}"></span>${esc(stock.largo)}</p>
        ${producto.description ? `<p class="detalle__descripcion">${esc(producto.description)}</p>` : ""}
        <div class="detalle__acciones">
          <div class="detalle__accion" data-accion="${producto.id}" data-grande>${accionHTML(producto, { grande: true })}</div>
          <button class="copiar-enlace" type="button" data-copiar-enlace="${esc(ruta)}">${icono("link")}<span>Copiar enlace <span class="copiar-enlace__url">${esc(ruta)}</span></span></button>
        </div>
      </div>
    </div>`;
}

function ponerEnURL(id) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("producto", id);
  else url.searchParams.delete("producto");
  history.replaceState(history.state, "", url);
}

export function abrirDetalle(id) {
  const producto = buscarProducto(id);
  if (!producto || !dialogo) return false;
  productoAbierto = producto.id;
  render(producto);
  ponerEnURL(producto.id);
  abrirCapa(dialogo);
  return true;
}

// Si el producto abierto cambió (otra sucursal, otro stock), se repinta; si
// ya no está en la sucursal, se cierra la hoja.
export function refrescarDetalle() {
  if (!dialogo?.open || productoAbierto === null) return;
  const producto = buscarProducto(productoAbierto);
  if (producto) render(producto);
  else dialogo.close();
}

export function abrirDetalleDesdeURL() {
  const id = new URLSearchParams(window.location.search).get("producto");
  if (!id) return;
  if (!abrirDetalle(id)) {
    ponerEnURL(null);
    aviso(`Ese producto no está disponible en ${nombreSucursal()}.`);
  }
}

async function copiar(ruta) {
  try {
    await navigator.clipboard.writeText(new URL(ruta, window.location.origin).href);
    aviso("Enlace copiado.");
  } catch {
    aviso("No se pudo copiar el enlace.", "error");
  }
}

export function iniciarDetalle() {
  dialogo?.addEventListener("close", () => {
    productoAbierto = null;
    ponerEnURL(null);
  });
  contenido?.addEventListener("click", (event) => {
    const boton = event.target.closest("[data-copiar-enlace]");
    if (boton) copiar(boton.dataset.copiarEnlace);
  });
  if (!CONFIG.urls.catalogo) console.warn("Falta la URL del catálogo.");
}
