export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  usuario_activo?: boolean;
}

export interface LoginData {
  token: string;
  usuario: Usuario;
}