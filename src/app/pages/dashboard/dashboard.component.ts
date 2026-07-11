import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthenticateService } from '../../services/authenticate.service';
import { ProductosService } from '../../services/productos.service';
import { Producto } from '../../models/producto.model';
import { Usuario } from '../../models/auth.model';

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

  // Arranca con la copia local (pinta el nombre al instante)
  // y ngOnInit la refresca con datos del servidor.
  usuario = signal<Usuario | null>(this.authService.getUsuario());

  productos = signal<Producto[]>([]);
  mensajeError = signal('');
  cargando = signal(true);

  ngOnInit(): void {
    // Validación de sesión contra el servidor: ¿el token sigue vivo?
    this.authService.me().subscribe({
      next: (usuario) => {
        this.usuario.set(usuario);
      },
      error: (err) => {
        // El 401 ya lo resolvió el interceptor (logout + redirect a login).
        // Aquí solo llegan otros errores, p. ej. el backend apagado.
        if (err.status !== 401) {
          this.mensajeError.set('No se pudo validar la sesión con el servidor.');
        }
      },
    });

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