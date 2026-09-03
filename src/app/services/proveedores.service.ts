import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Proveedor } from '../models/proveedor.model';

@Injectable({
  providedIn: 'root',
})
export class ProveedoresService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/proveedores`;

  listarProveedores(): Observable<ApiResponse<Proveedor[]>> {
    return this.http.get<ApiResponse<Proveedor[]>>(this.apiUrl);
  }
}