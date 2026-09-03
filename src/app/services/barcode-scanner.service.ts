import { Injectable, signal } from '@angular/core';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';

@Injectable({
  providedIn: 'root',
})
export class BarcodeScannerService {
  // Signal en vez de un simple booleano de componente: cualquier feature (productos, lotes,
  // ventas) que inyecte este servicio puede reaccionar al mismo estado de "cámara abierta"
  // sin tener que duplicar la lógica de mostrar spinner / deshabilitar botón.
  readonly scanning = signal(false);

  /**
   * Abre la UI nativa de escaneo (la trae el propio plugin, no la construimos nosotros)
   * y devuelve el texto decodificado, o null si el usuario canceló, negó el permiso
   * de cámara, o el escaneo falló por cualquier motivo.
   *
   * hint: ALL porque ClinicApp escanea tanto códigos de producto (EAN/UPC) como
   * posibles códigos QR de lote — no tiene sentido restringir el formato aquí.
   */
  async scan(): Promise<string | null> {
    this.scanning.set(true);
    try {
      const resultado = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.ALL,
      });
      return resultado?.ScanResult ?? null;
    } catch (error) {
      // El plugin rechaza la promesa tanto si el usuario cancela como si el permiso de
      // cámara fue denegado. Para la UI de ClinicApp, ambos casos se tratan igual:
      // "no hay resultado" — quien llame a scan() no necesita distinguir el motivo.
      console.warn('Escaneo cancelado o no disponible:', error);
      return null;
    } finally {
      this.scanning.set(false);
    }
  }
}