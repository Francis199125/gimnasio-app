function AdminPanel() {
  const nombre = sessionStorage.getItem('allan')
  return (
    <div style={{ padding: '20px' }}>
      <h1>Panel Administrador</h1>
      <p>Bienvenido, {nombre}</p>
    </div>
  )
}

export default AdminPanel