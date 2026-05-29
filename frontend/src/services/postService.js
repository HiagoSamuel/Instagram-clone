import api from './api'

const getFeed = async () => {
  const { data } = await api.get('/posts/feed')
  return data
}

const createPost = async (formData) => {
  const { data } = await api.post('/posts', formData)
  return data
}

const like = async (postId) => {
  const { data } = await api.post(`/posts/${postId}/like`)
  return data
}

const unlike = async (postId) => {
  const { data } = await api.delete(`/posts/${postId}/like`)
  return data
}

const getUserPosts = async (username) => {
  const { data } = await api.get(`/posts/user/${username}`)
  return data
}

export const postService = {
  getFeed,
  createPost,
  like,
  unlike,
  getUserPosts,
}
