import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function Login() {
  const [cui, setCui] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const emailFicticio = `${cui}@gimnasio.local`

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: emailFicticio,
      password: password,
    })

    if (authError) {
      setError('CUI o contraseña incorrectos')
      setLoading(false)
      return
    }

    // Buscar el rol del usuario en la tabla usuarios
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('rol, nombre')
      .eq('cui', cui)
      .single()

    setLoading(false)

    if (userError || !usuario) {
      setError('Usuario no encontrado en el sistema')
      return
    }

    // Guardar info básica en sessionStorage para usar en otras pantallas
    sessionStorage.setItem('rol', usuario.rol)
    sessionStorage.setItem('nombre', usuario.nombre)
    sessionStorage.setItem('cui', cui)

    // Redirigir según rol
    if (usuario.rol === 'administrador') {
      navigate('/admin')
    } else if (usuario.rol === 'entrenador') {
      navigate('/entrenador')
    } else if (usuario.rol === 'cliente') {
      navigate('/cliente')
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f4f4' }}>
      <form onSubmit={handleLogin} style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '320px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Gimnasio - Login</h2>

        <div style={{ marginBottom: '15px' }}>
          <label>CUI</label>
          <input
            type="text"
            value={cui}
            onChange={(e) => setCui(e.target.value)}
            placeholder="Ej: 1234567890101"
            required
            style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box' }}
          />
        </div>

        {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '10px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}

export default Login