import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthenticateService } from '../../services/authenticate.service';
import { ProductosService } from '../../services/productos.service';
import { Producto } from '../../models/producto.model';

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthenticateService);
  private readonly productosService = inject(ProductosService);
  private readonly router = inject(Router);

  readonly usuario = this.authService.getUsuario();

  productos = signal<Producto[]>([]);
  mensajeError = signal('');
  cargando = signal(true);

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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}