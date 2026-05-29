const supabase = require('../services/supabase')

exports.getFeed = async (req, res) => {
  const { userId } = req.user
  // buscar quem o usuário segue e buscar posts
}

exports.createPost = async (req, res) => {
  const { userId } = req.user
  const { caption } = req.body
  const file = req.file
  // upload para Supabase Storage e salvar post
}

exports.getUserPosts = async (req, res) => {
  const { username } = req.params
  // buscar posts do usuário pelo username
}

exports.likePost = async (req, res) => {
  const { userId } = req.user
  const { id } = req.params
  // inserir curtida na tabela likes
}

exports.unlikePost = async (req, res) => {
  const { userId } = req.user
  const { id } = req.params
  // remover curtida da tabela likes
}