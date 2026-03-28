import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, MapPin, Store, AlertCircle, Package, BookOpen } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { crearPedidoManual, buscarProductos, getProductosDashboard } from '../../api/dashboard'
import { useInfoTienda } from '../../hooks/useTienda'
import { formatPrecio } from '../../lib/format'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { BuscadorConCamara } from '../../components/ui/BuscadorConCamara'
import toast from 'react-hot-toast'

export default function PedidoManualPage() {
  const navigate = useNavigate()
  const { data: infoTienda } = useInfoTienda()
  const config = infoTienda?.config_visual || {}

  // ── Datos del cliente (estados individuales para evitar pérdida de foco) ──
  const [clienteNombre,    setClienteNombre]    = useState('')
  const [clienteCelular,   setClienteCelular]   = useState('')
  const [clienteDocumento, setClienteDocumento] = useState('')
  const [clienteEmail,     setClienteEmail]     = useState('')
  const [metodoEntrega,    setMetodoEntrega]    = useState('retiro')
  const [direccion,        setDireccion]        = useState('')
  const [notas,            setNotas]            = useState('')
  const [errores,          setErrores]          = useState({})

  // ── Productos ─────────────────────────────────────────────────────────────
  const [items,       setItems]       = useState([])
  const [busqueda,    setBusqueda]    = useState('')
  const [sugerencias, setSugerencias] = useState([])
  const [showSug,     setShowSug]     = useState(false)

  // ── Modal catálogo completo ───────────────────────────────────────────────
  const [modalCat,       setModalCat]       = useState(false)
  const [todosProductos, setTodosProductos] = useState([])
  const [loadingCat,     setLoadingCat]     = useState(false)
  const [filtroCat,      setFiltroCat]      = useState('')

  const searchRef = useRef(null)
  const inputRef  = useRef(null)

  // Autocompletado con debounce
  useEffect(() => {
    if (busqueda.length < 2) { setSugerencias([]); setShowSug(false); return }
    const t = setTimeout(async () => {
      try {
        const data = await buscarProductos(busqueda)
        setSugerencias(data.items || [])
        setShowSug(true)
      } catch { setSugerencias([]) }
    }, 280)
    return () => clearTimeout(t)
  }, [busqueda])

  // Enter / código de barras escaneado → agregar directo si hay match exacto
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (sugerencias.length === 0) return
      const exacto = sugerencias.find(p =>
        p.codigo_barras === busqueda.trim() || p.codigo_interno === busqueda.trim()
      )
      const target = exacto || (sugerencias.length === 1 ? sugerencias[0] : null)
      if (target) agregarItem(target)
      else setShowSug(true)
    }
    if (e.key === 'Escape') setShowSug(false)
  }

  const agregarItem = (producto) => {
    setItems(prev => {
      const existe = prev.find(i => i.id_local === producto.id_local)
      if (existe)
        return prev.map(i =>
          i.id_local === producto.id_local ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      return [...prev, {
        id_local:      producto.id_local,
        nombre:        producto.nombre,
        codigo_barras: producto.codigo_barras,
        precio:        Number(producto.precio),
        cantidad:      1,
        stock_badge:   producto.stock_badge,
      }]
    })
    setBusqueda(''); setSugerencias([]); setShowSug(false)
    setErrores(prev => { const n = { ...prev }; delete n.items; return n })
    toast.success('Agregado', { duration: 1200, icon: '✓' })
    inputRef.current?.focus()
  }

  const setCantidadItem = (id, val) => {
    const n = Math.max(1, parseInt(val) || 1)
    setItems(prev => prev.map(i => i.id_local === id ? { ...i, cantidad: n } : i))
  }

  const quitarItem = (id) => setItems(prev => prev.filter(i => i.id_local !== id))

  // Abrir modal catálogo completo
  const abrirModalCatalogo = async () => {
    setModalCat(true)
    setFiltroCat('')
    if (todosProductos.length > 0) return
    setLoadingCat(true)
    try {
      const data = await getProductosDashboard()
      setTodosProductos(data || [])
    } catch { toast.error('Error al cargar productos') }
    finally { setLoadingCat(false) }
  }

  const productosFiltrados = todosProductos.filter(p =>
    !filtroCat ||
    p.nombre.toLowerCase().includes(filtroCat.toLowerCase()) ||
    (p.codigo_barras || '').includes(filtroCat)
  )

  // Totales en tiempo real
  const subtotal = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)
  const costoEnvio = (() => {
    if (metodoEntrega !== 'domicilio') return 0
    const c = Number(config.costo_envio_domicilio || 0)
    const g = Number(config.envio_gratis_desde    || 0)
    if (g > 0 && subtotal >= g) return 0
    return c
  })()
  const total = subtotal + costoEnvio

  const limpiarError = (campo) =>
    setErrores(prev => { const n = { ...prev }; delete n[campo]; return n })

  const mutation = useMutation({
    mutationFn: crearPedidoManual,
    onSuccess: (data) => {
      toast.success(`Pedido ${data.numero_pedido} creado`)
      navigate('/dashboard/pedidos')
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Error al crear pedido')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!clienteNombre.trim())  errs.cliente_nombre = 'Requerido'
    if (!clienteCelular.trim()) errs.cliente_celular = 'Requerido'
    if (metodoEntrega === 'domicilio' && !direccion.trim()) errs.direccion = 'Requerida'
    if (items.length === 0) errs.items = 'Agregá al menos un producto'
    if (Object.keys(errs).length > 0) { setErrores(errs); return }

    mutation.mutate({
      cliente_nombre:    clienteNombre,
      cliente_celular:   clienteCelular,
      cliente_documento: clienteDocumento || null,
      cliente_email:     clienteEmail     || null,
      metodo_entrega:    metodoEntrega,
      direccion_entrega: direccion || null,
      notas:             notas     || null,
      items: items.map(i => ({ id_producto_local: i.id_local, cantidad: i.cantidad })),
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Package size={22} className="text-gray-600" />
        <h1 className="text-xl font-bold text-gray-900">Nuevo pedido manual</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">

            {/* ── Datos del cliente ────────────────────────────────────── */}
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                Datos del cliente
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo <span className="text-red-400">*</span>
                  </label>
                  <input type="text" value={clienteNombre}
                         onChange={e => { setClienteNombre(e.target.value); limpiarError('cliente_nombre') }}
                         autoComplete="name"
                         className={`input-field ${errores.cliente_nombre ? 'border-red-400' : ''}`} />
                  {errores.cliente_nombre && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={10} /> {errores.cliente_nombre}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Celular <span className="text-red-400">*</span>
                  </label>
                  <input type="tel" value={clienteCelular}
                         onChange={e => { setClienteCelular(e.target.value); limpiarError('cliente_celular') }}
                         autoComplete="tel"
                         className={`input-field ${errores.cliente_celular ? 'border-red-400' : ''}`} />
                  {errores.cliente_celular && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={10} /> {errores.cliente_celular}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DNI / CUIT <span className="text-gray-400 font-normal">(Opcional)</span>
                  </label>
                  <input type="text" value={clienteDocumento}
                         onChange={e => setClienteDocumento(e.target.value)}
                         className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={clienteEmail}
                         onChange={e => setClienteEmail(e.target.value)}
                         autoComplete="email"
                         className="input-field" />
                </div>
              </div>
            </div>

            {/* ── Productos ────────────────────────────────────────────── */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  Productos
                </h2>
                <button type="button" onClick={abrirModalCatalogo}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5
                                   rounded-lg border transition-colors hover:bg-gray-50"
                        style={{ borderColor: 'var(--color-acento)', color: 'var(--color-acento)' }}>
                  <BookOpen size={13} /> Ver catálogo completo
                </button>
              </div>

              {/* Buscador con cámara + dropdown de sugerencias */}
              <div className="relative" ref={searchRef}>
                <BuscadorConCamara
                  inputRef={inputRef}
                  value={busqueda}
                  onChange={setBusqueda}
                  onKeyDown={handleKeyDown}
                  placeholder="Nombre, código o escanear con cámara (Enter para agregar)"
                />
                {showSug && sugerencias.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white rounded-xl
                                  shadow-lg border border-gray-200 max-h-64 overflow-y-auto animate-fade-in">
                    {sugerencias.map(p => (
                      <button key={p.id} type="button" onClick={() => agregarItem(p)}
                              className="w-full flex items-center justify-between px-4 py-3
                                         hover:bg-gray-50 transition-colors text-left border-b
                                         border-gray-50 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{p.nombre}</p>
                          <p className="text-xs text-gray-400">
                            {p.codigo_barras}{p.codigo_interno ? ` · ${p.codigo_interno}` : ''}
                          </p>
                        </div>
                        <div className="ml-3 text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900">{formatPrecio(p.precio)}</p>
                          {p.stock_badge && (
                            <span className={`text-xs ${
                              p.stock_badge === 'sin_stock' ? 'text-red-400' : 'text-yellow-500'
                            }`}>
                              {p.stock_badge === 'sin_stock' ? 'Sin stock' : '⚡ Últimas'}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {errores.items && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={10} /> {errores.items}
                </p>
              )}

              {/* Lista de items con scroll propio */}
              {items.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">
                      {items.length} producto{items.length !== 1 ? 's' : ''} en el pedido
                    </span>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1
                                  border border-gray-100 rounded-xl p-2">
                    {items.map(item => (
                      <div key={item.id_local}
                           className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 leading-tight">{item.nombre}</p>
                          <p className="text-xs text-gray-400">{item.codigo_barras}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button type="button"
                                  onClick={() => setCantidadItem(item.id_local, item.cantidad - 1)}
                                  className="w-7 h-7 rounded-lg bg-white border border-gray-200
                                             flex items-center justify-center font-bold hover:bg-gray-100">
                            −
                          </button>
                          <input type="number" min="1" step="1" value={item.cantidad}
                                 onChange={e => setCantidadItem(item.id_local, e.target.value)}
                                 className="w-12 text-center border border-gray-200 rounded-lg py-1
                                            text-sm font-semibold focus:outline-none bg-white" />
                          <button type="button"
                                  onClick={() => setCantidadItem(item.id_local, item.cantidad + 1)}
                                  className="w-7 h-7 rounded-lg text-white flex items-center
                                             justify-center font-bold"
                                  style={{ backgroundColor: 'var(--color-acento)' }}>
                            +
                          </button>
                        </div>
                        <span className="text-sm font-bold text-gray-900 w-24 text-right flex-shrink-0">
                          {formatPrecio(item.precio * item.cantidad)}
                        </span>
                        <button type="button" onClick={() => quitarItem(item.id_local)}
                                className="p-1.5 text-gray-300 hover:text-red-400 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Entrega ──────────────────────────────────────────────── */}
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Entrega</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { val: 'retiro',    icon: Store,  label: 'Retiro en local' },
                  { val: 'domicilio', icon: MapPin, label: 'A domicilio'     },
                ].map(({ val, icon: Icon, label }) => (
                  <label key={val}
                         className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer
                                     transition-all ${metodoEntrega === val ? '' : 'border-gray-200'}`}
                         style={metodoEntrega === val
                           ? { borderColor: 'var(--color-acento)', backgroundColor: '#f0f7ff' }
                           : {}}>
                    <input type="radio" value={val} checked={metodoEntrega === val}
                           onChange={() => setMetodoEntrega(val)} className="sr-only" />
                    <Icon size={16} className="text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400">
                        {val === 'retiro'
                          ? 'Sin costo'
                          : costoEnvio > 0
                            ? '+ ' + formatPrecio(costoEnvio)
                            : 'Sin costo'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              {metodoEntrega === 'domicilio' && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección <span className="text-red-400">*</span>
                  </label>
                  <input type="text" value={direccion}
                         onChange={e => { setDireccion(e.target.value); limpiarError('direccion') }}
                         placeholder="Calle, número, barrio..."
                         className={`input-field ${errores.direccion ? 'border-red-400' : ''}`} />
                  {errores.direccion && (
                    <p className="text-xs text-red-500 mt-1">{errores.direccion}</p>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea rows={2} value={notas} onChange={e => setNotas(e.target.value)}
                          placeholder="Observaciones para el operador..."
                          className="input-field resize-none" />
              </div>
            </div>
          </div>

          {/* ── Resumen fijo ─────────────────────────────────────────────── */}
          <div>
            <div className="card p-5 sticky top-20 space-y-4">
              <h2 className="font-semibold text-gray-700">Resumen</h2>
              {items.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sin productos aún</p>
              ) : (
                <div className="space-y-1.5">
                  {items.map(i => (
                    <div key={i.id_local} className="flex justify-between text-sm gap-2">
                      <span className="text-gray-600 flex-1 truncate">{i.cantidad}× {i.nombre}</span>
                      <span className="font-medium text-gray-900 flex-shrink-0">
                        {formatPrecio(i.precio * i.cantidad)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {items.length > 0 && (
                <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span><span>{formatPrecio(subtotal)}</span>
                  </div>
                  {metodoEntrega === 'domicilio' && (
                    <div className="flex justify-between text-gray-600">
                      <span>Envío</span>
                      <span className={costoEnvio === 0 ? 'text-green-600 font-medium' : ''}>
                        {costoEnvio === 0 ? 'GRATIS' : formatPrecio(costoEnvio)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-900 text-base
                                  border-t border-gray-100 pt-2">
                    <span>TOTAL</span><span>{formatPrecio(total)}</span>
                  </div>
                </div>
              )}
              <button type="submit" disabled={mutation.isPending}
                      className="btn-primary w-full py-3 text-sm">
                {mutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent
                                     rounded-full animate-spin" />
                    Creando...
                  </span>
                ) : ('Crear pedido' + (total > 0 ? ' - ' + formatPrecio(total) : ''))}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* ── Modal catálogo completo ───────────────────────────────────── */}
      <Modal open={modalCat} onClose={() => setModalCat(false)}
             title="Catálogo completo de productos" size="xl">
        <div className="space-y-4">
          <BuscadorConCamara
            value={filtroCat}
            onChange={setFiltroCat}
            placeholder="Filtrar por nombre o código de barras..."
            autoFocus
          />
          {loadingCat ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : (
            <div className="overflow-y-auto max-h-[50vh]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-xs text-gray-500 font-semibold">Código</th>
                    <th className="text-left py-2 px-3 text-xs text-gray-500 font-semibold">Nombre</th>
                    <th className="text-right py-2 px-3 text-xs text-gray-500 font-semibold">Precio</th>
                    <th className="text-right py-2 px-3 text-xs text-gray-500 font-semibold">Stock</th>
                    <th className="py-2 px-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productosFiltrados.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2 px-3 text-xs text-gray-500">{p.codigo_barras}</td>
                      <td className="py-2 px-3 text-gray-800 font-medium">{p.nombre}</td>
                      <td className="py-2 px-3 text-right font-bold text-gray-900">
                        {formatPrecio(p.precio)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className={`text-xs font-medium ${
                          Number(p.stock_actual) <= 0      ? 'text-red-500' :
                          Number(p.stock_actual) <= 2      ? 'text-yellow-600' :
                                                             'text-green-600'
                        }`}>
                          {Number(p.stock_actual || 0).toFixed(0)}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => {
                            agregarItem({
                              id_local:      p.id_local,
                              nombre:        p.nombre,
                              codigo_barras: p.codigo_barras,
                              precio:        p.precio,
                              stock_badge:   Number(p.stock_actual) <= 0 ? 'sin_stock' : null,
                            })
                            setModalCat(false)
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs
                                     font-medium text-white transition-all active:scale-95"
                          style={{ backgroundColor: 'var(--color-acento)' }}
                        >
                          <Plus size={11} /> Agregar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {productosFiltrados.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">Sin resultados</p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
