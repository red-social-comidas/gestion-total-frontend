import { useState, useEffect, useRef } from 'react'
import { Trash2, Plus, Minus } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { editarPedido, buscarProductos } from '../../api/dashboard'
import { useInfoTienda } from '../../hooks/useTienda'
import { formatPrecio } from '../../lib/format'
import { Modal } from '../ui/Modal'
import { BuscadorConCamara } from '../ui/BuscadorConCamara'
import { SLUG } from '../../api/axios'
import toast from 'react-hot-toast'

export const EditarPedidoModal = ({ pedido, open, onClose }) => {
  const qc = useQueryClient()
  const { data: infoTienda } = useInfoTienda(SLUG)
  const config = infoTienda?.config_visual || {}

  const [items,         setItems]         = useState([])
  const [metodoEntrega, setMetodoEntrega] = useState('retiro')
  const [direccion,     setDireccion]     = useState('')
  const [notas,         setNotas]         = useState('')
  const [busqueda,      setBusqueda]      = useState('')
  const [sugerencias,   setSugerencias]   = useState([])
  const [showSug,       setShowSug]       = useState(false)
  const inputRef = useRef(null)

  const calcularCostoEnvio = (metodo, sub) => {
    if (metodo !== 'domicilio') return 0
    const costo = Number(config.costo_envio_domicilio || 0)
    const gratis = Number(config.envio_gratis_desde || 0)
    if (gratis > 0 && sub >= gratis) return 0
    return costo
  }

  useEffect(() => {
    if (!pedido || !open) return
    setItems((pedido.items || []).map(i => ({
      id_local:      i.id_producto_local,
      nombre:        i.nombre_producto,
      codigo_barras: i.codigo_barras,
      precio:        Number(i.precio_unitario),
      cantidad:      Number(i.cantidad),
    })))
    setMetodoEntrega(pedido.metodo_entrega || 'retiro')
    setDireccion(pedido.direccion_entrega || '')
    setNotas(pedido.notas || '')
    setBusqueda('')
    setSugerencias([])
    setShowSug(false)
  }, [pedido, open])

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

  const agregarItem = (producto) => {
    setItems(prev => {
      const existe = prev.find(i => i.id_local === producto.id_local)
      if (existe)
        return prev.map(i => i.id_local === producto.id_local ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, {
        id_local:      producto.id_local,
        nombre:        producto.nombre,
        codigo_barras: producto.codigo_barras,
        precio:        Number(producto.precio),
        cantidad:      1,
      }]
    })
    setBusqueda('')
    setSugerencias([])
    setShowSug(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && sugerencias.length > 0) {
      e.preventDefault()
      const exacto = sugerencias.find(p =>
        p.codigo_barras === busqueda.trim() || p.codigo_interno === busqueda.trim()
      )
      agregarItem(exacto || sugerencias[0])
    }
    if (e.key === 'Escape') setShowSug(false)
  }

  const setCantidad = (id, val) => {
    const n = Math.max(1, parseInt(val) || 1)
    setItems(prev => prev.map(i => i.id_local === id ? { ...i, cantidad: n } : i))
  }

  const quitar = (id) => setItems(prev => prev.filter(i => i.id_local !== id))

  const subtotal   = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)
  const costoEnvio = calcularCostoEnvio(metodoEntrega, subtotal)
  const total      = subtotal + costoEnvio

  const mutation = useMutation({
    mutationFn: (payload) => editarPedido(pedido.id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kanban'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'reportes'] })
      toast.success('Pedido actualizado correctamente')
      onClose()
    },
    onError: (err) => {
      const detail = err.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Error al actualizar el pedido')
    },
  })

  const handleGuardar = () => {
    if (items.length === 0) { toast.error('El pedido debe tener al menos un producto'); return }
    if (metodoEntrega === 'domicilio' && !direccion.trim()) {
      toast.error('Ingresa la direccion de entrega'); return
    }
    mutation.mutate({
      items: items.map(i => ({ id_producto_local: i.id_local, cantidad: i.cantidad })),
      metodo_entrega:    metodoEntrega,
      direccion_entrega: metodoEntrega === 'domicilio' ? direccion : null,
      notas:             notas || null,
      costo_envio:       costoEnvio,
    })
  }

  if (!pedido) return null

  return (
    <Modal open={open} onClose={onClose} title={`Editar pedido ${pedido.numero_pedido}`} size="lg">
      <div className="space-y-5">

        {/* Buscador con camara */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Agregar / modificar productos</p>
          <div className="relative">
            <BuscadorConCamara
              inputRef={inputRef}
              value={busqueda}
              onChange={v => { setBusqueda(v); if (v.length < 2) setShowSug(false) }}
              onKeyDown={handleKeyDown}
              onFocus={() => sugerencias.length > 0 && setShowSug(true)}
              placeholder="Nombre, codigo interno o codigo de barras..."
            />
            {showSug && sugerencias.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white rounded-xl
                              shadow-lg border border-gray-200 max-h-48 overflow-y-auto animate-fade-in">
                {sugerencias.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => agregarItem(p)}
                    className="w-full flex items-center justify-between px-4 py-2.5
                               hover:bg-gray-50 text-left border-b border-gray-50 last:border-0 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{p.nombre}</p>
                      <p className="text-xs text-gray-400">
                        {p.codigo_barras}{p.codigo_interno ? ` - ${p.codigo_interno}` : ''}
                      </p>
                    </div>
                    <span className="font-bold text-gray-900 ml-3 flex-shrink-0">
                      {formatPrecio(p.precio)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lista items con scroll */}
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-xl">
              Sin productos - usa el buscador para agregar
            </p>
          ) : (
            items.map(item => (
              <div key={item.id_local}
                   className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{item.nombre}</p>
                  <p className="text-xs text-gray-400">{item.codigo_barras}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setCantidad(item.id_local, item.cantidad - 1)}
                    className="w-6 h-6 rounded-lg bg-white border border-gray-200
                               flex items-center justify-center hover:bg-gray-100"
                  >
                    <Minus size={11} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={e => setCantidad(item.id_local, e.target.value)}
                    className="w-10 text-center border border-gray-200 rounded-lg py-0.5
                               text-sm font-semibold focus:outline-none bg-white"
                  />
                  <button
                    onClick={() => setCantidad(item.id_local, item.cantidad + 1)}
                    className="w-6 h-6 rounded-lg text-white flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-acento)' }}
                  >
                    <Plus size={11} />
                  </button>
                </div>
                <span className="font-bold text-gray-900 w-20 text-right flex-shrink-0">
                  {formatPrecio(item.precio * item.cantidad)}
                </span>
                <button
                  onClick={() => quitar(item.id_local)}
                  className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totalizador */}
        {items.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatPrecio(subtotal)}</span>
            </div>
            {metodoEntrega === 'domicilio' && (
              <div className="flex justify-between text-gray-600">
                <span>Envio a domicilio</span>
                <span className={costoEnvio === 0 ? 'text-green-600 font-medium' : ''}>
                  {costoEnvio === 0 ? 'GRATIS' : formatPrecio(costoEnvio)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base
                            border-t border-gray-200 pt-2">
              <span>TOTAL</span>
              <span>{formatPrecio(total)}</span>
            </div>
          </div>
        )}

        {/* Metodo entrega */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Metodo de entrega</p>
          <div className="flex gap-3">
            {[
              { val: 'retiro',    label: 'Retiro en local' },
              { val: 'domicilio', label: 'Envio a domicilio' },
            ].map(({ val, label }) => (
              <label
                key={val}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2
                             cursor-pointer transition-all flex-1 justify-center text-sm font-medium
                             ${metodoEntrega === val ? '' : 'border-gray-200 hover:border-gray-300'}`}
                style={metodoEntrega === val
                  ? { borderColor: 'var(--color-acento)', backgroundColor: '#f0f7ff' }
                  : {}}
              >
                <input
                  type="radio"
                  value={val}
                  checked={metodoEntrega === val}
                  onChange={() => setMetodoEntrega(val)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
          {metodoEntrega === 'domicilio' && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Direccion de entrega
              </label>
              <input
                type="text"
                value={direccion}
                onChange={e => setDireccion(e.target.value)}
                placeholder="Calle, numero, barrio..."
                className="input-field text-sm"
              />
            </div>
          )}
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Notas <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            rows={2}
            value={notas}
            onChange={e => setNotas(e.target.value)}
            placeholder="Observaciones..."
            className="input-field resize-none text-sm"
          />
        </div>

        {/* Acciones */}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm">
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={mutation.isPending}
            className="btn-primary flex-1 py-2.5 text-sm"
          >
            {mutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent
                                 rounded-full animate-spin" />
                Guardando...
              </span>
            ) : ('Guardar - ' + formatPrecio(total))}
          </button>
        </div>

      </div>
    </Modal>
  )
}
