// Pedido: diálogo del carrito en tres pasos (armar, confirmar, listo), barra
// fija en celular y contador de la cabecera. El pedido se envía abriendo
// WhatsApp con el mensaje armado; no hay pagos ni backend de pedidos.
import { carrito, datosPedido } from "./carrito.js";
import { CONFIG } from "./config.js";
import { buscarProducto, estado, estadoStock, nombreSucursal } from "./estado.js";
import { imagenHTML } from "./tarjetas.js";
import { abrirDialogo } from "./ui.js";
import { enlaceWhatsapp, esc, icono, money, productosLabel, unidadesLabel } from "./utils.js";

const $ = (id) => document.getElementById(id);
const els = {
  dialogo: $("dialogoCarrito"),
  sub: $("carritoSub"),
  vacio: $("carritoVacio"),
  lineas: $("carritoLineas"),
  form: $("formPedido"),
  campoNombre: $("campoNombre"),
  nombre: $("pedidoNombre"),
  nombreError: $("pedidoNombreError"),
  notas: $("pedidoNotas"),
  mensaje: $("mensajePedido"),
  pie: $("carritoPie"),
  total: $("carritoTotal"),
  volver: $("volverPedido"),
  whatsapp: $("abrirWhatsapp"),
  vaciar: $("vaciarPedido"),
  contador: $("carritoContador"),
  botonCarrito: $("abrirCarrito"),
  barra: $("barraPedido"),
  barraCantidad: $("barraCantidad"),
  barraTotal: $("barraTotal"),
};

let paso = "armar";

// Cada ítem del carrito cruzado con el catálogo de la sucursal actual: el
// precio y el stock vigentes mandan sobre la copia guardada.
function lineasPedido() {
  return carrito.items().map(({ product, quantity }) => {
    const vigente = estado.catalogoCargado ? buscarProducto(product.id) : product;
    const stock = vigente ? estadoStock(vigente) : null;
    return {
      producto: vigente || product,
      cantidad: quantity,
      disponible: Boolean(vigente && stock.disponible),
      enCatalogo: Boolean(vigente),
      maximo: stock?.maximo ?? 0,
    };
  });
}

function resumen(lineas = lineasPedido()) {
  return lineas.filter((l) => l.disponible).reduce((acc, l) => {
    acc.cantidad += Math.min(l.cantidad, l.maximo);
    acc.total += Math.min(l.cantidad, l.maximo) * l.producto.price;
    return acc;
  }, { cantidad: 0, total: 0 });
}

function lineaHTML(l) {
  const p = l.producto;
  const nombre = esc(p.name);
  let avisoLinea = "";
  if (!l.enCatalogo) avisoLinea = `No está en ${esc(nombreSucursal())}. No se incluye en el pedido.`;
  else if (!l.disponible) avisoLinea = `Sin stock en ${esc(nombreSucursal())}. No se incluye en el pedido.`;
  else if (l.cantidad > l.maximo) avisoLinea = `Hay ${unidadesLabel(l.maximo)} en ${esc(nombreSucursal())}. Pedimos esa cantidad.`;
  const cantidad = l.disponible ? Math.min(l.cantidad, l.maximo) : l.cantidad;
  return `
    <li class="linea${l.disponible ? "" : " linea--no-disponible"}">
      <div class="pozo">${imagenHTML(p)}</div>
      <p class="linea__nombre">${nombre}</p>
      <p class="linea__total">${l.disponible ? money(p.price * cantidad) : ""}</p>
      <div class="linea__controles">
        ${l.disponible ? `
          <div class="cantidad" role="group" aria-label="Cantidad de ${nombre}">
            <button type="button" data-restar="${p.id}" aria-label="${cantidad === 1 ? "Quitar" : "Restar uno de"} ${nombre}">${icono(cantidad === 1 ? "trash" : "minus")}</button>
            <output>${cantidad}</output>
            <button type="button" data-sumar="${p.id}" aria-label="Sumar uno de ${nombre}"${cantidad >= l.maximo ? " disabled" : ""}>${icono("plus")}</button>
          </div>
          <span class="linea__unitario">${money(p.price)} c/u</span>`
          : `<button class="enlace" type="button" data-quitar="${p.id}">Quitar</button>`}
      </div>
      ${avisoLinea ? `<p class="linea__aviso">${icono("warning-circle")}${avisoLinea}</p>` : ""}
    </li>`;
}

export function mensajePedido({ nombre, notas }, lineas = lineasPedido()) {
  const incluidas = lineas.filter((l) => l.disponible);
  const { total } = resumen(lineas);
  const items = incluidas.map((l) => {
    const cantidad = Math.min(l.cantidad, l.maximo);
    return `• ${l.producto.name}, ${unidadesLabel(cantidad)}: ${money(l.producto.price * cantidad)}`;
  });
  return [
    `Hola Nutrivid, quiero hacer este pedido en ${nombreSucursal()}:`,
    "",
    ...items,
    "",
    `Total estimado: ${money(total)}`,
    `Nombre: ${nombre}`,
    ...(notas ? [`Notas: ${notas}`] : []),
  ].join("\n");
}

function irAPaso(nuevo) {
  paso = nuevo;
  els.dialogo.querySelectorAll("[data-paso]").forEach((s) => { s.hidden = s.dataset.paso !== paso; });
  els.dialogo.querySelectorAll("[data-pie]").forEach((s) => { s.hidden = s.dataset.pie !== paso; });
  els.dialogo.querySelector(".panel__cuerpo").scrollTop = 0;
}

function validarNombre() {
  const valido = els.nombre.value.trim().length >= 2;
  els.nombreError.hidden = valido;
  els.campoNombre.classList.toggle("campo--error", !valido);
  els.nombre.setAttribute("aria-invalid", String(!valido));
  return valido;
}

function datos() {
  return { nombre: els.nombre.value.trim(), notas: els.notas.value.trim() };
}

export function renderPedido() {
  const lineas = lineasPedido();
  const { cantidad, total } = resumen(lineas);
  const hayItems = lineas.length > 0;
  const hayIncluidos = lineas.some((l) => l.disponible);

  // Contador y barra fija
  els.contador.hidden = cantidad === 0;
  els.contador.textContent = cantidad;
  els.botonCarrito.setAttribute("aria-label", cantidad ? `Ver pedido, ${productosLabel(cantidad)}` : "Ver pedido");
  els.barra.hidden = cantidad === 0;
  document.documentElement.classList.toggle("con-barra", cantidad > 0);
  els.barraCantidad.textContent = productosLabel(cantidad);
  els.barraTotal.textContent = money(total);

  // Diálogo
  els.sub.textContent = estado.sucursalActual ? `En ${nombreSucursal()}` : "";
  els.vacio.hidden = hayItems;
  els.form.hidden = !hayIncluidos;
  els.pie.hidden = !hayItems && paso !== "listo";
  els.total.textContent = money(total);
  els.lineas.innerHTML = lineas.map(lineaHTML).join("");
  els.dialogo.querySelector('[data-pie="armar"] button').disabled = !hayIncluidos;
  if (!hayItems && paso === "confirmar") irAPaso("armar");
}

function confirmar(event) {
  event.preventDefault();
  if (!validarNombre()) {
    els.nombre.focus();
    return;
  }
  datosPedido.guardar(datos());
  const texto = mensajePedido(datos());
  els.mensaje.textContent = texto;
  if (CONFIG.whatsapp) {
    els.whatsapp.href = enlaceWhatsapp(texto);
    els.whatsapp.removeAttribute("aria-disabled");
  } else {
    els.whatsapp.removeAttribute("href");
    els.whatsapp.setAttribute("aria-disabled", "true");
  }
  irAPaso("confirmar");
}

export function abrirPedido() {
  if (paso !== "listo") irAPaso("armar");
  renderPedido();
  abrirDialogo(els.dialogo);
}

export function iniciarPedido() {
  const guardados = datosPedido.leer();
  els.nombre.value = guardados.nombre;
  els.notas.value = guardados.notas;

  els.form.addEventListener("submit", confirmar);
  els.nombre.addEventListener("input", () => {
    if (!els.nombreError.hidden) validarNombre();
  });
  els.form.addEventListener("change", () => datosPedido.guardar(datos()));
  els.volver.addEventListener("click", () => irAPaso("armar"));
  els.whatsapp.addEventListener("click", () => {
    if (els.whatsapp.hasAttribute("href")) irAPaso("listo");
  });
  els.vaciar.addEventListener("click", () => {
    carrito.vaciar();
    irAPaso("armar");
  });
  els.dialogo.addEventListener("close", () => {
    if (paso === "listo") irAPaso("armar");
  });
  if (!CONFIG.whatsapp) console.warn("Falta WHATSAPP_NUMBER: no se pueden enviar pedidos.");
}
