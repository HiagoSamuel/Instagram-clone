import api from './api'

const getProfile = async () => {
  const { data } = await api.get('/auth/me')
  return data
}

const updateProfile = async (payload) => {
  const formData = new FormData()

  if (payload.avatar) {
    formData.append('avatar', payload.avatar)
  }
  if (payload.username) {
    formData.append('username', payload.username)
  }
  if (payload.bio !== undefined) {
    formData.append('bio', payload.bio)
  }

  const { data } = await api.put('/auth/me', formData)
  return data
}

export const userService = {
  getProfile,
  updateProfile,
}
