// Vista del carrito (cajón) y armado del pedido por WhatsApp.
import { carrito } from "./carrito.js";
import { CONFIG } from "./config.js";
import { buscarProducto } from "./estado.js";
import { esc, money, productosLabel } from "./utils.js";

const els = {
  cartItems: document.querySelector("#cartItems"),
  cartEmpty: document.querySelector("#cartEmpty"),
  cartToolbar: document.querySelector("#cartToolbar"),
  cartItemsLabel: document.querySelector("#cartItemsLabel"),
  clearCart: document.querySelector("#clearCart"),
  subtotalCount: document.querySelector("#subtotalCount"),
  cartCount: document.querySelector("#cartCount"),
  subtotal: document.querySelector("#subtotal"),
  sendOrder: document.querySelector("#sendOrder"),
  customerName: document.querySelector("#customerName"),
};

const TRASH_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// El carrito guarda una copia del producto del momento en que se agregó.
// Si el producto sigue en el catálogo actual, se usa su imagen vigente.
function imagenItem(producto) {
  return (buscarProducto(producto.id) || producto).image || "";
}

export function renderCarrito() {
  const items = carrito.items();
  const totales = carrito.totales();
  if (els.cartItems) {
    els.cartItems.innerHTML = items.map(({ product, quantity }) => {
      const nombre = esc(product.name);
      return `
      <div class="cart-item">
        <img class="cart-thumb" src="${esc(imagenItem(product))}" alt="" loading="lazy">
        <div class="cart-item-info">
          <strong>${nombre}</strong>
          <small>${money(product.price)}</small>
        </div>
        <div class="quantity" role="group" aria-label="Cantidad de ${nombre}">
          <button type="button" data-decrease="${product.id}" aria-label="Restar ${nombre}">−</button>
          <strong>${quantity}</strong>
          <button type="button" data-increase="${product.id}" aria-label="Sumar ${nombre}">+</button>
        </div>
        <strong class="cart-line-total">${money(product.price * quantity)}</strong>
        <button class="remove-item" type="button" data-remove="${product.id}" aria-label="Quitar ${nombre}">${TRASH_ICON}</button>
      </div>`;
    }).join("");
  }
  if (els.cartEmpty) els.cartEmpty.hidden = items.length > 0;
  if (els.cartToolbar) els.cartToolbar.hidden = items.length === 0;
  if (els.cartItemsLabel) els.cartItemsLabel.textContent = productosLabel(totales.cantidad);
  if (els.subtotalCount) els.subtotalCount.textContent = productosLabel(totales.cantidad);
  if (els.cartCount) els.cartCount.textContent = totales.cantidad;
  if (els.subtotal) els.subtotal.textContent = money(totales.subtotal);
  if (els.sendOrder) els.sendOrder.disabled = items.length === 0 || !CONFIG.whatsapp;
}

export function mensajePedido({ nombre }) {
  const totales = carrito.totales();
  const lineas = carrito.items().map(({ product, quantity }) => `* ${product.name} x ${quantity}`);
  return [
    "Hola Nutrivid Corrientes.",
    "",
    "Quisiera realizar el siguiente pedido:",
    "",
    ...lineas,
    "",
    `Total estimado: ${money(totales.subtotal)}`,
    "",
    `Mi nombre es: ${nombre}`,
  ].join("\n");
}

function enviarPedido() {
  if (!carrito.size || !CONFIG.whatsapp) return;
  const nombre = els.customerName?.value.trim() || "";
  const texto = mensajePedido({ nombre });
  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
}

export function iniciarPedido() {
  carrito.onChange(renderCarrito);
  els.cartItems?.addEventListener("click", (event) => {
    const sumar = event.target.closest("[data-increase]");
    const restar = event.target.closest("[data-decrease]");
    const quitar = event.target.closest("[data-remove]");
    if (sumar) carrito.cambiarCantidad(sumar.dataset.increase, 1);
    if (restar) carrito.cambiarCantidad(restar.dataset.decrease, -1);
    if (quitar) carrito.quitar(quitar.dataset.remove);
  });
  els.clearCart?.addEventListener("click", () => carrito.vaciar());
  els.sendOrder?.addEventListener("click", enviarPedido);
}
