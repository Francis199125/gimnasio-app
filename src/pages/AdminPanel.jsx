import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

// ── Paleta ──────────────────────────────────────────────
const C = {
  bg: '#0f1117',
  surface: '#1a1d27',
  card: '#21253a',
  accent: '#f97316',       // naranja energía
  accentDim: '#7c3a1a',
  green: '#22c55e',
  red: '#ef4444',
  yellow: '#eab308',
  text: '#f1f5f9',
  muted: '#94a3b8',
  border: '#2e3347',
}

const styles = {
  layout: {
    display: 'flex', minHeight: '100vh',
    backgroundColor: C.bg, color: C.text,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  sidebar: {
    width: '220px', minHeight: '100vh',
    backgroundColor: C.surface,
    borderRight: `1px solid ${C.border}`,
    display: 'flex', flexDirection: 'column',
    position: 'fixed', top: 0, left: 0, bottom: 0,
    zIndex: 100,
  },
  logo: {
    padding: '24px 20px 16px',
    borderBottom: `1px solid ${C.border}`,
  },
  logoTitle: {
    fontSize: '18px', fontWeight: '700',
    color: C.accent, margin: 0,
  },
  logoSub: { fontSize: '11px', color: C.muted, margin: '2px 0 0' },
  nav: { flex: 1, padding: '12px 0' },
  navItem: (active) => ({
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 20px', cursor: 'pointer',
    backgroundColor: active ? C.card : 'transparent',
    borderLeft: active ? `3px solid ${C.accent}` : '3px solid transparent',
    color: active ? C.text : C.muted,
    fontSize: '14px', fontWeight: active ? '600' : '400',
    transition: 'all 0.15s',
  }),
  sidebarFooter: {
    padding: '16px 20px',
    borderTop: `1px solid ${C.border}`,
  },
  main: {
    marginLeft: '220px', flex: 1,
    padding: '28px', minHeight: '100vh',
  },
  pageHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '24px',
  },
  pageTitle: { fontSize: '22px', fontWeight: '700', margin: 0 },
  btn: (variant = 'primary') => ({
    padding: '9px 18px', borderRadius: '8px', border: 'none',
    cursor: 'pointer', fontSize: '14px', fontWeight: '600',
    backgroundColor: variant === 'primary' ? C.accent
      : variant === 'danger' ? C.red
      : variant === 'success' ? C.green
      : C.card,
    color: '#fff',
    transition: 'opacity 0.15s',
  }),
  card: {
    backgroundColor: C.card, borderRadius: '12px',
    border: `1px solid ${C.border}`, padding: '20px',
    marginBottom: '16px',
  },
  input: {
    width: '100%', padding: '10px 12px',
    backgroundColor: C.surface, border: `1px solid ${C.border}`,
    borderRadius: '8px', color: C.text, fontSize: '14px',
    boxSizing: 'border-box', outline: 'none',
  },
  label: {
    display: 'block', fontSize: '12px',
    color: C.muted, marginBottom: '5px', fontWeight: '600',
  },
  table: {
    width: '100%', borderCollapse: 'collapse', fontSize: '14px',
  },
  th: {
    padding: '10px 14px', textAlign: 'left',
    borderBottom: `1px solid ${C.border}`,
    color: C.muted, fontSize: '12px', fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  td: {
    padding: '12px 14px',
    borderBottom: `1px solid ${C.border}`,
  },
  badge: (color) => ({
    display: 'inline-block',
    padding: '3px 10px', borderRadius: '20px',
    fontSize: '12px', fontWeight: '600',
    backgroundColor: color === 'green' ? '#14532d'
      : color === 'red' ? '#7f1d1d'
      : color === 'yellow' ? '#713f12' : C.card,
    color: color === 'green' ? C.green
      : color === 'red' ? C.red
      : color === 'yellow' ? C.yellow : C.muted,
  }),
  grid2: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px',
  },
  grid3: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px',
  },
  statCard: {
    backgroundColor: C.card, borderRadius: '12px',
    border: `1px solid ${C.border}`, padding: '20px',
  },
  statNum: { fontSize: '32px', fontWeight: '800', margin: '4px 0' },
  statLabel: { fontSize: '13px', color: C.muted },
  modal: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 999,
  },
  modalBox: {
    backgroundColor: C.card, borderRadius: '14px',
    border: `1px solid ${C.border}`,
    padding: '28px', width: '500px', maxWidth: '95vw',
    maxHeight: '90vh', overflowY: 'auto',
  },
  alert: (type) => ({
    padding: '10px 14px', borderRadius: '8px', fontSize: '14px',
    marginBottom: '14px',
    backgroundColor: type === 'error' ? '#7f1d1d' : '#14532d',
    color: type === 'error' ? C.red : C.green,
    border: `1px solid ${type === 'error' ? C.red : C.green}`,
  }),
}

const NAV = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'clientes', icon: '👥', label: 'Clientes' },
  { id: 'membresias', icon: '🏷️', label: 'Membresías' },
  { id: 'productos', icon: '🛒', label: 'Productos' },
  { id: 'ventas', icon: '💰', label: 'Ventas' },
]

// ══════════════════════════════════════════════════════════
// MÓDULO: CLIENTES
// ══════════════════════════════════════════════════════════
function ModuloClientes() {
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(null) // null | 'nuevo' | 'editar'
  const [seleccionado, setSeleccionado] = useState(null)
  const [form, setForm] = useState({
    cui: '', nombre: '', apellido_paterno: '', apellido_materno: '',
    telefono: '', observaciones: '', password_hash: '',
  })
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { cargarClientes() }, [])

  async function cargarClientes() {
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('rol', 'cliente')
      .order('fecha_registro', { ascending: false })
    setClientes(data || [])
  }

  const filtrados = clientes.filter(c =>
    `${c.nombre} ${c.apellido_paterno} ${c.apellido_materno} ${c.cui} ${c.telefono}`
      .toLowerCase().includes(busqueda.toLowerCase())
  )

  function abrirNuevo() {
    setForm({ cui: '', nombre: '', apellido_paterno: '', apellido_materno: '', telefono: '', observaciones: '', password_hash: '' })
    setMsg(null)
    setModal('nuevo')
  }

  function abrirEditar(c) {
    setSeleccionado(c)
    setForm({ cui: c.cui, nombre: c.nombre, apellido_paterno: c.apellido_paterno, apellido_materno: c.apellido_materno || '', telefono: c.telefono || '', observaciones: c.observaciones || '', password_hash: '' })
    setMsg(null)
    setModal('editar')
  }

  async function guardarNuevo() {
    if (!form.cui || !form.nombre || !form.apellido_paterno || !form.password_hash) {
      setMsg({ type: 'error', text: 'CUI, nombre, apellido paterno y contraseña son obligatorios' })
      return
    }
    setLoading(true)
    // Crear en Auth
    const email = `${form.cui}@gimnasio.local`
    const { error: authErr } = await supabase.auth.admin
      ? { error: null } // admin API no disponible en cliente
      : { error: null }

    // Crear usuario via signUp (el admin lo hace por el usuario)
    const { error: signErr } = await supabase.auth.signUp({
      email,
      password: form.password_hash,
      options: { emailRedirectTo: undefined }
    })

    if (signErr && !signErr.message.includes('already registered')) {
      setMsg({ type: 'error', text: 'Error al crear acceso: ' + signErr.message })
      setLoading(false)
      return
    }

    // Insertar en tabla usuarios
    const { error: dbErr } = await supabase.from('usuarios').insert({
      cui: form.cui,
      nombre: form.nombre,
      apellido_paterno: form.apellido_paterno,
      apellido_materno: form.apellido_materno,
      telefono: form.telefono,
      observaciones: form.observaciones,
      rol: 'cliente',
      password_hash: 'auth',
    })

    setLoading(false)
    if (dbErr) { setMsg({ type: 'error', text: dbErr.message }); return }
    setMsg({ type: 'success', text: 'Cliente creado correctamente' })
    cargarClientes()
    setTimeout(() => setModal(null), 1200)
  }

  async function guardarEdicion() {
    if (!form.nombre || !form.apellido_paterno) {
      setMsg({ type: 'error', text: 'Nombre y apellido paterno son obligatorios' })
      return
    }
    setLoading(true)
    const { error } = await supabase.from('usuarios').update({
      nombre: form.nombre,
      apellido_paterno: form.apellido_paterno,
      apellido_materno: form.apellido_materno,
      telefono: form.telefono,
      observaciones: form.observaciones,
    }).eq('id', seleccionado.id)
    setLoading(false)
    if (error) { setMsg({ type: 'error', text: error.message }); return }
    setMsg({ type: 'success', text: 'Cliente actualizado' })
    cargarClientes()
    setTimeout(() => setModal(null), 1200)
  }

  async function eliminarCliente(c) {
    if (!confirm(`¿Eliminar a ${c.nombre} ${c.apellido_paterno}? Esta acción no se puede deshacer.`)) return
    const { error } = await supabase.from('usuarios').delete().eq('id', c.id)
    if (error) { alert('Error: ' + error.message); return }
    cargarClientes()
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>👥 Clientes</h1>
        <button style={styles.btn('primary')} onClick={abrirNuevo}>+ Agregar cliente</button>
      </div>

      <div style={{ ...styles.card, padding: '14px 20px', marginBottom: '16px' }}>
        <input
          style={styles.input}
          placeholder="🔍 Buscar por nombre, CUI, teléfono..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nombre</th>
              <th style={styles.th}>CUI</th>
              <th style={styles.th}>Teléfono</th>
              <th style={styles.th}>Observaciones</th>
              <th style={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr><td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: C.muted }}>
                {busqueda ? 'No se encontraron resultados' : 'No hay clientes registrados aún'}
              </td></tr>
            )}
            {filtrados.map(c => (
              <tr key={c.id} style={{ transition: 'background 0.1s' }}>
                <td style={styles.td}>
                  <strong>{c.nombre} {c.apellido_paterno}</strong>
                  {c.apellido_materno && <span style={{ color: C.muted }}> {c.apellido_materno}</span>}
                </td>
                <td style={{ ...styles.td, color: C.muted, fontFamily: 'monospace' }}>{c.cui}</td>
                <td style={styles.td}>{c.telefono || <span style={{ color: C.muted }}>—</span>}</td>
                <td style={{ ...styles.td, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.observaciones || <span style={{ color: C.muted }}>—</span>}
                </td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ ...styles.btn('secondary'), padding: '6px 12px', fontSize: '12px' }} onClick={() => abrirEditar(c)}>Editar</button>
                    <button style={{ ...styles.btn('danger'), padding: '6px 12px', fontSize: '12px' }} onClick={() => eliminarCliente(c)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: '12px', color: C.muted, fontSize: '13px' }}>
          {filtrados.length} cliente{filtrados.length !== 1 ? 's' : ''} {busqueda ? 'encontrados' : 'registrados'}
        </div>
      </div>

      {/* MODAL */}
      {modal && (
        <div style={styles.modal} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={styles.modalBox}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px' }}>
              {modal === 'nuevo' ? '➕ Nuevo cliente' : '✏️ Editar cliente'}
            </h2>
            {msg && <div style={styles.alert(msg.type)}>{msg.text}</div>}

            <div style={styles.grid2}>
              <div>
                <label style={styles.label}>CUI *</label>
                <input style={styles.input} value={form.cui} disabled={modal === 'editar'}
                  onChange={e => setForm({ ...form, cui: e.target.value })} placeholder="1234567890101" />
              </div>
              <div>
                <label style={styles.label}>Teléfono</label>
                <input style={styles.input} value={form.telefono}
                  onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="55551234" />
              </div>
              <div>
                <label style={styles.label}>Nombre *</label>
                <input style={styles.input} value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" />
              </div>
              <div>
                <label style={styles.label}>Apellido Paterno *</label>
                <input style={styles.input} value={form.apellido_paterno}
                  onChange={e => setForm({ ...form, apellido_paterno: e.target.value })} placeholder="Apellido Paterno" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={styles.label}>Apellido Materno</label>
                <input style={styles.input} value={form.apellido_materno}
                  onChange={e => setForm({ ...form, apellido_materno: e.target.value })} placeholder="Apellido Materno" />
              </div>
              {modal === 'nuevo' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={styles.label}>Contraseña inicial *</label>
                  <input style={styles.input} type="password" value={form.password_hash}
                    onChange={e => setForm({ ...form, password_hash: e.target.value })} placeholder="Contraseña para que el cliente pueda entrar" />
                </div>
              )}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={styles.label}>Observaciones</label>
                <textarea style={{ ...styles.input, minHeight: '70px', resize: 'vertical' }}
                  value={form.observaciones}
                  onChange={e => setForm({ ...form, observaciones: e.target.value })}
                  placeholder="Lesiones, condiciones especiales, notas..." />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button style={styles.btn('secondary')} onClick={() => setModal(null)}>Cancelar</button>
              <button style={styles.btn('primary')} disabled={loading}
                onClick={modal === 'nuevo' ? guardarNuevo : guardarEdicion}>
                {loading ? 'Guardando...' : modal === 'nuevo' ? 'Crear cliente' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// MÓDULO: DASHBOARD
// ══════════════════════════════════════════════════════════
function ModuloDashboard() {
  const [stats, setStats] = useState({ clientes: 0, activas: 0, vencidas: 0, morosos: 0 })
  const nombre = sessionStorage.getItem('nombre')

  useEffect(() => {
    async function cargar() {
      const [{ count: clientes }, { count: activas }, { count: vencidas }] = await Promise.all([
        supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('rol', 'cliente'),
        supabase.from('membresias').select('*', { count: 'exact', head: true }).eq('estado', 'activa'),
        supabase.from('membresias').select('*', { count: 'exact', head: true }).eq('estado', 'vencida'),
      ])
      const { count: morosos } = await supabase.from('ventas')
        .select('*', { count: 'exact', head: true }).eq('estado_pago', 'parcial')
      setStats({ clientes: clientes || 0, activas: activas || 0, vencidas: vencidas || 0, morosos: morosos || 0 })
    }
    cargar()
  }, [])

  const cards = [
    { label: 'Clientes registrados', num: stats.clientes, icon: '👥', color: C.accent },
    { label: 'Membresías activas', num: stats.activas, icon: '✅', color: C.green },
    { label: 'Membresías vencidas', num: stats.vencidas, icon: '⏰', color: C.yellow },
    { label: 'Pagos pendientes', num: stats.morosos, icon: '⚠️', color: C.red },
  ]

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>📊 Dashboard</h1>
          <p style={{ margin: '4px 0 0', color: C.muted, fontSize: '14px' }}>
            Bienvenido, {nombre || 'Administrador'}
          </p>
        </div>
      </div>

      <div style={styles.grid2}>
        {cards.map((c, i) => (
          <div key={i} style={styles.statCard}>
            <div style={{ fontSize: '28px' }}>{c.icon}</div>
            <div style={{ ...styles.statNum, color: c.color }}>{c.num}</div>
            <div style={styles.statLabel}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ ...styles.card, marginTop: '20px' }}>
        <h3 style={{ margin: '0 0 12px', color: C.muted, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Accesos rápidos
        </h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {NAV.filter(n => n.id !== 'dashboard').map(n => (
            <div key={n.id} style={{ ...styles.btn('secondary'), padding: '10px 16px', cursor: 'default', borderRadius: '8px', fontSize: '14px' }}>
              {n.icon} {n.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// MÓDULO: MEMBRESÍAS (placeholder, siguiente fase)
// ══════════════════════════════════════════════════════════
function ModuloMembresias() {
  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>🏷️ Membresías</h1>
      </div>
      <div style={{ ...styles.card, textAlign: 'center', padding: '60px', color: C.muted }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏋️</div>
        <p style={{ fontSize: '16px' }}>Módulo de membresías — próximamente</p>
        <p style={{ fontSize: '13px' }}>Aquí podrás asignar y gestionar membresías por cliente</p>
      </div>
    </div>
  )
}

function ModuloProductos() {
  return (
    <div>
      <div style={styles.pageHeader}><h1 style={styles.pageTitle}>🛒 Productos</h1></div>
      <div style={{ ...styles.card, textAlign: 'center', padding: '60px', color: C.muted }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
        <p style={{ fontSize: '16px' }}>Módulo de productos — próximamente</p>
      </div>
    </div>
  )
}

function ModuloVentas() {
  return (
    <div>
      <div style={styles.pageHeader}><h1 style={styles.pageTitle}>💰 Ventas</h1></div>
      <div style={{ ...styles.card, textAlign: 'center', padding: '60px', color: C.muted }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>💳</div>
        <p style={{ fontSize: '16px' }}>Módulo de ventas — próximamente</p>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// PANEL PRINCIPAL
// ══════════════════════════════════════════════════════════
export default function AdminPanel() {
  const [seccion, setSeccion] = useState('dashboard')
  const navigate = useNavigate()
  const nombre = sessionStorage.getItem('nombre')

  async function cerrarSesion() {
    await supabase.auth.signOut()
    sessionStorage.clear()
    navigate('/')
  }

  const modulos = {
    dashboard: <ModuloDashboard />,
    clientes: <ModuloClientes />,
    membresias: <ModuloMembresias />,
    productos: <ModuloProductos />,
    ventas: <ModuloVentas />,
  }

  return (
    <div style={styles.layout}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <p style={styles.logoTitle}>💪 GymApp</p>
          <p style={styles.logoSub}>Panel Administrador</p>
        </div>
        <nav style={styles.nav}>
          {NAV.map(item => (
            <div key={item.id}
              style={styles.navItem(seccion === item.id)}
              onClick={() => setSeccion(item.id)}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
        <div style={styles.sidebarFooter}>
          <div style={{ fontSize: '13px', color: C.muted, marginBottom: '10px' }}>
            👤 {nombre || 'Admin'}
          </div>
          <button style={{ ...styles.btn('danger'), width: '100%', padding: '8px' }}
            onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main style={styles.main}>
        {modulos[seccion]}
      </main>
    </div>
  )
}
