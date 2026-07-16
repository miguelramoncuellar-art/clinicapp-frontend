import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/api-response.model';
import {
  FiltroRangoFechas,
  ReporteDiario,
  ReporteSemanal,
  ReporteMensual,
  VentaPorDia,
  ProductoMasVendido,
  VentaPorUsuario,
} from './reportes.model';

@Injectable({
  providedIn: 'root',
})
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reportes`;

  // Concepto clave de la clase: HttpParams es INMUTABLE. Cada .set() devuelve
  // una instancia NUEVA — hay que reasignar (params = params.set(...)).
  // Si solo haces params.set(...) sin reasignar, el parámetro se pierde
  // en silencio: bug silencioso clásico, la petición sale sin filtros.
  private construirParams(filtro: FiltroRangoFechas): HttpParams {
    let params = new HttpParams();
    if (filtro.fecha_inicio) {
      params = params.set('fecha_inicio', filtro.fecha_inicio);
    }
    if (filtro.fecha_fin) {
      params = params.set('fecha_fin', filtro.fecha_fin);
    }
    return params;
  }

  // GET /reportes/diario — solo administrador (403 para operador)
  obtenerReporteDiario(): Observable<ApiResponse<ReporteDiario>> {
    return this.http.get<ApiResponse<ReporteDiario>>(`${this.apiUrl}/diario`);
  }

  // GET /reportes/semanal — solo administrador
  obtenerReporteSemanal(): Observable<ApiResponse<ReporteSemanal>> {
    return this.http.get<ApiResponse<ReporteSemanal>>(`${this.apiUrl}/semanal`);
  }

  // GET /reportes/mensual — solo administrador
  obtenerReporteMensual(): Observable<ApiResponse<ReporteMensual>> {
    return this.http.get<ApiResponse<ReporteMensual>>(`${this.apiUrl}/mensual`);
  }

  // GET /reportes/ventas-por-dia?fecha_inicio=&fecha_fin= — solo administrador
  // Sin fechas, el backend usa los últimos 30 días por defecto.
  obtenerVentasPorDia(filtro: FiltroRangoFechas = {}): Observable<ApiResponse<VentaPorDia[]>> {
    const params = this.construirParams(filtro);
    return this.http.get<ApiResponse<VentaPorDia[]>>(`${this.apiUrl}/ventas-por-dia`, { params });
  }

  // GET /reportes/productos-mas-vendidos?limite=&fecha_inicio=&fecha_fin= — solo administrador
  // Sin límite, el backend devuelve 10.
  obtenerProductosMasVendidos(
    filtro: FiltroRangoFechas = {},
    limite?: number,
  ): Observable<ApiResponse<ProductoMasVendido[]>> {
    let params = this.construirParams(filtro);
    if (limite) {
      params = params.set('limite', limite);
    }
    return this.http.get<ApiResponse<ProductoMasVendido[]>>(
      `${this.apiUrl}/productos-mas-vendidos`,
      { params },
    );
  }

  // GET /reportes/ventas-por-usuario — solo administrador; mes en curso, sin filtros
  obtenerVentasPorUsuario(): Observable<ApiResponse<VentaPorUsuario[]>> {
    return this.http.get<ApiResponse<VentaPorUsuario[]>>(`${this.apiUrl}/ventas-por-usuario`);
  }
}