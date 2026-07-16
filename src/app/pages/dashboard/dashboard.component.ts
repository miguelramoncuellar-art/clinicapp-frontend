import { Component, OnInit, computed, inject, signal } from '@angular/core';
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

  // computed y no un método en el template: se memoiza y solo se recalcula
  // cuando cambia el signal usuario — clave con zoneless, donde los signals
  // son la fuente de reactividad. Además se actualiza SOLO: si /auth/me
  // refresca al usuario en ngOnInit, el link aparece/desaparece sin más código.
  // .toLowerCase() por la regla ya conocida: el JWT trae el rol en crudo
  // y no queremos depender de cómo venga capitalizado.
  esAdministrador = computed(
    () => this.usuario()?.rol?.toLowerCase() === 'administrador',
  );

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