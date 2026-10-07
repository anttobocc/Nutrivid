// Listados de productos: rubros y grillas del inicio; búsqueda, filtros,
// orden y resultados del catálogo. El estado de los filtros se refleja en
// la URL para poder compartirla.
import { CONFIG } from "./config.js";
import { esOferta, estado, estadoStock, nombreSucursal } from "./estado.js";
import { tarjetaHTML } from "./tarjetas.js";
import { esc, icono, normalizeText, productosLabel } from "./utils.js";

// Filtros especiales. Usan los campos que edita el panel (oferta, destacado,
// nuevo) y el stock de la sucursal elegida.
const FILTROS = [
  { valor: "ofertas", etiqueta: "Ofertas", aplica: esOferta, clase: "chip--oferta" },
  { valor: "destacados", etiqueta: "Destacados", aplica: (p) => p.destacado },
  { valor: "nuevos", etiqueta: "Nuevos", aplica: (p) => p.nuevo },
  { valor: "con-stock", etiqueta: "Con stock", aplica: (p) => estadoStock(p).disponible },
];
// Valores de las URLs del sitio anterior (?tag=offer, ?category=...).
const FILTROS_LEGACY = { offer: "ofertas", best: "destacados", new: "nuevos" };

const porNombre = (a, b) => a.name.localeCompare(b.name, "es");
const disponiblesPrimero = (a, b) => estadoStock(b).disponible - estadoStock(a).disponible;
const ORDENES = {
  destacados: (a, b) => disponiblesPrimero(a, b) || b.destacado - a.destacado || porNombre(a, b),
  "precio-asc": (a, b) => a.price - b.price || porNombre(a, b),
  "precio-desc": (a, b) => b.price - a.price || porNombre(a, b),
  nuevos: (a, b) => b.nuevo - a.nuevo || b.id - a.id,
  nombre: porNombre,
};
const ORDEN_INICIAL = "destacados";

const ICONOS_CATEGORIA = {
  "cereales": "bowl-food",
  "frutos secos": "acorn",
  "semillas": "plant",
  "suplementos": "pill",
  "sin tacc": "grains-slash",
  "harinas": "grains",
  "snacks saludables": "cookie",
};

const filtros = { categoria: "", especial: "", busqueda: "", orden: ORDEN_INICIAL };

const els = {
  rubros: document.getElementById("listaRubros"),
  ofertas: document.getElementById("gridOfertas"),
  destacados: document.getElementById("gridDestacados"),
  grilla: document.getElementById("gridCatalogo"),
  buscar: document.getElementById("buscar"),
  chipsCategorias: document.getElementById("chipsCategorias"),
  chipsFiltros: document.getElementById("chipsFiltros"),
  orden: document.getElementById("orden"),
  conteo: document.getElementById("conteo"),
  limpiar: document.getElementById("limpiarFiltros"),
};

export const esPaginaCatalogo = Boolean(els.grilla);

function urlCatalogo(params) {
  return `${CONFIG.urls.catalogo}?${new URLSearchParams(params)}`;
}

function iconoCategoria(nombre) {
  return ICONOS_CATEGORIA[normalizeText(nombre)] || "package";
}

/* ---------- Inicio ---------- */

function renderRubros() {
  if (!els.rubros) return;
  const ofertas = `<li><a class="rubro rubro--oferta" href="${esc(urlCatalogo({ filtro: "ofertas" }))}"><span>${icono("tag")}</span>Ofertas</a></li>`;
  els.rubros.innerHTML = ofertas + estado.categorias.map((c) => `
    <li><a class="rubro" href="${esc(urlCatalogo({ categoria: c.name }))}"><span>${icono(iconoCategoria(c.name))}</span>${esc(c.name)}</a></li>`).join("");
}

function renderGrillaInicio(contenedor, productos, vacio) {
  if (!contenedor) return;
  contenedor.innerHTML = productos.length
    ? productos.map((p) => tarjetaHTML(p)).join("")
    : `<p class="vacio">${esc(vacio)}</p>`;
}

function renderInicio() {
  renderRubros();
  const ordenados = [...estado.productos].sort(ORDENES.destacados);
  const ofertas = ordenados.filter(esOferta).slice(0, 4);
  // Destacados no repite lo que ya se ve en ofertas.
  const destacados = ordenados.filter((p) => p.destacado && !ofertas.includes(p)).slice(0, 8);
  renderGrillaInicio(els.ofertas, ofertas, `No hay ofertas en ${nombreSucursal()} por ahora.`);
  renderGrillaInicio(els.destacados, destacados, `No hay productos destacados en ${nombreSucursal()}.`);
}

/* ---------- Catálogo ---------- */

function hayFiltros() {
  return Boolean(filtros.categoria || filtros.especial || filtros.busqueda.trim());
}

function productosVisibles() {
  const termino = normalizeText(filtros.busqueda.trim());
  const especial = FILTROS.find((f) => f.valor === filtros.especial);
  return estado.productos
    .filter((p) => {
      if (filtros.categoria && p.category !== filtros.categoria) return false;
      if (especial && !especial.aplica(p)) return false;
      return !termino || normalizeText(`${p.name} ${p.category} ${p.description}`).includes(termino);
    })
    .sort(ORDENES[filtros.orden] || ORDENES[ORDEN_INICIAL]);
}

function chip({ valor, etiqueta, activo, clase = "", dato }) {
  return `<button class="chip ${clase}" type="button" data-${dato}="${esc(valor)}" aria-pressed="${activo}">${esc(etiqueta)}</button>`;
}

function renderChips() {
  if (els.chipsCategorias) {
    const opciones = [{ valor: "", etiqueta: "Todo" }, ...estado.categorias.map((c) => ({ valor: c.name, etiqueta: c.name }))];
    els.chipsCategorias.innerHTML = opciones.map((o) => chip({ ...o, activo: o.valor === filtros.categoria, dato: "categoria" })).join("");
  }
  if (els.chipsFiltros) {
    els.chipsFiltros.innerHTML = FILTROS.map((f) => chip({ ...f, activo: f.valor === filtros.especial, dato: "filtro" })).join("");
  }
}

function mensajeVacio() {
  const termino = filtros.busqueda.trim();
  const detalle = termino ? `No hay resultados para “${esc(termino)}”` : "No hay productos con estos filtros";
  return `
    <div class="vacio">
      ${icono("magnifying-glass")}
      <b>${detalle}</b>
      <p>en ${esc(nombreSucursal())}. Probá con otra palabra o mirá todo el catálogo.</p>
      <button class="boton boton--marca" type="button" data-limpiar-filtros>Ver todo el catálogo</button>
    </div>`;
}

function renderResultados() {
  if (!els.grilla) return;
  const visibles = productosVisibles();
  const total = estado.productos.length;
  els.grilla.innerHTML = visibles.length
    ? visibles.map((p, i) => tarjetaHTML(p, { eager: i < 4 })).join("")
    : mensajeVacio();
  if (els.conteo) {
    els.conteo.textContent = hayFiltros() ? `${visibles.length} de ${productosLabel(total)}` : productosLabel(total);
  }
  if (els.limpiar) els.limpiar.hidden = !hayFiltros();
}

function sincronizarURL() {
  const url = new URL(window.location.href);
  const params = { categoria: filtros.categoria, filtro: filtros.especial, q: filtros.busqueda.trim(), orden: filtros.orden === ORDEN_INICIAL ? "" : filtros.orden };
  for (const legacy of ["tag", "category"]) url.searchParams.delete(legacy);
  for (const [clave, valor] of Object.entries(params)) {
    if (valor) url.searchParams.set(clave, valor);
    else url.searchParams.delete(clave);
  }
  history.replaceState(history.state, "", url);
  // "Ofertas" del menú queda marcado solo con ese filtro activo.
  document.querySelectorAll(".nav [data-nav]").forEach((link) => {
    const activo = link.dataset.nav === (filtros.especial === "ofertas" ? "ofertas" : "catalogo");
    if (activo) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function aplicarCambio() {
  renderChips();
  renderResultados();
  sincronizarURL();
}

function limpiarFiltros() {
  filtros.categoria = "";
  filtros.especial = "";
  filtros.busqueda = "";
  if (els.buscar) els.buscar.value = "";
  aplicarCambio();
}

// Lo que no depende del servidor se lee antes de esperar las APIs; la
// categoría se valida contra la lista real de la sucursal.
export function leerFiltrosURL() {
  const params = new URLSearchParams(window.location.search);
  const especial = params.get("filtro") || FILTROS_LEGACY[params.get("tag")];
  if (FILTROS.some((f) => f.valor === especial)) filtros.especial = especial;
  filtros.busqueda = params.get("q") || "";
  const orden = params.get("orden");
  if (orden && ORDENES[orden]) filtros.orden = orden;
  filtros.categoria = params.get("categoria") || params.get("category") || "";
  if (els.buscar) els.buscar.value = filtros.busqueda;
  if (els.orden) els.orden.value = filtros.orden;
}

// Al cambiar de sucursal se mantienen los filtros que eligió el visitante;
// solo se descarta la categoría si no existe en la sucursal nueva.
export function validarCategoria() {
  if (filtros.categoria && !estado.categorias.some((c) => c.name === filtros.categoria)) filtros.categoria = "";
}

export function renderListados() {
  renderInicio();
  if (esPaginaCatalogo) {
    validarCategoria();
    renderChips();
    renderResultados();
    sincronizarURL();
  }
}

export function mostrarErrorCarga(texto = "No pudimos cargar los productos. Revisá la conexión y recargá la página.") {
  const html = `<div class="vacio">${icono("warning-circle")}<b>Algo salió mal</b><p>${esc(texto)}</p></div>`;
  [els.grilla, els.ofertas, els.destacados].forEach((el) => { if (el) el.innerHTML = html; });
  if (els.rubros) els.rubros.innerHTML = "";
  if (els.conteo) els.conteo.textContent = "";
}

export function iniciarCatalogo() {
  els.chipsCategorias?.addEventListener("click", (event) => {
    const boton = event.target.closest("[data-categoria]");
    if (!boton) return;
    filtros.categoria = boton.dataset.categoria;
    aplicarCambio();
  });
  els.chipsFiltros?.addEventListener("click", (event) => {
    const boton = event.target.closest("[data-filtro]");
    if (!boton) return;
    // Tocar el filtro activo lo desactiva.
    filtros.especial = filtros.especial === boton.dataset.filtro ? "" : boton.dataset.filtro;
    aplicarCambio();
  });
  els.buscar?.addEventListener("input", (event) => {
    filtros.busqueda = event.target.value;
    renderResultados();
    sincronizarURL();
  });
  els.orden?.addEventListener("change", (event) => {
    filtros.orden = event.target.value;
    renderResultados();
    sincronizarURL();
  });
  els.limpiar?.addEventListener("click", limpiarFiltros);
  els.grilla?.addEventListener("click", (event) => {
    if (event.target.closest("[data-limpiar-filtros]")) limpiarFiltros();
  });
  // Desde el ícono de búsqueda del inicio en celular (/catalogo/#buscar).
  if (els.buscar && window.location.hash === "#buscar") els.buscar.focus();
}
