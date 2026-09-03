export interface Producto {
  id_producto: number;
  nombre: string;
  descripcion: string;
  precio: string;
  stock_minimo: number;
  producto_activo: boolean;
  producto_creado_en: string;
  producto_actualizado_en: string;
  id_categoria: number;
  categoria_nombre: string;
  id_proveedor: number;
  proveedor_nombre: string;
}


export interface ProductoInput {
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock_minimo: number;
  id_categoria: number;
  id_proveedor?: number | null;
}