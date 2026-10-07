// Carrusel de promociones del inicio.
import { CAROUSEL_INTERVAL_MS, CONFIG } from "./config.js";
import { estado } from "./estado.js";
import { esc, normalizeText } from "./utils.js";
import { PROMOS } from "./promos.js";

const els = {
  track: document.querySelector("#carouselTrack"),
  dots: document.querySelector("#carouselDots"),
  prev: document.querySelector("#prevSlide"),
  next: document.querySelector("#nextSlide"),
};

// Íconos (trazo) de los beneficios que se muestran debajo del texto de cada slide.
const BENEFIT_ICONS = {
  leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14zM5 19l7-7"/>',
  bone: '<path d="M8.5 15.5l7-7M6 13a2.5 2.5 0 1 1 1.8-4.3A2.5 2.5 0 1 1 12 7l-5 5zM18 11a2.5 2.5 0 1 1-1.8 4.3A2.5 2.5 0 1 1 12 17l5-5z"/>',
  hair: '<path d="M5 20c1-6 1-10 3-15M10 20c0-6 1-10 3-15M15 20c0-5 1-9 4-14M3 20h18"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
  check: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.2l2.3 2.3 4.7-4.8"/>',
  box: '<path d="M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  chat: '<path d="M4 19l1.3-3.5A8 8 0 1 1 8.5 19z"/>',
  muscle: '<path d="M6 17c-2-3-1-9 3-11l2 2-2 2c1 2 3 2 5 1 3-1 6 1 5 5-1 2-4 3-8 3-2 0-4-1-5-2z"/>',
};
const TAG_ICON = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" focusable="false"><path d="M3 12V4h8l10 10-8 8z" fill="currentColor"/><circle cx="7.5" cy="8.5" r="1.6" fill="#fff"/></svg>';
const CART_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M3 4h2l2.4 10.2a1.5 1.5 0 0 0 1.5 1.1h8.4a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="19.5" r="1.4" fill="currentColor"/><circle cx="17" cy="19.5" r="1.4" fill="currentColor"/></svg>';
const ARROW_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

let actual = 0;
let timer = null;

function urlCategoria(promo) {
  return promo.categoria ? `${CONFIG.urls.catalogo}?categoria=${encodeURIComponent(promo.categoria)}` : CONFIG.urls.catalogo;
}

// Producto del catálogo actual al que apunta el botón del slide (o null).
export function productoDePromo(indice) {
  const promo = PROMOS[indice];
  if (!promo?.producto) return null;
  const buscado = normalizeText(promo.producto);
  return estado.productos.find((item) => normalizeText(item.name).includes(buscado)) || null;
}

export function urlDePromo(indice) {
  return urlCategoria(PROMOS[indice]);
}

function slide(promo, indice) {
  const imagen = CONFIG.imagenes[promo.imagen] || "";
  const cta = promo.producto
    ? `<button type="button" class="btn btn-primary promo-cta" data-slide-add="${indice}">${CART_ICON}Agregar al carrito${ARROW_ICON}</button>`
    : `<a class="btn btn-primary promo-cta" href="${esc(urlCategoria(promo))}">Ver productos${ARROW_ICON}</a>`;
  return `
    <article class="promo-slide" style="--slide-bg:${promo.fondo}" aria-roledescription="slide" aria-label="${indice + 1} de ${PROMOS.length}">
      <div class="promo-copy">
        <span class="promo-kicker">${TAG_ICON}${esc(promo.etiqueta)}</span>
        <h2>${esc(promo.titulo)}</h2>
        <p>${esc(promo.descripcion)}</p>
        <ul class="promo-benefits">${promo.beneficios.map(([icono, texto]) => `
          <li><span aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${BENEFIT_ICONS[icono]}</svg></span>${esc(texto)}</li>`).join("")}
        </ul>
        ${cta}
      </div>
      <div class="promo-art${promo.foto ? " promo-art--photo" : ""}"><img src="${esc(imagen)}" alt=""${indice === 0 ? ' fetchpriority="high"' : ' loading="lazy"'}></div>
    </article>`;
}

function actualizar() {
  els.track.style.transform = `translateX(-${actual * 100}%)`;
  els.dots.querySelectorAll("button").forEach((boton, i) => boton.classList.toggle("is-active", i === actual));
}

function irA(indice) {
  actual = (indice + PROMOS.length) % PROMOS.length;
  actualizar();
}

function reiniciarTimer() {
  clearInterval(timer);
  timer = setInterval(() => irA(actual + 1), CAROUSEL_INTERVAL_MS);
}

export function iniciarCarrusel() {
  if (!els.track || !els.dots) return;
  els.track.innerHTML = PROMOS.map(slide).join("");
  els.dots.innerHTML = PROMOS.map((_, i) => `
    <button type="button" class="${i === actual ? "is-active" : ""}" data-slide="${i}" aria-label="Ver promoción ${i + 1}"></button>`).join("");
  actualizar();
  reiniciarTimer();

  els.prev?.addEventListener("click", () => { irA(actual - 1); reiniciarTimer(); });
  els.next?.addEventListener("click", () => { irA(actual + 1); reiniciarTimer(); });
  els.dots.addEventListener("click", (event) => {
    const dot = event.target.closest("[data-slide]");
    if (!dot) return;
    irA(Number(dot.dataset.slide));
    reiniciarTimer();
  });
}
