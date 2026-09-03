import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Categoria } from '../models/categoria.model';

@Injectable({
  providedIn: 'root',
})
export class CategoriasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/categorias`;

  listarCategorias(): Observable<ApiResponse<Categoria[]>> {
    return this.http.get<ApiResponse<Categoria[]>>(this.apiUrl);
  }
}