import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/api-response.model';
import {
  Usuario,
  UsuarioEstadoActualizado,
  CambioEstadoUsuario,
} from './usuarios.model';

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  // GET /usuarios — solo administrador (operador recibe 403).
  // El token viaja solo: el interceptor lo adjunta a toda petición saliente.
  obtenerUsuarios(): Observable<ApiResponse<Usuario[]>> {
    return this.http.get<ApiResponse<Usuario[]>>(this.apiUrl);
  }

  // PATCH /usuarios/:id_usuario/estado — solo administrador.
  // PATCH y no PUT: cambio PARCIAL del recurso, solo viaja usuario_activo.
  // El backend responde 400 si: usuario_activo no es boolean, el id no
  // existe, o el solicitante intenta desactivar SU PROPIA cuenta (regla
  // de la Fase 1).
  // Nota el tipo de retorno: UsuarioEstadoActualizado, NO Usuario — la
  // respuesta del PATCH trae usuario_actualizado_en, no usuario_creado_en.
  cambiarEstado(
    idUsuario: number,
    usuarioActivo: boolean,
  ): Observable<ApiResponse<UsuarioEstadoActualizado>> {
    const body: CambioEstadoUsuario = { usuario_activo: usuarioActivo };
    return this.http.patch<ApiResponse<UsuarioEstadoActualizado>>(
      `${this.apiUrl}/${idUsuario}/estado`,
      body,
    );
  }

  // Deliberadamente NO hay:
  // - obtenerUsuarioPorId: el endpoint existe, pero devuelve EXACTAMENTE
  //   las mismas columnas que el listado (sin JOINs). Un método sin
  //   consumidor es código muerto; se agrega el día que exista una vista
  //   de detalle que aporte algo.
  // - crearUsuario: POST /usuarios quedó fuera del alcance actual
  //   (extensión futura pactada).
}