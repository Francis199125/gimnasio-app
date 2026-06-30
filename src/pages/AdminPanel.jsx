import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const C = {
  bg: '#0f1117', surface: '#1a1d27', card: '#21253a',
  accent: '#f97316', green: '#22c55e', red: '#ef4444', yellow: '#eab308',
  text: '#f1f5f9', muted: '#94a3b8', border: '#2e3347',
}

const styles = {
  layout: { display: 'flex', minHeight: '100vh', backgroundColor: C.bg, color: C.text, fontFamily: "'Segoe UI', system-ui, sans-serif" },
  sidebar: { width: '220px', minHeight: '100vh', backgroundColor: C.surface, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100 },
  logo: { padding: '24px 20px 16px', borderBottom: `1px solid ${C.border}` },
  logoTitle: { fontSize: '18px', fontWeight: '700', color: C.accent, margin: 0 },
  logoSub: { fontSize: '11px', color: C.muted, margin: '2px 0 0' },
  nav: { flex: 1, padding: '12px 0' },
  navItem: (active) => ({ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', cursor: 'pointer', backgroundColor: active ? C.card : 'transparent', borderLeft: active ? `3px solid ${C.accent}` : '3px solid transparent', color: active ? C.text : C.muted, fontSize: '14px', fontWeight: active ? '600' : '400', transition: 'all 0.15s' }),
  sidebarFooter: { padding: '16px 20px', borderTop: `1px solid ${C.border}` },
  main: { marginLeft: '220px', flex: 1, padding: '28px', minHeight: '100vh' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  pageTitle: { fontSize: '22px', fontWeight: '700', margin: 0 },
  btn: (variant = 'primary') => ({ padding: '9px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', backgroundColor: variant === 'primary' ? C.accent : variant === 'danger' ? C.red : variant === 'success' ? C.green : C.card, color: '#fff', transition: 'opacity 0.15s' }),
  card: { backgroundColor: C.card, borderRadius: '12px', border: `1px solid ${C.border}`, padding: '20px', marginBottom: '16px' },
  input: { width: '100%', padding: '10px 12px', backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  label: { display: 'block', fontSize: '12px', color: C.muted, marginBottom: '5px', fontWeight: '600' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { padding: '10px 14px', textAlign: 'left', borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '12px 14px', borderBottom: `1px solid ${C.border}` },
  badge: (color) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: color === 'green' ? '#14532d' : color === 'red' ? '#7f1d1d' : color === 'yellow' ? '#713f12' : C.card, color: color === 'green' ? C.green : color === 'red' ? C.red : color === 'yellow' ? C.yellow : C.muted }),
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  statCard: { backgroundColor: C.card, borderRadius: '12px', border: `1px solid ${C.border}`, padding: '20px' },
  statNum: { fontSize: '32px', fontWeight: '800', margin: '4px 0' },
  statLabel: { fontSize: '13px', color: C.muted },
  modal: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  modalBox: { backgroundColor: C.card, borderRadius: '14px', border: `1px solid ${C.border}`, padding: '28px', width: '560px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
  alert: (type) => ({ padding: '10px 14px', borderRadius: '8px', fontSize: '14px', marginBottom: '14px', backgroundColor: type === 'error' ? '#7f1d1d' : '#14532d', color: type === 'error' ? C.red : C.green, border: `1px solid ${type === 'error' ? C.red : C.green}` }),
  tabs: { display: 'flex', gap: '4px', marginBottom: '20px', backgroundColor: C.surface, padding: '4px', borderRadius: '10px', width: 'fit-content' },
  tab: (active) => ({ padding: '8px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', backgroundColor: active ? C.accent : 'transparent', color: active ? '#fff' : C.muted, transition: 'all 0.15s' }),
}

const NAV = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'clientes', icon: '👥', label: 'Clientes' },
  { id: 'membresias', icon: '🏷️', label: 'Membresías' },
  { id: 'productos', icon: '🛒', label: 'Productos' },
  { id: 'ventas', icon: '💰', label: 'Ventas' },
  { id: 'asistencia', icon: '📋', label: 'Asistencia' },
]

// ══════════════════════════════════════════════════════════
// MÓDULO: CLIENTES
// ══════════════════════════════════════════════════════════
function ModuloClientes() {
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(null)
  const [seleccionado, setSeleccionado] = useState(null)
  const [form, setForm] = useState({ cui: '', nombre: '', apellido_paterno: '', apellido_materno: '', telefono: '', observaciones: '', password_hash: '' })
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { cargarClientes() }, [])

  async function cargarClientes() {
    const { data } = await supabase.from('usuarios').select('*').eq('rol', 'cliente').order('fecha_registro', { ascending: false })
    setClientes(data || [])
  }

  const filtrados = clientes.filter(c =>
    `${c.nombre} ${c.apellido_paterno} ${c.apellido_materno} ${c.cui} ${c.telefono}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  async function guardarNuevo() {
    if (!form.cui || !form.nombre || !form.apellido_paterno || !form.password_hash) {
      setMsg({ type: 'error', text: 'CUI, nombre, apellido paterno y contraseña son obligatorios' }); return
    }
    setLoading(true)

    // Crear usuario en Auth via Edge Function (sin interrumpir sesión actual)
    const { data: fnData, error: fnErr } = await supabase.functions.invoke('crear-usuario', {
      body: { cui: form.cui, password: form.password_hash }
    })

    if (fnErr || fnData?.error) {
      setMsg({ type: 'error', text: 'Error al crear acceso: ' + (fnData?.error || fnErr?.message) })
      setLoading(false); return
    }

    // Insertar en tabla usuarios
    const { error: dbErr } = await supabase.from('usuarios').insert({
      cui: form.cui, nombre: form.nombre, apellido_paterno: form.apellido_paterno,
      apellido_materno: form.apellido_materno, telefono: form.telefono,
      observaciones: form.observaciones, rol: 'cliente', password_hash: 'auth'
    })
    setLoading(false)
    if (dbErr) { setMsg({ type: 'error', text: dbErr.message }); return }
    setMsg({ type: 'success', text: 'Cliente creado correctamente' })
    cargarClientes(); setTimeout(() => setModal(null), 1200)
  }

  async function guardarEdicion() {
    if (!form.nombre || !form.apellido_paterno) { setMsg({ type: 'error', text: 'Nombre y apellido paterno son obligatorios' }); return }
    setLoading(true)
    const { error } = await supabase.from('usuarios').update({ nombre: form.nombre, apellido_paterno: form.apellido_paterno, apellido_materno: form.apellido_materno, telefono: form.telefono, observaciones: form.observaciones }).eq('id', seleccionado.id)
    setLoading(false)
    if (error) { setMsg({ type: 'error', text: error.message }); return }
    setMsg({ type: 'success', text: 'Cliente actualizado' })
    cargarClientes(); setTimeout(() => setModal(null), 1200)
  }

  async function eliminarCliente(c) {
    if (!confirm(`¿Eliminar a ${c.nombre} ${c.apellido_paterno}?`)) return
    await supabase.from('usuarios').delete().eq('id', c.id)
    cargarClientes()
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>👥 Clientes</h1>
        <button style={styles.btn('primary')} onClick={() => { setForm({ cui: '', nombre: '', apellido_paterno: '', apellido_materno: '', telefono: '', observaciones: '', password_hash: '' }); setMsg(null); setModal('nuevo') }}>+ Agregar cliente</button>
      </div>
      <div style={{ ...styles.card, padding: '14px 20px' }}>
        <input style={styles.input} placeholder="🔍 Buscar por nombre, CUI, teléfono..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>
      <div style={styles.card}>
        <table style={styles.table}>
          <thead><tr><th style={styles.th}>Nombre</th><th style={styles.th}>CUI</th><th style={styles.th}>Teléfono</th><th style={styles.th}>Observaciones</th><th style={styles.th}>Acciones</th></tr></thead>
          <tbody>
            {filtrados.length === 0 && <tr><td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: C.muted }}>{busqueda ? 'Sin resultados' : 'No hay clientes aún'}</td></tr>}
            {filtrados.map(c => (
              <tr key={c.id}>
                <td style={styles.td}><strong>{c.nombre} {c.apellido_paterno}</strong>{c.apellido_materno && <span style={{ color: C.muted }}> {c.apellido_materno}</span>}</td>
                <td style={{ ...styles.td, color: C.muted, fontFamily: 'monospace' }}>{c.cui}</td>
                <td style={styles.td}>{c.telefono || '—'}</td>
                <td style={{ ...styles.td, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.observaciones || '—'}</td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ ...styles.btn('secondary'), padding: '6px 12px', fontSize: '12px' }} onClick={() => { setSeleccionado(c); setForm({ cui: c.cui, nombre: c.nombre, apellido_paterno: c.apellido_paterno, apellido_materno: c.apellido_materno || '', telefono: c.telefono || '', observaciones: c.observaciones || '', password_hash: '' }); setMsg(null); setModal('editar') }}>Editar</button>
                    <button style={{ ...styles.btn('danger'), padding: '6px 12px', fontSize: '12px' }} onClick={() => eliminarCliente(c)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: '12px', color: C.muted, fontSize: '13px' }}>{filtrados.length} cliente(s)</div>
      </div>
      {modal && (
        <div style={styles.modal} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={styles.modalBox}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px' }}>{modal === 'nuevo' ? '➕ Nuevo cliente' : '✏️ Editar cliente'}</h2>
            {msg && <div style={styles.alert(msg.type)}>{msg.text}</div>}
            <div style={styles.grid2}>
              <div><label style={styles.label}>CUI *</label><input style={styles.input} value={form.cui} disabled={modal === 'editar'} onChange={e => setForm({ ...form, cui: e.target.value })} placeholder="1234567890101" /></div>
              <div><label style={styles.label}>Teléfono</label><input style={styles.input} value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} /></div>
              <div><label style={styles.label}>Nombre *</label><input style={styles.input} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></div>
              <div><label style={styles.label}>Apellido Paterno *</label><input style={styles.input} value={form.apellido_paterno} onChange={e => setForm({ ...form, apellido_paterno: e.target.value })} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={styles.label}>Apellido Materno</label><input style={styles.input} value={form.apellido_materno} onChange={e => setForm({ ...form, apellido_materno: e.target.value })} /></div>
              {modal === 'nuevo' && <div style={{ gridColumn: '1 / -1' }}><label style={styles.label}>Contraseña *</label><input style={styles.input} type="password" value={form.password_hash} onChange={e => setForm({ ...form, password_hash: e.target.value })} /></div>}
              <div style={{ gridColumn: '1 / -1' }}><label style={styles.label}>Observaciones</label><textarea style={{ ...styles.input, minHeight: '70px', resize: 'vertical' }} value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} /></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button style={styles.btn('secondary')} onClick={() => setModal(null)}>Cancelar</button>
              <button style={styles.btn('primary')} disabled={loading} onClick={modal === 'nuevo' ? guardarNuevo : guardarEdicion}>{loading ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// MÓDULO: MEMBRESÍAS
// ══════════════════════════════════════════════════════════
function ModuloMembresias() {
  const [tab, setTab] = useState('asignadas')
  const [membresias, setMembresias] = useState([])
  const [tipos, setTipos] = useState([])
  const [clientes, setClientes] = useState([])
  const [modal, setModal] = useState(null)
  const [seleccionado, setSeleccionado] = useState(null)
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [formTipo, setFormTipo] = useState({ nombre: '', duracion_meses: '', precio: '', descripcion: '' })
  const [formMem, setFormMem] = useState({ cliente_id: '', tipo_membresia_id: '', precio_pagado: '', fecha_inicio: new Date().toISOString().split('T')[0], fecha_fin: '', monto_pagado: '', modo_fecha: 'meses', meses_duracion: '' })

  useEffect(() => { cargarTodo() }, [])

  async function cargarTodo() {
    const [{ data: m }, { data: t }, { data: c }] = await Promise.all([
      supabase.from('membresias').select('*, cliente:cliente_id(nombre,apellido_paterno), tipo:tipo_membresia_id(nombre,precio)').order('fecha_registro', { ascending: false }),
      supabase.from('tipos_membresia').select('*').eq('activo', true).order('precio'),
      supabase.from('usuarios').select('id,nombre,apellido_paterno,cui').eq('rol', 'cliente').order('nombre'),
    ])
    setMembresias(m || []); setTipos(t || []); setClientes(c || [])
  }

  function calcularFechaFin(inicio, meses) {
    if (!inicio || !meses) return ''
    const d = new Date(inicio)
    d.setDate(d.getDate() + Math.round(parseFloat(meses) * 30.44))
    return d.toISOString().split('T')[0]
  }

  async function guardarTipo() {
    if (!formTipo.nombre || !formTipo.precio) { setMsg({ type: 'error', text: 'Nombre y precio son obligatorios' }); return }
    setLoading(true)
    const op = seleccionado
      ? supabase.from('tipos_membresia').update({ nombre: formTipo.nombre, duracion_meses: formTipo.duracion_meses || null, precio: formTipo.precio, descripcion: formTipo.descripcion }).eq('id', seleccionado.id)
      : supabase.from('tipos_membresia').insert({ nombre: formTipo.nombre, duracion_meses: formTipo.duracion_meses || null, precio: formTipo.precio, descripcion: formTipo.descripcion })
    const { error } = await op
    setLoading(false)
    if (error) { setMsg({ type: 'error', text: error.message }); return }
    setMsg({ type: 'success', text: 'Plan guardado' })
    cargarTodo(); setTimeout(() => setModal(null), 1200)
  }

  async function guardarMembresia() {
    if (!formMem.cliente_id || !formMem.fecha_inicio || !formMem.fecha_fin || !formMem.precio_pagado) {
      setMsg({ type: 'error', text: 'Cliente, fechas y precio son obligatorios' }); return
    }
    setLoading(true)
    const monto = parseFloat(formMem.monto_pagado) || 0
    const precio = parseFloat(formMem.precio_pagado)
    const estado_pago = monto >= precio ? 'pagado' : monto > 0 ? 'parcial' : 'pendiente'
    const cui = sessionStorage.getItem('cui')
    const { data: admin } = await supabase.from('usuarios').select('id').eq('cui', cui).single()
    const { error } = await supabase.from('membresias').insert({ cliente_id: formMem.cliente_id, tipo_membresia_id: formMem.tipo_membresia_id || null, precio_pagado: precio, fecha_inicio: formMem.fecha_inicio, fecha_fin: formMem.fecha_fin, monto_pagado: monto, estado_pago, estado: 'activa', registrado_por: admin?.id || null })
    setLoading(false)
    if (error) { setMsg({ type: 'error', text: error.message }); return }
    setMsg({ type: 'success', text: 'Membresía registrada' })
    cargarTodo(); setTimeout(() => setModal(null), 1200)
  }

  const estadoBadge = (m) => {
    if (m.estado === 'vencida') return <span style={styles.badge('red')}>Vencida</span>
    const dias = Math.ceil((new Date(m.fecha_fin) - new Date()) / 86400000)
    if (dias <= 5) return <span style={styles.badge('yellow')}>Vence en {dias}d</span>
    return <span style={styles.badge('green')}>Activa</span>
  }

  const pagoBadge = (m) => {
    if (m.estado_pago === 'pagado') return <span style={styles.badge('green')}>Pagado</span>
    if (m.estado_pago === 'parcial') return <span style={styles.badge('yellow')}>Parcial</span>
    return <span style={styles.badge('red')}>Pendiente</span>
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>🏷️ Membresías</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={styles.btn('secondary')} onClick={async () => { const hoy = new Date().toISOString().split('T')[0]; await supabase.from('membresias').update({ estado: 'vencida' }).lt('fecha_fin', hoy).eq('estado', 'activa'); cargarTodo() }}>🔄 Actualizar estados</button>
          {tab === 'planes'
            ? <button style={styles.btn('primary')} onClick={() => { setSeleccionado(null); setFormTipo({ nombre: '', duracion_meses: '', precio: '', descripcion: '' }); setMsg(null); setModal('tipo') }}>+ Nuevo plan</button>
            : <button style={styles.btn('primary')} onClick={() => { setFormMem({ cliente_id: '', tipo_membresia_id: '', precio_pagado: '', fecha_inicio: new Date().toISOString().split('T')[0], fecha_fin: '', monto_pagado: '', modo_fecha: 'meses', meses_duracion: '' }); setMsg(null); setModal('membresia') }}>+ Asignar membresía</button>}
        </div>
      </div>
      <div style={styles.tabs}>
        <button style={styles.tab(tab === 'asignadas')} onClick={() => setTab('asignadas')}>📋 Membresías</button>
        <button style={styles.tab(tab === 'planes')} onClick={() => setTab('planes')}>📦 Planes</button>
      </div>
      {tab === 'planes' && (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Plan</th><th style={styles.th}>Duración</th><th style={styles.th}>Precio</th><th style={styles.th}>Descripción</th><th style={styles.th}>Acciones</th></tr></thead>
            <tbody>
              {tipos.length === 0 && <tr><td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: C.muted }}>No hay planes creados</td></tr>}
              {tipos.map(t => (
                <tr key={t.id}>
                  <td style={styles.td}><strong>{t.nombre}</strong></td>
                  <td style={styles.td}>{t.duracion_meses ? `${t.duracion_meses} mes(es)` : <span style={{ color: C.muted }}>Flexible</span>}</td>
                  <td style={styles.td}><strong style={{ color: C.accent }}>Q{parseFloat(t.precio).toFixed(2)}</strong></td>
                  <td style={styles.td}>{t.descripcion || '—'}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ ...styles.btn('secondary'), padding: '6px 12px', fontSize: '12px' }} onClick={() => { setSeleccionado(t); setFormTipo({ nombre: t.nombre, duracion_meses: t.duracion_meses || '', precio: t.precio, descripcion: t.descripcion || '' }); setMsg(null); setModal('tipo') }}>Editar</button>
                      <button style={{ ...styles.btn('danger'), padding: '6px 12px', fontSize: '12px' }} onClick={() => { if (confirm(`¿Eliminar "${t.nombre}"?`)) { supabase.from('tipos_membresia').update({ activo: false }).eq('id', t.id).then(() => cargarTodo()) } }}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === 'asignadas' && (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Cliente</th><th style={styles.th}>Plan</th><th style={styles.th}>Inicio</th><th style={styles.th}>Fin</th><th style={styles.th}>Precio</th><th style={styles.th}>Pagado</th><th style={styles.th}>Saldo</th><th style={styles.th}>Estado</th><th style={styles.th}>Pago</th></tr></thead>
            <tbody>
              {membresias.length === 0 && <tr><td colSpan={9} style={{ ...styles.td, textAlign: 'center', color: C.muted }}>No hay membresías</td></tr>}
              {membresias.map(m => (
                <tr key={m.id}>
                  <td style={styles.td}><strong>{m.cliente?.nombre} {m.cliente?.apellido_paterno}</strong></td>
                  <td style={styles.td}>{m.tipo?.nombre || <span style={{ color: C.muted }}>Libre</span>}</td>
                  <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '12px' }}>{m.fecha_inicio}</td>
                  <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '12px' }}>{m.fecha_fin}</td>
                  <td style={styles.td}>Q{parseFloat(m.precio_pagado).toFixed(2)}</td>
                  <td style={styles.td}>Q{parseFloat(m.monto_pagado || 0).toFixed(2)}</td>
                  <td style={styles.td}><strong style={{ color: (parseFloat(m.precio_pagado) - parseFloat(m.monto_pagado || 0)) > 0 ? C.yellow : C.green }}>Q{(parseFloat(m.precio_pagado) - parseFloat(m.monto_pagado || 0)).toFixed(2)}</strong></td>
                  <td style={styles.td}>{estadoBadge(m)}</td>
                  <td style={styles.td}>{pagoBadge(m)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal === 'tipo' && (
        <div style={styles.modal} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={styles.modalBox}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px' }}>{seleccionado ? '✏️ Editar plan' : '➕ Nuevo plan'}</h2>
            {msg && <div style={styles.alert(msg.type)}>{msg.text}</div>}
            <div style={styles.grid2}>
              <div style={{ gridColumn: '1 / -1' }}><label style={styles.label}>Nombre *</label><input style={styles.input} value={formTipo.nombre} onChange={e => setFormTipo({ ...formTipo, nombre: e.target.value })} placeholder="Ej: Mensual, Anual" /></div>
              <div><label style={styles.label}>Duración (meses)</label><input style={styles.input} type="number" step="0.25" value={formTipo.duracion_meses} onChange={e => setFormTipo({ ...formTipo, duracion_meses: e.target.value })} placeholder="1, 3, 12..." /></div>
              <div><label style={styles.label}>Precio (Q) *</label><input style={styles.input} type="number" step="0.01" value={formTipo.precio} onChange={e => setFormTipo({ ...formTipo, precio: e.target.value })} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={styles.label}>Descripción</label><input style={styles.input} value={formTipo.descripcion} onChange={e => setFormTipo({ ...formTipo, descripcion: e.target.value })} /></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button style={styles.btn('secondary')} onClick={() => setModal(null)}>Cancelar</button>
              <button style={styles.btn('primary')} disabled={loading} onClick={guardarTipo}>{loading ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
      {modal === 'membresia' && (
        <div style={styles.modal} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={styles.modalBox}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px' }}>➕ Asignar membresía</h2>
            {msg && <div style={styles.alert(msg.type)}>{msg.text}</div>}
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Cliente *</label>
              <select style={styles.input} value={formMem.cliente_id} onChange={e => setFormMem({ ...formMem, cliente_id: e.target.value })}>
                <option value="">— Seleccionar —</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido_paterno} — {c.cui}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Plan (opcional)</label>
              <select style={styles.input} value={formMem.tipo_membresia_id} onChange={e => { const t = tipos.find(t => t.id === e.target.value); setFormMem({ ...formMem, tipo_membresia_id: e.target.value, precio_pagado: t ? t.precio : formMem.precio_pagado }) }}>
                <option value="">— Precio libre —</option>
                {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre} — Q{t.precio}</option>)}
              </select>
            </div>
            <div style={{ ...styles.tabs, marginBottom: '14px' }}>
              <button style={styles.tab(formMem.modo_fecha === 'meses')} onClick={() => setFormMem({ ...formMem, modo_fecha: 'meses' })}>Por meses</button>
              <button style={styles.tab(formMem.modo_fecha === 'manual')} onClick={() => setFormMem({ ...formMem, modo_fecha: 'manual' })}>Fechas manuales</button>
            </div>
            <div style={styles.grid2}>
              <div><label style={styles.label}>Fecha inicio *</label><input style={styles.input} type="date" value={formMem.fecha_inicio} onChange={e => setFormMem({ ...formMem, fecha_inicio: e.target.value, fecha_fin: formMem.modo_fecha === 'meses' ? calcularFechaFin(e.target.value, formMem.meses_duracion) : formMem.fecha_fin })} /></div>
              {formMem.modo_fecha === 'meses'
                ? <div><label style={styles.label}>Duración (meses) *</label><input style={styles.input} type="number" step="0.25" placeholder="1, 3, 6, 12..." value={formMem.meses_duracion} onChange={e => setFormMem({ ...formMem, meses_duracion: e.target.value, fecha_fin: calcularFechaFin(formMem.fecha_inicio, e.target.value) })} /></div>
                : <div><label style={styles.label}>Fecha fin *</label><input style={styles.input} type="date" value={formMem.fecha_fin} onChange={e => setFormMem({ ...formMem, fecha_fin: e.target.value })} /></div>}
              {formMem.fecha_fin && <div style={{ gridColumn: '1 / -1', backgroundColor: C.surface, padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: C.muted }}>📅 Vence el: <strong style={{ color: C.text }}>{formMem.fecha_fin}</strong></div>}
              <div><label style={styles.label}>Precio total (Q) *</label><input style={styles.input} type="number" step="0.01" value={formMem.precio_pagado} onChange={e => setFormMem({ ...formMem, precio_pagado: e.target.value })} placeholder="0.00" /></div>
              <div><label style={styles.label}>Monto pagado ahora (Q)</label><input style={styles.input} type="number" step="0.01" value={formMem.monto_pagado} onChange={e => setFormMem({ ...formMem, monto_pagado: e.target.value })} placeholder="0.00" /></div>
              {formMem.precio_pagado && <div style={{ gridColumn: '1 / -1', backgroundColor: C.surface, padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>Saldo pendiente: <strong style={{ color: (parseFloat(formMem.precio_pagado) - parseFloat(formMem.monto_pagado || 0)) > 0 ? C.yellow : C.green }}>Q{(parseFloat(formMem.precio_pagado) - parseFloat(formMem.monto_pagado || 0)).toFixed(2)}</strong></div>}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button style={styles.btn('secondary')} onClick={() => setModal(null)}>Cancelar</button>
              <button style={styles.btn('primary')} disabled={loading} onClick={guardarMembresia}>{loading ? 'Guardando...' : 'Registrar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// MÓDULO: PRODUCTOS
// ══════════════════════════════════════════════════════════
function ModuloProductos() {
  const [productos, setProductos] = useState([])
  const [modal, setModal] = useState(null)
  const [seleccionado, setSeleccionado] = useState(null)
  const [form, setForm] = useState({ nombre: '', costo: '', precio: '', stock: '', estado: 'disponible' })
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => { cargarProductos() }, [])

  async function cargarProductos() {
    const { data } = await supabase.from('productos').select('*').order('fecha_registro', { ascending: false })
    setProductos(data || [])
  }

  const filtrados = productos.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))

  async function guardar() {
    if (!form.nombre || !form.precio || !form.costo) { setMsg({ type: 'error', text: 'Nombre, costo y precio son obligatorios' }); return }
    setLoading(true)
    const datos = { nombre: form.nombre, costo: parseFloat(form.costo), precio: parseFloat(form.precio), stock: parseInt(form.stock) || 0, estado: form.estado }
    const { error } = seleccionado
      ? await supabase.from('productos').update(datos).eq('id', seleccionado.id)
      : await supabase.from('productos').insert(datos)
    setLoading(false)
    if (error) { setMsg({ type: 'error', text: error.message }); return }
    setMsg({ type: 'success', text: seleccionado ? 'Producto actualizado' : 'Producto creado' })
    cargarProductos(); setTimeout(() => setModal(null), 1200)
  }

  async function eliminar(p) {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return
    await supabase.from('productos').delete().eq('id', p.id)
    cargarProductos()
  }

  const estadoBadge = (e) => {
    if (e === 'disponible') return <span style={styles.badge('green')}>Disponible</span>
    if (e === 'agotado') return <span style={styles.badge('red')}>Agotado</span>
    return <span style={styles.badge('')}>Descontinuado</span>
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>🛒 Productos</h1>
        <button style={styles.btn('primary')} onClick={() => { setSeleccionado(null); setForm({ nombre: '', costo: '', precio: '', stock: '', estado: 'disponible' }); setMsg(null); setModal('producto') }}>+ Nuevo producto</button>
      </div>
      <div style={{ ...styles.card, padding: '14px 20px' }}>
        <input style={styles.input} placeholder="🔍 Buscar producto..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>
      <div style={styles.card}>
        <table style={styles.table}>
          <thead><tr><th style={styles.th}>Producto</th><th style={styles.th}>Costo</th><th style={styles.th}>Precio</th><th style={styles.th}>Ganancia</th><th style={styles.th}>Stock</th><th style={styles.th}>Estado</th><th style={styles.th}>Acciones</th></tr></thead>
          <tbody>
            {filtrados.length === 0 && <tr><td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: C.muted }}>No hay productos</td></tr>}
            {filtrados.map(p => (
              <tr key={p.id}>
                <td style={styles.td}><strong>{p.nombre}</strong></td>
                <td style={styles.td}>Q{parseFloat(p.costo).toFixed(2)}</td>
                <td style={styles.td}><strong style={{ color: C.accent }}>Q{parseFloat(p.precio).toFixed(2)}</strong></td>
                <td style={styles.td}><span style={{ color: C.green }}>Q{(parseFloat(p.precio) - parseFloat(p.costo)).toFixed(2)}</span></td>
                <td style={styles.td}>{p.stock}</td>
                <td style={styles.td}>{estadoBadge(p.estado)}</td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ ...styles.btn('secondary'), padding: '6px 12px', fontSize: '12px' }} onClick={() => { setSeleccionado(p); setForm({ nombre: p.nombre, costo: p.costo, precio: p.precio, stock: p.stock, estado: p.estado }); setMsg(null); setModal('producto') }}>Editar</button>
                    <button style={{ ...styles.btn('danger'), padding: '6px 12px', fontSize: '12px' }} onClick={() => eliminar(p)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal === 'producto' && (
        <div style={styles.modal} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={styles.modalBox}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px' }}>{seleccionado ? '✏️ Editar producto' : '➕ Nuevo producto'}</h2>
            {msg && <div style={styles.alert(msg.type)}>{msg.text}</div>}
            <div style={styles.grid2}>
              <div style={{ gridColumn: '1 / -1' }}><label style={styles.label}>Nombre *</label><input style={styles.input} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Proteína Whey 1kg" /></div>
              <div><label style={styles.label}>Costo (Q) *</label><input style={styles.input} type="number" step="0.01" value={form.costo} onChange={e => setForm({ ...form, costo: e.target.value })} placeholder="0.00" /></div>
              <div><label style={styles.label}>Precio de venta (Q) *</label><input style={styles.input} type="number" step="0.01" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} placeholder="0.00" /></div>
              {form.costo && form.precio && <div style={{ gridColumn: '1 / -1', backgroundColor: C.surface, padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>Ganancia por unidad: <strong style={{ color: C.green }}>Q{(parseFloat(form.precio || 0) - parseFloat(form.costo || 0)).toFixed(2)}</strong></div>}
              <div><label style={styles.label}>Stock (unidades)</label><input style={styles.input} type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" /></div>
              <div><label style={styles.label}>Estado</label>
                <select style={styles.input} value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                  <option value="disponible">Disponible</option>
                  <option value="agotado">Agotado</option>
                  <option value="descontinuado">Descontinuado</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button style={styles.btn('secondary')} onClick={() => setModal(null)}>Cancelar</button>
              <button style={styles.btn('primary')} disabled={loading} onClick={guardar}>{loading ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// MÓDULO: VENTAS
// ══════════════════════════════════════════════════════════
function ModuloVentas() {
  const [ventas, setVentas] = useState([])
  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [modal, setModal] = useState(null)
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [abono, setAbono] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [form, setForm] = useState({ cliente_id: '', producto_id: '', cantidad: 1, monto_pagado: '' })

  useEffect(() => { cargarTodo() }, [])

  async function cargarTodo() {
    const [{ data: v }, { data: p }, { data: c }] = await Promise.all([
      supabase.from('ventas').select('*, cliente:cliente_id(nombre,apellido_paterno), producto:producto_id(nombre,precio)').order('fecha_venta', { ascending: false }),
      supabase.from('productos').select('*').eq('estado', 'disponible').order('nombre'),
      supabase.from('usuarios').select('id,nombre,apellido_paterno,cui').eq('rol', 'cliente').order('nombre'),
    ])
    setVentas(v || []); setProductos(p || []); setClientes(c || [])
  }

  const productoSeleccionado = productos.find(p => p.id === form.producto_id)
  const precioTotal = productoSeleccionado ? parseFloat(productoSeleccionado.precio) * parseInt(form.cantidad || 1) : 0

  async function registrarVenta() {
    if (!form.cliente_id || !form.producto_id) { setMsg({ type: 'error', text: 'Cliente y producto son obligatorios' }); return }
    setLoading(true)
    const monto = parseFloat(form.monto_pagado) || 0
    const estado_pago = monto >= precioTotal ? 'pagado' : monto > 0 ? 'parcial' : 'pendiente'
    const cui = sessionStorage.getItem('cui')
    const { data: admin } = await supabase.from('usuarios').select('id').eq('cui', cui).single()
    const { error } = await supabase.from('ventas').insert({ cliente_id: form.cliente_id, producto_id: form.producto_id, cantidad: parseInt(form.cantidad), precio_total: precioTotal, monto_pagado: monto, estado_pago, registrado_por: admin?.id || null })
    setLoading(false)
    if (error) { setMsg({ type: 'error', text: error.message }); return }
    setMsg({ type: 'success', text: 'Venta registrada correctamente' })
    cargarTodo(); setTimeout(() => setModal(null), 1200)
  }

  async function registrarAbono() {
    if (!abono || parseFloat(abono) <= 0) { alert('Ingresa un monto válido'); return }
    const nuevoMonto = parseFloat(ventaSeleccionada.monto_pagado || 0) + parseFloat(abono)
    const nuevoEstado = nuevoMonto >= parseFloat(ventaSeleccionada.precio_total) ? 'pagado' : 'parcial'
    const cui = sessionStorage.getItem('cui')
    const { data: admin } = await supabase.from('usuarios').select('id').eq('cui', cui).single()
    await supabase.from('abonos').insert({ venta_id: ventaSeleccionada.id, monto: parseFloat(abono), registrado_por: admin?.id || null })
    await supabase.from('ventas').update({ monto_pagado: nuevoMonto, estado_pago: nuevoEstado }).eq('id', ventaSeleccionada.id)
    setAbono(''); setModal(null); cargarTodo()
  }

  const ventasFiltradas = ventas.filter(v => filtro === 'todos' ? true : v.estado_pago === filtro)

  const pagoBadge = (e) => {
    if (e === 'pagado') return <span style={styles.badge('green')}>Pagado</span>
    if (e === 'parcial') return <span style={styles.badge('yellow')}>Parcial</span>
    return <span style={styles.badge('red')}>Pendiente</span>
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>💰 Ventas</h1>
        <button style={styles.btn('primary')} onClick={() => { setForm({ cliente_id: '', producto_id: '', cantidad: 1, monto_pagado: '' }); setMsg(null); setModal('venta') }}>+ Nueva venta</button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['todos', 'pendiente', 'parcial', 'pagado'].map(f => (
          <button key={f} style={{ ...styles.btn(filtro === f ? 'primary' : 'secondary'), padding: '7px 14px', fontSize: '13px' }} onClick={() => setFiltro(f)}>
            {f === 'todos' ? 'Todos' : f === 'pendiente' ? '⚠️ Pendientes' : f === 'parcial' ? '🔶 Parciales' : '✅ Pagados'}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead><tr><th style={styles.th}>Cliente</th><th style={styles.th}>Producto</th><th style={styles.th}>Cant.</th><th style={styles.th}>Total</th><th style={styles.th}>Pagado</th><th style={styles.th}>Saldo</th><th style={styles.th}>Estado</th><th style={styles.th}>Acciones</th></tr></thead>
          <tbody>
            {ventasFiltradas.length === 0 && <tr><td colSpan={8} style={{ ...styles.td, textAlign: 'center', color: C.muted }}>No hay ventas</td></tr>}
            {ventasFiltradas.map(v => (
              <tr key={v.id}>
                <td style={styles.td}><strong>{v.cliente?.nombre} {v.cliente?.apellido_paterno}</strong></td>
                <td style={styles.td}>{v.producto?.nombre}</td>
                <td style={styles.td}>{v.cantidad}</td>
                <td style={styles.td}>Q{parseFloat(v.precio_total).toFixed(2)}</td>
                <td style={styles.td}>Q{parseFloat(v.monto_pagado || 0).toFixed(2)}</td>
                <td style={styles.td}><strong style={{ color: (parseFloat(v.precio_total) - parseFloat(v.monto_pagado || 0)) > 0 ? C.yellow : C.green }}>Q{(parseFloat(v.precio_total) - parseFloat(v.monto_pagado || 0)).toFixed(2)}</strong></td>
                <td style={styles.td}>{pagoBadge(v.estado_pago)}</td>
                <td style={styles.td}>
                  {v.estado_pago !== 'pagado' && (
                    <button style={{ ...styles.btn('success'), padding: '6px 12px', fontSize: '12px' }} onClick={() => { setVentaSeleccionada(v); setAbono(''); setModal('abono') }}>+ Abono</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === 'venta' && (
        <div style={styles.modal} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={styles.modalBox}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px' }}>➕ Nueva venta</h2>
            {msg && <div style={styles.alert(msg.type)}>{msg.text}</div>}
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Cliente *</label>
              <select style={styles.input} value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })}>
                <option value="">— Seleccionar cliente —</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido_paterno} — {c.cui}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Producto *</label>
              <select style={styles.input} value={form.producto_id} onChange={e => setForm({ ...form, producto_id: e.target.value })}>
                <option value="">— Seleccionar producto —</option>
                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} — Q{p.precio}</option>)}
              </select>
            </div>
            <div style={styles.grid2}>
              <div><label style={styles.label}>Cantidad</label><input style={styles.input} type="number" min="1" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} /></div>
              <div><label style={styles.label}>Monto pagado ahora (Q)</label><input style={styles.input} type="number" step="0.01" value={form.monto_pagado} onChange={e => setForm({ ...form, monto_pagado: e.target.value })} placeholder="0.00" /></div>
              {productoSeleccionado && (
                <div style={{ gridColumn: '1 / -1', backgroundColor: C.surface, padding: '14px', borderRadius: '8px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: C.muted }}>Total:</span>
                    <strong style={{ color: C.accent }}>Q{precioTotal.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: C.muted }}>Saldo pendiente:</span>
                    <strong style={{ color: (precioTotal - parseFloat(form.monto_pagado || 0)) > 0 ? C.yellow : C.green }}>
                      Q{(precioTotal - parseFloat(form.monto_pagado || 0)).toFixed(2)}
                    </strong>
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button style={styles.btn('secondary')} onClick={() => setModal(null)}>Cancelar</button>
              <button style={styles.btn('primary')} disabled={loading} onClick={registrarVenta}>{loading ? 'Guardando...' : 'Registrar venta'}</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'abono' && ventaSeleccionada && (
        <div style={styles.modal} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={{ ...styles.modalBox, width: '400px' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px' }}>💳 Registrar abono</h2>
            <div style={{ backgroundColor: C.surface, padding: '14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
              <div style={{ marginBottom: '6px' }}><strong>{ventaSeleccionada.cliente?.nombre} {ventaSeleccionada.cliente?.apellido_paterno}</strong></div>
              <div style={{ color: C.muted, marginBottom: '6px' }}>{ventaSeleccionada.producto?.nombre}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Saldo pendiente:</span>
                <strong style={{ color: C.yellow }}>Q{(parseFloat(ventaSeleccionada.precio_total) - parseFloat(ventaSeleccionada.monto_pagado || 0)).toFixed(2)}</strong>
              </div>
            </div>
            <div>
              <label style={styles.label}>Monto del abono (Q)</label>
              <input style={styles.input} type="number" step="0.01" value={abono} onChange={e => setAbono(e.target.value)} placeholder="0.00" autoFocus />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button style={styles.btn('secondary')} onClick={() => setModal(null)}>Cancelar</button>
              <button style={styles.btn('success')} onClick={registrarAbono}>Registrar abono</button>
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
  const [stats, setStats] = useState({ clientes: 0, activas: 0, vencidas: 0, morosos: 0, ingresos: 0 })
  const nombre = sessionStorage.getItem('nombre')

  useEffect(() => {
    async function cargar() {
      const [{ count: clientes }, { count: activas }, { count: vencidas }, { count: morosos }, { data: ventas }] = await Promise.all([
        supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('rol', 'cliente'),
        supabase.from('membresias').select('*', { count: 'exact', head: true }).eq('estado', 'activa'),
        supabase.from('membresias').select('*', { count: 'exact', head: true }).eq('estado', 'vencida'),
        supabase.from('membresias').select('*', { count: 'exact', head: true }).eq('estado_pago', 'parcial'),
        supabase.from('ventas').select('monto_pagado'),
      ])
      const ingresos = (ventas || []).reduce((acc, v) => acc + parseFloat(v.monto_pagado || 0), 0)
      setStats({ clientes: clientes || 0, activas: activas || 0, vencidas: vencidas || 0, morosos: morosos || 0, ingresos })
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
          <p style={{ margin: '4px 0 0', color: C.muted, fontSize: '14px' }}>Bienvenido, {nombre || 'Administrador'}</p>
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
      <div style={{ ...styles.statCard, marginTop: '16px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ fontSize: '36px' }}>💵</div>
        <div>
          <div style={{ ...styles.statNum, color: C.green, fontSize: '28px' }}>Q{stats.ingresos.toFixed(2)}</div>
          <div style={styles.statLabel}>Total cobrado en ventas de productos</div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// MÓDULO: ASISTENCIA
// ══════════════════════════════════════════════════════════
function ModuloAsistencia() {
  const [asistencias, setAsistencias] = useState([])
  const [clientes, setClientes] = useState([])
  const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().split('T')[0])
  const [filtroCliente, setFiltroCliente] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ hoy: 0, semana: 0, mes: 0 })
  const [modalCodigos, setModalCodigos] = useState(false)

  useEffect(() => { cargarTodo() }, [filtroFecha, filtroCliente])

  async function cargarTodo() {
    setLoading(true)
    let query = supabase
      .from('asistencia')
      .select('*, usuario:usuario_id(nombre, apellido_paterno, cui, codigo_acceso, rol)')
      .order('fecha', { ascending: false })
      .order('hora_entrada', { ascending: false })

    if (filtroFecha) query = query.eq('fecha', filtroFecha)
    if (filtroCliente) query = query.eq('usuario_id', filtroCliente)

    const { data } = await query
    setAsistencias(data || [])

    // Stats
    const hoy = new Date().toISOString().split('T')[0]
    const inicioSemana = new Date()
    inicioSemana.setDate(inicioSemana.getDate() - 7)
    const inicioMes = new Date()
    inicioMes.setDate(1)

    const [{ count: countHoy }, { count: countSemana }, { count: countMes }] = await Promise.all([
      supabase.from('asistencia').select('*', { count: 'exact', head: true }).eq('fecha', hoy),
      supabase.from('asistencia').select('*', { count: 'exact', head: true }).gte('fecha', inicioSemana.toISOString().split('T')[0]),
      supabase.from('asistencia').select('*', { count: 'exact', head: true }).gte('fecha', inicioMes.toISOString().split('T')[0]),
    ])
    setStats({ hoy: countHoy || 0, semana: countSemana || 0, mes: countMes || 0 })

    const { data: c } = await supabase.from('usuarios').select('id,nombre,apellido_paterno,cui').eq('rol', 'cliente').order('nombre')
    setClientes(c || [])
    setLoading(false)
  }

  async function marcarManual(clienteId) {
    const hoy = new Date().toISOString().split('T')[0]
    const { data: yaMarco } = await supabase.from('asistencia').select('id').eq('usuario_id', clienteId).eq('fecha', hoy).single()
    if (yaMarco) { alert('Este cliente ya tiene asistencia registrada hoy.'); return }
    await supabase.from('asistencia').insert({ usuario_id: clienteId, registrado_por: 'admin' })
    cargarTodo()
  }

  async function eliminarAsistencia(id) {
    if (!confirm('¿Eliminar este registro de asistencia?')) return
    await supabase.from('asistencia').delete().eq('id', id)
    cargarTodo()
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>📋 Asistencia</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={styles.btn('secondary')} onClick={() => setModalCodigos(true)}>🔑 Ver códigos</button>
          <a href="/quiosco" target="_blank" style={{ ...styles.btn('primary'), textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>🖥️ Abrir quiosco</a>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Asistencias hoy', num: stats.hoy, icon: '📅', color: C.accent },
          { label: 'Últimos 7 días', num: stats.semana, icon: '📆', color: C.green },
          { label: 'Este mes', num: stats.mes, icon: '🗓️', color: C.yellow },
        ].map((s, i) => (
          <div key={i} style={styles.statCard}>
            <div style={{ fontSize: '24px' }}>{s.icon}</div>
            <div style={{ ...styles.statNum, color: s.color, fontSize: '28px' }}>{s.num}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div style={{ ...styles.card, padding: '16px 20px' }}>
        <div style={styles.grid2}>
          <div>
            <label style={styles.label}>Filtrar por fecha</label>
            <input style={styles.input} type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>Filtrar por cliente</label>
            <select style={styles.input} value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}>
              <option value="">— Todos los clientes —</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido_paterno}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button style={{ ...styles.btn('secondary'), padding: '7px 14px', fontSize: '13px' }} onClick={() => { setFiltroFecha(new Date().toISOString().split('T')[0]); setFiltroCliente('') }}>Hoy</button>
          <button style={{ ...styles.btn('secondary'), padding: '7px 14px', fontSize: '13px' }} onClick={() => setFiltroFecha('')}>Ver todos</button>
        </div>
      </div>

      {/* TABLA */}
      <div style={styles.card}>
        <table style={styles.table}>
          <thead><tr>
            <th style={styles.th}>Cliente</th>
            <th style={styles.th}>CUI</th>
            <th style={styles.th}>Fecha</th>
            <th style={styles.th}>Hora entrada</th>
            <th style={styles.th}>Registrado por</th>
            <th style={styles.th}>Acciones</th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: C.muted }}>Cargando...</td></tr>}
            {!loading && asistencias.length === 0 && <tr><td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: C.muted }}>No hay registros para los filtros seleccionados</td></tr>}
            {asistencias.map(a => (
              <tr key={a.id}>
                <td style={styles.td}><strong>{a.usuario?.nombre} {a.usuario?.apellido_paterno}</strong></td>
                <td style={{ ...styles.td, fontFamily: 'monospace', color: C.muted, fontSize: '12px' }}>{a.usuario?.cui}</td>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '13px' }}>{a.fecha}</td>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '13px' }}>{a.hora_entrada?.slice(0, 5)}</td>
                <td style={styles.td}>
                  <span style={styles.badge(a.registrado_por === 'quiosco' ? 'green' : a.registrado_por === 'admin' ? '' : 'yellow')}>
                    {a.registrado_por === 'quiosco' ? '🖥️ Quiosco' : a.registrado_por === 'admin' ? '👤 Admin' : '🏋️ Entrenador'}
                  </span>
                </td>
                <td style={styles.td}>
                  <button style={{ ...styles.btn('danger'), padding: '5px 10px', fontSize: '12px' }} onClick={() => eliminarAsistencia(a.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: '12px', color: C.muted, fontSize: '13px' }}>{asistencias.length} registro(s)</div>
      </div>

      {/* MARCADO MANUAL */}
      <div style={styles.card}>
        <div style={{ ...styles.cardTitle, fontSize: '13px', fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>✏️ Marcar asistencia manual (hoy)</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {clientes.map(c => (
            <button key={c.id} style={{ ...styles.btn('secondary'), padding: '7px 14px', fontSize: '13px' }} onClick={() => marcarManual(c.id)}>
              {c.nombre} {c.apellido_paterno}
            </button>
          ))}
          {clientes.length === 0 && <span style={{ color: C.muted, fontSize: '13px' }}>No hay clientes registrados</span>}
        </div>
      </div>

      {/* MODAL CÓDIGOS */}
      {modalCodigos && (
        <div style={styles.modal} onClick={e => e.target === e.currentTarget && setModalCodigos(false)}>
          <div style={styles.modalBox}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px' }}>🔑 Códigos de acceso</h2>
            <p style={{ color: C.muted, fontSize: '13px', marginBottom: '16px' }}>Entrega este código a cada cliente para que pueda marcar su asistencia en el quiosco.</p>
            <table style={styles.table}>
              <thead><tr>
                <th style={styles.th}>Cliente</th>
                <th style={styles.th}>CUI</th>
                <th style={styles.th}>Código</th>
              </tr></thead>
              <tbody>
                {clientes.map(c => (
                  <tr key={c.id}>
                    <td style={styles.td}><strong>{c.nombre} {c.apellido_paterno}</strong></td>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '12px', color: C.muted }}>{c.cui}</td>
                    <td style={styles.td}>
                      <span style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: '800', color: C.accent, letterSpacing: '4px' }}>
                        {c.codigo_acceso || '——'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button style={styles.btn('secondary')} onClick={() => setModalCodigos(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
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
    asistencia: <ModuloAsistencia />,
  }

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <p style={styles.logoTitle}>💪 GymApp</p>
          <p style={styles.logoSub}>Panel Administrador</p>
        </div>
        <nav style={styles.nav}>
          {NAV.map(item => (
            <div key={item.id} style={styles.navItem(seccion === item.id)} onClick={() => setSeccion(item.id)}>
              <span>{item.icon}</span><span>{item.label}</span>
            </div>
          ))}
        </nav>
        <div style={styles.sidebarFooter}>
          <div style={{ fontSize: '13px', color: C.muted, marginBottom: '10px' }}>👤 {nombre || 'Admin'}</div>
          <button style={{ ...styles.btn('danger'), width: '100%', padding: '8px' }} onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </aside>
      <main style={styles.main}>{modulos[seccion]}</main>
    </div>
  )
}
