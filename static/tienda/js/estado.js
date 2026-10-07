// Datos compartidos entre módulos. Se completan con las respuestas de /api/.
export const estado = {
  productos: [],
  categorias: [],
  sucursales: [],
  sucursalActual: null,
};

export function buscarProducto(id) {
  return estado.productos.find((item) => item.id === Number(id)) || null;
}
