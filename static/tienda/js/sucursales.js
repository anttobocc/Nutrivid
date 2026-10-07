// Selector de sucursal pública (independiente del login del panel).
import { cargarSucursales } from "./api.js";
import { SUCURSAL_KEY } from "./config.js";
import { estado, nombreSucursal } from "./estado.js";
import { abrirDialogo, cerrarDialogo } from "./ui.js";
import { esc, icono, storage } from "./utils.js";

const els = {
  boton: document.getElementById("abrirSucursal"),
  dialogo: document.getElementById("dialogoSucursal"),
  lista: document.getElementById("listaSucursales"),
  pie: document.getElementById("pieSucursales"),
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

export function renderSucursales() {
  const nombre = estado.sucursalActual ? nombreSucursal() : "Sin sucursales";
  document.querySelectorAll("[data-sucursal-nombre]").forEach((el) => { el.textContent = nombre; });

  // Con una sola sucursal no hay nada que elegir: el botón queda informativo.
  if (els.boton) {
    els.boton.disabled = estado.sucursales.length < 2;
    els.boton.setAttribute("aria-label", `Sucursal: ${nombre}${els.boton.disabled ? "" : ". Cambiar sucursal"}`);
  }

  if (els.lista) {
    els.lista.innerHTML = estado.sucursales.map((s) => `
      <li>
        <button class="opcion-sucursal" type="button" data-sucursal-id="${s.id}" aria-pressed="${s.id === estado.sucursalActual}">
          ${icono("storefront")}
          <span>${esc(s.name)}${s.address ? `<small>${esc(s.address)}</small>` : ""}</span>
          ${icono("check", "i i--elegida")}
        </button>
      </li>`).join("");
  }
  if (els.pie) {
    els.pie.innerHTML = estado.sucursales.length
      ? estado.sucursales.map((s) => `<li>${esc(s.name)}${s.address ? `, ${esc(s.address)}` : ""}</li>`).join("")
      : "<li>Sin sucursales disponibles</li>";
  }
}

export function iniciarSucursales({ onCambio }) {
  els.boton?.addEventListener("click", () => abrirDialogo(els.dialogo));
  els.lista?.addEventListener("click", (event) => {
    const opcion = event.target.closest("[data-sucursal-id]");
    if (!opcion) return;
    const id = Number(opcion.dataset.sucursalId);
    cerrarDialogo(els.dialogo);
    if (id === estado.sucursalActual) return;
    estado.sucursalActual = id;
    storage.set(SUCURSAL_KEY, String(id));
    renderSucursales();
    onCambio();
  });
}
