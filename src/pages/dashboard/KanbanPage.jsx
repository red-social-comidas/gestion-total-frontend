import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getKanban, cambiarEstadoPedido } from '../../api/dashboard'
import { KanbanCard } from '../../components/kanban/KanbanCard'
import { Spinner } from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

const COLUMNAS = [
  { id: 'por_confirmar',  label: 'Por confirmar',  color: 'bg-yellow-50 border-yellow-200',  header: 'bg-yellow-400' },
  { id: 'en_preparacion', label: 'En preparación', color: 'bg-blue-50   border-blue-200',    header: 'bg-blue-500'   },
  { id: 'para_entregar',  label: 'Para entregar',  color: 'bg-purple-50 border-purple-200',  header: 'bg-purple-500' },
  { id: 'entregado',      label: 'Entregado',      color: 'bg-green-50  border-green-200',   header: 'bg-green-500'  },
]

export default function KanbanPage() {
  const qc = useQueryClient()

  const { data: kanban, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['kanban'],
    queryFn: getKanban,
    refetchInterval: 30000,
  })

  const mutation = useMutation({
    mutationFn: ({ id, nuevoEstado }) => cambiarEstadoPedido(id, nuevoEstado),
    onSuccess: (_, { nuevoEstado }) => {
      qc.invalidateQueries({ queryKey: ['kanban'] })
      toast.success(nuevoEstado === 'cancelado' ? 'Pedido cancelado' : 'Estado actualizado')
    },
    onError: () => toast.error('Error al cambiar estado'),
  })

  const handleCambio = (pedido, nuevoEstado) => {
    if (nuevoEstado === 'cancelado') {
      if (!confirm(`¿Cancelar el pedido ${pedido.numero_pedido}?`)) return
    }
    mutation.mutate({ id: pedido.id, nuevoEstado })
  }

  const ultimaAct = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center
                      justify-between gap-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Pedidos</h1>
          {ultimaAct && (
            <p className="text-xs text-gray-400">Actualizado: {ultimaAct} · auto cada 30s</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['kanban'] })}
            className="p-2 rounded-xl border border-gray-200 text-gray-500
                       hover:bg-gray-50 transition-colors"
            title="Actualizar"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <Link to="/dashboard/pedido-manual"
                className="btn-primary flex items-center gap-1.5 text-sm py-2 px-3">
            <Plus size={15} /> Nuevo pedido
          </Link>
        </div>
      </div>

      {/* Board */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-4 min-w-max h-full">
            {COLUMNAS.map(col => {
              const pedidos = kanban?.[col.id] || []
              // Columna "entregado": máximo 10, más reciente primero
              const lista = col.id === 'entregado'
                ? [...pedidos].sort((a, b) =>
                    new Date(b.created_at) - new Date(a.created_at)).slice(0, 10)
                : [...pedidos].sort((a, b) =>
                    new Date(b.created_at) - new Date(a.created_at))

              return (
                <div key={col.id}
                     className={`flex-shrink-0 w-72 rounded-2xl border ${col.color}
                                 flex flex-col max-h-full kanban-col`}>
                  {/* Header columna */}
                  <div className={`${col.header} rounded-t-2xl px-4 py-2.5 flex items-center
                                   justify-between`}>
                    <span className="text-white font-semibold text-sm">{col.label}</span>
                    <span className="bg-white/30 text-white text-xs font-bold
                                     rounded-full px-2 py-0.5">
                      {pedidos.length}
                      {col.id === 'entregado' && pedidos.length > 10 && `/${pedidos.length}`}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {lista.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-xs">
                        Sin pedidos
                      </div>
                    ) : (
                      lista.map(pedido => (
                        <KanbanCard
                          key={pedido.id}
                          pedido={pedido}
                          compacto={col.id === 'entregado'}
                          onCambiarEstado={(estado) => handleCambio(pedido, estado)}
                        />
                      ))
                    )}

                    {col.id === 'entregado' && pedidos.length > 10 && (
                      <p className="text-xs text-gray-400 text-center pb-2">
                        +{pedidos.length - 10} más en Reportes
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
