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
    
    const { data: c } = await supabase.from('usuarios').select('id,nombre,apellido_paterno,cui,codigo_acceso').eq('rol', 'cliente').order('nombre')
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
