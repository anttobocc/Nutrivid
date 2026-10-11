// Carrusel de promociones del inicio. Avanza cada 6 s y se pausa con el
// mouse encima, con foco adentro, con la pestaña oculta, con una ventana
// abierta o si el sistema pide reducir el movimiento. Después de que el
// visitante lo usa, deja de avanzar solo.
import { carrito } from "./carrito.js";
import { CAROUSEL_INTERVAL_MS, CONFIG } from "./config.js";
import { descuento, estado, nombreSucursal } from "./estado.js";
import { PROMOS } from "./promos.js";
import { esc, icono, money, movimientoReducido, normalizeText } from "./utils.js";

const els = {
  raiz: document.getElementById("carrusel"),
  pista: document.getElementById("carruselPista"),
  puntos: document.getElementById("carruselPuntos"),
};

let indice = 0;
let encima = false;
let detenido = false;
let alAgregar = () => {};
let alRestar = () => {};
let alVerPedido = () => {};

function productoDe(promo) {
  if (!promo.producto) return null;
  return estado.productos.find((p) => normalizeText(p.name).includes(promo.producto)) || null;
}

function datosPromo(promo) {
  const producto = productoDe(promo);
  const conStock = Boolean(producto && producto.stock > 0);
  const off = conStock ? descuento(producto) : 0;
  return {
    producto: conStock ? producto : null,
    etiqueta: off ? "Oferta de la semana" : promo.categoria,
    nombre: conStock ? producto.name : promo.titulo,
    detalle: conStock ? producto.description || promo.categoria : `No lo encontramos con stock en ${nombreSucursal()}.`,
    imagen: (conStock && producto.image) || CONFIG.imagenes[promo.imagen] || "",
    off,
    cantidad: conStock ? Math.min(carrito.cantidad(producto.id), producto.stock) : 0,
  };
}

// Botón o control de cantidad de la promo (se repinta solo al cambiar el pedido).
function accionHTML(promo, i, d) {
  const foco = i === indice ? "" : ' tabindex="-1"';
  if (!d.producto) {
    return `<button class="boton boton--rosa promo__sumar" type="button" data-promo="${i}"${foco}>Ver ${esc(promo.categoria)}</button>`;
  }
  if (!d.cantidad) {
    return `<button class="boton boton--rosa promo__sumar" type="button" data-promo="${i}"${foco}>${icono("plus")}Sumar al pedido</button>`;
  }
  const tope = d.cantidad >= d.producto.stock;
  return `
    <div class="promo__cantidad" role="group" aria-label="Cantidad de ${esc(d.nombre)}">
      <button class="promo__menos" type="button" data-promo-restar="${i}" aria-label="Restar uno"${foco}>${icono("minus")}</button>
      <span aria-live="polite"><b>${d.cantidad}</b> en tu pedido</span>
      <button class="promo__mas" type="button" data-promo="${i}" aria-label="Sumar uno"${tope ? " disabled" : ""}${foco}>${icono("plus")}</button>
    </div>`;
}

function diapositivaHTML(promo, i) {
  const d = datosPromo(promo);
  const carga = i === 0 ? 'fetchpriority="high"' : 'loading="lazy"';
  return `
    <div class="promo" aria-roledescription="diapositiva" aria-label="Promo ${i + 1} de ${PROMOS.length}" ${i === indice ? "" : 'aria-hidden="true"'}>
      <div class="promo__foto">
        ${d.imagen ? `<img src="${esc(d.imagen)}" alt="" ${carga}>` : icono("package")}
        ${d.off ? `<span class="promo__descuento">−${d.off}%</span>` : ""}
      </div>
      <div class="promo__info">
        <div class="promo__arriba">
          <p class="promo__etiqueta">${esc(d.etiqueta)}</p>
          <p class="promo__contador">${i + 1} / ${PROMOS.length}</p>
        </div>
        <p class="promo__nombre">${esc(d.nombre)}</p>
        <p class="promo__detalle">${esc(d.detalle)}</p>
        ${d.producto ? `<p class="promo__precio"><b>${money(d.producto.price)}</b>${d.off ? `<s><span class="sr-only">Antes </span>${money(d.producto.oldPrice)}</s>` : ""}</p>` : ""}
        <div class="promo__accion" data-promo-accion="${i}">${accionHTML(promo, i, d)}</div>
      </div>
    </div>`;
}

function mover() {
  els.pista.style.transform = `translateX(-${indice * 100}%)`;
  els.pista.querySelectorAll(".promo").forEach((slide, i) => {
    slide.toggleAttribute("aria-hidden", i !== indice);
    slide.querySelectorAll("button").forEach((b) => { b.tabIndex = i === indice ? 0 : -1; });
  });
  els.puntos.querySelectorAll("button").forEach((punto, i) => punto.setAttribute("aria-current", String(i === indice)));
}

function ir(nuevo, { usuario = true } = {}) {
  indice = (nuevo + PROMOS.length) % PROMOS.length;
  if (usuario) detenido = true;
  mover();
}

export function renderCarrusel() {
  if (!els.raiz) return;
  els.pista.innerHTML = PROMOS.map(diapositivaHTML).join("");
  els.puntos.innerHTML = PROMOS.map((_, i) => `
    <button class="carrusel__punto" type="button" data-punto="${i}" aria-label="Promo ${i + 1} de ${PROMOS.length}" aria-current="${i === indice}"><span></span></button>`).join("");
  mover();
}

// Cambió el carrito: solo se repintan los botones de cada promo.
export function actualizarPromos() {
  if (!els.raiz) return;
  const enfocado = document.activeElement?.closest?.("[data-promo-accion]")?.dataset.promoAccion;
  els.pista.querySelectorAll("[data-promo-accion]").forEach((zona) => {
    const i = Number(zona.dataset.promoAccion);
    zona.innerHTML = accionHTML(PROMOS[i], i, datosPromo(PROMOS[i]));
    if (String(i) === enfocado) zona.querySelector("button:not(:disabled)")?.focus();
  });
}

function accion(i) {
  detenido = true;
  const promo = PROMOS[i];
  const { producto } = datosPromo(promo);
  if (producto) {
    if (carrito.cantidad(producto.id) < producto.stock) alAgregar(producto.id);
    else alVerPedido();
    return;
  }
  const existe = estado.categorias.some((c) => c.name === promo.categoria);
  window.location.href = existe ? `${CONFIG.urls.catalogo}?${new URLSearchParams({ categoria: promo.categoria })}` : CONFIG.urls.catalogo;
}

function restar(i) {
  detenido = true;
  const { producto } = datosPromo(PROMOS[i]);
  if (producto) alRestar(producto.id);
}

function enPausa() {
  return encima || detenido || document.hidden || movimientoReducido()
    || document.querySelector("dialog.capa[open]") !== null;
}

export function iniciarCarrusel({ agregar, restar: quitarUno, verPedido }) {
  if (!els.raiz) return;
  alAgregar = agregar;
  alRestar = quitarUno;
  alVerPedido = verPedido;
  els.raiz.addEventListener("click", (event) => {
    const punto = event.target.closest("[data-punto]");
    if (punto) return ir(Number(punto.dataset.punto));
    if (event.target.closest("[data-promo-anterior]")) return ir(indice - 1);
    if (event.target.closest("[data-promo-siguiente]")) return ir(indice + 1);
    const menos = event.target.closest("[data-promo-restar]");
    if (menos) return restar(Number(menos.dataset.promoRestar));
    const boton = event.target.closest("[data-promo]");
    if (boton) accion(Number(boton.dataset.promo));
  });
  els.raiz.addEventListener("keydown", (event) => {
    if (event.target.closest("input, button")) return;
    if (event.key === "ArrowRight") ir(indice + 1);
    if (event.key === "ArrowLeft") ir(indice - 1);
  });
  els.raiz.addEventListener("mouseenter", () => { encima = true; });
  els.raiz.addEventListener("mouseleave", () => { encima = false; });
  els.raiz.addEventListener("focusin", () => { encima = true; });
  els.raiz.addEventListener("focusout", () => { encima = false; });
  setInterval(() => {
    if (!enPausa()) ir(indice + 1, { usuario: false });
  }, CAROUSEL_INTERVAL_MS);
}
