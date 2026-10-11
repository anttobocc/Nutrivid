// Listados de productos: categorías, ofertas y destacados del inicio;
// búsqueda, filtros, orden y resultados del catálogo. El estado de los
// filtros se refleja en la URL para poder compartirla.
import { CONFIG } from "./config.js";
import { ORDENES, esOferta, estado, estadoStock, nombreSucursal } from "./estado.js";
import { tarjetaHTML } from "./tarjetas.js";
import { esc, icono, normalizeText, productosLabel } from "./utils.js";

// Filtros especiales. Usan los campos que edita el panel (oferta, destacado,
// nuevo) y el stock de la sucursal elegida.
const FILTROS = [
  { valor: "ofertas", etiqueta: "Ofertas", aplica: esOferta },
  { valor: "destacados", etiqueta: "Destacados", aplica: (p) => p.destacado },
  { valor: "nuevos", etiqueta: "Nuevos", aplica: (p) => p.nuevo },
  { valor: "con-stock", etiqueta: "Con stock", aplica: (p) => estadoStock(p).disponible },
];
// Valores de las URLs del sitio anterior (?tag=offer, ?category=...).
const FILTROS_LEGACY = { offer: "ofertas", best: "destacados", new: "nuevos" };
const ETIQUETAS_ORDEN = { "precio-asc": "Menor precio", "precio-desc": "Mayor precio", nuevos: "Novedades", nombre: "Nombre (A-Z)" };
const ORDEN_INICIAL = "destacados";

const filtros = { categoria: "", especial: "", busqueda: "", orden: ORDEN_INICIAL };

const $ = (id) => document.getElementById(id);
const els = {
  categorias: $("listaCategorias"),
  errorInicio: $("errorInicio"),
  cargandoInicio: $("cargandoInicio"),
  seccionOfertas: $("seccionOfertas"),
  seccionDestacados: $("seccionDestacados"),
  ofertas: $("gridOfertas"),
  destacados: $("gridDestacados"),
  grilla: $("gridCatalogo"),
  buscar: $("buscar"),
  borrar: $("borrarBusqueda"),
  chipsCategorias: $("chipsCategorias"),
  chipsFiltros: $("chipsFiltros"),
  orden: $("orden"),
  conteo: $("conteo"),
  activos: $("filtrosActivos"),
  limpiar: $("limpiarFiltros"),
};

export const esPaginaCatalogo = Boolean(els.grilla);

function urlCatalogo(params) {
  return `${CONFIG.urls.catalogo}?${new URLSearchParams(params)}`;
}

/* ---------- Inicio ---------- */

function burbujaHTML({ nombre, imagen, url }) {
  const foto = imagen
    ? `<img class="burbuja__imagen" src="${esc(imagen)}" alt="" loading="lazy" decoding="async">`
    : `<span class="burbuja__imagen burbuja__imagen--vacia">${icono("package")}</span>`;
  return `<a class="burbuja" href="${esc(url)}">${foto}<span class="burbuja__nombre">${esc(nombre)}</span></a>`;
}

function renderCategorias(ordenados, ofertas) {
  if (!els.categorias) return;
  const burbujas = [{ nombre: "Ofertas", imagen: ofertas[0]?.image || CONFIG.imagenes["frutos-secos"], url: urlCatalogo({ filtro: "ofertas" }) }];
  const categorias = [...estado.categorias].sort((a, b) => a.name.localeCompare(b.name, "es"));
  for (const c of categorias) {
    const primero = ordenados.find((p) => p.category === c.name && p.image);
    burbujas.push({ nombre: c.name, imagen: primero?.image || "", url: urlCatalogo({ categoria: c.name }) });
  }
  els.categorias.innerHTML = burbujas.map(burbujaHTML).join("");
}

function renderCarril(seccion, contenedor, productos, vacio) {
  if (!seccion) return;
  seccion.hidden = false;
  seccion.querySelector("[data-con-productos]").hidden = productos.length === 0;
  contenedor.innerHTML = productos.length
    ? productos.map((p) => tarjetaHTML(p)).join("")
    : `<div class="vacio">${esc(vacio)}</div>`;
}

function renderInicio() {
  if (!els.cargandoInicio) return;
  els.cargandoInicio.hidden = true;
  els.errorInicio.hidden = true;
  const ordenados = [...estado.productos].sort(ORDENES.destacados);
  const ofertas = ordenados.filter(esOferta).slice(0, 4);
  // Destacados no repite lo que ya se ve en ofertas.
  const destacados = ordenados.filter((p) => p.destacado && !ofertas.includes(p)).slice(0, 8);
  renderCategorias(ordenados, ofertas);
  renderCarril(els.seccionOfertas, els.ofertas, ofertas, `No hay ofertas en ${nombreSucursal()} por ahora.`);
  renderCarril(els.seccionDestacados, els.destacados, destacados, `No hay productos destacados en ${nombreSucursal()}.`);
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

function chip({ valor, etiqueta, activo, dato }) {
  return `<button class="chip" type="button" data-${dato}="${esc(valor)}" aria-pressed="${activo}">${esc(etiqueta)}</button>`;
}

function renderChips() {
  if (els.chipsCategorias) {
    const categorias = [...estado.categorias].sort((a, b) => a.name.localeCompare(b.name, "es"));
    const opciones = [{ valor: "", etiqueta: "Todo" }, ...categorias.map((c) => ({ valor: c.name, etiqueta: c.name }))];
    els.chipsCategorias.innerHTML = opciones.map((o) => chip({ ...o, activo: o.valor === filtros.categoria, dato: "categoria" })).join("");
  }
  if (els.chipsFiltros) {
    els.chipsFiltros.innerHTML = FILTROS.map((f) => chip({ ...f, activo: f.valor === filtros.especial, dato: "filtro" })).join("");
  }
}

function filtrosActivos() {
  const termino = filtros.busqueda.trim();
  return [
    termino && { etiqueta: `“${termino}”`, quitar: "busqueda" },
    filtros.categoria && { etiqueta: filtros.categoria, quitar: "categoria" },
    filtros.especial && { etiqueta: FILTROS.find((f) => f.valor === filtros.especial).etiqueta, quitar: "especial" },
    filtros.orden !== ORDEN_INICIAL && { etiqueta: `Orden: ${ETIQUETAS_ORDEN[filtros.orden]}`, quitar: "orden" },
  ].filter(Boolean);
}

function renderBarra(visibles) {
  const total = estado.productos.length;
  if (els.conteo) els.conteo.textContent = hayFiltros() ? `${visibles} de ${productosLabel(total)}` : productosLabel(total);
  const activos = filtrosActivos();
  if (els.activos) {
    els.activos.innerHTML = activos.map((f) => `
      <span class="filtro-activo">${esc(f.etiqueta)}<button type="button" data-quitar-filtro="${f.quitar}" aria-label="Quitar filtro ${esc(f.etiqueta)}">${icono("x")}</button></span>`).join("");
  }
  if (els.limpiar) els.limpiar.hidden = activos.length === 0;
  if (els.borrar) els.borrar.hidden = !filtros.busqueda;
}

function mensajeVacio() {
  const termino = filtros.busqueda.trim();
  const titulo = termino ? `No hay resultados para “${esc(termino)}”` : "No hay productos con estos filtros";
  return `
    <div class="vacio" style="grid-column:1/-1">
      ${icono("magnifying-glass")}
      <p class="vacio__titulo">${titulo}</p>
      <p class="vacio__texto">en ${esc(nombreSucursal())}. Probá con otra palabra o sacá algún filtro.</p>
      <button class="boton" type="button" data-ver-todo>Ver todo el catálogo</button>
    </div>`;
}

function renderResultados() {
  if (!els.grilla || !estado.catalogoCargado) return;
  const visibles = productosVisibles();
  els.grilla.removeAttribute("aria-busy");
  els.grilla.innerHTML = visibles.length
    ? visibles.map((p, i) => tarjetaHTML(p, { eager: i < 4 })).join("")
    : mensajeVacio();
  renderBarra(visibles.length);
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
  document.querySelectorAll(".cabecera__nav [data-nav]").forEach((link) => {
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

function limpiar({ orden = false } = {}) {
  filtros.categoria = "";
  filtros.especial = "";
  filtros.busqueda = "";
  if (orden) filtros.orden = ORDEN_INICIAL;
  if (els.buscar) els.buscar.value = "";
  if (els.orden) els.orden.value = filtros.orden;
  aplicarCambio();
}

function quitarFiltro(cual) {
  if (cual === "busqueda") {
    filtros.busqueda = "";
    if (els.buscar) els.buscar.value = "";
  } else if (cual === "orden") {
    filtros.orden = ORDEN_INICIAL;
    if (els.orden) els.orden.value = ORDEN_INICIAL;
  } else {
    filtros[cual] = "";
  }
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
    aplicarCambio();
  }
}

export function mostrarCargando() {
  if (els.cargandoInicio) {
    els.cargandoInicio.hidden = false;
    els.errorInicio.hidden = true;
    els.seccionOfertas.hidden = true;
    els.seccionDestacados.hidden = true;
  }
  if (els.grilla) {
    els.grilla.setAttribute("aria-busy", "true");
    els.grilla.innerHTML = Array.from({ length: 6 }, () => `
      <div class="tarjeta-esqueleto" aria-hidden="true"><div class="tarjeta-esqueleto__imagen"></div><div class="tarjeta-esqueleto__linea" style="width:80%"></div><div class="tarjeta-esqueleto__linea" style="width:40%"></div><div class="tarjeta-esqueleto__boton"></div></div>`).join("");
  }
}

export function mostrarErrorCarga() {
  if (els.cargandoInicio) {
    els.cargandoInicio.hidden = true;
    els.errorInicio.hidden = false;
    els.seccionOfertas.hidden = true;
    els.seccionDestacados.hidden = true;
    els.categorias.innerHTML = "";
  }
  if (els.grilla) {
    els.grilla.removeAttribute("aria-busy");
    els.grilla.innerHTML = `
      <div class="falla" role="alert" style="grid-column:1/-1">${icono("cloud-slash")}<div><p class="falla__titulo">Algo salió mal</p><p class="texto-2" style="margin-top:4px">No pudimos cargar los productos. Revisá la conexión y recargá la página.</p></div></div>`;
    if (els.conteo) els.conteo.textContent = "";
  }
}

// Flechas de los carriles: desplazan el carril de su sección.
function moverCarril(boton) {
  const pista = boton.closest("section")?.querySelector("[data-carril-pista]");
  if (!pista) return;
  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  pista.scrollBy({ left: Number(boton.dataset.carril) * pista.clientWidth * 0.85, behavior: reducido ? "auto" : "smooth" });
}

export function iniciarCatalogo() {
  document.addEventListener("click", (event) => {
    const flecha = event.target.closest("[data-carril]");
    if (flecha) moverCarril(flecha);
  });
  els.chipsCategorias?.addEventListener("click", (event) => {
    const boton = event.target.closest("[data-categoria]");
    if (!boton) return;
    // Tocar la categoría activa la desactiva ("Todo").
    filtros.categoria = filtros.categoria === boton.dataset.categoria ? "" : boton.dataset.categoria;
    aplicarCambio();
  });
  els.chipsFiltros?.addEventListener("click", (event) => {
    const boton = event.target.closest("[data-filtro]");
    if (!boton) return;
    filtros.especial = filtros.especial === boton.dataset.filtro ? "" : boton.dataset.filtro;
    aplicarCambio();
  });
  els.buscar?.addEventListener("input", (event) => {
    filtros.busqueda = event.target.value;
    renderResultados();
    sincronizarURL();
  });
  els.borrar?.addEventListener("click", () => {
    quitarFiltro("busqueda");
    els.buscar.focus();
  });
  els.orden?.addEventListener("change", (event) => {
    filtros.orden = event.target.value;
    aplicarCambio();
  });
  els.activos?.addEventListener("click", (event) => {
    const boton = event.target.closest("[data-quitar-filtro]");
    if (boton) quitarFiltro(boton.dataset.quitarFiltro);
  });
  els.limpiar?.addEventListener("click", () => limpiar({ orden: true }));
  els.grilla?.addEventListener("click", (event) => {
    if (event.target.closest("[data-ver-todo]")) limpiar();
  });
}
