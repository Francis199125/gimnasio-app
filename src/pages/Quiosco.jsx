import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

const C = {
  bg: '#0f1117', surface: '#1a1d27', card: '#21253a',
  accent: '#f97316', green: '#22c55e', red: '#ef4444', yellow: '#eab308',
  text: '#f1f5f9', muted: '#94a3b8', border: '#2e3347',
}

export default function Quiosco() {
  const [codigo, setCodigo] = useState('')
  const [estado, setEstado] = useState(null) // null | 'cargando' | 'exito' | 'error'
  const [usuario, setUsuario] = useState(null)
  const [hora, setHora] = useState(new Date())
  const inputRef = useRef(null)

  // Reloj en tiempo real
  useEffect(() => {
    const interval = setInterval(() => setHora(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Mantener foco en el input siempre
  useEffect(() => {
    const mantenerFoco = () => inputRef.current?.focus()
    document.addEventListener('click', mantenerFoco)
    inputRef.current?.focus()
    return () => document.removeEventListener('click', mantenerFoco)
  }, [])

  // Auto-limpiar después de 4 segundos
  useEffect(() => {
    if (estado === 'exito' || estado === 'error') {
      const t = setTimeout(() => {
        setEstado(null)
        setUsuario(null)
        setCodigo('')
        inputRef.current?.focus()
      }, 4000)
      return () => clearTimeout(t)
    }
  }, [estado])

  async function marcarAsistencia(e) {
    e.preventDefault()
    if (!codigo.trim()) return
    setEstado('cargando')

    // Buscar usuario por código corto
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido_paterno, rol, codigo_acceso')
      .eq('codigo_acceso', codigo.trim())
      .single()

    if (error || !user) {
      setEstado('error')
      setUsuario(null)
      return
    }

    // Verificar que no haya marcado ya hoy
    const hoy = new Date().toISOString().split('T')[0]
    const { data: yaMarco } = await supabase
      .from('asistencia')
      .select('id')
      .eq('usuario_id', user.id)
      .eq('fecha', hoy)
      .single()

    if (yaMarco) {
      setUsuario({ ...user, yaMarco: true })
      setEstado('exito')
      return
    }

    // Registrar asistencia
    const { error: asistErr } = await supabase
      .from('asistencia')
      .insert({ usuario_id: user.id, registrado_por: 'quiosco' })

    if (asistErr) {
      setEstado('error')
      return
    }

    setUsuario({ ...user, yaMarco: false })
    setEstado('exito')
  }

  const fechaFormateada = hora.toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const horaFormateada = hora.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, color: C.text, fontFamily: "'Segoe UI', system-ui, sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>

      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>💪</div>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: C.accent, margin: 0 }}>GymApp</h1>
        <p style={{ color: C.muted, fontSize: '14px', margin: '4px 0 0' }}>Control de Asistencia</p>
      </div>

      {/* RELOJ */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '52px', fontWeight: '800', fontFamily: 'monospace', color: C.text, letterSpacing: '4px' }}>
          {horaFormateada}
        </div>
        <div style={{ fontSize: '16px', color: C.muted, marginTop: '4px', textTransform: 'capitalize' }}>
          {fechaFormateada}
        </div>
      </div>

      {/* PANTALLA DE RESULTADO */}
      {estado === 'exito' && usuario && (
        <div style={{ backgroundColor: usuario.yaMarco ? '#713f12' : '#14532d', border: `2px solid ${usuario.yaMarco ? C.yellow : C.green}`, borderRadius: '16px', padding: '32px 48px', textAlign: 'center', marginBottom: '32px', minWidth: '400px', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ fontSize: '64px', marginBottom: '12px' }}>{usuario.yaMarco ? '⚠️' : '✅'}</div>
          <div style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px', color: usuario.yaMarco ? C.yellow : C.green }}>
            {usuario.yaMarco ? '¡Ya marcaste hoy!' : '¡Bienvenido!'}
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>
            {usuario.nombre} {usuario.apellido_paterno}
          </div>
          {!usuario.yaMarco && (
            <div style={{ fontSize: '14px', color: C.muted, marginTop: '8px' }}>
              Asistencia registrada a las {horaFormateada}
            </div>
          )}
          {usuario.yaMarco && (
            <div style={{ fontSize: '14px', color: C.muted, marginTop: '8px' }}>
              Tu asistencia de hoy ya fue registrada anteriormente.
            </div>
          )}
        </div>
      )}

      {estado === 'error' && (
        <div style={{ backgroundColor: '#7f1d1d', border: `2px solid ${C.red}`, borderRadius: '16px', padding: '32px 48px', textAlign: 'center', marginBottom: '32px', minWidth: '400px' }}>
          <div style={{ fontSize: '64px', marginBottom: '12px' }}>❌</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: C.red, marginBottom: '8px' }}>Código no encontrado</div>
          <div style={{ fontSize: '14px', color: C.muted }}>Verifica tu código e intenta de nuevo.</div>
        </div>
      )}

      {estado === 'cargando' && (
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>⏳</div>
          <div style={{ color: C.muted }}>Verificando...</div>
        </div>
      )}

      {/* INPUT */}
      {(!estado || estado === 'cargando') && (
        <form onSubmit={marcarAsistencia} style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ backgroundColor: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '32px', textAlign: 'center' }}>
            <p style={{ color: C.muted, fontSize: '16px', marginBottom: '20px', marginTop: 0 }}>
              Ingresa tu código de acceso
            </p>
            <input
              ref={inputRef}
              type="text"
              value={codigo}
              onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="_ _ _ _ _ _"
              maxLength={6}
              style={{
                width: '100%', padding: '20px', textAlign: 'center',
                fontSize: '36px', fontWeight: '800', letterSpacing: '12px',
                backgroundColor: C.surface, border: `2px solid ${codigo.length === 6 ? C.accent : C.border}`,
                borderRadius: '12px', color: C.text, outline: 'none',
                boxSizing: 'border-box', fontFamily: 'monospace',
                transition: 'border-color 0.2s',
              }}
              autoFocus
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={codigo.length < 4 || estado === 'cargando'}
              style={{
                width: '100%', marginTop: '16px', padding: '16px',
                backgroundColor: codigo.length >= 4 ? C.accent : C.surface,
                color: '#fff', border: 'none', borderRadius: '12px',
                fontSize: '18px', fontWeight: '700', cursor: codigo.length >= 4 ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s',
              }}
            >
              {estado === 'cargando' ? 'Verificando...' : '✅ Marcar asistencia'}
            </button>
            <p style={{ color: C.muted, fontSize: '12px', marginTop: '16px', marginBottom: 0 }}>
              También puedes presionar <strong>Enter</strong>
            </p>
          </div>
        </form>
      )}

      {/* LINK ADMIN */}
      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <a href="/" style={{ color: C.muted, fontSize: '12px', textDecoration: 'none' }}>
          Ir al login del sistema →
        </a>
      </div>
    </div>
  )
}
