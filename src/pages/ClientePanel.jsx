import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const C = {
  bg: '#0f1117', surface: '#1a1d27', card: '#21253a',
  accent: '#06b6d4', green: '#22c55e', red: '#ef4444', yellow: '#eab308',
  text: '#f1f5f9', muted: '#94a3b8', border: '#2e3347',
}

const styles = {
  layout: { minHeight: '100vh', backgroundColor: C.bg, color: C.text, fontFamily: "'Segoe UI', system-ui, sans-serif" },
  header: { backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 },
  logoTitle: { fontSize: '18px', fontWeight: '700', color: C.accent, margin: 0 },
  main: { maxWidth: '800px', margin: '0 auto', padding: '28px 20px' },
  nav: { display: 'flex', gap: '4px', backgroundColor: C.surface, padding: '4px', borderRadius: '10px', marginBottom: '24px' },
  navItem: (active) => ({ flex: 1, padding: '10px', textAlign: 'center', cursor: 'pointer', borderRadius: '7px', backgroundColor: active ? C.accent : 'transparent', color: active ? '#fff' : C.muted, fontSize: '14px', fontWeight: active ? '600' : '400', transition: 'all 0.15s', border: 'none' }),
  card: { backgroundColor: C.card, borderRadius: '12px', border: `1px solid ${C.border}`, padding: '20px', marginBottom: '16px' },
  cardTitle: { fontSize: '14px', fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' },
  badge: (color) => ({ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', backgroundColor: color === 'green' ? '#14532d' : color === 'red' ? '#7f1d1d' : color === 'yellow' ? '#713f12' : color === 'blue' ? '#0c4a6e' : C.card, color: color === 'green' ? C.green : color === 'red' ? C.red : color === 'yellow' ? C.yellow : color === 'blue' ? C.accent : C.muted }),
  btn: (variant = 'primary') => ({ padding: '9px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', backgroundColor: variant === 'primary' ? C.accent : variant === 'danger' ? C.red : C.card, color: '#fff' }),
  infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.border}` },
  infoLabel: { fontSize: '13px', color: C.muted },
  infoValue: { fontSize: '14px', fontWeight: '600' },
  progressBar: (pct) => ({ height: '8px', borderRadius: '4px', backgroundColor: C.surface, overflow: 'hidden', marginTop: '8px', position: 'relative' }),
  progressFill: (pct, color) => ({ height: '100%', width: `${Math.min(pct, 100)}%`, backgroundColor: color, borderRadius: '4px', transition: 'width 0.5s' }),
  notifCard: (leida) => ({ backgroundColor: leida ? C.card : C.surface, borderRadius: '10px', border: `1px solid ${leida ? C.border : C.accent}`, padding: '14px 16px', marginBottom: '10px', display: 'flex', gap: '12px', alignItems: 'flex-start' }),
  rutinaCard: { backgroundColor: C.surface, borderRadius: '10px', border: `1px solid ${C.border}`, padding: '16px', marginBottom: '12px' },
}

export default function ClientePanel() {
  const [seccion, setSeccion] = useState('inicio')
  const [usuario, setUsuario] = useState(null)
  const [membresia, setMembresia] = useState(null)
  const [rutinas, setRutinas] = useState([])
  const [notificaciones, setNotificaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { cargarTodo() }, [])

  async function cargarTodo() {
    const cui = sessionStorage.getItem('cui')
    if (!cui) { navigate('/'); return }

    const { data: user } = await supabase.from('usuarios').select('*').eq('cui', cui).single()
    if (!user) { navigate('/'); return }
    setUsuario(user)
    sessionStorage.setItem('nombre', user.nombre)

    const hoy = new Date().toISOString().split('T')[0]

    // Membresía activa más reciente
    const { data: mems } = await supabase
      .from('membresias')
      .select('*, tipo:tipo_membresia_id(nombre)')
      .eq('cliente_id', user.id)
      .order('fecha_inicio', { ascending: false })
      .limit(1)
    setMembresia(mems?.[0] || null)

    // Rutinas activas
    const { data: ruts } = await supabase
      .from('rutinas')
      .select('*, entrenador:entrenador_id(nombre, apellido_paterno)')
      .eq('cliente_id', user.id)
      .eq('activa', true)
      .order('fecha_asignacion', { ascending: false })
    setRutinas(ruts || [])

    // Generar notificaciones automáticas basadas en membresía
    const notifs = []
    if (mems?.[0]) {
      const m = mems[0]
      const diasRestantes = Math.ceil((new Date(m.fecha_fin) - new Date()) / 86400000)
      if (diasRestantes < 0) {
        notifs.push({ id: 'vencida', tipo: 'vencida', mensaje: `Tu membresía venció el ${m.fecha_fin}. Contacta al gimnasio para renovarla.`, leida: false })
      } else if (diasRestantes <= 7) {
        notifs.push({ id: 'pronto', tipo: 'vencimiento_proximo', mensaje: `Tu membresía vence en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} (${m.fecha_fin}). ¡Renueva pronto!`, leida: false })
      } else {
        notifs.push({ id: 'activa', tipo: 'inicio_membresia', mensaje: `Tu membresía está activa hasta el ${m.fecha_fin}. ¡Sigue así!`, leida: true })
      }
    } else {
      notifs.push({ id: 'sin_mem', tipo: 'vencida', mensaje: 'No tienes una membresía activa. Contacta al gimnasio.', leida: false })
    }
    if (ruts?.length > 0) {
      notifs.push({ id: 'rutina', tipo: 'rutina_nueva', mensaje: `Tienes ${ruts.length} rutina${ruts.length !== 1 ? 's' : ''} asignada${ruts.length !== 1 ? 's' : ''}. ¡Revísalas!`, leida: true })
    }
    setNotificaciones(notifs)
    setLoading(false)
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    sessionStorage.clear()
    navigate('/')
  }

  if (loading) return (
    <div style={{ ...styles.layout, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.muted, fontSize: '16px' }}>Cargando tu información...</div>
    </div>
  )

  const notifsNoLeidas = notificaciones.filter(n => !n.leida).length

  // ── Cálculo de membresía ──────────────────────────────
  const diasRestantes = membresia ? Math.ceil((new Date(membresia.fecha_fin) - new Date()) / 86400000) : 0
  const diasTotales = membresia ? Math.ceil((new Date(membresia.fecha_fin) - new Date(membresia.fecha_inicio)) / 86400000) : 1
  const diasUsados = diasTotales - diasRestantes
  const porcentajeUsado = Math.max(0, Math.min(100, (diasUsados / diasTotales) * 100))
  const colorBarra = diasRestantes < 0 ? C.red : diasRestantes <= 7 ? C.yellow : C.green
  const estadoMem = diasRestantes < 0 ? 'vencida' : diasRestantes <= 7 ? 'yellow' : 'green'

  const notifIcono = (tipo) => {
    if (tipo === 'vencida') return '🔴'
    if (tipo === 'vencimiento_proximo') return '🟡'
    if (tipo === 'inicio_membresia') return '🟢'
    if (tipo === 'rutina_nueva') return '🏋️'
    return '📢'
  }

  return (
    <div style={styles.layout}>
      {/* HEADER */}
      <header style={styles.header}>
        <p style={styles.logoTitle}>💪 GymApp</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {notifsNoLeidas > 0 && (
            <div style={{ backgroundColor: C.red, color: '#fff', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }} onClick={() => setSeccion('notificaciones')}>
              🔔 {notifsNoLeidas} nueva{notifsNoLeidas !== 1 ? 's' : ''}
            </div>
          )}
          <span style={{ fontSize: '13px', color: C.muted }}>👤 {usuario?.nombre}</span>
          <button style={{ ...styles.btn('danger'), padding: '7px 14px', fontSize: '13px' }} onClick={cerrarSesion}>Salir</button>
        </div>
      </header>

      <main style={styles.main}>
        {/* NAVEGACIÓN */}
        <div style={styles.nav}>
          {[
            { id: 'inicio', label: '🏠 Inicio' },
            { id: 'membresia', label: '🏷️ Membresía' },
            { id: 'rutinas', label: '🏋️ Rutinas' },
            { id: 'notificaciones', label: `🔔 Avisos${notifsNoLeidas > 0 ? ` (${notifsNoLeidas})` : ''}` },
          ].map(item => (
            <button key={item.id} style={styles.navItem(seccion === item.id)} onClick={() => setSeccion(item.id)}>
              {item.label}
            </button>
          ))}
        </div>

        {/* ── INICIO ── */}
        {seccion === 'inicio' && (
          <div>
            <div style={{ ...styles.card, background: `linear-gradient(135deg, #0c4a6e, #164e63)`, borderColor: C.accent }}>
              <div style={{ fontSize: '13px', color: C.accent, marginBottom: '4px', fontWeight: '600' }}>BIENVENIDO DE VUELTA</div>
              <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>{usuario?.nombre} {usuario?.apellido_paterno}</div>
              <div style={{ fontSize: '13px', color: C.muted }}>{usuario?.apellido_materno}</div>
            </div>

            {/* Resumen membresía */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>Estado de membresía</div>
              {membresia ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '700' }}>{membresia.tipo?.nombre || 'Membresía libre'}</span>
                    {diasRestantes < 0
                      ? <span style={styles.badge('red')}>Vencida</span>
                      : diasRestantes <= 7
                        ? <span style={styles.badge('yellow')}>Vence en {diasRestantes}d</span>
                        : <span style={styles.badge('green')}>Activa</span>}
                  </div>
                  <div style={{ fontSize: '13px', color: C.muted, marginBottom: '8px' }}>
                    {membresia.fecha_inicio} → {membresia.fecha_fin}
                    {diasRestantes >= 0 && <span style={{ marginLeft: '8px', color: colorBarra, fontWeight: '600' }}> · {diasRestantes} días restantes</span>}
                  </div>
                  <div style={styles.progressBar(porcentajeUsado)}>
                    <div style={styles.progressFill(porcentajeUsado, colorBarra)} />
                  </div>
                </div>
              ) : (
                <div style={{ color: C.muted, fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                  No tienes una membresía activa. Contacta al gimnasio.
                </div>
              )}
            </div>

            {/* Datos personales */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>Mis datos</div>
              {[
                { label: 'Nombre completo', value: `${usuario?.nombre} ${usuario?.apellido_paterno} ${usuario?.apellido_materno || ''}`.trim() },
                { label: 'CUI', value: usuario?.cui },
                { label: 'Teléfono', value: usuario?.telefono || 'No registrado' },
                { label: 'Observaciones', value: usuario?.observaciones || 'Ninguna' },
              ].map((row, i) => (
                <div key={i} style={{ ...styles.infoRow, borderBottom: i < 3 ? `1px solid ${C.border}` : 'none' }}>
                  <span style={styles.infoLabel}>{row.label}</span>
                  <span style={styles.infoValue}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Rutinas resumen */}
            {rutinas.length > 0 && (
              <div style={styles.card}>
                <div style={styles.cardTitle}>Mis rutinas ({rutinas.length})</div>
                {rutinas.slice(0, 2).map(r => (
                  <div key={r.id} style={{ padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ fontWeight: '600', marginBottom: '2px' }}>{r.titulo}</div>
                    <div style={{ fontSize: '12px', color: C.muted }}>Por: {r.entrenador?.nombre} {r.entrenador?.apellido_paterno}</div>
                  </div>
                ))}
                {rutinas.length > 2 && <button style={{ ...styles.btn('primary'), marginTop: '12px', fontSize: '13px', padding: '7px 14px' }} onClick={() => setSeccion('rutinas')}>Ver todas las rutinas</button>}
              </div>
            )}
          </div>
        )}

        {/* ── MEMBRESÍA ── */}
        {seccion === 'membresia' && (
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '20px' }}>🏷️ Mi Membresía</h1>
            {membresia ? (
              <div>
                <div style={styles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>{membresia.tipo?.nombre || 'Membresía libre'}</div>
                      <div style={{ fontSize: '13px', color: C.muted }}>Membresía actual</div>
                    </div>
                    {diasRestantes < 0
                      ? <span style={styles.badge('red')}>Vencida</span>
                      : diasRestantes <= 7
                        ? <span style={styles.badge('yellow')}>⚠️ Próxima a vencer</span>
                        : <span style={styles.badge('green')}>✅ Activa</span>}
                  </div>

                  <div style={styles.progressBar(porcentajeUsado)}>
                    <div style={styles.progressFill(porcentajeUsado, colorBarra)} />
                  </div>
                  {diasRestantes >= 0 && <div style={{ fontSize: '12px', color: C.muted, marginTop: '6px', textAlign: 'right' }}>{diasRestantes} días restantes de {diasTotales}</div>}

                  <div style={{ marginTop: '20px' }}>
                    {[
                      { label: 'Fecha de inicio', value: membresia.fecha_inicio },
                      { label: 'Fecha de vencimiento', value: membresia.fecha_fin },
                      { label: 'Precio total', value: `Q${parseFloat(membresia.precio_pagado).toFixed(2)}` },
                      { label: 'Monto pagado', value: `Q${parseFloat(membresia.monto_pagado || 0).toFixed(2)}` },
                      { label: 'Saldo pendiente', value: `Q${(parseFloat(membresia.precio_pagado) - parseFloat(membresia.monto_pagado || 0)).toFixed(2)}` },
                    ].map((row, i, arr) => (
                      <div key={i} style={{ ...styles.infoRow, borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                        <span style={styles.infoLabel}>{row.label}</span>
                        <span style={{ ...styles.infoValue, color: row.label === 'Saldo pendiente' ? ((parseFloat(membresia.precio_pagado) - parseFloat(membresia.monto_pagado || 0)) > 0 ? C.yellow : C.green) : C.text }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {diasRestantes >= 0 && diasRestantes <= 7 && (
                  <div style={{ backgroundColor: '#713f12', border: `1px solid ${C.yellow}`, borderRadius: '10px', padding: '16px', color: C.yellow, fontSize: '14px' }}>
                    ⚠️ Tu membresía vence pronto. Acércate al gimnasio para renovarla y no perder tu acceso.
                  </div>
                )}
                {diasRestantes < 0 && (
                  <div style={{ backgroundColor: '#7f1d1d', border: `1px solid ${C.red}`, borderRadius: '10px', padding: '16px', color: C.red, fontSize: '14px' }}>
                    🔴 Tu membresía ha vencido. Contacta al gimnasio para renovarla.
                  </div>
                )}
              </div>
            ) : (
              <div style={{ ...styles.card, textAlign: 'center', padding: '60px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏷️</div>
                <p style={{ color: C.muted }}>No tienes una membresía activa. Contacta al gimnasio.</p>
              </div>
            )}
          </div>
        )}

        {/* ── RUTINAS ── */}
        {seccion === 'rutinas' && (
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '20px' }}>🏋️ Mis Rutinas</h1>
            {rutinas.length === 0 ? (
              <div style={{ ...styles.card, textAlign: 'center', padding: '60px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏋️</div>
                <p style={{ color: C.muted }}>Tu entrenador aún no te ha asignado rutinas.</p>
              </div>
            ) : (
              rutinas.map(r => (
                <div key={r.id} style={styles.rutinaCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>{r.titulo}</div>
                      <div style={{ fontSize: '12px', color: C.muted }}>
                        Asignada por: {r.entrenador?.nombre} {r.entrenador?.apellido_paterno} · {new Date(r.fecha_asignacion).toLocaleDateString()}
                      </div>
                    </div>
                    <span style={styles.badge('green')}>Activa</span>
                  </div>
                  <pre style={{ margin: 0, fontFamily: "'Segoe UI', sans-serif", fontSize: '14px', color: C.text, whiteSpace: 'pre-wrap', lineHeight: '1.6', backgroundColor: C.card, padding: '14px', borderRadius: '8px', border: `1px solid ${C.border}` }}>
                    {r.contenido}
                  </pre>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── NOTIFICACIONES ── */}
        {seccion === 'notificaciones' && (
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '20px' }}>🔔 Notificaciones</h1>
            {notificaciones.length === 0 ? (
              <div style={{ ...styles.card, textAlign: 'center', padding: '40px', color: C.muted }}>No tienes notificaciones.</div>
            ) : (
              notificaciones.map(n => (
                <div key={n.id} style={styles.notifCard(n.leida)}>
                  <div style={{ fontSize: '24px', flexShrink: 0 }}>{notifIcono(n.tipo)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{n.mensaje}</div>
                    {!n.leida && <div style={{ fontSize: '11px', color: C.accent, marginTop: '4px', fontWeight: '600' }}>NUEVO</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
