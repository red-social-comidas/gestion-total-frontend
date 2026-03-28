import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCarritoStore = create(
  persist(
    (set, get) => ({
      items: [],

      agregar: (producto, cantidad = 1) => {
        const items = get().items
        const existe = items.find(i => i.idProductoLocal === producto.id_local)
        if (existe) {
          set({
            items: items.map(i =>
              i.idProductoLocal === producto.id_local
                ? { ...i, cantidad: i.cantidad + cantidad }
                : i
            ),
          })
        } else {
          set({
            items: [
              ...items,
              {
                idProductoLocal: producto.id_local,
                nombre:          producto.nombre,
                precio:          Number(producto.precio),
                cantidad,
                codigoBarras:    producto.codigo_barras,
                imagenUrl:       producto.imagen_url,
              },
            ],
          })
        }
      },

      quitar: (idProductoLocal) =>
        set({ items: get().items.filter(i => i.idProductoLocal !== idProductoLocal) }),

      setCantidad: (idProductoLocal, cantidad) => {
        if (cantidad <= 0) return get().quitar(idProductoLocal)
        set({
          items: get().items.map(i =>
            i.idProductoLocal === idProductoLocal ? { ...i, cantidad } : i
          ),
        })
      },

      vaciar: () => set({ items: [] }),

      // ── Selectores como funciones (no getters) ────────────────────────
      // Llamar como: useCarritoStore(s => s.total())
      total: () =>
        get().items.reduce((acc, i) => acc + Number(i.precio) * Number(i.cantidad), 0),

      cantidadItems: () =>
        get().items.reduce((acc, i) => acc + Number(i.cantidad), 0),
    }),
    {
      name: 'carrito-storage',

      // version 2: garantiza que estados viejos del localStorage
      // (donde total/cantidadItems eran numbers guardados) se limpien
      version: 2,

      migrate: (persistedState, version) => {
        if (version < 2) {
          // Estado viejo incompatible — reset limpio
          return { items: [] }
        }
        return persistedState
      },

      // Solo persistir los items — las funciones NO se persisten
      partialize: (state) => ({ items: state.items }),
    }
  )
)
