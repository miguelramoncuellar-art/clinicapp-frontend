// Contrato de datos del módulo de Ventas.
// Derivado de los alias SQL reales del backend (ventas.db.js y detalleVentas.db.js).
// Regla ClinicApp: las interfaces se derivan de los alias reales, nunca se asumen.

// ─── Lecturas (GET) ─────────────────────────────────────────────

// Fila de GET /ventas y GET /ventas/usuario/:id_usuario.
// Alias SQL: v.id_venta, v.total, v.fecha, u.id_usuario,
//            u.nombre AS usuario_nombre, u.apellido AS usuario_apellido
export interface Venta {
  id_venta: number;
  total: string;            // DECIMAL(10,2) → node-postgres lo serializa como string
  fecha: string;            // TIMESTAMP → llega como string ISO por JSON
  id_usuario: number;
  usuario_nombre: string;
  usuario_apellido: string;
}

// Fila de detalle con JOIN a productos (findDetallesByVenta).
// Alias SQL: dv.id_detalle, dv.id_venta, dv.id_producto,
//            p.nombre AS producto, dv.cantidad, dv.precio_unitario,
//            (dv.cantidad * dv.precio_unitario) AS subtotal
export interface DetalleVenta {
  id_detalle: number;
  id_venta: number;
  id_producto: number;
  producto: string;
  cantidad: number;         // INTEGER → number
  precio_unitario: string;  // DECIMAL(10,2) → string
  subtotal: string;         // INTEGER × DECIMAL = NUMERIC → string
}

// Respuesta de GET /ventas/:id_venta — la venta con sus detalles anidados.
export interface VentaConDetalles extends Venta {
  detalles: DetalleVenta[];
}

// ─── Escritura (POST /ventas) ───────────────────────────────────

// Ítem del body. precio_unitario es opcional: si no se envía,
// el backend usa el precio actual del producto.
// Aquí los montos SÍ son number: es JSON que construimos nosotros.
export interface VentaItemInput {
  id_producto: number;
  cantidad: number;
  precio_unitario?: number;
}

// Body completo del POST. El usuario vendedor NO viaja aquí: sale del JWT.
export interface RegistrarVentaInput {
  items: VentaItemInput[];
}

// Respuesta del POST: filas "delgadas" del RETURNING, sin campos de JOIN
// (no traen usuario_nombre, producto ni subtotal). Por eso, tras registrar,
// re-consultamos la lista (refresh-after-mutation) en vez de fusionar esto.
export interface VentaCreada {
  id_venta: number;
  id_usuario: number;
  total: string;            // DECIMAL → string
  fecha: string;
}

export interface DetalleVentaCreado {
  id_detalle: number;
  id_venta: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: string;  // DECIMAL → string
}

export interface RegistrarVentaResponse {
  venta: VentaCreada;
  detalles: DetalleVentaCreado[];
}