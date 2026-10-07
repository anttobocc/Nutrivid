// Carrusel de promociones del inicio. Usa scroll-snap nativo (se desliza con
// el dedo); el avance automático se pausa con el mouse encima, con foco
// dentro, con la pestaña oculta y con movimiento reducido, y se detiene
// para siempre cuando la persona lo maneja.
import { carrito } from "./carrito.js";
import { CAROUSEL_INTERVAL_MS, CONFIG } from "./config.js";
import { descuento, estado, estadoStock } from "./estado.js";
import { PROMOS } from "./promos.js";
import { precioHTML } from "./tarjetas.js";
import { esc, icono, movimientoReducido, normalizeText } from "./utils.js";

const els = {
  raiz: document.getElementById("carrusel"),
  pista: document.getElementById("carruselPista"),
  puntos: document.getElementById("carruselPuntos"),
  anterior: document.getElementById("carruselAnterior"),
  siguiente: document.getElementById("carruselSiguiente"),
};

let actual = 0;
let timer = null;
let detenido = false;
let pausas = 0;
let observador = null;

function productoDe(promo) {
  if (!promo.producto) return null;
  const buscado = normalizeText(promo.producto);
  return estado.productos.find((p) => normalizeText(p.name).includes(buscado)) || null;
}

function urlCategoria(promo) {
  return `${CONFIG.urls.catalogo}?${new URLSearchParams({ categoria: promo.categoria })}`;
}

function ctaHTML(promo) {
  const producto = productoDe(promo);
  if (producto && estadoStock(producto).disponible) {
    const cantidad = carrito.cantidad(producto.id);
    return cantidad
      ? `<button class="boton boton--acento" type="button" data-abrir-carrito>${icono("check")}En tu pedido (${cantidad})</button>`
      : `<button class="boton boton--acento" type="button" data-agregar="${producto.id}">${icono("plus")}Sumar al pedido</button>`;
  }
  return `<a class="boton boton--acento" href="${esc(urlCategoria(promo))}">Ver ${esc(promo.categoria)}${icono("arrow-right")}</a>`;
}

function slideHTML(promo, indice) {
  const producto = productoDe(promo);
  const off = producto ? descuento(producto) : 0;
  return `
    <article class="promo" role="group" aria-roledescription="diapositiva" aria-label="${indice + 1} de ${PROMOS.length}: ${esc(promo.titulo)}">
      <div class="promo__texto">
        ${off ? `<span class="promo__etiqueta">-${off}%</span>` : ""}
        <p class="promo__titulo">${esc(promo.titulo)}</p>
        <p class="promo__bajada">${esc(promo.bajada)}</p>
        ${producto ? precioHTML(producto) : ""}
        <div data-promo-cta="${indice}">${ctaHTML(promo)}</div>
      </div>
      <div class="promo__imagen"><img src="${esc(CONFIG.imagenes[promo.imagen] || "")}" alt="" ${indice === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}></div>
    </article>`;
}

function marcarActual(indice) {
  actual = indice;
  els.puntos.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-current", String(i === indice)));
}

function irA(indice) {
  const total = PROMOS.length;
  const destino = (indice + total) % total;
  els.pista.scrollTo({ left: destino * els.pista.clientWidth, behavior: movimientoReducido() ? "auto" : "smooth" });
  marcarActual(destino);
}

function programar() {
  clearInterval(timer);
  if (detenido || pausas > 0 || document.hidden || movimientoReducido()) return;
  timer = setInterval(() => irA(actual + 1), CAROUSEL_INTERVAL_MS);
}

function detener() {
  detenido = true;
  clearInterval(timer);
}

function pausar(delta) {
  pausas = Math.max(0, pausas + delta);
  programar();
}

export function renderCarrusel() {
  if (!els.pista) return;
  els.pista.innerHTML = PROMOS.map(slideHTML).join("");
  els.puntos.innerHTML = PROMOS.map((p, i) => `<button type="button" data-ir="${i}" aria-label="Ver promoción ${i + 1}: ${esc(p.titulo)}"></button>`).join("");
  marcarActual(0);

  observador?.disconnect();
  observador = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (e.isIntersecting) marcarActual([...els.pista.children].indexOf(e.target));
    });
  }, { root: els.pista, threshold: 0.6 });
  [...els.pista.children].forEach((slide) => observador.observe(slide));
  programar();
}

// Solo los botones cambian cuando se suma algo al pedido.
export function actualizarPromos() {
  els.pista?.querySelectorAll("[data-promo-cta]").forEach((zona) => {
    zona.innerHTML = ctaHTML(PROMOS[Number(zona.dataset.promoCta)]);
  });
}

export function iniciarCarrusel() {
  if (!els.raiz) return;
  els.anterior?.addEventListener("click", () => { detener(); irA(actual - 1); });
  els.siguiente?.addEventListener("click", () => { detener(); irA(actual + 1); });
  els.puntos?.addEventListener("click", (event) => {
    const punto = event.target.closest("[data-ir]");
    if (!punto) return;
    detener();
    irA(Number(punto.dataset.ir));
  });
  els.pista.addEventListener("pointerdown", detener);
  els.pista.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") { detener(); irA(actual + 1); }
    if (event.key === "ArrowLeft") { detener(); irA(actual - 1); }
  });
  els.raiz.addEventListener("mouseenter", () => pausar(1));
  els.raiz.addEventListener("mouseleave", () => pausar(-1));
  els.raiz.addEventListener("focusin", () => pausar(1));
  els.raiz.addEventListener("focusout", () => pausar(-1));
  document.addEventListener("visibilitychange", programar);
}
