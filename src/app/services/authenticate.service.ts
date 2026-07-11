import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { LoginRequest, LoginData, Usuario } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthenticateService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // Claves con prefijo: localStorage se comparte por origen (localhost:4200),
  // así ClinicApp no colisiona con otras apps en la misma máquina.
  private readonly TOKEN_KEY = 'clinicapp_token';
  private readonly USUARIO_KEY = 'clinicapp_usuario';

  login(credenciales: LoginRequest): Observable<ApiResponse<LoginData>> {
    return this.http
      .post<ApiResponse<LoginData>>(`${this.apiUrl}/login`, credenciales)
      .pipe(
        tap((respuesta) => {
          localStorage.setItem(this.TOKEN_KEY, respuesta.data.token);
          localStorage.setItem(this.USUARIO_KEY, JSON.stringify(respuesta.data.usuario));
        })
      );
  }

  me(): Observable<Usuario> {
    return this.http
      .get<ApiResponse<Usuario>>(`${this.apiUrl}/me`)
      .pipe(
        // tap: efecto secundario — sincroniza el localStorage con datos frescos
        tap((respuesta) => {
          localStorage.setItem(this.USUARIO_KEY, JSON.stringify(respuesta.data));
        }),
        // map: transformación — desempaqueta el envelope y entrega el Usuario directo
        map((respuesta) => respuesta.data)
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USUARIO_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUsuario(): Usuario | null {
    const usuario = localStorage.getItem(this.USUARIO_KEY);
    return usuario ? JSON.parse(usuario) : null;
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }
}