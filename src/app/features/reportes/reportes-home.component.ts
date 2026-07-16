import { Component, LOCALE_ID, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, registerLocaleData } from '@angular/common';
import localeEsCO from '@angular/common/locales/es-CO';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ReportesService } from './reportes.service';
import { rangoFechasValidator } from './rango-fechas.validator';
import {
  ProductoMasVendido,
  ReporteDiario,
  ReporteMensual,
  ReporteSemanal,
  VentaPorDia,
  VentaPorUsuario,
} from './reportes.model';

// Los pipes date/currency necesitan los datos del locale ANTES de formatear.
// Se registra una sola vez al cargar este archivo.
registerLocaleData(localeEsCO);

@Component({
  selector: 'app-reportes-home',
  imports: [ReactiveFormsModule, DatePipe, CurrencyPipe],
  // LOCALE_ID a nivel de COMPONENTE (no global): los pipes de ESTE módulo
  // formatean en es-CO ($ 45.000 con punto de miles) sin alterar el formato
  // de módulos ya verificados. Si luego lo queremos global → app.config.ts.
  providers: [{ provide: LOCALE_ID, useValue: 'es-CO' }],
  templateUrl: './reportes-home.component.html',
  styleUrl: './reportes-home.component.css',
})
export class ReportesHomeComponent implements OnInit {
  private readonly reportesService = inject(ReportesService);
  private readonly fb = inject(NonNullableFormBuilder);

  cargando = signal(false);
  mensajeError = signal('');

  reporteDiario = signal<ReporteDiario | null>(null);
  reporteSemanal = signal<ReporteSemanal | null>(null);
  reporteMensual = signal<ReporteMensual | null>(null);
  ventasPorDia = signal<VentaPorDia[]>([]);
  productosMasVendidos = signal<ProductoMasVendido[]>([]);
  ventasPorUsuario = signal<VentaPorUsuario[]>([]);

  // El validador cross-field va en el SEGUNDO argumento del group(),
  // porque pertenece al grupo y no a un control individual.
  formulario = this.fb.group(
    {
      fecha_inicio: [this.getFechaHace30Dias(), Validators.required],
      fecha_fin: [this.getTodayDate(), Validators.required],
    },
    { validators: rangoFechasValidator },
  );

  ngOnInit(): void {
    this.cargarResumenes();
    this.buscar(); // primera carga con el rango por defecto del formulario
  }

  // Equivalente al getTodayDate() de la clase, pero en hora LOCAL.
  // toISOString() devuelve la fecha en UTC: en Bogotá (UTC-5), después de las
  // 7 p.m. ya sería "mañana" y los filtros no cuadrarían con el día real.
  private getTodayDate(): string {
    return this.formatearFechaLocal(new Date());
  }

  // La clase usaba hoy como valor por defecto; aquí el rango arranca 30 días
  // atrás para calcar el default del backend y que la primera carga traiga datos.
  private getFechaHace30Dias(): string {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 30);
    return this.formatearFechaLocal(fecha);
  }

  private formatearFechaLocal(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private cargarResumenes(): void {
    // forkJoin: dispara las peticiones EN PARALELO y emite UNA sola vez cuando
    // todas completan. Ideal para HTTP, que son observables que completan solos;
    // por eso aquí no hace falta takeUntilDestroyed como en el valueChanges de
    // ventas, que es un stream que vive mientras viva el componente.
    forkJoin({
      diario: this.reportesService.obtenerReporteDiario(),
      semanal: this.reportesService.obtenerReporteSemanal(),
      mensual: this.reportesService.obtenerReporteMensual(),
      porUsuario: this.reportesService.obtenerVentasPorUsuario(),
    }).subscribe({
      next: (res) => {
        this.reporteDiario.set(res.diario.data);
        this.reporteSemanal.set(res.semanal.data);
        this.reporteMensual.set(res.mensual.data);
        this.ventasPorUsuario.set(res.porUsuario.data);
      },
      error: (err) => this.manejarError(err),
    });
  }

  buscar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.mensajeError.set('');
    this.cargando.set(true);

    // getRawValue() devuelve { fecha_inicio, fecha_fin }: encaja directo
    // en FiltroRangoFechas — para esto definimos el filtro como interfaz.
    const filtro = this.formulario.getRawValue();

    forkJoin({
      porDia: this.reportesService.obtenerVentasPorDia(filtro),
      topProductos: this.reportesService.obtenerProductosMasVendidos(filtro),
    }).subscribe({
      next: (res) => {
        this.ventasPorDia.set(res.porDia.data);
        this.productosMasVendidos.set(res.topProductos.data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.manejarError(err);
      },
    });
  }

  private manejarError(err: { status?: number }): void {
    // Ojo con forkJoin: si UNA petición del conjunto falla, todo cae aquí.
    this.mensajeError.set(
      err.status === 403
        ? 'Solo los administradores pueden consultar los reportes.'
        : 'No se pudieron cargar los reportes. Intenta de nuevo.',
    );
  }
}