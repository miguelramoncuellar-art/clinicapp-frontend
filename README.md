# ClinicApp — Frontend

Interfaz web de **ClinicApp**, un sistema de gestión de inventario para clínica/farmacia:
control de stock por lotes, fechas de vencimiento, ventas, alertas y reportes.

Esta aplicación es **solo la capa de presentación**. No guarda datos ni contiene lógica de
negocio: todo lo consulta a la API de ClinicApp, que vive en un repositorio aparte y debe
estar corriendo para que el frontend funcione.

- **Backend (API + base de datos):** https://github.com/miguelramoncuellar-art/ClinicApp

---

## Tecnologías

| Área | Tecnología |
|---|---|
| Framework | Angular 22 — componentes *standalone*, sin NgModules |
| Estado | Signals de Angular (sin NgRx ni librerías externas) |
| Detección de cambios | *Zoneless* (sin Zone.js) |
| Lenguaje | TypeScript 6 |
| HTTP | `HttpClient` + interceptor funcional, RxJS 7.8 |
| Pruebas | Vitest 4 + jsdom |
| Estilos | CSS plano, sin framework |
| Formato | Prettier |

---

## Requisitos previos

- **Node.js 24** o superior
- **npm 11.13.0** (versión declarada en `packageManager` dentro de `package.json`)
- **PostgreSQL 18** — lo usa el backend, no este proyecto
- El **backend de ClinicApp** corriendo en `http://localhost:3000`

> El backend acepta peticiones únicamente desde `http://localhost:4200` (política CORS),
> que es el puerto por defecto de `ng serve`. Si cambias el puerto del frontend, hay que
> ajustar también el `cors()` del backend.

---

## Puesta en marcha

El orden importa: **primero el backend**, después el frontend. Sin API disponible, la
pantalla de login no puede autenticar a nadie.

### 1. Levantar el backend

```bash
git clone https://github.com/miguelramoncuellar-art/ClinicApp.git
cd ClinicApp
npm install
```

Crea el archivo `.env` a partir de `.env.example` y completa las credenciales de tu
PostgreSQL local. **El `.env` nunca se sube al repositorio.**

Ejecuta las migraciones para que las tablas coincidan con el código:

```bash
npm run db:migrate
```

> Este paso es obligatorio en una instalación nueva y también cada vez que traigas cambios
> del repositorio. La mayoría de los fallos de login "inexplicables" vienen de una base de
> datos desactualizada.

Levanta la API:

```bash
npm run dev
```

Verificaciones rápidas:

- `http://localhost:3000/api/health` → debe responder `200` con `base_de_datos: "conectada"`.
  Si responde `503`, la API está viva pero PostgreSQL no contesta.
- `http://localhost:3000/api-docs` → documentación Swagger de todos los endpoints.

### 2. Levantar el frontend

```bash
git clone https://github.com/miguelramoncuellar-art/clinicapp-frontend.git
cd clinicapp-frontend
npm install
npm start
```

La aplicación queda disponible en `http://localhost:4200`.

### 3. Crear el primer usuario

Las migraciones crean las tablas pero **no siembran usuarios**: en una instalación nueva la
tabla `usuarios` está vacía y nadie puede iniciar sesión. El primer administrador se crea a
mano, una sola vez.

La contraseña se guarda encriptada con bcrypt, así que no se puede escribir directamente en
la base de datos. Primero genera el hash **desde la carpeta del backend** (es donde está
instalado bcrypt):

```bash
node -e "console.log(require('bcrypt').hashSync('CambiaEstaClave123', 10))"
```

Copia el hash resultante (una cadena de 60 caracteres que empieza por `$2b$`) y ejecuta este
INSERT en pgAdmin o en `psql`:

```sql
INSERT INTO usuarios (nombre, apellido, correo, contrasena, rol)
VALUES ('Admin', 'Principal', 'admin@clinicapp.com', 'PEGA_AQUI_EL_HASH', 'administrador');
```

Con ese correo y la contraseña que elegiste ya puedes entrar en `http://localhost:4200`.

> Cambia la contraseña del ejemplo por una propia. Las columnas `usuario_activo` y las de
> fechas se llenan solas con los valores por defecto de la tabla.

---

## Usuarios y roles

### Cómo nace cada tipo de usuario

| Usuario | Puerta de entrada | Requiere |
|---|---|---|
| Primer administrador | INSERT manual en la base de datos | Acceso a PostgreSQL |
| Personal (operador / administrador) | `POST /api/usuarios` | Token de administrador |
| Clientes | `POST /api/auth/register` | Nada (endpoint público) |

El registro público crea **siempre** usuarios con rol `cliente`; ignora cualquier rol que se
envíe en la petición. Los roles con permisos sobre el inventario solo se otorgan desde el
endpoint protegido, es decir, por un administrador ya autenticado.

### Qué puede hacer cada rol

| Rol | Alcance |
|---|---|
| `administrador` | Acceso completo: productos, inventario, ventas, reportes y gestión de usuarios |
| `operador` | Operación diaria: productos, inventario y registro de ventas |
| `cliente` | Solo puede autenticarse. No tiene acceso a los módulos de gestión |

La restricción real vive en el backend (middlewares `verifyToken` y `verifyRole`). El
frontend replica esa jerarquía con guards para mejorar la experiencia — ocultar lo que no se
puede usar — pero nunca es la única barrera.

---

## Estructura del proyecto

```
src/
├── environments/            Configuración por entorno (URL del backend)
├── index.html
├── main.ts                  Arranque de la aplicación
├── styles.css               Estilos globales
└── app/
    ├── app.config.ts        Providers: router, HttpClient, interceptor, zoneless
    ├── app.routes.ts        Definición de rutas y guards
    ├── app.ts / .html / .css
    ├── features/            Módulos de dominio (uno por área de negocio)
    │   ├── inventario/      Componente + modelo + servicio
    │   ├── productos/       Solo componente (ver "Deudas conocidas")
    │   ├── reportes/        Componente + modelo + servicio + validador de rango de fechas
    │   ├── usuarios/        Componente + modelo + servicio
    │   └── ventas/          Componente + modelo + servicio
    ├── guards/
    │   ├── auth.guard.ts    Exige sesión activa
    │   └── admin.guard.ts   Exige rol administrador
    ├── interceptors/
    │   └── auth.interceptor.ts   Adjunta el token JWT a cada petición
    ├── models/              Interfaces compartidas (respuesta de la API, auth, producto)
    ├── pages/
    │   ├── login/           Pantalla de acceso
    │   └── dashboard/       Contenedor: barra superior, navegación y salida de los features
    └── services/            Servicios previos a la estructura por features
```

Cada carpeta de `features/` es autocontenida: componente, modelo TypeScript e integración
HTTP viven juntos. Las interfaces de los modelos se derivan de los **alias del SQL** de cada
endpoint del backend, no de los nombres de las tablas.

---

## Configuración de la URL del backend

La dirección de la API está centralizada en un solo lugar:

```
src/environments/environment.ts              → usada en compilaciones de producción
src/environments/environment.development.ts  → usada por ng serve
```

Ambos archivos exponen `apiUrl`, que por defecto apunta a `http://localhost:3000/api`.
Ningún servicio escribe la URL a mano: todos importan `environment`. Si el backend cambia de
puerto o de dominio, se edita aquí y nada más.

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Servidor de desarrollo con recarga automática en `http://localhost:4200` |
| `npm run build` | Compilación de producción en `dist/` |
| `npm run watch` | Compilación en modo desarrollo, recompilando ante cada cambio |
| `npm test` | Ejecuta las pruebas con Vitest |

---

## Autenticación en el cliente

El flujo completo funciona así:

1. El login envía las credenciales a `POST /api/auth/login` y recibe un **token JWT** con
   validez de **8 horas**, junto con los datos del usuario.
2. Token y usuario se guardan en `localStorage` con el prefijo `clinicapp_`, para no chocar
   con otras aplicaciones que usen el mismo `localhost`.
3. El **interceptor** adjunta el token a cada petición saliente.
4. El **`authGuard`** protege la ruta del dashboard; sus rutas hijas lo heredan.
5. El **`adminGuard`** protege además las rutas exclusivas de administrador. Si un usuario sin
   permisos entra por un enlace directo, se le redirige sin llegar a llamar al backend.
6. Al recargar la página se consulta `GET /api/auth/me`, que revalida la sesión contra la base
   de datos: si la cuenta fue desactivada mientras tanto, el token deja de servir aunque
   todavía no haya expirado.

Los usuarios no se eliminan, se desactivan. Así el historial de ventas asociado a una cuenta
permanece intacto.

---

## Módulos disponibles

La interfaz cubre hoy cinco áreas: **productos**, **inventario**, **ventas**, **reportes** y
**usuarios** (las dos últimas, solo para administradores).

La API expone además **categorías**, **proveedores**, **lotes**, **alertas** y
**detalle de ventas**, que por ahora se gestionan desde Swagger (`/api-docs`) y no tienen
pantalla propia.

---

## Pruebas

El proyecto usa **Vitest** con **jsdom** como entorno de navegador simulado, configurado a
través del constructor de Angular. Se ejecutan con `npm test`.

Actualmente solo existen los archivos `.spec.ts` generados automáticamente por Angular CLI
(login, dashboard y los dos servicios de `app/services`). La cobertura real de los módulos
está pendiente.

---

## Deudas conocidas

- **Productos a medio migrar:** su componente ya vive en `features/productos/`, pero el
  servicio y el modelo siguen en `app/services/` y `app/models/`, de una estructura anterior.
- **Cobertura de pruebas:** los features no tienen specs propios todavía.
- **Validación de formularios:** hoy es manual en cada componente; se evalúa centralizarla.