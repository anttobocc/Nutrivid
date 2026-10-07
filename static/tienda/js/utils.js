import { CONFIG } from "./config.js";

const formatoPesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export function money(value) {
  return formatoPesos.format(value);
}

// Minúsculas y sin tildes, para comparar "Colágeno" con "colageno".
export function normalizeText(value) {
  return String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Todo texto que viene de la base (cargado desde el panel) pasa por acá antes
// de insertarse con innerHTML.
const ENTIDADES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ENTIDADES[c]);
}

export function productosLabel(cantidad) {
  return `${cantidad} ${cantidad === 1 ? "producto" : "productos"}`;
}

export function unidadesLabel(cantidad) {
  return `${cantidad} ${cantidad === 1 ? "unidad" : "unidades"}`;
}

// Ícono del sprite de Phosphor (static/tienda/img/iconos.svg).
export function icono(nombre, clase = "i") {
  return `<svg class="${clase}" aria-hidden="true" focusable="false"><use href="${CONFIG.iconos}#i-${nombre}"></use></svg>`;
}

export function enlaceWhatsapp(texto) {
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`;
}

export const movimientoReducido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// localStorage puede no estar disponible (modo privado, bloqueado): la
// tienda tiene que seguir funcionando igual, sin persistir.
export const storage = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* sin persistencia */ }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* sin persistencia */ }
  },
};
