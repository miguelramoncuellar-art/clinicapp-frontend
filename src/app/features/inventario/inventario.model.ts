// Espejo del SELECT con JOIN de inventario.db.js.
// Cada nombre debe coincidir exactamente con el alias del SQL:
// si aquí escribiera "nombre_producto" en vez de "producto_nombre",
// la columna saldría vacía en pantalla sin ningún error.
export interface Inventario {
  id_inventario: number;
  stock_actual: number;
  inventario_actualizado_en: string; // TIMESTAMP viaja como texto ISO
  id_lote: number;
  fecha_vencimiento: string;         // DATE viaja como texto ISO
  cantidad_lote: number;             // alias de l.cantidad
  id_producto: number;
  producto_nombre: string;           // alias de p.nombre
  precio: string;                    // NUMERIC de PostgreSQL viaja como string (ya lo conoces)
  id_proveedor: number;
  proveedor_nombre: string;          // alias de pr.nombre
}

// Cuerpo que espera POST /inventario (mismo nombre que tu schema de Swagger)
export interface InventarioInput {
  id_lote: number;
  stock_actual: number;
}

// Cuerpo que espera PATCH /inventario/:id/stock
export interface StockInput {
  stock_actual: number;
}

// Lo que devuelven POST y PATCH en su RETURNING: la fila sin JOIN.
// Existe como interfaz aparte para que TypeScript nos impida
// meter esta respuesta "incompleta" en la tabla principal.
export interface InventarioBasico {
  id_inventario: number;
  id_lote: number;
  stock_actual: number;
  inventario_actualizado_en: string;
}