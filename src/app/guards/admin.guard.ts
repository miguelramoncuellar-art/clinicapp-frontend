import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthenticateService } from '../services/authenticate.service';

// Guard de ROL, patrón propio (la clase solo cubrió el de sesión).
// Estructura calcada del authGuard: guard FUNCIONAL (CanActivateFn),
// dependencias vía inject(), retorno true | UrlTree.
//
// Su lugar en la cadena: el authGuard del padre ya corrió y pasó
// (si no hay sesión, redirige a /login y este guard NI SE EJECUTA).
// Por eso aquí no re-validamos sesión: cada guard hace UNA cosa.
// La cascada espeja la del backend — authGuard ≈ verifyToken,
// adminGuard ≈ verifyRole — misma arquitectura, distinto lado del cable.
//
// Es mejora de UX, no seguridad: lee el rol del snapshot de localStorage
// (escrito en el login). Si alguien lo manipulara a mano, entraría a la
// pantalla… y el backend respondería 403 a cada petición, como ya
// comprobamos en la Fase 4. La seguridad real sigue viviendo en
// verifyRole(['administrador']).
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthenticateService);
  const router = inject(Router);

  const usuario = authService.getUsuario();

  // Mismo criterio exacto que el computed esAdministrador del dashboard:
  // toLowerCase por la regla de siempre (no depender de la capitalización
  // del rol). El doble ?. es defensa barata: si localStorage viniera
  // corrupto y usuario o rol fueran null/undefined, la comparación da
  // false y se redirige — nunca revienta.
  if (usuario?.rol?.toLowerCase() === 'administrador') {
    return true;
  }

  // A /dashboard, NO a /login: el usuario TIENE sesión válida — mandarlo
  // al login sería absurdo (vería un formulario estando logueado).
  // Tampoco hardcodeamos /dashboard/productos: delegamos en el
  // redirectTo del padre, el único punto de verdad del módulo por
  // defecto. Sin riesgo de bucle: productos no está tras este guard.
  return router.createUrlTree(['/dashboard']);
};