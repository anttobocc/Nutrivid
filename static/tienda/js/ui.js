// Comportamiento general de la interfaz: diálogos y avisos.
import { icono, movimientoReducido } from "./utils.js";

const DURACION_CIERRE_MS = 200;
const abiertos = new Set();

function bloquearScroll() {
  document.documentElement.classList.toggle("sin-scroll", abiertos.size > 0);
}

// Los <dialog> nativos ya manejan el foco, Escape y la capa superior. Acá se
// suma la animación de salida: se marca data-cerrando, se espera la
// transición (definida en dialogos.css) y recién ahí se cierra.
export function abrirDialogo(dialogo) {
  if (!dialogo || dialogo.open) return;
  delete dialogo.dataset.cerrando;
  dialogo.showModal();
  abiertos.add(dialogo);
  bloquearScroll();
}

export function cerrarDialogo(dialogo) {
  if (!dialogo?.open || dialogo.dataset.cerrando !== undefined) return;
  const terminar = () => {
    dialogo.close();
    delete dialogo.dataset.cerrando;
  };
  if (movimientoReducido()) {
    terminar();
    return;
  }
  dialogo.dataset.cerrando = "";
  setTimeout(terminar, DURACION_CIERRE_MS);
}

function prepararDialogo(dialogo) {
  dialogo.addEventListener("cancel", (event) => {
    event.preventDefault();
    cerrarDialogo(dialogo);
  });
  dialogo.addEventListener("close", () => {
    abiertos.delete(dialogo);
    bloquearScroll();
  });
  // Clic en el velo (fuera del contenido) o en un botón [data-cerrar].
  dialogo.addEventListener("click", (event) => {
    if (event.target === dialogo || event.target.closest("[data-cerrar]")) cerrarDialogo(dialogo);
  });
}

const avisos = document.getElementById("avisos");

export function aviso(texto, { icono: nombreIcono = "info", duracion = 3200 } = {}) {
  if (!avisos) return;
  const el = document.createElement("div");
  el.className = "aviso";
  el.innerHTML = `${icono(nombreIcono)}<span></span>`;
  el.querySelector("span").textContent = texto;
  avisos.append(el);
  setTimeout(() => {
    el.dataset.saliendo = "";
    setTimeout(() => el.remove(), DURACION_CIERRE_MS);
  }, duracion);
}

export function iniciarUI() {
  document.querySelectorAll("dialog.panel").forEach(prepararDialogo);
}
