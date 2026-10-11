// Comportamiento del panel. Todo lo que guarda datos sigue siendo un
// formulario POST a las vistas de Django; acá solo se suma la interacción
// del diseño (paneles, filtros, avisos en vivo, confirmaciones).
import { abrirCapa, cerrarCapa } from "../../comun/js/interfaz.js";

const $ = (selector, raiz = document) => raiz.querySelector(selector);
const $$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];
const normalizar = (texto) => String(texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/* ---------- Capas que se abren al cargar (alta/edición con errores) ---------- */
function abrirAlCargar() {
  $$("dialog[data-abrir-al-cargar]").forEach((dialogo) => abrirCapa(dialogo));
  // Al cerrar un panel abierto desde su propia URL (/productos/7/editar/),
  // la dirección vuelve a la de la lista sin recargar.
  $$("dialog[data-al-cerrar]").forEach((dialogo) => {
    dialogo.addEventListener("close", () => {
      const destino = dialogo.dataset.alCerrar;
      if (window.location.pathname !== destino) history.replaceState(null, "", destino);
    });
  });
}

/* ---------- Enviar: botón con "Guardando…" ---------- */
function prepararEnvios() {
  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!form.matches("[data-formulario-envio]") || event.defaultPrevented) return;
    const boton = $("[data-texto-envio]", form);
    if (!boton) return;
    // Se deshabilita en el próximo ciclo para no cortar el envío.
    setTimeout(() => {
      boton.disabled = true;
      boton.innerHTML = `<span class="girador"></span><span></span>`;
      boton.lastElementChild.textContent = boton.dataset.textoEnvio;
    });
    delete form.dataset.sucio;
  });
}

/* ---------- Cambios sin guardar ---------- */
function prepararCambios() {
  $$("form[data-avisar-cambios]").forEach((form) => {
    const marcar = () => { form.dataset.sucio = "1"; };
    form.addEventListener("input", marcar);
    form.addEventListener("change", marcar);
    form.closest("dialog")?.addEventListener("close", () => { delete form.dataset.sucio; });
  });
}

function formularioSucio() {
  return $$("dialog[open] form[data-sucio]")[0] || null;
}

let dialogoCambios = null;
function confirmarDescartar(destino, alConfirmar) {
  if (!dialogoCambios) {
    dialogoCambios = document.createElement("dialog");
    dialogoCambios.className = "capa capa--modal";
    dialogoCambios.setAttribute("aria-labelledby", "cambios-t");
    dialogoCambios.innerHTML = `
      <div class="capa__velo"></div>
      <div class="modal">
        <h2 class="titulo-dialogo" id="cambios-t">Tenés cambios sin guardar</h2>
        <p class="modal__texto"></p>
        <div class="modal__acciones">
          <button class="boton boton--secundario" type="button" data-cerrar>Seguir editando</button>
          <button class="boton" type="button" data-descartar>Descartar y cambiar</button>
        </div>
      </div>`;
    document.body.append(dialogoCambios);
  }
  const actual = $(".selector-sucursal__nombre")?.textContent.trim() || "esta sucursal";
  $(".modal__texto", dialogoCambios).textContent = `El formulario abierto es de ${actual}. Si cambiás a ${destino}, se pierden esos cambios.`;
  $("[data-descartar]", dialogoCambios).onclick = () => {
    $$("dialog[open] form[data-sucio]").forEach((f) => delete f.dataset.sucio);
    alConfirmar();
  };
  abrirCapa(dialogoCambios);
}

/* ---------- Menú de sucursal activa ---------- */
function prepararMenuSucursal() {
  const boton = $("#botonSucursal");
  const menu = $("#menuSucursal");
  if (!boton || !menu) return;
  const abrir = (si) => {
    menu.hidden = !si;
    boton.setAttribute("aria-expanded", String(si));
    if (si) $('[aria-selected="true"]', menu)?.focus() || $("button", menu)?.focus();
  };
  boton.addEventListener("click", () => abrir(menu.hidden));
  document.addEventListener("click", (event) => {
    if (!menu.hidden && !event.target.closest(".selector-sucursal")) abrir(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) {
      abrir(false);
      boton.focus();
    }
  });
  menu.addEventListener("click", (event) => {
    const opcion = event.target.closest("[name='sucursal_id']");
    if (!opcion) return;
    if (opcion.getAttribute("aria-selected") === "true") {
      event.preventDefault();
      abrir(false);
      return;
    }
    if (formularioSucio()) {
      event.preventDefault();
      abrir(false);
      confirmarDescartar(opcion.dataset.nombre, () => menu.requestSubmit(opcion));
    }
  });
}

/* ---------- Formulario de producto ---------- */
function numero(valor) {
  const texto = String(valor || "").trim().replace(",", ".");
  if (!texto) return null;
  const n = Number(texto);
  return Number.isFinite(n) ? n : null;
}

function prepararProducto(form) {
  const precio = $("[name='precio']", form);
  const anterior = $("[name='precio_anterior']", form);
  const avisoCero = $("[data-aviso-precio-cero]", form);
  const avisoAnterior = $("[data-aviso-precio-anterior]", form);
  const revisarPrecios = () => {
    const p = numero(precio?.value);
    const a = numero(anterior?.value);
    if (avisoCero) avisoCero.hidden = p !== 0;
    if (avisoAnterior) avisoAnterior.hidden = !(p !== null && a !== null && a <= p);
  };
  precio?.addEventListener("input", revisarPrecios);
  anterior?.addEventListener("input", revisarPrecios);
  revisarPrecios();

  // Nombre repetido en el catálogo global (solo al crear: el panel avisa,
  // no bloquea; la regla de negocio no cambia).
  const nombre = $("[name='nombre']", form);
  const avisoDuplicado = $("[data-aviso-duplicado]", form);
  if (nombre && avisoDuplicado) {
    const nombres = JSON.parse($("#nombres-productos")?.textContent || "[]");
    const revisarNombre = () => {
      const buscado = normalizar(nombre.value);
      const existente = buscado ? nombres.find((n) => normalizar(n) === buscado) : null;
      avisoDuplicado.hidden = !existente;
      if (existente) avisoDuplicado.lastElementChild.textContent = `Ya existe «${existente}» en el catálogo global. Si seguís, se crea otra ficha con el mismo nombre.`;
    };
    nombre.addEventListener("input", revisarNombre);
    revisarNombre();
  }

  // Vista previa de la imagen elegida.
  const archivo = $("[data-entrada-imagen]", form);
  archivo?.addEventListener("change", () => {
    const foto = archivo.files?.[0];
    const vista = $("[data-vista-imagen]", form);
    if (!foto || !vista) return;
    if (!/^image\/(jpeg|png|webp)$/.test(foto.type)) return;
    const img = document.createElement("img");
    img.className = "selector-imagen__vista";
    img.alt = "";
    img.dataset.vistaImagen = "";
    img.src = URL.createObjectURL(foto);
    vista.replaceWith(img);
  });

  // Texto del interruptor "Disponible".
  const disponible = $("[data-interruptor]", form);
  disponible?.addEventListener("change", () => {
    const ayuda = $(".interruptor__ayuda", disponible.closest("label"));
    if (ayuda) ayuda.textContent = disponible.checked ? ayuda.dataset.textoSi : ayuda.dataset.textoNo;
  });
}

/* ---------- Tabla de productos: filtros del lado del cliente ---------- */
const CLAVE_FILTROS = "panel-filtros-productos";
const ORDENES = {
  recientes: (a, b) => b.dataset.creado - a.dataset.creado,
  nombre: (a, b) => a.dataset.nombre.localeCompare(b.dataset.nombre, "es"),
  "precio-asc": (a, b) => a.dataset.precio - b.dataset.precio,
  "precio-desc": (a, b) => b.dataset.precio - a.dataset.precio,
  stock: (a, b) => a.dataset.stock - b.dataset.stock,
};

function prepararFiltros() {
  const cuerpo = $("#filasProductos");
  if (!cuerpo) return;
  const filas = $$(".tabla__fila", cuerpo);
  const texto = $("#filtroTexto");
  const categoria = $("#filtroCategoria");
  const orden = $("#filtroOrden");
  const chips = $$("#filtroEstado [data-estado]");
  const tabla = $("#tablaProductos");
  const sinResultados = $("#sinResultados");
  let estado = "";

  // Los filtros sobreviven a la recarga que hace cada acción (interruptor, guardar).
  try {
    const guardados = JSON.parse(sessionStorage.getItem(CLAVE_FILTROS) || "{}");
    texto.value = guardados.texto || "";
    if ([...categoria.options].some((o) => o.value === guardados.categoria)) categoria.value = guardados.categoria;
    if (ORDENES[guardados.orden]) orden.value = guardados.orden;
    estado = chips.some((c) => c.dataset.estado === guardados.estado) ? guardados.estado : "";
  } catch { /* sin filtros guardados */ }

  function aplicar() {
    const buscado = normalizar(texto.value);
    let visibles = 0;
    filas.sort(ORDENES[orden.value] || ORDENES.recientes).forEach((fila) => {
      const coincide = (!buscado || normalizar(fila.dataset.nombre).includes(buscado))
        && (!categoria.value || fila.dataset.categoria === categoria.value)
        && (!estado || fila.dataset.estados.split(" ").includes(estado));
      fila.hidden = !coincide;
      if (coincide) visibles += 1;
      cuerpo.append(fila);
    });
    chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.estado === estado)));
    tabla.hidden = visibles === 0;
    sinResultados.hidden = visibles > 0;
    try {
      sessionStorage.setItem(CLAVE_FILTROS, JSON.stringify({ texto: texto.value, categoria: categoria.value, orden: orden.value, estado }));
    } catch { /* sin persistencia */ }
  }

  texto.addEventListener("input", aplicar);
  categoria.addEventListener("change", aplicar);
  orden.addEventListener("change", aplicar);
  chips.forEach((chip) => chip.addEventListener("click", () => {
    estado = chip.dataset.estado;
    aplicar();
  }));
  $("#limpiarFiltrosPanel")?.addEventListener("click", () => {
    texto.value = "";
    categoria.value = "";
    estado = "";
    aplicar();
  });
  aplicar();
}

/* ---------- Confirmaciones ---------- */
function prepararConfirmaciones() {
  // Eliminar sucursal: se habilita al escribir el nombre exacto.
  $$("[data-confirmar-nombre]").forEach((entrada) => {
    const boton = document.getElementById(entrada.dataset.boton);
    entrada.addEventListener("input", () => {
      boton.disabled = entrada.value.trim() !== entrada.dataset.confirmarNombre;
    });
    entrada.closest("dialog")?.addEventListener("close", () => {
      entrada.value = "";
      boton.disabled = true;
    });
  });
  // Inicializar: se habilita al elegir la sucursal de origen.
  $$("form[data-requiere-seleccion]").forEach((form) => {
    const select = $("select", form);
    const boton = $("[type='submit']", form);
    select.addEventListener("change", () => { boton.disabled = !select.value; });
  });
  // Pasar de un modal a otro (Editar usuario → Cambiar contraseña).
  document.addEventListener("click", async (event) => {
    const boton = event.target.closest("[data-cambiar-a]");
    if (!boton) return;
    const destino = document.getElementById(boton.dataset.cambiarA);
    await cerrarCapa(boton.closest("dialog"));
    abrirCapa(destino);
  });
}

prepararEnvios();
prepararCambios();
prepararMenuSucursal();
$$(".form-producto").forEach(prepararProducto);
prepararFiltros();
prepararConfirmaciones();
abrirAlCargar();
