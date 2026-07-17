import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProductosHomeComponent } from './features/productos/productos-home.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { InventarioHomeComponent } from './features/inventario/inventario-home.component';
import { VentasHomeComponent } from './features/ventas/ventas-home.component';
import { ReportesHomeComponent } from './features/reportes/reportes-home.component';
import { UsuariosHomeComponent } from './features/usuarios/usuarios-home.component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard], // valida SESIÓN: protege al padre y a TODOS sus hijos
    children: [
      { path: '', redirectTo: 'productos', pathMatch: 'full' },
      { path: 'productos', component: ProductosHomeComponent },
      { path: 'inventario', component: InventarioHomeComponent },
      { path: 'ventas', component: VentasHomeComponent },
      // Solo-admin: cadena de guards en cascada — el authGuard del padre
      // valida sesión, el adminGuard del hijo valida rol (espejo del
      // verifyToken → verifyRole del backend). El guard es UX: redirección
      // limpia en vez de pantalla con 403; la seguridad real sigue en el
      // backend.
      { path: 'reportes', component: ReportesHomeComponent, canActivate: [adminGuard] },
      { path: 'usuarios', component: UsuariosHomeComponent, canActivate: [adminGuard] },
    ],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];