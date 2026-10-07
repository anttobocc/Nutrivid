import { CONFIG } from "./config.js";

async function getJSON(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Respuesta ${res.status} de ${url}`);
  return res.json();
}

export function cargarSucursales() {
  return getJSON(CONFIG.urls.api.sucursales);
}

export async function cargarCatalogo(sucursalId) {
  const query = `?sucursal=${encodeURIComponent(sucursalId)}`;
  const [productos, categorias] = await Promise.all([
    getJSON(CONFIG.urls.api.productos + query),
    getJSON(CONFIG.urls.api.categorias + query),
  ]);
  return { productos, categorias };
}
