import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticateService } from '../../services/authenticate.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly authService = inject(AuthenticateService);
  private readonly router = inject(Router);

  correo = signal('');
  contrasena = signal('');
  mensaje = signal('');
  loginExitoso = signal(false);
  cargando = signal(false);

  // Controla si la contraseña se muestra en texto plano. El input
  // alterna entre type="text" y type="password" según este valor.
  contrasenaVisible = signal(false);

  alternarContrasena(): void {
    this.contrasenaVisible.update((visible) => !visible);
  }

  onSubmit(): void {
    this.mensaje.set('');
    this.cargando.set(true);

    this.authService
      .login({ correo: this.correo(), contrasena: this.contrasena() })
      .subscribe({
        next: () => {
          this.cargando.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.cargando.set(false);
          this.loginExitoso.set(false);
          this.mensaje.set(err.error?.message ?? 'Error de conexión con el servidor.');
        },
      });
  }
}