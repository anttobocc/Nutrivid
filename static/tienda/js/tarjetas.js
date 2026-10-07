// Tarjeta de producto y su área de acción (Sumar / cantidad / Consultar),
// compartidas por el inicio, el catálogo y el detalle.
import { carrito } from "./carrito.js";
import { buscarProducto, descuento, estadoStock, nombreSucursal } from "./estado.js";
import { enlaceWhatsapp, esc, icono, money } from "./utils.js";

export function urlProducto(id) {
  const url = new URL(window.location.href);
  url.searchParams.set("producto", id);
  return url.pathname + url.search;
}

export function precioHTML(producto) {
  const oferta = Boolean(descuento(producto));
  return `<p class="precio${oferta ? " precio--oferta" : ""}"><b>${money(producto.price)}</b>${oferta ? `<s><span class="sr-only">Antes </span>${money(producto.oldPrice)}</s>` : ""}</p>`;
}

export function stockHTML(producto, { largo = false } = {}) {
  const stock = estadoStock(producto);
  const texto = largo ? `${stock.texto} en ${esc(nombreSucursal())}` : stock.texto;
  return `<p class="stock stock--${stock.clase}">${stock.clase === "ok" ? icono("check") : ""}${texto}</p>`;
}

export function imagenHTML(producto, { eager = false } = {}) {
  if (!producto.image) return icono("package");
  const carga = eager ? 'fetchpriority="high"' : 'loading="lazy"';
  return `<img src="${esc(producto.image)}" alt="" decoding="async" ${carga}>`;
}

export function consultaWhatsapp(producto) {
  return enlaceWhatsapp(`Hola Nutrivid, ¿tienen ${producto.name} en ${nombreSucursal()}?`);
}

// Área de acción. data-rol permite devolver el foco al control equivalente
// cuando el área se vuelve a pintar (por ejemplo, de "Sumar" a la cantidad).
export function accionHTML(producto, { grande = false } = {}) {
  const stock = estadoStock(producto);
  const nombre = esc(producto.name);
  const tam = grande ? "" : " boton--chico";
  if (!stock.disponible) {
    return `<a class="boton boton--fantasma${tam}" href="${esc(consultaWhatsapp(producto))}" target="_blank" rel="noopener" data-rol="consultar">${icono("whatsapp-logo")}Consultar</a>`;
  }
  const cantidad = carrito.cantidad(producto.id);
  if (!cantidad) {
    // En el detalle es la acción principal: lapacho, como en el carrusel.
    const estilo = grande ? "boton--acento" : "boton--marca";
    return `<button class="boton ${estilo}${tam}" type="button" data-agregar="${producto.id}" data-rol="agregar" aria-label="Sumar ${nombre} al pedido">${icono("plus")}${grande ? "Sumar al pedido" : "Sumar"}</button>`;
  }
  return `
    <div class="cantidad" role="group" aria-label="Cantidad de ${nombre} en el pedido">
      <button type="button" data-restar="${producto.id}" data-rol="restar" aria-label="${cantidad === 1 ? "Quitar" : "Restar uno de"} ${nombre}">${icono(cantidad === 1 ? "trash" : "minus")}</button>
      <output aria-live="polite">${cantidad}</output>
      <button type="button" data-sumar="${producto.id}" data-rol="sumar" aria-label="Sumar uno de ${nombre}"${cantidad >= stock.maximo ? " disabled" : ""}>${icono("plus")}</button>
    </div>${grande ? `
    <button class="boton boton--acento" type="button" data-abrir-carrito data-rol="ver-pedido">Ver pedido${icono("arrow-right")}</button>` : ""}`;
}

export function tarjetaHTML(producto, { eager = false } = {}) {
  const stock = estadoStock(producto);
  const off = descuento(producto);
  return `
    <article class="tarjeta${stock.disponible ? "" : " tarjeta--agotada"}" data-producto="${producto.id}">
      <div class="pozo tarjeta__pozo">
        ${imagenHTML(producto, { eager })}
        ${off ? `<span class="tarjeta__descuento">-${off}%</span>` : ""}
      </div>
      <div class="tarjeta__cuerpo">
        <p class="tarjeta__meta"><span>${esc(producto.category)}</span>${producto.nuevo ? '<span class="etiqueta-nuevo">Nuevo</span>' : ""}</p>
        <h3 class="tarjeta__nombre"><a href="${esc(urlProducto(producto.id))}" data-detalle="${producto.id}">${esc(producto.name)}</a></h3>
        ${precioHTML(producto)}
        ${stockHTML(producto)}
      </div>
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
