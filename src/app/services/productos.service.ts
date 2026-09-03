import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Producto, ProductoInput } from '../models/producto.model';

@Injectable({
  providedIn: 'root',
})
export class ProductosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/productos`;

  listarProductos(): Observable<ApiResponse<Producto[]>> {
    return this.http.get<ApiResponse<Producto[]>>(this.apiUrl);
  }

  buscarProductoPorId(idProducto: number): Observable<ApiResponse<Producto>> {
    return this.http.get<ApiResponse<Producto>>(`${this.apiUrl}/${idProducto}`);
  }

  crearProducto(producto: ProductoInput): Observable<ApiResponse<Producto>> {
    return this.http.post<ApiResponse<Producto>>(this.apiUrl, producto);
  }

  actualizarProducto(idProducto: number, producto: ProductoInput): Observable<ApiResponse<Producto>> {
    return this.http.put<ApiResponse<Producto>>(`${this.apiUrl}/${idProducto}`, producto);
  }
}