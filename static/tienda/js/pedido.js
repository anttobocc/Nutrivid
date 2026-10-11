// Pedido: hoja del carrito en tres pasos (armar, confirmar, listo), barra
// fija en celular y contador de la cabecera. El pedido se envía abriendo
// WhatsApp con el mensaje armado; no hay pagos ni backend de pedidos.
import { abrirCapa, aviso, cerrarCapa } from "../../comun/js/interfaz.js";
import { carrito, datosPedido } from "./carrito.js";
import { CONFIG } from "./config.js";
import { estado, nombreSucursal } from "./estado.js";
import { lineasPara, resumen } from "./lineas.js";
import { enlaceWhatsapp, esc, icono, money, productosLabel, unidadesLabel } from "./utils.js";

const $ = (id) => document.getElementById(id);
const els = {
  dialogo: $("dialogoCarrito"),
  vacio: $("carritoVacio"),
  armar: $("carritoArmar"),
  pieArmar: $("carritoPieArmar"),
  lineas: $("carritoLineas"),
  form: $("formPedido"),
  nombre: $("pedidoNombre"),
  nombreError: $("pedidoNombreError"),
  notas: $("pedidoNotas"),
  contadorNotas: $("pedidoNotasContador"),
  revisar: $("revisarPedido"),
  mensaje: $("mensajePedido"),
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

function lineas() {
  // Sin sucursales no hay dónde pedir: el pedido guardado no se muestra.
  if (estado.sinSucursales) return [];
  // Antes de que cargue el catálogo, el pedido se muestra con lo guardado.
  if (!estado.catalogoCargado) {
    return carrito.items().map(({ product, quantity }) => ({ producto: product, cantidad: quantity, efectiva: quantity, incluida: true, tono: "ok", nota: "" }));
  }
  return lineasPara();
}

function lineaHTML(l) {
  const p = l.producto;
  const nombre = esc(p.name);
  const maximo = Number(p.stock) || 0;
  const imagen = p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy" decoding="async">` : icono("package");
  const controles = l.incluida
    ? `<div class="cantidad cantidad--linea" role="group" aria-label="Cantidad de ${nombre}">
        <button type="button" data-restar="${p.id}" aria-label="${l.efectiva === 1 ? `Quitar ${nombre}` : "Restar uno"}">${icono(l.efectiva === 1 ? "trash" : "minus")}</button>
        <output aria-live="polite">${l.efectiva}</output>
        <button type="button" data-sumar="${p.id}" aria-label="Sumar uno"${estado.catalogoCargado && l.efectiva >= maximo ? " disabled" : ""}>${icono("plus")}</button>
      </div>`
    : `<button class="boton boton--secundario linea__quitar" type="button" data-quitar="${p.id}">${icono("trash")}<span>Quitar</span></button>`;
  return `
    <li class="linea${l.incluida ? "" : " linea--excluida"}">
      <div class="linea__fila">
        <span class="linea__imagen">${imagen}</span>
        <div><p class="linea__nombre">${nombre}</p><p class="linea__unitario">${money(p.price)} c/u</p></div>
        <p class="linea__subtotal">${l.incluida ? money(l.efectiva * p.price) : "—"}</p>
      </div>
      ${l.nota ? `<p class="linea__nota${l.tono === "fuera" ? " linea__nota--fuera" : ""}">${icono("info")}<span>${esc(l.nota)}</span></p>` : ""}
      <div class="linea__controles">${controles}</div>
    </li>`;
}

export function mensajePedido({ nombre, notas }, todas = lineas()) {
  const incluidas = todas.filter((l) => l.incluida);
  const { total } = resumen(todas);
  return [
    `Hola Nutrivid, quiero hacer este pedido en ${nombreSucursal()}:`,
    "",
    ...incluidas.map((l) => `• ${l.producto.name}, ${unidadesLabel(l.efectiva)}: ${money(l.efectiva * l.producto.price)}`),
    "",
    `Total estimado: ${money(total)}`,
    `Nombre: ${nombre}`,
    ...(notas ? [`Notas: ${notas}`] : []),
  ].join("\n");
}

function irAPaso(nuevo) {
  paso = nuevo;
  renderPedido();
}

function datos() {
  return { nombre: els.nombre.value.trim(), notas: els.notas.value.trim() };
}

function mostrarErrorNombre(mostrar) {
  els.nombreError.hidden = !mostrar;
  els.nombre.setAttribute("aria-invalid", String(mostrar));
}

export function renderPedido() {
  const todas = lineas();
  const { unidades, total } = resumen(todas);
  const hayItems = todas.length > 0;
  const hayIncluidos = todas.some((l) => l.incluida);

  // Contador y barra fija
  els.contador.hidden = unidades === 0;
  els.contador.textContent = unidades;
  els.botonCarrito.setAttribute("aria-label", `Ver pedido, ${productosLabel(unidades)}`);
  els.barra.hidden = unidades === 0;
  document.documentElement.classList.toggle("con-barra", unidades > 0);
  els.barraCantidad.textContent = productosLabel(unidades);
  els.barraTotal.textContent = money(total);

  // Si se vació el pedido mientras se confirmaba, se vuelve a armar.
  if (!hayIncluidos && paso === "confirmar") paso = "armar";

  // Hoja
  els.dialogo.querySelectorAll("[data-paso]").forEach((el) => { el.hidden = el.dataset.paso !== paso; });
  if (paso === "armar") {
    els.vacio.hidden = hayItems;
    els.armar.hidden = !hayItems;
    els.pieArmar.hidden = !hayItems;
  }
  els.form.hidden = !hayIncluidos;
  els.revisar.disabled = !hayIncluidos;
  els.total.textContent = money(total);
  els.lineas.innerHTML = todas.map(lineaHTML).join("");
}

function revisar(event) {
  event.preventDefault();
  const nombre = els.nombre.value.trim();
  if (nombre.length < 2 || nombre.length > 80) {
    mostrarErrorNombre(true);
    els.nombre.focus();
    return;
  }
  mostrarErrorNombre(false);
  datosPedido.guardar(datos());
  const texto = mensajePedido(datos());
  els.mensaje.textContent = texto;
  if (CONFIG.whatsapp) els.whatsapp.href = enlaceWhatsapp(texto);
  else els.whatsapp.removeAttribute("href");
  irAPaso("confirmar");
}

export function abrirPedido() {
  if (paso !== "listo") paso = "armar";
  renderPedido();
  abrirCapa(els.dialogo);
}

export function iniciarPedido() {
  const guardados = datosPedido.leer();
  els.nombre.value = guardados.nombre;
  els.notas.value = guardados.notas;
  els.contadorNotas.textContent = `${els.notas.value.length}/300`;

  els.form.addEventListener("submit", revisar);
  els.nombre.addEventListener("input", () => {
    mostrarErrorNombre(false);
    datosPedido.guardar(datos());
  });
  els.notas.addEventListener("input", () => {
    els.contadorNotas.textContent = `${els.notas.value.length}/300`;
    datosPedido.guardar(datos());
  });
  els.volver.addEventListener("click", () => irAPaso("armar"));
  els.whatsapp.addEventListener("click", (event) => {
    if (!CONFIG.whatsapp) {
      event.preventDefault();
      return;
    }
    irAPaso("listo");
  });
  els.vaciar.addEventListener("click", async () => {
    carrito.vaciar();
    await cerrarCapa(els.dialogo);
    aviso("Vaciaste el pedido.");
  });
  els.dialogo.addEventListener("close", () => {
    if (paso === "listo") {
      paso = "armar";
      renderPedido();
    }
  });
  if (!CONFIG.whatsapp) console.warn("Falta WHATSAPP_NUMBER: no se pueden enviar pedidos.");
}
