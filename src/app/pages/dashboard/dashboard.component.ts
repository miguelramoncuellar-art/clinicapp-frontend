import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthenticateService } from '../../services/authenticate.service';
import { Usuario } from '../../models/auth.model';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthenticateService);
  private readonly router = inject(Router);

  usuario = signal<Usuario | null>(this.authService.getUsuario());
  mensajeError = signal('');

  ngOnInit(): void {
    // La validación de sesión vive en el layout: se ejecuta una sola vez,
    // sin importar qué módulo hijo esté abierto.
    this.authService.me().subscribe({
      next: (usuario) => this.usuario.set(usuario),
      error: (err) => {
        if (err.status !== 401) {
          this.mensajeError.set('No se pudo validar la sesión con el servidor.');
        }
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}