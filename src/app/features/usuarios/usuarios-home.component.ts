import { Component, LOCALE_ID, OnInit, inject, signal } from '@angular/core';
import { DatePipe, registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { AuthenticateService } from '../../services/authenticate.service';
import { UsuariosService } from './usuarios.service';
import { Usuario } from './usuarios.model';
// OJO: Usuario viene de './usuarios.model' (el del feature), NO de
// '../../models/auth.model'. Es la colisión de nombres anunciada en la
// Fase 2: si el auto-import de VS Code elige el de auth, el compilador
// reclamará que usuario_creado_en no existe.

// Mismo patrón que reportes: los datos del locale se registran a nivel
// de módulo (si reportes ya lo hizo, repetirlo es inocuo) y el LOCALE_ID
// se provee ESCOPADO al componente — decisión ya tomada: nada global,
// para no alterar el formato de módulos ya verificados.
registerLocaleData(localeEsCo);

@Component({
  selector: 'app-usuarios-home',
  imports: [DatePipe],
  templateUrl: './usuarios-home.component.html',
  styleUrl: './usuarios-home.component.css',
  providers: [{ provide: LOCALE_ID, useValue: 'es-CO' }],
})
export class UsuariosHomeComponent implements OnInit {
  private readonly usuariosService = inject(UsuariosService);
  private readonly authService = inject(AuthenticateService);

  usuarios = signal<Usuario[]>([]);
  cargando = signal(false);
  mensajeExito = signal('');
  mensajeError = signal('');

  // Fila con PATCH en vuelo: deshabilita SU botón mientras responde el
  // backend. Evita el doble clic que mandaría dos PATCH idénticos.
  idProcesando = signal<number | null>(null);

  // Id del usuario logueado, para deshabilitar el toggle de su propia
  // fila. Campo plano y no signal: es inmutable durante la sesión.
  // Si getUsuario() devolviera null (no debería, estamos tras el
  // authGuard), queda null y ninguna fila se deshabilita — defensa en
  // profundidad: el backend rechaza la auto-desactivación igual (400).
  private readonly idUsuarioActual =
    this.authService.getUsuario()?.id_usuario ?? null;

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando.set(true);
    this.mensajeError.set('');

    // Sin takeUntilDestroyed (a diferencia de valueChanges en ventas):
    // los observables de HttpClient emiten UNA vez y completan solos —
    // no hay stream vivo que limpiar.
    this.usuariosService.obtenerUsuarios().subscribe({
      next: (respuesta) => {
        this.usuarios.set(respuesta.data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.mensajeError.set(
          err.error?.message ?? 'No se pudieron cargar los usuarios.',
        );
        this.cargando.set(false);
      },
    });
  }

  // ¿Por qué un método y no un computed, si en el dashboard insistimos
  // en computed para esAdministrador? Porque computed memoiza UN valor;
  // aquí la pregunta es POR FILA y con parámetro. Y el costo es una
  // comparación de números contra un campo inmutable: nada que memoizar.
  esUsuarioActual(idUsuario: number): boolean {
    return idUsuario === this.idUsuarioActual;
  }

  cambiarEstado(usuario: Usuario): void {
    // El botón de la propia fila ya está deshabilitado en el template,
    // pero la guarda defensiva es gratis: si estás logueado estás activo,
    // así que la única acción posible sobre ti mismo sería "Desactivar" —
    // exactamente la que el backend rechaza con 400 desde la Fase 1.
    if (this.esUsuarioActual(usuario.id_usuario)) {
      return;
    }

    const nuevoEstado = !usuario.usuario_activo;

    this.mensajeExito.set('');
    this.mensajeError.set('');
    this.idProcesando.set(usuario.id_usuario);

    this.usuariosService.cambiarEstado(usuario.id_usuario, nuevoEstado).subscribe({
      next: (respuesta) => {
        // MERGE LOCAL, no refetch: el refresh-after-mutation clásico no
        // aplica porque no hay JOINs que recuperar — tabla única y el
        // RETURNING del PATCH ya confirma el valor nuevo. Recargar N
        // filas por un cambio de 1 campo sería desperdicio.
        //
        // Dos decisiones deliberadas:
        // 1) Copiamos SOLO usuario_activo, y del dato CONFIRMADO por el
        //    servidor (respuesta.data), no del optimista nuevoEstado.
        // 2) NO hacemos { ...u, ...respuesta.data }: la respuesta del
        //    PATCH es UsuarioEstadoActualizado (trae
        //    usuario_actualizado_en, no usuario_creado_en) — mezclarla
        //    entera contaminaría la fila con un campo ajeno a Usuario.
        //
        // update() + map() + spread: array NUEVO y objeto NUEVO para la
        // fila cambiada. Con signals (y zoneless) la reactividad se
        // dispara por cambio de REFERENCIA, no por mutación interna:
        // mutar la fila "a mano" sería otro bug silencioso — la tabla
        // simplemente no se redibujaría.
        this.usuarios.update((lista) =>
          lista.map((u) =>
            u.id_usuario === respuesta.data.id_usuario
              ? { ...u, usuario_activo: respuesta.data.usuario_activo }
              : u,
          ),
        );
        // El texto del éxito lo pone el backend ("Usuario desactivado
        // correctamente." / "activado"): una sola fuente de verdad.
        this.mensajeExito.set(respuesta.message);
        this.idProcesando.set(null);
      },
      error: (err) => {
        this.mensajeError.set(
          err.error?.message ?? 'No se pudo cambiar el estado del usuario.',
        );
        this.idProcesando.set(null);
      },
    });
  }
}