// Sucursal de la tienda pública (independiente del login del panel). Al
// cambiar, si el pedido se ve afectado, se muestra antes cómo queda.
import { abrirCapa, aviso, cerrarCapa } from "../../comun/js/interfaz.js";
import { cargarCatalogo, cargarSucursales } from "./api.js";
import { carrito } from "./carrito.js";
import { SUCURSAL_KEY, SUCURSAL_NOMBRE_KEY } from "./config.js";
import { estado, nombreSucursal } from "./estado.js";
import { lineasPara } from "./lineas.js";
import { esc, icono, storage, unidadesLabel } from "./utils.js";

const els = {
  boton: document.getElementById("abrirSucursal"),
  dialogo: document.getElementById("dialogoSucursal"),
  lista: document.getElementById("listaSucursales"),
  impacto: document.getElementById("impactoSucursal"),
  pie: document.getElementById("pieSucursales"),
  placeholder: document.querySelector("[data-placeholder-sucursal]"),
};

let cambiando = null;      // id de la sucursal que se está cargando
let pendiente = null;      // { sucursal, datos } esperando confirmación
let alCambiar = () => {};

function guardar(sucursal) {
  storage.set(SUCURSAL_KEY, String(sucursal.id));
  storage.set(SUCURSAL_NOMBRE_KEY, sucursal.name);
}

// Devuelve el aviso para mostrar si la sucursal guardada dejó de estar activa.
export async function resolverSucursal() {
  estado.sucursales = await cargarSucursales();
  const guardada = storage.get(SUCURSAL_KEY);
  const encontrada = estado.sucursales.find((s) => String(s.id) === guardada);
  if (encontrada) {
    estado.sucursalActual = encontrada.id;
    guardar(encontrada);
    return "";
  }
  // La sucursal guardada ya no existe o está desactivada: se toma la primera activa.
  const nombreAnterior = guardada ? storage.get(SUCURSAL_NOMBRE_KEY) : "";
  storage.remove(SUCURSAL_KEY);
  storage.remove(SUCURSAL_NOMBRE_KEY);
  const primera = estado.sucursales[0];
  estado.sucursalActual = primera?.id ?? null;
  if (!primera) return "";
  guardar(primera);
  return nombreAnterior ? `${nombreAnterior} ya no está disponible. Ahora ves ${primera.name}.` : "";
}

function opcionHTML(s) {
  const elegida = s.id === estado.sucursalActual;
  return `
    <button class="opcion-sucursal" type="button" data-sucursal-id="${s.id}" aria-pressed="${elegida}">
      ${icono("storefront")}
      <span class="opcion-sucursal__textos"><b>${esc(s.name)}</b>${s.address ? `<span>${esc(s.address)}</span>` : ""}</span>
      ${elegida ? `<span class="opcion-sucursal__elegida">${icono("check-circle-fill")}Elegida</span>` : ""}
      ${cambiando === s.id ? '<span class="girador girador--oscuro" aria-label="Cambiando"></span>' : ""}
    </button>`;
}

function renderLista() {
  if (!els.lista) return;
  els.lista.hidden = Boolean(pendiente);
  els.lista.innerHTML = estado.sucursales.map(opcionHTML).join("");
}

export function renderSucursales() {
  const hay = estado.sucursales.length > 0;
  const nombre = hay ? nombreSucursal() : "Sin sucursales";
  document.querySelectorAll("[data-sucursal-nombre]").forEach((el) => { el.textContent = nombre; });
  if (els.placeholder && hay) els.placeholder.placeholder = `Buscar en ${nombre}`;

  // Con una sola sucursal no hay nada que elegir: la píldora queda informativa.
  if (els.boton) {
    const varias = estado.sucursales.length > 1;
    els.boton.disabled = !varias;
    els.boton.classList.toggle("es-vacia", !hay);
    els.boton.setAttribute("aria-label", varias ? `Comprás en ${nombre}. Cambiar sucursal` : hay ? `Comprás en ${nombre}` : "Sin sucursales");
    if (!varias) els.boton.removeAttribute("aria-haspopup");
  }
  renderLista();
  if (els.pie) {
    els.pie.innerHTML = hay
      ? estado.sucursales.map((s) => `<div class="pie__sucursal"><b>${esc(s.name)}</b>${s.address ? `<span>${esc(s.address)}</span>` : ""}</div>`).join("")
      : "<span>Sin sucursales disponibles</span>";
  }
}

// Compara el pedido en la sucursal actual y en la nueva.
function impactoDe(datos, sucursal) {
  const antes = lineasPara();
  const despues = lineasPara(datos.productos, sucursal.name);
  const cambios = [];
  let iguales = 0;
  despues.forEach((l, i) => {
    const a = antes[i];
    if (a && a.efectiva === l.efectiva && a.incluida === l.incluida) {
      iguales += 1;
      return;
    }
    let texto;
    if (!l.incluida) texto = l.motivo === "no-esta" ? `No está en ${sucursal.name}` : `Sin stock en ${sucursal.name}`;
    else if (l.tono === "warn") texto = `Pasa a ${unidadesLabel(l.efectiva)}`;
    else texto = `Vuelve a entrar: ${unidadesLabel(l.efectiva)}`;
    cambios.push({ nombre: l.producto.name, texto, fuera: !l.incluida });
  });
  return { cambios, iguales };
}

function renderImpacto() {
  if (!els.impacto) return;
  if (!pendiente) {
    els.impacto.hidden = true;
    els.impacto.innerHTML = "";
    return;
  }
  const { sucursal, impacto } = pendiente;
  const iguales = impacto.iguales ? `${impacto.iguales} ${impacto.iguales === 1 ? "producto queda" : "productos quedan"} igual. ` : "";
  els.impacto.hidden = false;
  els.impacto.innerHTML = `
    <p class="impacto__titulo">Si cambiás a ${esc(sucursal.name)}, tu pedido cambia así:</p>
    <ul class="impacto__lista">
      ${impacto.cambios.map((c) => `
        <li>${c.fuera ? icono("x-circle", "i") : icono("arrows-down-up", "i")}<span><b>${esc(c.nombre)}</b> · ${esc(c.texto)}</span></li>`).join("")}
    </ul>
    <p class="impacto__nota">${esc(iguales)}No se borra nada: si volvés a esta sucursal, el pedido vuelve a quedar como está.</p>
    <div class="impacto__acciones">
      <button class="boton" type="button" data-confirmar-sucursal>Cambiar a ${esc(sucursal.name)}</button>
      <button class="boton boton--secundario" type="button" data-cancelar-sucursal>Quedarme en ${esc(nombreSucursal())}</button>
    </div>`;
  els.impacto.querySelectorAll(".impacto__lista li").forEach((li, i) => {
    li.querySelector(".i").style.color = impacto.cambios[i].fuera ? "var(--error-texto)" : "var(--aviso-texto)";
  });
  els.impacto.querySelector("[data-confirmar-sucursal]").focus();
}

async function aplicar(sucursal, datos, extra = "") {
  estado.sucursalActual = sucursal.id;
  guardar(sucursal);
  pendiente = null;
  cambiando = null;
  await cerrarCapa(els.dialogo);
  renderImpacto();
  renderSucursales();
  alCambiar(datos);
  aviso(`Ahora ves el stock de ${sucursal.name}.${extra}`);
}

async function elegir(id) {
  if (cambiando) return;
  if (id === estado.sucursalActual) {
    cerrarCapa(els.dialogo);
    return;
  }
  const sucursal = estado.sucursales.find((s) => s.id === id);
  if (!sucursal) return;
  cambiando = id;
  renderLista();
  let datos;
  try {
    datos = await cargarCatalogo(id);
  } catch (error) {
    console.error("Error al cargar la sucursal:", error);
    cambiando = null;
    renderLista();
    aviso(`No pudimos cargar ${sucursal.name}. Probá de nuevo.`, "error");
    return;
  }
  const hayPedido = carrito.size > 0;
  const impacto = impactoDe(datos, sucursal);
  if (hayPedido && impacto.cambios.length) {
    cambiando = null;
    pendiente = { sucursal, datos, impacto };
    renderLista();
    renderImpacto();
    return;
  }
  aplicar(sucursal, datos, hayPedido ? " Tu pedido no cambia." : "");
}

export function iniciarSucursales({ onCambio }) {
  alCambiar = onCambio;
  els.lista?.addEventListener("click", (event) => {
    const opcion = event.target.closest("[data-sucursal-id]");
    if (opcion) elegir(Number(opcion.dataset.sucursalId));
  });
  els.impacto?.addEventListener("click", (event) => {
    if (event.target.closest("[data-confirmar-sucursal]") && pendiente) {
      aplicar(pendiente.sucursal, pendiente.datos);
    } else if (event.target.closest("[data-cancelar-sucursal]")) {
      pendiente = null;
      renderImpacto();
      renderLista();
    }
  });
  els.boton?.addEventListener("click", () => {
    if (estado.sucursales.length > 1) abrirCapa(els.dialogo);
  });
  els.dialogo?.addEventListener("close", () => {
    pendiente = null;
    renderImpacto();
    renderLista();
  });
}
