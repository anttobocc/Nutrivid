// Comportamiento compartido por la tienda y el panel: capas (<dialog>),
// avisos flotantes y mensajes que se pueden cerrar.
//
// Capas: <dialog class="capa ..."> con un .capa__velo y el contenido
// (.hoja, .lateral o .modal). El <dialog> nativo maneja el foco, Escape y la
// capa superior; acá se suma la animación de salida con [data-cerrando].
//   - [data-abrir="id"] abre el <dialog id="id">.
//   - [data-cerrar] o un clic en el velo cierran la capa que los contiene.

const CIERRE_MS = { hoja: 190, lateral: 200, modal: 150 };
const AVISO_MS = 3200;
const MAX_AVISOS = 3;

export const movimientoReducido = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

function duracionCierre(dialogo) {
  if (dialogo.querySelector(".lateral, .hoja--lateral")) return CIERRE_MS.lateral;
  if (dialogo.querySelector(".hoja")) return CIERRE_MS.hoja;
  return CIERRE_MS.modal;
}

function actualizarScroll() {
  const hayAbiertas = document.querySelector("dialog.capa[open]") !== null;
  document.documentElement.classList.toggle("sin-scroll", hayAbiertas);
}

export function abrirCapa(dialogo) {
  if (!dialogo || dialogo.open) return;
  delete dialogo.dataset.cerrando;
  dialogo.showModal();
  // Como en el diseño, el foco va al contenedor de la capa (no al primer
  // botón), salvo que un campo pida autofocus.
  const contenido = dialogo.querySelector(".hoja, .lateral, .modal");
  if (contenido && !dialogo.querySelector("[autofocus]")) {
    contenido.setAttribute("tabindex", "-1");
    contenido.focus({ preventScroll: true });
  }
  actualizarScroll();
  // Si hay avisos en pantalla, siguen por encima de la capa nueva.
  const avisos = document.getElementById("avisos");
  if (avisos?.matches?.(":popover-open")) traerAvisosAlFrente(avisos);
  dialogo.dispatchEvent(new CustomEvent("capa:abierta"));
}

export function cerrarCapa(dialogo) {
  if (!dialogo?.open || dialogo.dataset.cerrando !== undefined) return Promise.resolve();
  return new Promise((resolver) => {
    const terminar = () => {
      dialogo.close();
      delete dialogo.dataset.cerrando;
      actualizarScroll();
      dialogo.dispatchEvent(new CustomEvent("capa:cerrada"));
      resolver();
    };
    if (movimientoReducido()) {
      terminar();
      return;
    }
    dialogo.dataset.cerrando = "";
    setTimeout(terminar, duracionCierre(dialogo));
  });
}

function prepararCapa(dialogo) {
  if (dialogo.dataset.capaLista) return;
  dialogo.dataset.capaLista = "1";
  // Escape: cerrar con animación en lugar del cierre seco del navegador.
  dialogo.addEventListener("cancel", (event) => {
    event.preventDefault();
    if (dialogo.dataset.bloqueada === undefined) cerrarCapa(dialogo);
  });
  dialogo.addEventListener("click", (event) => {
    const objetivo = event.target;
    if (objetivo.classList?.contains("capa__velo") || objetivo.closest("[data-cerrar]")) {
      if (dialogo.dataset.bloqueada === undefined || objetivo.closest("[data-cerrar]")) cerrarCapa(dialogo);
    }
  });
}

// ---------- Avisos flotantes ----------
function contenedorAvisos() {
  let cont = document.getElementById("avisos");
  if (!cont) {
    cont = document.createElement("div");
    cont.id = "avisos";
    cont.className = "avisos";
    cont.setAttribute("role", "status");
    cont.setAttribute("aria-live", "polite");
    document.body.append(cont);
  }
  return cont;
}

export function aviso(texto, tono = "info") {
  const cont = contenedorAvisos();
  while (cont.children.length >= MAX_AVISOS) cont.firstElementChild.remove();
  const el = document.createElement("div");
  el.className = tono === "error" ? "aviso aviso--error" : "aviso";
  el.textContent = texto;
  cont.append(el);
  traerAvisosAlFrente(cont);
  setTimeout(() => {
    el.remove();
    if (!cont.children.length && cont.matches?.(":popover-open")) cont.hidePopover();
  }, AVISO_MS);
}

// Los <dialog> abiertos están en la capa superior del navegador. Para que los
// avisos se vean por encima (como en el diseño), el contenedor es un popover
// y se vuelve a mostrar para quedar último en esa capa.
function traerAvisosAlFrente(cont) {
  if (!cont.showPopover) return;
  if (!cont.hasAttribute("popover")) cont.setAttribute("popover", "manual");
  if (cont.matches(":popover-open")) cont.hidePopover();
  cont.showPopover();
}

// ---------- Inicio ----------
export function iniciarInterfaz(raiz = document) {
  raiz.querySelectorAll("dialog.capa").forEach(prepararCapa);
}

document.addEventListener("click", (event) => {
  const abridor = event.target.closest("[data-abrir]");
  if (abridor) {
    event.preventDefault();
    const dialogo = document.getElementById(abridor.dataset.abrir);
    if (dialogo) {
      prepararCapa(dialogo);
      abrirCapa(dialogo);
    }
    return;
  }
  const cierreMensaje = event.target.closest("[data-cerrar-mensaje]");
  if (cierreMensaje) cierreMensaje.closest(".mensaje")?.remove();
});

iniciarInterfaz();
