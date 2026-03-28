import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Eye, EyeOff, Upload, Edit3, Check, X } from 'lucide-react'
import { BotonEscaner } from '../../components/ui/BarcodeScanner'
import { getProductosDashboard, habilitarProductoWeb, actualizarDescripcionWeb, subirImagenProducto } from '../../api/dashboard'
import { formatPrecio } from '../../lib/format'
import { Spinner } from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

export default function ProductosPage() {
  const qc = useQueryClient()
  const [busqueda, setBusqueda] = useState('')
  const [filtro,   setFiltro]   = useState('todos') // todos | habilitados | ocultos
  const [editando, setEditando] = useState(null)    // {id, desc}

  const { data: productos = [], isLoading } = useQuery({
    queryKey: ['dashboard', 'productos'],
    queryFn: getProductosDashboard,
  })

  const mutHabilitar = useMutation({
    mutationFn: ({ id, val }) => habilitarProductoWeb(id, val),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard', 'productos'] }),
    onError: () => toast.error('Error al actualizar'),
  })

  const mutDescripcion = useMutation({
    mutationFn: ({ id, desc }) => actualizarDescripcionWeb(id, desc),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard', 'productos'] })
      setEditando(null)
      toast.success('Descripción actualizada')
    },
  })

  const mutImagen = useMutation({
    mutationFn: ({ id, file }) => subirImagenProducto(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard', 'productos'] })
      toast.success('Imagen subida correctamente')
    },
    onError: () => toast.error('Error al subir imagen'),
  })

  const filtrados = productos.filter(p => {
    const matchBusq = !busqueda ||
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo_barras.includes(busqueda)
    const matchFiltro =
      filtro === 'todos'      ? true :
      filtro === 'habilitados'? p.habilitado_web :
      !p.habilitado_web
    return matchBusq && matchFiltro
  })

  const habilitarTodos = (val) => {
    const targets = filtrados.filter(p => p.habilitado_web !== val)
    if (targets.length === 0) return
    if (!confirm(`¿${val ? 'Habilitar' : 'Deshabilitar'} ${targets.length} productos en el portal?`)) return
    targets.forEach(p => mutHabilitar.mutate({ id: p.id, val }))
  }

  return (
    <div className="px-5 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">
          Productos del portal
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => habilitarTodos(true)}
            className="text-xs px-3 py-2 bg-green-100 text-green-700 rounded-xl
                       hover:bg-green-200 transition-colors font-medium"
          >
            ✓ Habilitar visibles
          </button>
          <button
            onClick={() => habilitarTodos(false)}
            className="text-xs px-3 py-2 bg-red-100 text-red-600 rounded-xl
                       hover:bg-red-200 transition-colors font-medium"
          >
            ✕ Ocultar todos
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o código de barras..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="input-field pl-9 w-full"
            />
          </div>
          <BotonEscaner onDetectado={(codigo) => setBusqueda(codigo)} />
        </div>
        <div className="flex gap-1.5">
          {['todos', 'habilitados', 'ocultos'].map(f => (
            <button key={f}
                    onClick={() => setFiltro(f)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all
                      ${filtro === f
                        ? 'text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    style={filtro === f ? { backgroundColor: 'var(--color-acento)' } : {}}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="flex gap-4 text-sm text-gray-500">
        <span><strong className="text-gray-900">{productos.length}</strong> total</span>
        <span><strong className="text-green-600">{productos.filter(p => p.habilitado_web).length}</strong> visibles</span>
        <span><strong className="text-gray-400">{productos.filter(p => !p.habilitado_web).length}</strong> ocultos</span>
        <span className="text-gray-300">|</span>
        <span><strong className="text-gray-900">{filtrados.length}</strong> mostrados</span>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Visible
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Imagen
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[200px]">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Precio
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Descripción web
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map(p => (
                  <tr key={p.id}
                      className={`hover:bg-gray-50/50 transition-colors ${
                        !p.habilitado_web ? 'opacity-60' : ''
                      }`}>
                    {/* Toggle visible */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => mutHabilitar.mutate({ id: p.id, val: !p.habilitado_web })}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
                                    font-medium transition-all active:scale-95
                                    ${p.habilitado_web
                                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                      >
                        {p.habilitado_web ? <Eye size={11} /> : <EyeOff size={11} />}
                        {p.habilitado_web ? 'Visible' : 'Oculto'}
                      </button>
                    </td>

                    {/* Imagen */}
                    <td className="px-4 py-3">
                      <div className="relative group w-10 h-10">
                        {p.imagen_url ? (
                          <img src={p.imagen_url} alt={p.nombre}
                               className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center
                                          justify-center text-gray-300 text-xl">📦</div>
                        )}
                        <label className="absolute inset-0 flex items-center justify-center
                                          bg-black/50 rounded-lg opacity-0 group-hover:opacity-100
                                          cursor-pointer transition-opacity">
                          <Upload size={14} className="text-white" />
                          <input type="file" accept="image/*" className="sr-only"
                                 onChange={e => {
                                   const f = e.target.files[0]
                                   if (f) mutImagen.mutate({ id: p.id, file: f })
                                 }} />
                        </label>
                      </div>
                    </td>

                    {/* Nombre + código */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 leading-tight">{p.nombre}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.codigo_barras}</p>
                    </td>

                    {/* Precio */}
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900">{formatPrecio(p.precio)}</span>
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${
                        p.stock_actual <= 0 ? 'text-red-500' :
                        p.stock_actual <= p.stock_minimo ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {Number(p.stock_actual).toFixed(0)}
                        {p.stock_actual <= 0 && ' (sin stock)'}
                      </span>
                    </td>

                    {/* Descripción web editable */}
                    <td className="px-4 py-3 max-w-xs">
                      {editando?.id === p.id ? (
                        <div className="flex gap-1.5 items-start">
                          <textarea
                            rows={2}
                            value={editando.desc}
                            onChange={e => setEditando(ed => ({ ...ed, desc: e.target.value }))}
                            className="input-field text-xs resize-none flex-1 py-1.5"
                            autoFocus
                          />
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => mutDescripcion.mutate({ id: p.id, desc: editando.desc })}
                              className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => setEditando(null)}
                              className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditando({ id: p.id, desc: p.descripcion_web || '' })}
                          className="text-xs text-gray-500 hover:text-gray-800 flex items-start
                                     gap-1 group transition-colors text-left w-full"
                        >
                          <Edit3 size={11} className="mt-0.5 opacity-0 group-hover:opacity-100
                                                        flex-shrink-0 transition-opacity" />
                          <span className={p.descripcion_web ? 'line-clamp-2' : 'italic text-gray-300'}>
                            {p.descripcion_web || 'Sin descripción web'}
                          </span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtrados.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-2">📦</p>
                <p className="text-sm">Sin productos para mostrar</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
