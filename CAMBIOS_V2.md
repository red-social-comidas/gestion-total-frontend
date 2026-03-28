# Gestion Total Portal — Cambios v2

## Bugs críticos corregidos

### 1. Total del carrito mostraba $ 0
**Causa:** `get total()` y `get cantidadItems()` como getters JavaScript no funcionan dentro
de la serialización de Zustand. El objeto se clona y los getters se pierden.

**Fix en `src/store/carritoStore.js`:**
Los getters se convirtieron en funciones normales:
```js
// Antes (roto)
get total() { return get().items.reduce(...) }

// Ahora (correcto)
total: () => get().items.reduce(...)
```
Todos los componentes que los usan ahora los llaman como función:
```js
const total = useCarritoStore(s => s.total())
const cant  = useCarritoStore(s => s.cantidadItems())
```

Archivos afectados: `carritoStore.js`, `CarritoDrawer.jsx`, `Header.jsx`, `CheckoutPage.jsx`

---

### 2. Inputs del checkout perdían el foco al escribir
**Causa:** el formulario usaba un setter llamado `set(field, val)` que colisionaba con el
nombre interno de Zustand al ser importado. React re-renderizaba el componente padre
y destruía el foco.

**Fix en `src/pages/public/CheckoutPage.jsx`:**
Cada campo del formulario tiene ahora su propio `useState` independiente:
```js
const [clienteNombre, setClienteNombre] = useState('')
const [clienteCelular, setClienteCelular] = useState('')
// ... etc
```
Esto elimina completamente el re-render del componente padre al escribir en cualquier campo.

---

## Nuevas funcionalidades

### 3. Sidebar de categorías en el catálogo (desktop)
**Archivo:** `src/pages/public/CatalogoPage.jsx`

- En pantallas `lg` (≥1024px) se muestra un sidebar izquierdo con todas las categorías,
  igual al estilo de Mercado Libre
- Muestra las primeras 8 categorías. Si hay más, aparece un botón **"Ver más (N)"**
- El botón "Ver más" abre un modal con el listado completo para seleccionar
- En mobile siguen apareciendo los chips horizontales (comportamiento anterior)
- Click en categoría filtra los productos y cierra el modal si estaba abierto

**Prop nueva en `FiltrosCatalogo.jsx`:** `soloMobile={true}` — oculta los chips en desktop
cuando el sidebar está visible.

---

### 4. Modal de detalle de producto al hacer click en la card
**Archivo nuevo:** `src/components/catalogo/ProductoModal.jsx`

- Click en la tarjeta del producto (en cualquier parte) abre el modal
- Muestra imagen grande, nombre, precio, descripción web (si existe), badge de stock
- Selector de cantidad con botones − / +
- Subtotal dinámico en tiempo real (precio × cantidad)
- Botón **"Agregar al carrito"** deshabilitado si `sin_stock`
- Al agregar, cierra el modal y muestra toast de confirmación

**Cambio en `ProductoCard.jsx`:** el botón del carrito ahora es para agregar rápido (1 unidad).
Click en la imagen/nombre abre el modal.

---

### 5. Badge del carrito en el Header siempre visible
**Archivo:** `src/components/layout/Header.jsx`

- Cuando hay items en el carrito, el fondo del botón cambia al color de acento
- Aparece un badge rojo en la esquina superior derecha con la cantidad exacta
- El contador usa `cantidadItems()` correctamente (fix del bug #1)

---

### 6. Modal de edición de pedidos en el Kanban
**Archivo nuevo:** `src/components/kanban/EditarPedidoModal.jsx`

- Botón **"Editar"** visible en los pedidos expandidos (columnas por_confirmar,
  en_preparacion, para_entregar — no en estados terminales)
- Permite modificar:
  - Productos: agregar/quitar/cambiar cantidades con autocompletado igual al pedido manual
  - Método de entrega (retiro/domicilio)
  - Dirección de entrega
  - Notas
- Totalizador de subtotal en tiempo real
- Al guardar llama a `PATCH /dashboard/pedidos/{id}` e invalida el Kanban

**Cambio en `KanbanCard.jsx`:** integra el botón Editar y el modal.

---

### 7. Pedido Manual — mejoras en búsqueda por código de barras
**Archivo:** `src/pages/dashboard/PedidoManualPage.jsx`

- El input de búsqueda tiene **campos individuales** para evitar el bug de pérdida de foco
- Enter agrega el producto si:
  - Hay match exacto por `codigo_barras` o `codigo_interno` → agrega directamente (ideal para lector de código de barras)
  - Hay un solo resultado → agrega ese
  - Hay múltiples → muestra el dropdown para elegir
- **Botón "Ver catálogo completo"**: abre un modal con tabla de todos los productos habilitados,
  con columnas: Código | Nombre | Precio | Stock | botón Agregar
  - Tiene filtro de búsqueda propio dentro del modal
  - El stock se muestra en color (verde/amarillo/rojo)

---

### 8. Sección Configuración del negocio
**Archivo nuevo:** `src/pages/dashboard/ConfiguracionPage.jsx`
**Ruta:** `/dashboard/configuracion`

Secciones disponibles:
- **Datos del negocio**: Nombre comercial, WhatsApp, email de contacto, dirección del local,
  mensaje de bienvenida
- **Apariencia**: Color de acento con color picker + preview en tiempo real, URL del logo
  con previsualización
- **Horario de atención**: Hora de apertura y cierre (controla el badge Abierto/Cerrado)
- **Opciones de entrega**: Toggle retiro/domicilio, costo de envío, umbral de envío gratis
- **Info Cloudinary**: instrucciones para subir imágenes de productos

**Nota técnica:** La sección llama a `PATCH /dashboard/config`. Este endpoint deberá
implementarse en la API FastAPI. Si no existe, muestra un aviso informativo pero no rompe la UI.

El cambio de color de acento se aplica en tiempo real (preview instantáneo mientras se edita).

---

## Archivos nuevos creados

| Archivo | Descripción |
|---|---|
| `src/components/catalogo/ProductoModal.jsx` | Modal detalle con cantidad y agregar al carrito |
| `src/components/kanban/EditarPedidoModal.jsx` | Modal edición de pedido desde el Kanban |
| `src/pages/dashboard/ConfiguracionPage.jsx` | Pantalla completa de configuración del negocio |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/store/carritoStore.js` | Fix bug total/cantidadItems como funciones |
| `src/components/carrito/CarritoDrawer.jsx` | Usa `total()` como función |
| `src/components/layout/Header.jsx` | Badge visible con contador correcto |
| `src/components/catalogo/ProductoCard.jsx` | Click abre modal, botón carrito agrega rápido |
| `src/components/catalogo/FiltrosCatalogo.jsx` | Prop `soloMobile` para ocultar chips en desktop |
| `src/components/kanban/KanbanCard.jsx` | Botón Editar + integración EditarPedidoModal |
| `src/components/layout/DashboardLayout.jsx` | Nav item Configuración agregado |
| `src/pages/public/CatalogoPage.jsx` | Sidebar categorías + modal Ver más |
| `src/pages/public/CheckoutPage.jsx` | Fix inputs con estados individuales + total() |
| `src/pages/dashboard/PedidoManualPage.jsx` | Fix inputs + Enter mejorado + modal catálogo |
| `src/App.jsx` | Ruta `/dashboard/configuracion` agregada |
