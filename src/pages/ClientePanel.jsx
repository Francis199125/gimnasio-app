function ClientePanel() {
  const nombre = sessionStorage.getItem('cliente')
  return (
    <div style={{ padding: '20px' }}>
      <h1>Panel Cliente</h1>
      <p>Bienvenido, {nombre}</p>
    </div>
  )
}

export default ClientePanel