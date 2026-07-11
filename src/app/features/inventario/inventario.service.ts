import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/api-response.model';
import { Inventario, InventarioBasico, InventarioInput, StockInput } from './inventario.model';

@Injectable({
  providedIn: 'root',
})
export class InventarioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/inventario`;

  listarInventario(): Observable<ApiResponse<Inventario[]>> {
    return this.http.get<ApiResponse<Inventario[]>>(this.apiUrl);
  }

  listarPorProducto(idProducto: number): Observable<ApiResponse<Inventario[]>> {
    return this.http.get<ApiResponse<Inventario[]>>(`${this.apiUrl}/producto/${idProducto}`);
  }

  registrarInventario(datos: InventarioInput): Observable<ApiResponse<InventarioBasico>> {
    return this.http.post<ApiResponse<InventarioBasico>>(this.apiUrl, datos);
  }

  ajustarStock(idInventario: number, datos: StockInput): Observable<ApiResponse<InventarioBasico>> {
    return this.http.patch<ApiResponse<InventarioBasico>>(`${this.apiUrl}/${idInventario}/stock`, datos);
  }
}