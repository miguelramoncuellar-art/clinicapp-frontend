import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ProductosService } from '../../services/productos.service';
import { Producto } from '../../models/producto.model';

@Component({
  selector: 'app-productos-home',
  imports: [CurrencyPipe],
  templateUrl: './productos-home.component.html',
  styleUrl: './productos-home.component.css',
})
export class ProductosHomeComponent implements OnInit {
  private readonly productosService = inject(ProductosService);

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
}