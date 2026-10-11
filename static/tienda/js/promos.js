// Contenido del carrusel de promociones del inicio.
// - imagen: clave de CONFIG.imagenes (las URLs las arma Django con {% static %}).
// - producto: texto que se busca en el nombre del producto. El precio, el
//   descuento y el stock salen del catálogo de la sucursal elegida. Si el
//   producto no está con stock en esa sucursal, el botón lleva a la categoría.
export const PROMOS = [
  { titulo: "Colágeno hidrolizado", producto: "colageno hidrolizado", categoria: "Suplementos", imagen: "colageno" },
  { titulo: "Mix de frutos secos", producto: "mix premium", categoria: "Frutos secos", imagen: "frutos-secos" },
  { titulo: "Sin TACC", producto: "cookies sin tacc", categoria: "Sin TACC", imagen: "sin-tacc" },
  { titulo: "Proteína whey", producto: "proteina whey", categoria: "Suplementos", imagen: "proteina" },
];
