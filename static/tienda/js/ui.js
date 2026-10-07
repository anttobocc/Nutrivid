// Comportamiento general de la interfaz: menú, cajón del carrito y estado
// activo del menú cuando cambia el #hash en el inicio.
const els = {
  menuToggle: document.querySelector(".menu-toggle"),
  navLinks: document.querySelector("#primary-menu"),
  openCart: document.querySelector("#openCart"),
  cartDrawer: document.querySelector("#cartDrawer"),
};

export function abrirCarrito() {
  if (!els.cartDrawer) return;
  els.cartDrawer.classList.add("is-open");
  els.cartDrawer.setAttribute("aria-hidden", "false");
  els.openCart?.setAttribute("aria-expanded", "true");
  document.body.classList.add("cart-open");
}

export function cerrarCarrito() {
  if (!els.cartDrawer) return;
  els.cartDrawer.classList.remove("is-open");
  els.cartDrawer.setAttribute("aria-hidden", "true");
  els.openCart?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("cart-open");
}

function cerrarMenu() {
  els.navLinks?.classList.remove("is-open");
  document.body.classList.remove("menu-open");
  els.menuToggle?.setAttribute("aria-expanded", "false");
}

// El servidor ya marca el ítem activo (aria-current) según la página. En el
// inicio, "Categorías" es un ancla: se actualiza cuando cambia el hash.
function resaltarAncla() {
  if (document.body.dataset.page !== "home" || !els.navLinks) return;
  const activo = window.location.hash === "#categorias" ? "categorias" : "inicio";
  els.navLinks.querySelectorAll("a[data-nav]").forEach((link) => {
    if (link.dataset.nav === activo) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

export function iniciarUI() {
  resaltarAncla();
  window.addEventListener("hashchange", resaltarAncla);

  els.menuToggle?.addEventListener("click", () => {
    const abierto = els.navLinks.classList.toggle("is-open");
    document.body.classList.toggle("menu-open", abierto);
    els.menuToggle.setAttribute("aria-expanded", String(abierto));
  });
  els.navLinks?.addEventListener("click", (event) => {
    if (event.target.closest("a")) cerrarMenu();
  });

  els.openCart?.addEventListener("click", abrirCarrito);
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-cart]")) cerrarCarrito();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") cerrarCarrito();
  });
}
