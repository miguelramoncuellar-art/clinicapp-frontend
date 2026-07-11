import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthenticateService } from '../../services/authenticate.service';
import { InventarioService } from './inventario.service';
import { Inventario, InventarioInput, StockInput } from './inventario.model';

@Component({
  selector: 'app-inventario-home',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './inventario-home.component.html',
  styleUrl: './inventario-home.component.css',
})
export class InventarioHomeComponent implements OnInit {
  private readonly inventarioService = inject(InventarioService);
  private readonly authService = inject(AuthenticateService);
  private readonly fb = inject(FormBuilder);

  registros = signal<Inventario[]>([]);
  cargando = signal(true);
  procesando = signal(false); // protege los formularios contra doble clic
  mensajeExito = signal('');
  mensajeError = signal('');

  // Normalizado con toLowerCase: inmune a que el valor venga
  // como 'Administrador' o 'administrador'. Se calcula una vez
  // al construir el componente (si el rol cambia, re-login).
  esAdministrador = (this.authService.getUsuario()?.rol ?? '').toLowerCase() === 'administrador';

  // Cada campo: [valorInicial, [validadores]].
  // Los validadores replican las reglas de inventario.service.js del backend.
  formRegistro = this.fb.group({
    id_lote: [null as number | null, [Validators.required, Validators.pattern('^[0-9]+$'), Validators.min(1)]],
    stock_actual: [null as number | null, [Validators.required, Validators.pattern('^[0-9]+$'), Validators.min(0)]],
  });

  formAjuste = this.fb.group({
    id_inventario: [null as number | null, [Validators.required, Validators.pattern('^[0-9]+$'), Validators.min(1)]],
    stock_actual: [null as number | null, [Validators.required, Validators.pattern('^[0-9]+$'), Validators.min(0)]],
  });

  // Un control suelto (sin group): así se ve un FormControl individual.
  filtroProducto = this.fb.control<number | null>(null, [Validators.pattern('^[0-9]+$'), Validators.min(1)]);

  ngOnInit(): void {
    this.cargarInventario();
  }

  cargarInventario(): void {
    this.cargando.set(true);
    this.inventarioService.listarInventario().subscribe({
      next: (respuesta) => {
        this.registros.set(respuesta.data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.mensajeError.set(err.error?.message ?? 'Error de conexión con el servidor.');
        this.cargando.set(false);
      },
    });
  }

  onFiltrar(): void {
    if (this.filtroProducto.invalid) return;
    this.limpiarMensajes();

    const idProducto = this.filtroProducto.value;
    if (idProducto === null) {
      this.cargarInventario(); // filtro vacío = ver todo
      return;
    }

    this.cargando.set(true);
    this.inventarioService.listarPorProducto(Number(idProducto)).subscribe({
      next: (respuesta) => {
        this.registros.set(respuesta.data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.registros.set([]);
        this.mensajeError.set(err.error?.message ?? 'Error de conexión con el servidor.');
        this.cargando.set(false);
      },
    });
  }

  verTodo(): void {
    this.filtroProducto.reset();
    this.limpiarMensajes();
    this.cargarInventario();
  }

  onRegistrar(): void {
    if (this.formRegistro.invalid || this.procesando()) return;
    this.limpiarMensajes();
    this.procesando.set(true);

    const datos: InventarioInput = {
      id_lote: Number(this.formRegistro.value.id_lote),
      stock_actual: Number(this.formRegistro.value.stock_actual),
    };

    this.inventarioService.registrarInventario(datos).subscribe({
      next: (respuesta) => {
        this.mensajeExito.set(respuesta.message);
        this.formRegistro.reset();
        this.procesando.set(false);
        // El POST devuelve la fila "delgada" (sin JOIN):
        // refrescamos la lista para ver el registro completo.
        this.cargarInventario();
      },
      error: (err) => {
        this.mensajeError.set(err.error?.message ?? 'Error de conexión con el servidor.');
        this.procesando.set(false);
      },
    });
  }

  onAjustar(): void {
    if (this.formAjuste.invalid || this.procesando()) return;
    this.limpiarMensajes();
    this.procesando.set(true);

    const idInventario = Number(this.formAjuste.value.id_inventario);
    const datos: StockInput = { stock_actual: Number(this.formAjuste.value.stock_actual) };

    this.inventarioService.ajustarStock(idInventario, datos).subscribe({
      next: (respuesta) => {
        this.mensajeExito.set(respuesta.message);
        this.formAjuste.reset();
        this.procesando.set(false);
        this.cargarInventario();
      },
      error: (err) => {
        this.mensajeError.set(err.error?.message ?? 'Error de conexión con el servidor.');
        this.procesando.set(false);
      },
    });
  }

  private limpiarMensajes(): void {
    this.mensajeExito.set('');
    this.mensajeError.set('');
  }
}