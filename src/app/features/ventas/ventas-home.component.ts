import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthenticateService } from '../../services/authenticate.service';
import { ProductosService } from '../../services/productos.service';
import { Producto } from '../../models/producto.model';
import { VentasService } from './ventas.service';
import { Venta, VentaConDetalles, RegistrarVentaInput } from './ventas.model';

@Component({
  selector: 'app-ventas-home',
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe],
  templateUrl: './ventas-home.component.html',
  styleUrl: './ventas-home.component.css',
})
export class VentasHomeComponent implements OnInit {
  private readonly ventasService = inject(VentasService);
  private readonly productosService = inject(ProductosService);
  private readonly authService = inject(AuthenticateService);
  private readonly fb = inject(FormBuilder);

  ventas = signal<Venta[]>([]);
  productos = signal<Producto[]>([]);
  ventaConsultada = signal<VentaConDetalles | null>(null);
  cargando = signal(false);
  procesando = signal(false);
  mensajeExito = signal('');
  mensajeError = signal('');
  totalEstimado = signal(0);

  // Derivado: cada vez que cambia productos(), esto se recalcula solo.
  // Solo se venden productos activos, igual que valida el backend.
  productosActivos = computed(() => this.productos().filter((p) => p.producto_activo));

  esAdministrador = (this.authService.getUsuario()?.rol ?? '').toLowerCase() === 'administrador';

  // FormArray: un arreglo de FormGroups. Cada posición es una línea
  // de la venta (producto + cantidad) con sus propios validadores.
  formVenta = this.fb.group({
    items: this.fb.array([this.crearItem()]),
  });

  busquedaId = this.fb.control<number | null>(null, [Validators.pattern('^[0-9]+$'), Validators.min(1)]);

  constructor() {
    // Recalcula el total ante cualquier cambio: elegir producto, cambiar
    // cantidad, agregar o quitar líneas. valueChanges nunca completa solo,
    // así que takeUntilDestroyed corta la suscripción al destruir el componente.
    this.formVenta.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.totalEstimado.set(this.calcularTotal()));
  }

  // Getter tipado: evita repetir el cast en cada uso.
  get items(): FormArray {
    return this.formVenta.get('items') as FormArray;
  }

  ngOnInit(): void {
    this.cargarProductos();
    // Rol invertido respecto a inventario: aquí el operador NO puede
    // listar ventas (403), así que ni siquiera disparamos el GET.
    if (this.esAdministrador) {
      this.cargarVentas();
    }
  }

  cargarProductos(): void {
    this.productosService.listarProductos().subscribe({
      next: (respuesta) => this.productos.set(respuesta.data),
      error: (err) => {
        this.mensajeError.set(err.error?.message ?? 'Error de conexión con el servidor.');
      },
    });
  }

  cargarVentas(): void {
    this.cargando.set(true);
    this.ventasService.listarVentas().subscribe({
      next: (respuesta) => {
        this.ventas.set(respuesta.data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.mensajeError.set(err.error?.message ?? 'Error de conexión con el servidor.');
        this.cargando.set(false);
      },
    });
  }

  agregarItem(): void {
    this.items.push(this.crearItem());
  }

  eliminarItem(indice: number): void {
    if (this.items.length === 1) return; // una venta necesita al menos una línea
    this.items.removeAt(indice);
  }

  // Precio del producto elegido en una línea, para mostrarlo junto a ella.
  precioProducto(indice: number): string {
    const idProducto = Number(this.items.at(indice).value.id_producto);
    const producto = this.productos().find((p) => p.id_producto === idProducto);
    return producto ? `$ ${producto.precio}` : '—';
  }

  onRegistrar(): void {
    if (this.formVenta.invalid || this.procesando()) return;
    this.limpiarMensajes();
    this.procesando.set(true);

    const datos: RegistrarVentaInput = {
      items: this.items.controls.map((control) => ({
        id_producto: Number(control.value.id_producto),
        cantidad: Number(control.value.cantidad),
        // precio_unitario no se envía: el backend usa el precio vigente
        // del producto (fuente de verdad). El total en pantalla es preview.
      })),
    };

    this.ventasService.registrarVenta(datos).subscribe({
      next: (respuesta) => {
        // El ID va en el mensaje: el operador no tiene lista de ventas,
        // este número es su referencia para consultarla por ID.
        this.mensajeExito.set(`${respuesta.message} (ID de venta: ${respuesta.data.venta.id_venta})`);
        this.reiniciarFormulario();
        this.procesando.set(false);
        if (this.esAdministrador) {
          this.cargarVentas(); // refresh-after-mutation: el POST devuelve la fila delgada
        }
      },
      error: (err) => {
        this.mensajeError.set(err.error?.message ?? 'Error de conexión con el servidor.');
        this.procesando.set(false);
      },
    });
  }

  onBuscar(): void {
    if (this.busquedaId.invalid || this.busquedaId.value === null) return;
    this.limpiarMensajes();

    this.ventasService.buscarVentaPorId(Number(this.busquedaId.value)).subscribe({
      next: (respuesta) => this.ventaConsultada.set(respuesta.data),
      error: (err) => {
        this.ventaConsultada.set(null);
        this.mensajeError.set(err.error?.message ?? 'Error de conexión con el servidor.');
      },
    });
  }

  limpiarBusqueda(): void {
    this.busquedaId.reset();
    this.ventaConsultada.set(null);
  }

  // reset() conservaría el número de líneas; queremos volver a UNA línea vacía.
  private reiniciarFormulario(): void {
    this.items.clear();
    this.items.push(this.crearItem());
  }

  private crearItem(): FormGroup {
    return this.fb.group({
      id_producto: [null as number | null, [Validators.required]],
      cantidad: [null as number | null, [Validators.required, Validators.pattern('^[0-9]+$'), Validators.min(1)]],
    });
  }

  // Suma cantidad × precio de cada línea completa, ignorando las incompletas.
  // producto.precio es string (DECIMAL de PostgreSQL): Number() lo convierte.
  private calcularTotal(): number {
    return this.items.controls.reduce((acumulado, control) => {
      const idProducto = Number(control.value.id_producto);
      const cantidad = Number(control.value.cantidad);
      if (!idProducto || !cantidad || cantidad <= 0) return acumulado;

      const producto = this.productos().find((p) => p.id_producto === idProducto);
      if (!producto) return acumulado;

      return acumulado + Number(producto.precio) * cantidad;
    }, 0);
  }

  private limpiarMensajes(): void {
    this.mensajeExito.set('');
    this.mensajeError.set('');
  }
}