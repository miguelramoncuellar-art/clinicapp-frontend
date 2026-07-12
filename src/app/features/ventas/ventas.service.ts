import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/api-response.model';
import {
  Venta,
  VentaConDetalles,
  RegistrarVentaInput,
  RegistrarVentaResponse,
} from './ventas.model';

@Injectable({
  providedIn: 'root',
})
export class VentasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/ventas`;

  // GET /ventas — solo administrador (403 para operador)
  listarVentas(): Observable<ApiResponse<Venta[]>> {
    return this.http.get<ApiResponse<Venta[]>>(this.apiUrl);
  }

  // GET /ventas/usuario/:id_usuario — solo administrador
  listarVentasPorUsuario(idUsuario: number): Observable<ApiResponse<Venta[]>> {
    return this.http.get<ApiResponse<Venta[]>>(`${this.apiUrl}/usuario/${idUsuario}`);
  }

  // GET /ventas/:id_venta — administrador y operador; incluye detalles anidados
  buscarVentaPorId(idVenta: number): Observable<ApiResponse<VentaConDetalles>> {
    return this.http.get<ApiResponse<VentaConDetalles>>(`${this.apiUrl}/${idVenta}`);
  }

  // POST /ventas — administrador y operador; el vendedor sale del JWT
  registrarVenta(datos: RegistrarVentaInput): Observable<ApiResponse<RegistrarVentaResponse>> {
    return this.http.post<ApiResponse<RegistrarVentaResponse>>(this.apiUrl, datos);
  }
}