import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthenticateService } from '../../services/authenticate.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly authService = inject(AuthenticateService);

  correo = signal('');
  contrasena = signal('');
  mensaje = signal('');
  loginExitoso = signal(false);
  cargando = signal(false);

  onSubmit(): void {
    this.mensaje.set('');
    this.cargando.set(true);

    this.authService
      .login({ correo: this.correo(), contrasena: this.contrasena() })
      .subscribe({
        next: (respuesta) => {
          this.cargando.set(false);
          this.loginExitoso.set(true);
          this.mensaje.set(respuesta.message);
        },
        error: (err) => {
          this.cargando.set(false);
          this.loginExitoso.set(false);
          this.mensaje.set(err.error?.message ?? 'Error de conexión con el servidor.');
        },
      });
  }
}