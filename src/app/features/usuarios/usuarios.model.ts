// ============================================================
// Modelo del feature Usuarios.
// Fuente de verdad: src/database/usuarios.db.js del backend.
// "Los alias del SQL mandan" — y mandan POR ENDPOINT, no por tabla:
// el listado y el PATCH devuelven formas distintas (RETURNING distinto),
// así que aquí hay DOS interfaces, cada una calcada de su SQL real.
//
// OJO con el auto-import: ya existe OTRA interfaz Usuario en
// src/app/models/auth.model.ts (la del login: sin usuario_creado_en,
// con usuario_activo opcional). Al importar desde componentes, verificar
// que VS Code traiga la de ESTE archivo (./usuarios.model) y no la de
// auth. No la reutilizamos: aquella modela el payload de sesión; esta,
// las filas de administración — contratos distintos, tipos distintos.
// ============================================================

// GET /usuarios (findAllUsuarios) y GET /usuarios/:id (findUsuarioById):
// SELECT id_usuario, nombre, apellido, correo, rol, usuario_activo, usuario_creado_en
//
// Tipos, campo a campo:
// - id_usuario: INTEGER → llega como number. La regla "NUMERIC/COUNT
//   llegan como string" NO aplica aquí: es exclusiva de los tipos de
//   precisión arbitraria; un INTEGER cabe sin pérdida en un number de JS.
// - usuario_activo: BOOLEAN de Postgres → boolean de JS, sin sorpresas.
// - usuario_creado_en: TIMESTAMP. El driver lo vuelve Date en el backend,
//   pero JSON no tiene tipo fecha: res.json() lo serializa a string ISO.
//   Al frontend SIEMPRE llega string. Y a diferencia de las columnas DATE
//   de reportes (que pedían pipe date con 'UTC' para no correrse un día),
//   un TIMESTAMP completo se muestra con el pipe date normal: convertir
//   a hora local es justamente el comportamiento correcto aquí.
// - rol: string plano, igual que en auth.model.ts. Un union literal
//   ('administrador' | 'operador' | 'cliente') daría autocompletado,
//   pero TS no valida nada en runtime; la garantía real llegará con Zod.
export interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  usuario_activo: boolean;
  usuario_creado_en: string;
}

// PATCH /usuarios/:id_usuario/estado (updateUsuarioStatus):
// RETURNING id_usuario, nombre, apellido, correo, rol, usuario_activo,
//           usuario_actualizado_en
//
// Trae usuario_actualizado_en y NO usuario_creado_en. Por eso no metimos
// ambos campos como opcionales en una sola interfaz: un
// `usuario_creado_en?` mentiría en los dos endpoints (diría "quizá viene"
// donde SIEMPRE viene, y donde NUNCA viene). Dos interfaces honestas >
// una ambigua. El premio: si intentáramos leer usuario_creado_en de la
// respuesta del PATCH, el compilador lo marca en rojo — un undefined
// silencioso convertido en error ruidoso de compilación.
export interface UsuarioEstadoActualizado {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  usuario_activo: boolean;
  usuario_actualizado_en: string;
}

// Body del PATCH. Tiparlo evita mandar "false" (string) por accidente:
// el backend lo rechazaría con 400 (typeof !== 'boolean'), pero mejor
// que el error ni siquiera compile.
export interface CambioEstadoUsuario {
  usuario_activo: boolean;
}