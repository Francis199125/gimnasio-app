function EntrenadorPanel() {
  const nombre = sessionStorage.getItem('jorge')
  return (
    <div style={{ padding: '20px' }}>
      <h1>Panel Entrenador</h1>
      <p>Bienvenido, {nombre}</p>
    </div>
  )
}

export default EntrenadorPanel