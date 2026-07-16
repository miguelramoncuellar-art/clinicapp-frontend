import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// PATRÓN NUEVO — Validador cross-field: se aplica al FormGroup completo, no a
// un control individual, porque necesita leer DOS campos a la vez. Angular lo
// re-ejecuta en cada cambio de cualquier control del grupo, y el error queda
// en formulario.errors (no en los errors de cada control).
//
// Truco: las fechas YYYY-MM-DD se comparan correctamente como strings
// (orden lexicográfico = orden cronológico), así evitamos new Date() y sus
// trampas de zona horaria.
export const rangoFechasValidator: ValidatorFn = (
  grupo: AbstractControl,
): ValidationErrors | null => {
  const inicio = grupo.get('fecha_inicio')?.value as string | undefined;
  const fin = grupo.get('fecha_fin')?.value as string | undefined;

  if (!inicio || !fin) {
    return null; // de los vacíos se encarga Validators.required; aquí solo el orden
  }

  return inicio <= fin ? null : { rangoInvalido: true };
};