// Interfaces del módulo de reportes.
// REGLA DE ORO: los nombres de campo calcan EXACTAMENTE los alias del SQL
// en src/database/reportes.db.js del backend. Si un alias cambia allá, cambia acá.

// ¿Por qué number | string y no solo string como en precio?
// PostgreSQL devuelve COUNT/SUM/AVG como string a través del driver de Node
// (bigint y NUMERIC no caben con seguridad en un number de JS)... PERO los
// fallbacks de reportes.db.js (cuando no hay ventas) devuelven 0 numérico.
// El MISMO campo puede llegar con ambos tipos según haya datos o no.
// Los pipes date/currency de Angular aceptan ambos, así que la UI no se entera.
export type NumeroSQL = number | string;

// Filtro de rango de fechas — equivalente al modelo from/to de la clase.
// Formato YYYY-MM-DD, que es lo que produce nativamente un <input type="date">.
export interface FiltroRangoFechas {
  fecha_inicio?: string;
  fecha_fin?: string;
}

// GET /reportes/diario
// Ojo: cuando hay ventas, "fecha" llega como timestamp ISO completo
// (el driver convierte DATE a Date de JS y Express lo serializa);
// cuando no hay, llega como 'YYYY-MM-DD' plano. El pipe date digiere ambos.
export interface ReporteDiario {
  total_ventas: NumeroSQL;
  ingresos_totales: NumeroSQL;
  promedio_por_venta: NumeroSQL;
  fecha: string;
}

// GET /reportes/semanal
export interface ReporteSemanal {
  total_ventas: NumeroSQL;
  ingresos_totales: NumeroSQL;
  promedio_por_venta: NumeroSQL;
  semana_inicio: string;
  semana_fin: string;
}

// GET /reportes/mensual
// "mes" llega como texto ya formateado por TO_CHAR (ej. 'July      2026':
// viene en inglés y con relleno de espacios; HTML colapsa los espacios al
// renderizar, así que se ve bien — el idioma es cosmético y del backend).
export interface ReporteMensual {
  total_ventas: NumeroSQL;
  ingresos_totales: NumeroSQL;
  promedio_por_venta: NumeroSQL;
  mes: string;
}

// GET /reportes/ventas-por-dia — una fila por día del rango
export interface VentaPorDia {
  dia: string;
  total_ventas: NumeroSQL;
  ingresos: NumeroSQL;
}

// GET /reportes/productos-mas-vendidos — ranking por unidades
export interface ProductoMasVendido {
  id_producto: number;
  producto_nombre: string;
  unidades_vendidas: NumeroSQL;
  ingresos_generados: NumeroSQL;
}

// GET /reportes/ventas-por-usuario — desempeño del mes en curso
export interface VentaPorUsuario {
  id_usuario: number;
  usuario_nombre: string;
  usuario_apellido: string;
  total_ventas: NumeroSQL;
  ingresos_generados: NumeroSQL;
}