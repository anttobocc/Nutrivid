// Contenido del carrusel de promociones del inicio.
// - imagen: clave de CONFIG.imagenes (las URLs las arma Django con {% static %}).
// - producto: texto que se busca en el nombre del producto. El precio, el
//   descuento y el stock salen del catálogo de la sucursal elegida. Si el
//   producto no está en esa sucursal, el botón lleva a la categoría.
export const PROMOS = [
  {
    titulo: "Colágeno hidrolizado",
    bajada: "Polvo neutro para bebidas frías o calientes.",
    producto: "colageno hidrolizado",
    categoria: "Suplementos",
    imagen: "colageno",
  },
  {
    titulo: "Mix premium de frutos secos",
    bajada: "Almendras, nueces, cajú, maní y pasas. Para desayunos y meriendas.",
    producto: "mix premium",
    categoria: "Frutos secos",
    imagen: "frutosSecos",
  },
  {
    titulo: "Sin TACC para toda la semana",
    bajada: "Premezclas, galletitas, fideos y cookies aptos para celíacos.",
    categoria: "Sin TACC",
    imagen: "sinTacc",
  },
  {
    titulo: "Proteína whey",
    bajada: "Presentación de 900 g, sabor vainilla.",
    producto: "proteina whey",
    categoria: "Suplementos",
    imagen: "proteina",
  },
];
