import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './RegisterPage.css'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', full_name: '', username: '', password: '' })
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0] || null
    setAvatar(file)
    setError('')
  }

  useEffect(() => {
    if (!avatar) {
      setAvatarPreview(null)
      return
    }

    const previewUrl = URL.createObjectURL(avatar)
    setAvatarPreview(previewUrl)

    return () => {
      URL.revokeObjectURL(previewUrl)
    }
  }, [avatar])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // FIX: validação de senha mínima no frontend
    if (form.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('email', form.email)
    formData.append('full_name', form.full_name)
    formData.append('username', form.username)
    formData.append('password', form.password)
    if (avatar) formData.append('avatar', avatar)

    try {
      await api.post('/auth/register', formData)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao cadastrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-hero">
        <div className="hero-brand">
          <div className="hero-logo">Instagram</div>
          <h1>Crie sua conta para acompanhar os momentos dos seus amigos.</h1>
        </div>

        <div className="hero-visual">
          <div className="hero-shape" />
          <div className="hero-card" />
          <div className="hero-label">Bem-vindo ao seu feed pessoal</div>
        </div>
      </div>

      <div className="login-card">
        <div className="login-box">
          <h2>Criar conta</h2>
          <form onSubmit={handleSubmit} className="auth-form">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="full_name"
              placeholder="Nome completo"
              value={form.full_name}
              onChange={handleChange}
            />
            <input
              type="text"
              name="username"
              placeholder="Nome de usuário"
              value={form.username}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Senha (mínimo 6 caracteres)"
              value={form.password}
              onChange={handleChange}
              minLength={6}
              required
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
            />
            {avatarPreview && (
              <img
                src={avatarPreview}
                alt="Prévia do avatar"
                className="avatar-preview"
              />
            )}
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </form>
          <p className="auth-help">Ao criar a conta, você aceita nossos termos.</p>
          <p className="register-sentence">
            Já tem conta? <Link to="/login">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
