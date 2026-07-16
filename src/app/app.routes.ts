import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProductosHomeComponent } from './features/productos/productos-home.component';
import { authGuard } from './guards/auth.guard';
import { InventarioHomeComponent } from './features/inventario/inventario-home.component';
import { VentasHomeComponent } from './features/ventas/ventas-home.component';
import { ReportesHomeComponent } from './features/reportes/reportes-home.component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard], // protege al padre y, con él, a TODOS sus hijos
    children: [
      { path: '', redirectTo: 'productos', pathMatch: 'full' },
      { path: 'productos', component: ProductosHomeComponent },
      { path: 'inventario', component: InventarioHomeComponent },
      { path: 'ventas', component: VentasHomeComponent },
      // Hereda authGuard del padre. OJO: el guard valida SESIÓN, no ROL —
      // la restricción de administrador la aplica el backend (403).
      { path: 'reportes', component: ReportesHomeComponent },
    ],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];