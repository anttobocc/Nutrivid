// Catálogo: tarjetas de producto, grillas del inicio, categorías, filtros
// (categoría, ofertas/destacados/nuevos) y búsqueda.
import { CONFIG } from "./config.js";
import { estado } from "./estado.js";
import { esc, money, normalizeText } from "./utils.js";

// Cuántas tarjetas del catálogo entran en el primer viewport (hasta 3
// columnas x 2 filas): esas cargan la imagen de inmediato; el resto, lazy.
const CATALOG_EAGER_IMAGE_COUNT = 6;
const CATALOG_HIGH_PRIORITY_IMAGE_COUNT = 3;
const HOME_HIGH_PRIORITY_IMAGE_COUNT = 2;

// Filtros especiales. Se basan en los campos booleanos que edita el panel
// (oferta/destacado/nuevo); una oferta también se reconoce por el precio anterior.
const FILTROS = [
  { valor: "ofertas", etiqueta: "Ofertas", aplica: (p) => p.oferta || Boolean(p.oldPrice) },
  { valor: "destacados", etiqueta: "Destacados", aplica: (p) => p.destacado },
  { valor: "nuevos", etiqueta: "Nuevos", aplica: (p) => p.nuevo },
];
// Valores de las URLs del sitio anterior (?tag=offer, ?category=...).
const FILTROS_LEGACY = { offer: "ofertas", best: "destacados", new: "nuevos" };
const TODOS = "todos";

const filtros = { categoria: TODOS, especial: TODOS, busqueda: "" };

const els = {
  categoryCards: document.querySelector("#categoryCards"),
  productGrid: document.querySelector("#productGrid"),
  resultCount: document.querySelector("#resultCount"),
  clearFilters: document.querySelector("#clearFilters"),
  searchInput: document.querySelector("#searchInput"),
  filterButtons: document.querySelector("#filterButtons"),
  tagButtons: document.querySelector("#tagButtons"),
  bestSellerGrid: document.querySelector("#bestSellerGrid"),
  offerGrid: document.querySelector("#offerGrid"),
};

// Estilo visual (color/ícono) de cada categoría en las tarjetas del inicio.
const CATEGORY_STYLES = {
  "Cereales": { color: "#dff0c2", icon: "grain" },
  "Frutos secos": { color: "#f8e0c7", icon: "nut" },
  "Semillas": { color: "#e8f3d5", icon: "seed" },
  "Suplementos": { color: "#dceef7", icon: "plus" },
  "Sin TACC": { color: "#f7ebbd", icon: "check" },
  "Harinas": { color: "#efe4cf", icon: "bag" },
  "Snacks saludables": { color: "#fbd8c6", icon: "spark" },
};
const DEFAULT_CATEGORY_STYLE = { color: "#eef1e6", icon: "bag" };
const CATEGORY_ICONS = {
  grain: "M4 4c7 0 13 6 13 13h-2C15 11.1 9.9 6 4 6V4Zm0 5c4.4 0 8 3.6 8 8h-2c0-3.3-2.7-6-6-6V9Zm0 5c1.7 0 3 1.3 3 3H4v-3Z",
  nut: "M12 3c4 0 7 3.6 7 8.2 0 5.4-3.1 9.8-7 9.8s-7-4.4-7-9.8C5 6.6 8 3 12 3Zm0 2C9.2 5 7 7.7 7 11.2 7 15.5 9.3 19 12 19s5-3.5 5-7.8C17 7.7 14.8 5 12 5Z",
  seed: "M20.5 3.5C13 3.7 6.4 8 5.3 15.4L3 18l1.4 1.4 2.2-2.2C13.9 16.1 18.2 10 20.5 3.5ZM7.5 14.4c1.2-4 4.5-7 9.2-8.2-2 4.3-5 7.2-9.2 8.2Z",
  plus: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z",
  check: "m10 15.2 7.1-7.1 1.4 1.4L10 18 5.5 13.5l1.4-1.4 3.1 3.1Z",
  bag: "M7 7V6a5 5 0 0 1 10 0v1h2v14H5V7h2Zm2 0h6V6a3 3 0 0 0-6 0v1Zm-2 2v10h10V9H7Z",
  spark: "m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z",
};

export function esOferta(producto) {
  return FILTROS[0].aplica(producto);
}

export function urlCatalogo(params = {}) {
  const query = new URLSearchParams(params).toString();
  return CONFIG.urls.catalogo + (query ? `?${query}` : "");
}

function badges(producto) {
  const lista = [];
  if (producto.oldPrice) lista.push(`<span class="badge offer">-${Math.round((1 - producto.price / producto.oldPrice) * 100)}%</span>`);
  if (producto.nuevo) lista.push('<span class="badge new">Nuevo</span>');
  if (producto.destacado) lista.push('<span class="badge">Destacado</span>');
  return lista.length ? `<div class="badges">${lista.join("")}</div>` : "";
}

function tarjeta(producto, { eager = false, priority = false } = {}) {
  const carga = eager ? (priority ? ' fetchpriority="high"' : "") : ' loading="lazy"';
  const imagen = producto.image
    ? `<img src="${esc(producto.image)}" alt="${esc(producto.name)}" decoding="async"${carga}>`
    : '<div class="skeleton-image" aria-hidden="true"></div>';
  return `
    <article class="product-card">
      ${badges(producto)}
      ${imagen}
      <div class="product-body">
        <div class="product-meta">
          <span class="tag">${esc(producto.category)}</span>
          <span class="price-wrap">
            ${producto.oldPrice ? `<span class="old-price">${money(producto.oldPrice)}</span>` : ""}
            <strong class="price">${money(producto.price)}</strong>
          </span>
        </div>
        <h3>${esc(producto.name)}</h3>
        <p>${esc(producto.description)}</p>
        <button class="add-btn" type="button" data-add="${producto.id}">Agregar al carrito</button>
      </div>
    </article>`;
}

function productosFiltrados() {
  const termino = normalizeText(filtros.busqueda.trim());
  const especial = FILTROS.find((f) => f.valor === filtros.especial);
  return estado.productos.filter((p) => {
    if (filtros.categoria !== TODOS && p.category !== filtros.categoria) return false;
    if (especial && !especial.aplica(p)) return false;
    return !termino || normalizeText(`${p.name} ${p.category} ${p.description}`).includes(termino);
  });
}

export function renderCategorias() {
  if (!els.categoryCards) return;
  els.categoryCards.innerHTML = estado.categorias.map((categoria) => {
    const estilo = CATEGORY_STYLES[categoria.name] || DEFAULT_CATEGORY_STYLE;
    return `
    <a class="category-card" href="${esc(urlCatalogo({ categoria: categoria.name }))}" style="--category-color:${estilo.color}">
      <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${CATEGORY_ICONS[estilo.icon]}"/></svg></span>
      <h3>${esc(categoria.name)}</h3>
      <p>${esc(categoria.description)}</p>
    </a>`;
  }).join("");
}

export function renderFiltros() {
  if (els.filterButtons) {
    const opciones = [{ valor: TODOS, etiqueta: "Todos" }, ...estado.categorias.map((c) => ({ valor: c.name, etiqueta: c.name }))];
    els.filterButtons.innerHTML = opciones.map((o) => `
      <button class="filter-btn ${o.valor === filtros.categoria ? "is-active" : ""}" type="button" data-category="${esc(o.valor)}" role="listitem">${esc(o.etiqueta)}</button>
    `).join("");
  }
  if (els.tagButtons) {
    els.tagButtons.innerHTML = FILTROS.map((f) => `
      <button class="filter-btn ${f.valor === filtros.especial ? "is-active" : ""}" type="button" data-tag="${f.valor}" role="listitem">${f.etiqueta}</button>
    `).join("");
  }
}

export function renderProductos() {
  if (!els.productGrid) return;
  const visibles = productosFiltrados();
  if (els.resultCount) els.resultCount.textContent = `${visibles.length} producto${visibles.length === 1 ? "" : "s"}`;
  els.productGrid.innerHTML = visibles.length
    ? visibles.map((p, i) => tarjeta(p, { eager: i < CATALOG_EAGER_IMAGE_COUNT, priority: i < CATALOG_HIGH_PRIORITY_IMAGE_COUNT })).join("")
    : '<p class="product-card product-body">No encontramos productos con ese criterio.</p>';
}

export function renderInicio() {
  if (els.bestSellerGrid) {
    els.bestSellerGrid.innerHTML = estado.productos.filter((p) => p.destacado).slice(0, 4)
      .map((p, i) => tarjeta(p, { eager: true, priority: i < HOME_HIGH_PRIORITY_IMAGE_COUNT })).join("");
  }
  if (els.offerGrid) {
    els.offerGrid.innerHTML = estado.productos.filter(esOferta).slice(0, 4).map((p) => tarjeta(p)).join("");
  }
}

export function renderTodo() {
  renderCategorias();
  renderInicio();
  renderFiltros();
  renderProductos();
}

export function mostrarErrorCarga(texto = "No se pudieron cargar los productos. Intentá nuevamente.") {
  const mensaje = `<p class="product-card product-body">${esc(texto)}</p>`;
  [els.productGrid, els.bestSellerGrid, els.offerGrid, els.categoryCards].forEach((el) => {
    if (el) el.innerHTML = mensaje;
  });
  if (els.resultCount) els.resultCount.textContent = "";
}

// Lo que no depende del servidor (filtro especial y búsqueda) se aplica
// antes de esperar las APIs; la categoría se valida contra la lista real.
export function leerFiltrosURL({ conCategoria = false } = {}) {
  const params = new URLSearchParams(window.location.search);
  const especial = params.get("filtro") || FILTROS_LEGACY[params.get("tag")];
  if (FILTROS.some((f) => f.valor === especial)) filtros.especial = especial;
  const q = params.get("q");
  if (q) filtros.busqueda = q;
  if (els.searchInput) els.searchInput.value = filtros.busqueda;
  if (conCategoria) {
    const categoria = params.get("categoria") || params.get("category");
    if (categoria && estado.categorias.some((c) => c.name === categoria)) filtros.categoria = categoria;
  }
}

// Al cambiar de sucursal se mantienen los filtros que eligió el visitante;
// solo se descarta la categoría si no existe en la sucursal nueva.
export function validarCategoria() {
  if (filtros.categoria !== TODOS && !estado.categorias.some((c) => c.name === filtros.categoria)) {
    filtros.categoria = TODOS;
  }
}

export function iniciarCatalogo() {
  els.filterButtons?.addEventListener("click", (event) => {
    const boton = event.target.closest("[data-category]");
    if (!boton) return;
    filtros.categoria = boton.dataset.category;
    renderFiltros();
    renderProductos();
  });
  els.tagButtons?.addEventListener("click", (event) => {
    const boton = event.target.closest("[data-tag]");
    if (!boton) return;
    filtros.especial = boton.dataset.tag;
    renderFiltros();
    renderProductos();
  });
  els.searchInput?.addEventListener("input", (event) => {
    filtros.busqueda = event.target.value;
    renderProductos();
  });
  els.clearFilters?.addEventListener("click", () => {
    filtros.categoria = TODOS;
    filtros.especial = TODOS;
    filtros.busqueda = "";
    if (els.searchInput) els.searchInput.value = "";
    renderFiltros();
    renderProductos();
  });
}
