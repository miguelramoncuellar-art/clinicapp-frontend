import { Component, OnInit, LOCALE_ID, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthenticateService } from '../../services/authenticate.service';
import { ProductosService } from '../../services/productos.service';
import { Producto } from '../../models/producto.model';

@Component({
  selector: 'app-productos-home',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './productos-home.component.html',
  styleUrl: './productos-home.component.css',
  // Escopado al componente, no global: CurrencyPipe con 'COP' necesita el
  // formato de agrupación de dígitos de es-CO, pero eso no debe forzar
  // es-CO en el resto de la app (fechas, otros números, etc.).
  providers: [{ provide: LOCALE_ID, useValue: 'es-CO' }],
})
export class ProductosHomeComponent implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly authService = inject(AuthenticateService);

  productos = signal<Producto[]>([]);
  mensajeError = signal('');
  cargando = signal(true);

  // Mismo patrón que ventas-home: crear/editar producto exige administrador
  // en el backend (POST/PUT /productos), así que el botón y el ícono de
  // editar solo se muestran si el rol coincide — la seguridad real la
  // sigue imponiendo el backend, esto es solo para no mostrar acciones
  // que el usuario no podría completar.
  esAdministrador = (this.authService.getUsuario()?.rol ?? '').toLowerCase() === 'administrador';

  ngOnInit(): void {
    this.productosService.listarProductos().subscribe({
      next: (respuesta) => {
        this.productos.set(respuesta.data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.mensajeError.set(err.error?.message ?? 'Error de conexión con el servidor.');
        this.cargando.set(false);
      },
    });
  }
}