import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductosService } from '../../services/productos.service';
import { CategoriasService } from '../../services/categorias.service';
import { ProveedoresService } from '../../services/proveedores.service';
import { Categoria } from '../../models/categoria.model';
import { Proveedor } from '../../models/proveedor.model';

@Component({
  selector: 'app-producto-form',
  imports: [FormsModule],
  templateUrl: './producto-form.component.html',
  styleUrl: './producto-form.component.css',
})
export class ProductoFormComponent implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly categoriasService = inject(CategoriasService);
  private readonly proveedoresService = inject(ProveedoresService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Si hay id_producto en la ruta, estamos editando; si no, creando.
  // Se lee una sola vez: la ruta no cambia sin recrear el componente completo.
  private readonly idProducto = this.route.snapshot.paramMap.get('id_producto');
  readonly modoEdicion = this.idProducto !== null;

  nombre = signal('');
  descripcion = signal('');
  precio = signal<number | null>(null);
  stockMinimo = signal<number | null>(null);
  idCategoria = signal<number | null>(null);
  idProveedor = signal<number | null>(null);

  categorias = signal<Categoria[]>([]);
  proveedores = signal<Proveedor[]>([]);

  // Dos estados de carga separados: uno para los datos iniciales (dropdowns +
  // producto si es edición), otro para el envío del formulario. Login solo
  // necesitaba uno porque no precarga nada.
  cargandoDatos = signal(true);
  guardando = signal(false);
  mensaje = signal('');

  ngOnInit(): void {
    this.categoriasService.listarCategorias().subscribe({
      next: (respuesta) => this.categorias.set(respuesta.data),
      error: () => this.mensaje.set('No se pudieron cargar las categorías.'),
    });

    this.proveedoresService.listarProveedores().subscribe({
      next: (respuesta) => this.proveedores.set(respuesta.data),
      error: () => this.mensaje.set('No se pudieron cargar los proveedores.'),
    });

    if (this.modoEdicion && this.idProducto) {
      this.productosService.buscarProductoPorId(Number(this.idProducto)).subscribe({
        next: (respuesta) => {
          const producto = respuesta.data;
          this.nombre.set(producto.nombre);
          this.descripcion.set(producto.descripcion ?? '');
          // precio llega como string del backend (driver pg con NUMERIC) —
          // se convierte a number para que el input numérico lo acepte.
          this.precio.set(Number(producto.precio));
          this.stockMinimo.set(producto.stock_minimo);
          this.idCategoria.set(producto.id_categoria);
          this.idProveedor.set(producto.id_proveedor ?? null);
          this.cargandoDatos.set(false);
        },
        error: (err) => {
          this.mensaje.set(err.error?.message ?? 'No se pudo cargar el producto.');
          this.cargandoDatos.set(false);
        },
      });
    } else {
      this.cargandoDatos.set(false);
    }
  }

  onSubmit(): void {
    this.mensaje.set('');

    // Validación en el mismo orden que el backend, para que el mensaje que
    // ve el usuario coincida con el que tirará el servidor si algo se cuela.
    if (!this.nombre().trim()) {
      this.mensaje.set('El nombre del producto es obligatorio.');
      return;
    }

    if (this.precio() === null || this.precio()! < 0) {
      this.mensaje.set('El precio debe ser un número mayor o igual a 0.');
      return;
    }

    if (this.stockMinimo() === null || this.stockMinimo()! < 0) {
      this.mensaje.set('El stock mínimo debe ser un número mayor o igual a 0.');
      return;
    }

    if (this.idCategoria() === null) {
      this.mensaje.set('Debes seleccionar una categoría.');
      return;
    }

    this.guardando.set(true);

    const producto = {
      nombre: this.nombre(),
      descripcion: this.descripcion().trim() || null,
      precio: this.precio()!,
      stock_minimo: this.stockMinimo()!,
      id_categoria: this.idCategoria()!,
      id_proveedor: this.idProveedor(),
    };

    const peticion = this.modoEdicion
      ? this.productosService.actualizarProducto(Number(this.idProducto), producto)
      : this.productosService.crearProducto(producto);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.router.navigate(['/dashboard/productos']);
      },
      error: (err) => {
        this.guardando.set(false);
        this.mensaje.set(err.error?.message ?? 'Error de conexión con el servidor.');
      },
    });
  }

  onCancelar(): void {
    this.router.navigate(['/dashboard/productos']);
  }
}