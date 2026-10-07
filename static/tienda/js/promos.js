// Contenido del carrusel de promociones del inicio.
// - imagen: clave de CONFIG.imagenes (las URLs las arma Django con {% static %}).
// - producto: texto que se busca en el nombre del producto para que el botón
//   lo sume directo al carrito. Si el producto no está en la sucursal
//   actual, el botón lleva al catálogo filtrado por la categoría.
export const PROMOS = [
  {
    titulo: "Colágeno hidrolizado",
    etiqueta: "-20%",
    descripcion: "Promo destacada por tiempo limitado. Sumalo a tu pedido y confirmá stock por WhatsApp.",
    categoria: "Suplementos",
    imagen: "colageno",
    foto: true,
    fondo: "#e4efd4",
    producto: "colageno",
    beneficios: [["leaf", "Apoya la salud de la piel"], ["bone", "Huesos y articulaciones"], ["hair", "Cabello y uñas"]],
  },
  {
    titulo: "Frutos secos premium",
    etiqueta: "Selección especial",
    descripcion: "Mixes frescos para desayunos, meriendas y picadas saludables.",
    categoria: "Frutos secos",
    imagen: "frutosSecos",
    fondo: "#f6e6d2",
    producto: "mix premium",
    beneficios: [["bolt", "Energía natural"], ["heart", "Grasas saludables"], ["leaf", "Sin conservantes"]],
  },
  {
    titulo: "Productos sin TACC",
    etiqueta: "Aptos y prácticos",
    descripcion: "Premezclas, snacks y opciones para resolver tus compras rápido.",
    categoria: "Sin TACC",
    imagen: "sinTacc",
    fondo: "#f5edc9",
    beneficios: [["check", "Aptos celíacos"], ["box", "Variedad de marcas"], ["leaf", "Opciones saludables"]],
  },
  {
    titulo: "Envíos a domicilio",
    etiqueta: "Compra cómoda",
    descripcion: "Armá el pedido, envialo por WhatsApp y coordinamos la entrega o el retiro.",
    categoria: null,
    imagen: "envios",
    fondo: "#dcebc8",
    beneficios: [["chat", "Pedido por WhatsApp"], ["clock", "Entrega coordinada"], ["box", "Retiro en sucursal"]],
  },
  {
    titulo: "Suplementos deportivos",
    etiqueta: "Nueva selección",
    descripcion: "Proteínas y complementos para entrenar con mejor organización.",
    categoria: "Suplementos",
    imagen: "suplementos",
    fondo: "#dbeaf0",
    producto: "whey",
    beneficios: [["muscle", "Recuperación muscular"], ["bolt", "Más rendimiento"], ["check", "Marcas reconocidas"]],
  },
];
