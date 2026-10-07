// Selector de sucursal pública (independiente del login del panel).
import { cargarSucursales } from "./api.js";
import { SUCURSAL_KEY } from "./config.js";
import { estado } from "./estado.js";
import { esc, storage } from "./utils.js";

const els = {
  trigger: document.querySelector("#sucursalTrigger"),
  label: document.querySelector("#sucursalActualLabel"),
  caret: document.querySelector(".sucursal-trigger-caret"),
  modal: document.querySelector("#sucursalModal"),
  cerrar: document.querySelector("#sucursalModalClose"),
  lista: document.querySelector("#sucursalList"),
};

export async function resolverSucursal() {
  estado.sucursales = await cargarSucursales();
  const guardada = storage.get(SUCURSAL_KEY);
  if (guardada && estado.sucursales.some((s) => String(s.id) === guardada)) {
    estado.sucursalActual = Number(guardada);
    return;
  }
  // La sucursal guardada ya no existe o está desactivada: se toma la primera activa.
  storage.remove(SUCURSAL_KEY);
  estado.sucursalActual = estado.sucursales[0]?.id ?? null;
  if (estado.sucursalActual) storage.set(SUCURSAL_KEY, String(estado.sucursalActual));
}

export function sucursalActual() {
  return estado.sucursales.find((s) => s.id === estado.sucursalActual) || null;
}

export function renderSucursales() {
  const actual = sucursalActual();
  if (els.label) els.label.textContent = actual ? actual.name : "Sin sucursales disponibles";

  // Con 0 o 1 sucursal no hay nada que elegir: el botón queda informativo.
  const hayEleccion = estado.sucursales.length > 1;
  if (els.trigger) {
    els.trigger.disabled = !hayEleccion;
    els.trigger.setAttribute("aria-haspopup", hayEleccion ? "dialog" : "false");
  }
  if (els.caret) els.caret.hidden = !hayEleccion;

  if (!els.lista) return;
  els.lista.innerHTML = estado.sucursales.length
    ? estado.sucursales.map((s) => `
        <li>
          <button type="button" class="sucursal-option ${s.id === estado.sucursalActual ? "is-active" : ""}" data-sucursal-id="${s.id}">
            <span>${esc(s.name)}</span>
            <span class="check" aria-hidden="true">✓ Seleccionada</span>
          </button>
        </li>`).join("")
    : '<li class="sucursal-modal-empty">No hay sucursales disponibles en este momento.</li>';
}

function abrir() {
  if (!els.modal || els.trigger?.disabled) return;
  els.modal.hidden = false;
  els.trigger?.setAttribute("aria-expanded", "true");
}

function cerrar() {
  if (!els.modal) return;
  els.modal.hidden = true;
  els.trigger?.setAttribute("aria-expanded", "false");
}

export function iniciarSucursales({ onCambio }) {
  els.trigger?.addEventListener("click", abrir);
  els.cerrar?.addEventListener("click", cerrar);
  els.modal?.addEventListener("click", (event) => {
    if (event.target === els.modal) cerrar();
  });
  els.lista?.addEventListener("click", (event) => {
    const opcion = event.target.closest("[data-sucursal-id]");
    if (!opcion) return;
    const id = Number(opcion.dataset.sucursalId);
    cerrar();
    if (id === estado.sucursalActual) return;
    estado.sucursalActual = id;
    storage.set(SUCURSAL_KEY, String(id));
    renderSucursales();
    onCambio();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && els.modal && !els.modal.hidden) cerrar();
  });
}
