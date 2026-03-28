import { useState, useCallback, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ChevronDown, Tag } from 'lucide-react'

import { Header } from '../../components/layout/Header'
import { FiltrosCatalogo } from '../../components/catalogo/FiltrosCatalogo'
import { ProductoCard } from '../../components/catalogo/ProductoCard'
import { PageSpinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'

import { useInfoTienda, useCategorias, useProductos } from '../../hooks/useTienda'
import { calcularEstadoTienda } from '../../lib/format'

const PAGE_SIZE = 24
const CATS_VISIBLES = 8

export default function CatalogoPage() {
  const { slug } = useParams()

  const [categoriaId, setCategoriaId] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [modalCats, setModalCats] = useState(false)
  const [showTop, setShowTop] = useState(false)

  const { data: infoTienda } = useInfoTienda(slug)
  const { data: categorias } = useCategorias(slug)

  const params = {
    ...(categoriaId ? { categoria_id: categoriaId } : {}),
    ...(busqueda ? { q: busqueda } : {}),
    page: pagina,
    page_size: PAGE_SIZE,
  }

  const { data, isLoading, isFetching } = useProductos(slug, params)

  const productos = data?.items || []
  const totalPags = data?.pages || 1

  const cats = categorias || []
  const catsVisibles = cats.slice(0, CATS_VISIBLES)
  const hayMasCats = cats.length > CATS_VISIBLES

  // ✅ Optimización
  const categoriaActivaObj = useMemo(
    () => cats.find(c => c.id === categoriaId),
    [cats, categoriaId]
  )

  // 🎨 Color dinámico
  const colorAcento = infoTienda?.config_visual?.color_acento
  useEffect(() => {
    if (colorAcento) {
      document.documentElement.style.setProperty('--color-acento', colorAcento)
    }
  }, [colorAcento])

  // ⬆️ Scroll top button
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleCategoria = useCallback((id) => {
    setCategoriaId(id)
    setPagina(1)
    setModalCats(false)
  }, [])

  const handleBusqueda = useCallback((val) => {
    setBusqueda(val)
    setPagina(1)
  }, [])

  const config = infoTienda?.config_visual || {}
  const abierto = calcularEstadoTienda(config)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header infoTienda={infoTienda} />

      {/* Mensaje bienvenida */}
      {config.mensaje_bienvenida && (
        <div
          className="text-white text-center py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-acento)' }}
        >
          {config.mensaje_bienvenida}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-5">

        {/* Aviso negocio cerrado */}
        {abierto === false && (
          <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3
                          text-sm text-orange-700 flex flex-wrap items-center gap-2">
            🕐 El negocio está cerrado ahora. Podés hacer tu pedido y lo procesamos cuando abramos.
            {config.horario_apertura && (
              <span className="font-medium">
                Horario: {config.horario_apertura} – {config.horario_cierre}
              </span>
            )}
          </div>
        )}

        <div className="flex gap-5">

          {/* ───────── Sidebar desktop ───────── */}
          {cats.length > 0 && (
            <aside className="hidden lg:block flex-shrink-0 w-52">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm
                              sticky top-24 overflow-hidden">

                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <Tag size={14} style={{ color: 'var(--color-acento)' }} />
                  <span className="font-bold text-sm text-gray-800">Categorías</span>
                </div>

                <div className="py-2">

                  {/* Todos */}
                  <button
                    onClick={() => handleCategoria(null)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors
                      ${!categoriaId
                        ? 'font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    style={!categoriaId ? { color: 'var(--color-acento)' } : {}}
                  >
                    Todos
                    {data?.total > 0 && !categoriaId && (
                      <span className="text-gray-400 text-xs ml-1">
                        ({data.total})
                      </span>
                    )}
                  </button>

                  {/* Categorías */}
                  {catsVisibles.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoria(cat.id)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors
                        ${categoriaId === cat.id
                          ? 'font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      style={categoriaId === cat.id ? { color: 'var(--color-acento)' } : {}}
                    >
                      {cat.nombre}
                    </button>
                  ))}

                  {/* Ver más */}
                  {hayMasCats && (
                    <button
                      onClick={() => setModalCats(true)}
                      className="w-full text-left px-4 py-2 text-sm font-medium
                                 flex items-center gap-1 hover:bg-gray-50 transition-colors"
                      style={{ color: 'var(--color-acento)' }}
                    >
                      <ChevronDown size={14} />
                      Ver más ({cats.length - CATS_VISIBLES})
                    </button>
                  )}

                </div>
              </div>
            </aside>
          )}

          {/* ───────── Contenido ───────── */}
          <div className="flex-1 min-w-0">

            {/* Mobile filtros */}
            <div className="mb-4 space-y-2">
              <FiltrosCatalogo
                categorias={catsVisibles}
                categoriaActiva={categoriaId}
                onCategoria={handleCategoria}
                busqueda={busqueda}
                onBusqueda={handleBusqueda}
                soloMobile
              />

              {hayMasCats && (
                <button
                  onClick={() => setModalCats(true)}
                  className="text-sm text-blue-500"
                >
                  Ver más ({cats.length - CATS_VISIBLES})
                </button>
              )}
            </div>

            {/* Conteo */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">
                {categoriaActivaObj && (
                  <span className="font-medium text-gray-700 mr-1">
                    {categoriaActivaObj.nombre} ·
                  </span>
                )}
                {data?.total > 0 ? `${data.total} productos` : ''}
              </p>

              {isFetching && !isLoading && (
                <span className="text-xs text-gray-400 animate-pulse">
                  Actualizando...
                </span>
              )}
            </div>

            {/* Productos */}
            {isLoading ? (
              <PageSpinner />
            ) : productos.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="Sin resultados"
                description={
                  busqueda
                    ? `No encontramos "${busqueda}".`
                    : 'Sin productos en esta categoría.'
                }
                action={
                  busqueda && (
                    <button
                      onClick={() => handleBusqueda('')}
                      className="btn-secondary text-sm"
                    >
                      Limpiar búsqueda
                    </button>
                  )
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 animate-fade-in">
                  {productos.map(p => (
                    <ProductoCard key={p.id} producto={p} />
                  ))}
                </div>

                {/* Paginación */}
                {totalPags > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => setPagina(p => Math.max(1, p - 1))}
                      disabled={pagina === 1}
                      className="btn-secondary px-3 py-2 disabled:opacity-40"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {Array.from({ length: Math.min(5, totalPags) }, (_, i) => {
                      const p = pagina <= 3 ? i + 1 : pagina - 2 + i
                      if (p < 1 || p > totalPags) return null

                      return (
                        <button
                          key={p}
                          onClick={() => setPagina(p)}
                          className={`w-9 h-9 rounded-xl text-sm font-medium transition-all
                            ${p === pagina
                              ? 'text-white shadow-sm'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          style={p === pagina ? { backgroundColor: 'var(--color-acento)' } : {}}
                        >
                          {p}
                        </button>
                      )
                    })}

                    <button
                      onClick={() => setPagina(p => Math.min(totalPags, p + 1))}
                      disabled={pagina === totalPags}
                      className="btn-secondary px-3 py-2 disabled:opacity-40"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal categorías */}
      <Modal
        open={modalCats}
        onClose={() => setModalCats(false)}
        title="Todas las categorías"
        size="sm"
      >
        <div className="space-y-1">
          <button
            onClick={() => handleCategoria(null)}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors
              ${!categoriaId ? 'font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
            style={!categoriaId ? { color: 'var(--color-acento)' } : {}}
          >
            Todos los productos
          </button>

          {cats.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoria(cat.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors
                ${categoriaId === cat.id
                  ? 'font-bold'
                  : 'text-gray-600 hover:bg-gray-50'
                }`}
              style={categoriaId === cat.id ? { color: 'var(--color-acento)' } : {}}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </Modal>

      {/* Botón scroll top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-4 right-4 bg-black text-white px-3 py-2 rounded-full shadow-lg z-50"
        >
          ↑
        </button>
      )}
    </div>
  )
}