import { useQuery } from '@tanstack/react-query'
import { getInfoTienda, getCategorias, getProductos, getProducto } from '../api/tienda'
import { SLUG } from '../api/axios'

export const useInfoTienda = (slug = SLUG) =>
  useQuery({
    queryKey: ['tienda', 'info', slug],
    queryFn: () => getInfoTienda(slug),
    staleTime: 1000 * 60 * 10, // 10 min
  })

export const useCategorias = (slug = SLUG) =>
  useQuery({
    queryKey: ['tienda', 'categorias', slug],
    queryFn: () => getCategorias(slug),
    staleTime: 1000 * 60 * 10,
  })

export const useProductos = (slug = SLUG, params = {}) =>
  useQuery({
    queryKey: ['tienda', 'productos', slug, params],
    queryFn: () => getProductos(slug, params),
    keepPreviousData: true,
  })

export const useProducto = (slug = SLUG, idLocal) =>
  useQuery({
    queryKey: ['tienda', 'producto', slug, idLocal],
    queryFn: () => getProducto(slug, idLocal),
    enabled: !!idLocal,
  })
