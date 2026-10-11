// Tarjeta de producto y su área de acción (Sumar / cantidad / Consultar),
// compartidas por el inicio, el catálogo y el detalle.
import { carrito } from "./carrito.js";
import { CONFIG } from "./config.js";
import { buscarProducto, descuento, estadoStock, nombreSucursal } from "./estado.js";
import { enlaceWhatsapp, esc, icono, money } from "./utils.js";

export function urlProducto(id) {
  return `${CONFIG.urls.catalogo}?producto=${encodeURIComponent(id)}`;
}

export function imagenHTML(producto, { eager = false } = {}) {
  if (!producto.image) return `<span class="tarjeta__sin-imagen">${icono("package")}</span>`;
  const carga = eager ? 'fetchpriority="high"' : 'loading="lazy"';
  return `<img src="${esc(producto.image)}" alt="" decoding="async" ${carga}>`;
}

export function insigniasHTML(producto, { grande = false } = {}) {
  const off = descuento(producto);
  const tam = grande ? " insignia--grande" : "";
  return `${off ? `<span class="insignia insignia--rosa${tam}">−${off}%</span>` : ""}${producto.nuevo ? `<span class="insignia insignia--oliva${tam}">Nuevo</span>` : ""}`;
}

export function precioHTML(producto) {
  const off = descuento(producto);
  return `<b>${money(producto.price)}</b>${off ? `<s><span class="sr-only">Antes </span>${money(producto.oldPrice)}</s>` : ""}`;
}

export function consultaHTML(producto, { grande = false } = {}) {
  const texto = grande ? "Consultar por WhatsApp" : "Consultar";
  const clases = "boton boton--secundario";
  if (!CONFIG.whatsapp) {
    return `<button class="${clases}" type="button" data-sin-whatsapp data-rol="consultar">${icono("whatsapp-logo")}<span>${texto}</span></button>`;
  }
  const enlace = enlaceWhatsapp(`Hola Nutrivid, ¿tienen ${producto.name} en ${nombreSucursal()}?`);
  return `<a class="${clases}" href="${esc(enlace)}" target="_blank" rel="noopener" data-rol="consultar">${icono("whatsapp-logo")}<span>${texto}</span></a>`;
}

function cantidadHTML(producto, cantidad, maximo, clase = "") {
  const nombre = esc(producto.name);
  return `
    <div class="cantidad${clase}" role="group" aria-label="Cantidad de ${nombre}">
      <button type="button" data-restar="${producto.id}" data-rol="restar" aria-label="${cantidad === 1 ? `Quitar ${nombre}` : "Restar uno"}">${icono(cantidad === 1 ? "trash" : "minus")}</button>
      <output aria-live="polite">${cantidad}</output>
      <button type="button" data-sumar="${producto.id}" data-rol="sumar" aria-label="Sumar uno"${cantidad >= maximo ? " disabled" : ""}>${icono("plus")}</button>
    </div>`;
}

// Área de acción. data-rol permite devolver el foco al control equivalente
// cuando el área se vuelve a pintar (por ejemplo, de "Sumar" a la cantidad).
export function accionHTML(producto, { grande = false } = {}) {
  const stock = estadoStock(producto);
  if (!stock.disponible) return consultaHTML(producto, { grande });
  const cantidad = Math.min(carrito.cantidad(producto.id), stock.maximo);
  const nombre = esc(producto.name);
  if (!cantidad) {
    return `<button class="boton" type="button" data-agregar="${producto.id}" data-rol="agregar" aria-label="Sumar ${nombre} al pedido">${icono("plus")}<span>${grande ? "Sumar al pedido" : "Sumar"}</span></button>`;
  }
  if (!grande) return cantidadHTML(producto, cantidad, stock.maximo);
  return `<div class="detalle__fila">${cantidadHTML(producto, cantidad, stock.maximo)}<button class="boton" type="button" data-ver-pedido data-rol="ver-pedido">Ver pedido</button></div>`;
}

export function tarjetaHTML(producto, { eager = false } = {}) {
  const stock = estadoStock(producto);
  const nombre = esc(producto.name);
  const url = esc(urlProducto(producto.id));
  return `
    <article class="tarjeta${stock.disponible ? "" : " tarjeta--agotada"}" data-producto="${producto.id}">
      <a class="tarjeta__imagen" href="${url}" data-detalle="${producto.id}" aria-label="Ver detalle de ${nombre}" tabindex="-1">
        ${imagenHTML(producto, { eager })}
        <span class="tarjeta__insignias">${insigniasHTML(producto)}</span>
      </a>
      <p class="tarjeta__categoria">${esc(producto.category)}</p>
      <h3 class="tarjeta__nombre"><a href="${url}" data-detalle="${producto.id}">${nombre}</a></h3>
      <p class="precio">${precioHTML(producto)}</p>
      <p class="stock"><span class="punto punto--${stock.clase}"></span>${stock.texto}</p>
      <div class="tarjeta__accion" data-accion="${producto.id}">${accionHTML(producto)}</div>
    </article>`;
}

// Repinta solo las áreas de acción (no la grilla entera), conservando el foco.
export function actualizarAcciones(raiz = document) {
  const activo = document.activeElement;
  const enfocada = activo?.closest?.("[data-accion]");
  const rolEnfocado = activo?.dataset?.rol;
  raiz.querySelectorAll("[data-accion]").forEach((zona) => {
    const producto = buscarProducto(zona.dataset.accion);
    if (!producto) return;
    zona.innerHTML = accionHTML(producto, { grande: zona.dataset.grande !== undefined });
    if (zona === enfocada) {
      const destino = zona.querySelector(`[data-rol="${rolEnfocado}"]:not(:disabled)`)
        || zona.querySelector("[data-rol]:not(:disabled)");
      destino?.focus();
    }
  });
}
