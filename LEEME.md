# Gestion Total Portal — React

Portal web completo para catálogo online, pedidos y dashboard de gestión.

---

## Estructura de carpetas

```
src/
├── api/
│   ├── axios.js              Instancias Axios (pública + privada con JWT)
│   ├── tienda.js             Calls al catálogo público
│   ├── auth.js               Login JWT
│   └── dashboard.js          Calls privados del dashboard
│
├── store/
│   ├── authStore.js          Zustand: JWT del operador (persistido en localStorage)
│   └── carritoStore.js       Zustand: carrito (persistido en localStorage)
│
├── lib/
│   └── format.js             formatPrecio ARS, fechas, estado abierto/cerrado
│
├── hooks/
│   ├── useTienda.js          React Query hooks: info, categorías, productos
│   └── useWhatsApp.js        Genera link + mensaje WhatsApp con código de barras
│
├── components/
│   ├── layout/
│   │   ├── Header.jsx         Header público (logo, badge abierto/cerrado, carrito)
│   │   └── DashboardLayout.jsx  Sidebar + nav del dashboard privado
│   ├── catalogo/
│   │   ├── ProductoCard.jsx   Tarjeta de producto con botón agregar
│   │   ├── FiltrosCatalogo.jsx  Buscador + chips de categorías
│   │   └── StockBadge.jsx     Badge "Sin stock" / "Últimas unidades"
│   ├── carrito/
│   │   └── CarritoDrawer.jsx  Drawer lateral del carrito
│   ├── kanban/
│   │   └── KanbanCard.jsx     Tarjeta Kanban expandible con acciones
│   └── ui/
│       ├── Spinner.jsx        Spinner + PageSpinner
│       ├── EmptyState.jsx     Estado vacío genérico
│       └── Modal.jsx          Modal accesible con backdrop
│
├── pages/
│   ├── public/
│   │   ├── CatalogoPage.jsx   Catálogo paginado con filtros y badges de stock
│   │   ├── CheckoutPage.jsx   Checkout con costo de envío calculado
│   │   └── ConfirmacionPage.jsx  Confirmación + botones WhatsApp + volver
│   └── dashboard/
│       ├── LoginPage.jsx      Login con JWT
│       ├── KanbanPage.jsx     Kanban de pedidos (auto-refresh 30s)
│       ├── PedidoManualPage.jsx  Carga manual con autocompletado
│       ├── ProductosPage.jsx  Gestión de productos (visible/oculto, imagen, descripción)
│       └── ReportesPage.jsx   Historial de pedidos con filtros y detalle
│
├── App.jsx                    Router con rutas públicas y privadas (ProtectedRoute)
├── main.jsx                   Entry point con QueryClient y Toaster
└── index.css                  Variables CSS del tema + clases utilitarias
```

---

## Setup local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar `.env`

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_TENANT_SLUG=mi-negocio
```

Para producción (Railway):
```env
VITE_API_URL=https://TU-APP.railway.app/api/v1
VITE_TENANT_SLUG=mi-negocio
```

### 3. Correr en desarrollo

```bash
npm run dev
# → http://localhost:5173
```

### 4. Build para producción

```bash
npm run build
```

---

## Rutas

| Ruta | Tipo | Descripción |
|---|---|---|
| `/` | Redirect | → `/tienda/mi-negocio` |
| `/tienda/:slug` | Pública | Catálogo con filtros y búsqueda |
| `/tienda/:slug/checkout` | Pública | Formulario de pedido |
| `/tienda/:slug/confirmacion/:num` | Pública | Confirmación + WhatsApp |
| `/dashboard/login` | Pública | Login del operador |
| `/dashboard/pedidos` | Privada | Kanban de pedidos |
| `/dashboard/pedido-manual` | Privada | Crear pedido manual |
| `/dashboard/productos` | Privada | Habilitar/deshabilitar, imágenes |
| `/dashboard/reportes` | Privada | Historial con detalle |

---

## Funcionalidades clave

### Catálogo público
- Grid responsive (2 cols mobile → 6 cols desktop)
- Filtro por categoría (chips) + búsqueda por texto
- Paginación con `page_size=24`
- Badge ABIERTO/CERRADO según `horario_apertura` y `horario_cierre` del `config_visual`
- Banner de mensaje de bienvenida desde `config_visual.mensaje_bienvenida`
- Color de acento dinámico desde `config_visual.color_acento`
- Carrito persistente (localStorage via Zustand)

### Checkout
- Cálculo automático de costo de envío desde `config_visual.costo_envio_domicilio`
- Envío gratis si el subtotal supera `config_visual.envio_gratis_desde`
- Campo DNI/CUIT opcional (ADR-010)
- Validación inline con mensajes de error

### Confirmación + WhatsApp
- Link `wa.me/{numero}?text=...` con mensaje formateado
- Mensaje incluye: código de barras de cada producto, cantidades, precios, total, método de entrega
- Botón "Copiar mensaje" con `navigator.clipboard`
- Preview colapsable del mensaje

### Dashboard Kanban
- 4 columnas: Por confirmar / En preparación / Para entregar / Entregado
- Auto-refresh cada 30s con React Query
- Tarjeta expandible: muestra datos del cliente, items, totales, notas, acciones
- Columna "Entregado": máximo 10 cards, resto en Reportes
- Confirmación al cancelar

### Pedido manual (operador)
- Autocompletado de productos por nombre, código o código de barras
- Enter en código de barras agrega automáticamente si hay match exacto
- Cantidades solo enteras, editable por fila
- Totalizadores en tiempo real (subtotal + envío + total)
- Validación de campos requeridos

### Productos del dashboard
- Toggle Visible/Oculto por fila y masivo
- Subida de imagen via Cloudinary (hover sobre la imagen)
- Edición inline de descripción web

### Reportes
- Tabla con todos los pedidos
- Filtro por estado + búsqueda libre
- Stats cards: total, entregados, cancelados, monto total
- Modal de detalle con tabla de productos (código + descripción + cantidades)

---

## Deploy en Vercel

1. Subir el proyecto a GitHub
2. Conectar en `vercel.com`
3. Variables de entorno:
   ```
   VITE_API_URL=https://TU-APP.railway.app/api/v1
   VITE_TENANT_SLUG=mi-negocio
   ```
4. El `vercel.json` ya maneja el routing de React Router (SPA rewrites)

---

## Variables de config_visual del tenant

Las siguientes claves de `config_visual` (en `tenants` de Postgres) afectan la UI del portal:

| Clave | Tipo | Efecto |
|---|---|---|
| `color_acento` | `#rrggbb` | Color principal del portal (botones, chips, badges) |
| `logo_url` | URL | Logo en el header |
| `nombre_comercial` | string | Nombre en el header y WhatsApp |
| `horario_apertura` | `"HH:MM"` | Badge ABIERTO/CERRADO |
| `horario_cierre` | `"HH:MM"` | Badge ABIERTO/CERRADO |
| `costo_envio_domicilio` | number | Costo de envío calculado en checkout |
| `envio_gratis_desde` | number | Monto desde el que el envío es gratis |
| `acepta_retiro` | boolean | Mostrar opción "Retiro en local" |
| `acepta_domicilio` | boolean | Mostrar opción "Envío a domicilio" |
| `direccion_local` | string | Mostrada en la opción de retiro |
| `mensaje_bienvenida` | string | Banner superior del catálogo |
