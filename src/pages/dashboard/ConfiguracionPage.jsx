import { useState, useEffect, useCallback } from 'react'
import { Save, Store, Clock, Truck, Image, Palette, CheckCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPrivada } from '../../api/axios'
import toast from 'react-hot-toast'

const getTenantInfo = () =>
  apiPrivada.get(`/tienda/${import.meta.env.VITE_TENANT_SLUG}/info`)
    .then(r => r.data).catch(() => null)

const updateConfig = (data) =>
  apiPrivada.patch('/dashboard/config', data).then(r => r.data)

// Subcomponentes definidos FUERA del componente padre para evitar
// que React los recree en cada render (lo que causa la pérdida de foco).
const SectionCard = ({ icon: Icon, title, children }) => (
  <div className="card p-5 space-y-4">
    <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
      <Icon size={16} style={{ color: 'var(--color-acento)' }} />
      {title}
    </h2>
    {children}
  </div>
)

export default function ConfiguracionPage() {
  const qc = useQueryClient()

  const { data: tenantInfo, isLoading } = useQuery({
    queryKey: ['tenant', 'info-config'],
    queryFn: getTenantInfo,
    staleTime: 1000 * 60 * 5,
  })

  // ── Un useState por campo — evita pérdida de foco en cada keystroke ───────
  const [nombreComercial,   setNombreComercial]   = useState('')
  const [whatsapp,          setWhatsapp]          = useState('')
  const [emailContacto,     setEmailContacto]     = useState('')
  const [colorAcento,       setColorAcento]       = useState('#2E75B6')
  const [logoUrl,           setLogoUrl]           = useState('')
  const [mensajeBienvenida, setMensajeBienvenida] = useState('')
  const [direccionLocal,    setDireccionLocal]    = useState('')
  const [horarioApertura,   setHorarioApertura]   = useState('09:00')
  const [horarioCierre,     setHorarioCierre]     = useState('18:00')
  const [aceptaRetiro,      setAceptaRetiro]      = useState(true)
  const [aceptaDomicilio,   setAceptaDomicilio]   = useState(true)
  const [costoEnvio,        setCostoEnvio]        = useState('0')
  const [envioGratisDesde,  setEnvioGratisDesde]  = useState('0')
  const [guardado,          setGuardado]          = useState(false)
  const [inicializado,      setInicializado]      = useState(false)

  // Poblar estado una sola vez cuando llega la data
  useEffect(() => {
    if (!tenantInfo || inicializado) return
    const c = tenantInfo.config_visual || {}
    setNombreComercial(tenantInfo.nombre_comercial || '')
    setWhatsapp(tenantInfo.whatsapp_numero || '')
    setEmailContacto(tenantInfo.email_contacto || '')
    setColorAcento(c.color_acento || '#2E75B6')
    setLogoUrl(c.logo_url || '')
    setMensajeBienvenida(c.mensaje_bienvenida || '')
    setDireccionLocal(c.direccion_local || '')
    setHorarioApertura(c.horario_apertura || '09:00')
    setHorarioCierre(c.horario_cierre || '18:00')
    setAceptaRetiro(c.acepta_retiro !== false)
    setAceptaDomicilio(c.acepta_domicilio !== false)
    setCostoEnvio(String(c.costo_envio_domicilio ?? 0))
    setEnvioGratisDesde(String(c.envio_gratis_desde ?? 0))
    setInicializado(true)
  }, [tenantInfo, inicializado])

  // Preview de color en tiempo real sin causar re-render
  useEffect(() => {
    if (colorAcento) document.documentElement.style.setProperty('--color-acento', colorAcento)
  }, [colorAcento])

  const mutation = useMutation({
    mutationFn: updateConfig,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tienda', 'info'] })
      qc.invalidateQueries({ queryKey: ['tenant', 'info-config'] })
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)
      toast.success('Configuración guardada correctamente')
    },
    onError: (err) => {
      if (err.response?.status === 404 || err.response?.status === 405) {
        toast('Endpoint de config pendiente en la API.', { icon: 'ℹ️' })
      } else {
        toast.error('Error al guardar la configuración')
      }
    },
  })

  const handleGuardar = useCallback(() => {
    mutation.mutate({
      nombre_comercial: nombreComercial,
      whatsapp_numero:  whatsapp,
      email_contacto:   emailContacto || null,
      config_visual: {
        color_acento:          colorAcento,
        logo_url:              logoUrl || null,
        mensaje_bienvenida:    mensajeBienvenida || null,
        direccion_local:       direccionLocal || null,
        horario_apertura:      horarioApertura,
        horario_cierre:        horarioCierre,
        acepta_retiro:         aceptaRetiro,
        acepta_domicilio:      aceptaDomicilio,
        costo_envio_domicilio: Number(costoEnvio) || 0,
        envio_gratis_desde:    Number(envioGratisDesde) || 0,
      },
    })
  }, [nombreComercial, whatsapp, emailContacto, colorAcento, logoUrl,
      mensajeBienvenida, direccionLocal, horarioApertura, horarioCierre,
      aceptaRetiro, aceptaDomicilio, costoEnvio, envioGratisDesde])

  const btnClass = guardado ? 'bg-green-500' : ''
  const btnStyle = !guardado ? { backgroundColor: 'var(--color-acento)' } : {}

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-gray-200 rounded-full animate-spin"
             style={{ borderTopColor: 'var(--color-acento)' }} />
      </div>
    )
  }

  const BtnGuardar = () => (
    <button onClick={handleGuardar} disabled={mutation.isPending}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold
                        text-sm text-white active:scale-95 disabled:opacity-60 transition-all
                        ${btnClass}`}
            style={btnStyle}>
      {guardado
        ? <><CheckCircle size={16} /> Guardado</>
        : mutation.isPending
          ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
          : <><Save size={16} /> Guardar cambios</>
      }
    </button>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Configuración del negocio</h1>
        <BtnGuardar />
      </div>

      {/* Datos del negocio */}
      <SectionCard icon={Store} title="Datos del negocio">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre comercial</label>
            <input type="text" value={nombreComercial}
                   onChange={e => setNombreComercial(e.target.value)}
                   placeholder="Ej: Mi Almacén" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp <span className="text-gray-400 font-normal text-xs">(549XXXXXXXXXX)</span>
            </label>
            <input type="tel" value={whatsapp}
                   onChange={e => setWhatsapp(e.target.value)}
                   placeholder="5493624123456" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email de contacto <span className="text-gray-400 font-normal text-xs">(opcional)</span>
            </label>
            <input type="email" value={emailContacto}
                   onChange={e => setEmailContacto(e.target.value)}
                   placeholder="negocio@ejemplo.com" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección del local <span className="text-gray-400 font-normal text-xs">(se muestra en checkout)</span>
            </label>
            <input type="text" value={direccionLocal}
                   onChange={e => setDireccionLocal(e.target.value)}
                   placeholder="Av. Siempreviva 742, Resistencia" className="input-field" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mensaje de bienvenida <span className="text-gray-400 font-normal text-xs">(banner del catálogo)</span>
          </label>
          <input type="text" value={mensajeBienvenida}
                 onChange={e => setMensajeBienvenida(e.target.value)}
                 placeholder="¡Bienvenidos a nuestra tienda online!" className="input-field" />
        </div>
      </SectionCard>

      {/* Apariencia */}
      <SectionCard icon={Palette} title="Apariencia del portal">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color de acento</label>
            <div className="flex gap-3 items-center">
              <input type="color" value={colorAcento}
                     onChange={e => setColorAcento(e.target.value)}
                     className="h-10 w-14 rounded-xl cursor-pointer border border-gray-200 p-0.5 flex-shrink-0" />
              <input type="text" value={colorAcento}
                     onChange={e => setColorAcento(e.target.value)}
                     placeholder="#2E75B6" maxLength={7}
                     className="input-field flex-1 font-mono text-sm" />
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
              Preview:
              <span className="inline-block w-20 h-5 rounded-md border border-gray-200"
                    style={{ backgroundColor: colorAcento }} />
              <span className="font-medium" style={{ color: colorAcento }}>Texto</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL del logo <span className="text-gray-400 font-normal text-xs">(Cloudinary o externa)</span>
            </label>
            <input type="url" value={logoUrl}
                   onChange={e => setLogoUrl(e.target.value)}
                   placeholder="https://res.cloudinary.com/..." className="input-field text-sm" />
            {logoUrl && (
              <img src={logoUrl} alt="logo preview"
                   onError={e => { e.target.style.display = 'none' }}
                   className="mt-2 h-10 object-contain border border-gray-100 rounded-lg p-1 bg-gray-50" />
            )}
          </div>
        </div>
      </SectionCard>

      {/* Horario */}
      <SectionCard icon={Clock} title="Horario de atención">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apertura</label>
            <input type="time" value={horarioApertura}
                   onChange={e => setHorarioApertura(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cierre</label>
            <input type="time" value={horarioCierre}
                   onChange={e => setHorarioCierre(e.target.value)} className="input-field" />
          </div>
        </div>
        <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
          El portal muestra el badge <strong>ABIERTO</strong> o <strong>CERRADO</strong> según
          este horario. Los clientes siempre pueden hacer pedidos aunque esté cerrado.
        </p>
      </SectionCard>

      {/* Entrega */}
      <SectionCard icon={Truck} title="Opciones de entrega">
        <div className="grid sm:grid-cols-2 gap-3">
          {/* FIX scroll brusco: usar onChange nativo con e.target.checked */}
          <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer
                             transition-colors select-none
                             ${aceptaRetiro ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <input type="checkbox" checked={aceptaRetiro}
                   onChange={e => setAceptaRetiro(e.target.checked)}
                   className="mt-0.5 w-4 h-4 rounded flex-shrink-0" />
            <div>
              <p className="font-medium text-sm text-gray-800">Retiro en local</p>
              <p className="text-xs text-gray-500 mt-0.5">Los clientes retiran en el negocio</p>
            </div>
          </label>

          <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer
                             transition-colors select-none
                             ${aceptaDomicilio ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <input type="checkbox" checked={aceptaDomicilio}
                   onChange={e => setAceptaDomicilio(e.target.checked)}
                   className="mt-0.5 w-4 h-4 rounded flex-shrink-0" />
            <div>
              <p className="font-medium text-sm text-gray-800">Envío a domicilio</p>
              <p className="text-xs text-gray-500 mt-0.5">Los clientes reciben el pedido</p>
            </div>
          </label>
        </div>

        {aceptaDomicilio && (
          <div className="grid sm:grid-cols-2 gap-4 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo de envío <span className="text-gray-400 font-normal text-xs">(0 = gratis)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" min="0" value={costoEnvio}
                       onChange={e => setCostoEnvio(e.target.value)}
                       className="input-field pl-7" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Envío gratis desde <span className="text-gray-400 font-normal text-xs">(0 = nunca)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" min="0" value={envioGratisDesde}
                       onChange={e => setEnvioGratisDesde(e.target.value)}
                       className="input-field pl-7" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Monto a partir del cual el envío es gratuito.</p>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Cloudinary */}
      <SectionCard icon={Image} title="Imágenes de productos (Cloudinary)">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-2">
          <p className="font-semibold">Para subir imágenes de productos:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Ir a <strong>Productos</strong> en el menú lateral</li>
            <li>Hover sobre la imagen del producto → click en el ícono de subida</li>
            <li>Seleccionar archivo (JPG, PNG o WEBP)</li>
          </ol>
          <p className="text-xs text-blue-600 mt-2">
            Las credenciales de Cloudinary se configuran en el <code className="bg-blue-100 px-1 rounded">.env</code> de la API.
          </p>
        </div>
      </SectionCard>

      <div className="flex justify-end pb-4">
        <BtnGuardar />
      </div>
    </div>
  )
}
