import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './LoginPage.css'

export default function LoginPage() {
  const [form, setForm] = useState({
    email: localStorage.getItem('savedEmail') || '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciais inválidas. Tente novamente.')
      setForm((prev) => ({ ...prev, password: '' }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-hero">
        <div className="hero-brand">
          <div className="hero-logo">Instagram</div>
          <h1>Veja momentos do dia a dia dos seus amigos próximos.</h1>
        </div>

        <div className="hero-visual">
          <div className="hero-shape" />
          <div className="hero-card" />
          <div className="hero-label">Stories e posts exclusivos</div>
        </div>
      </div>

      <div className="login-card">
        <div className="login-box">
          <h2>Entrar no Instagram</h2>
          <form onSubmit={handleSubmit} className="auth-form">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />
            <div className="password-group">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Senha"
                value={form.password}
                onChange={handleChange}
              />
              {/* FIX: ícone SVG para evitar emoji quebrado em alguns sistemas */}
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <p className="auth-help">Esqueceu a senha?</p>
          <p className="register-sentence">
            Não tem conta? <Link to="/register">Criar nova conta</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
