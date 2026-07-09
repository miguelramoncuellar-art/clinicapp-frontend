import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { LoginRequest, LoginData, Usuario } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthenticateService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  login(credenciales: LoginRequest): Observable<ApiResponse<LoginData>> {
    return this.http
      .post<ApiResponse<LoginData>>(`${this.apiUrl}/login`, credenciales)
      .pipe(
        tap((respuesta) => {
          localStorage.setItem('token', respuesta.data.token);
          localStorage.setItem('usuario', JSON.stringify(respuesta.data.usuario));
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUsuario(): Usuario | null {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }
}