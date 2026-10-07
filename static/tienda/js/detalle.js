// Detalle de producto en un diálogo. Se puede compartir con ?producto=<id>.
import { buscarProducto, nombreSucursal } from "./estado.js";
import { accionHTML, imagenHTML, precioHTML, stockHTML } from "./tarjetas.js";
import { abrirDialogo, aviso } from "./ui.js";
import { esc } from "./utils.js";

const dialogo = document.getElementById("dialogoProducto");
const contenido = document.getElementById("detalleContenido");
const categoria = document.getElementById("detalleCategoria");
let productoAbierto = null;

function render(producto) {
  categoria.textContent = producto.category;
  contenido.innerHTML = `
    <div class="detalle">
      <div class="pozo">${imagenHTML(producto, { eager: true })}</div>
      <div class="detalle__info">
        <h2 id="detalleTitulo">${esc(producto.name)}</h2>
        ${precioHTML(producto)}
        ${stockHTML(producto, { largo: true })}
        ${producto.description ? `<p class="detalle__descripcion">${esc(producto.description)}</p>` : ""}
        <div class="detalle__accion" data-accion="${producto.id}" data-grande>${accionHTML(producto, { grande: true })}</div>
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
  abrirDialogo(dialogo);
  return true;
}

// Si el producto abierto cambió (otra sucursal, otro stock), se repinta.
export function refrescarDetalle() {
  if (!dialogo?.open || productoAbierto === null) return;
  const producto = buscarProducto(productoAbierto);
  if (producto) render(producto);
}

export function abrirDetalleDesdeURL() {
  const id = new URLSearchParams(window.location.search).get("producto");
  if (!id) return;
  if (!abrirDetalle(id)) {
    ponerEnURL(null);
    aviso(`Ese producto no está disponible en ${nombreSucursal()}.`, { icono: "warning-circle" });
  }
}

export function iniciarDetalle() {
  dialogo?.addEventListener("close", () => {
    productoAbierto = null;
    ponerEnURL(null);
  });
}
