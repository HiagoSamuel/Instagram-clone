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

exports.deletePost = async (req, res) => {
  const { userId } = req.user
  const { id } = req.params

  // verificar se o post pertence ao usuário
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('id, user_id, image_url')
    .eq('id', id)
    .single()

  if (fetchError || !post) {
    return res.status(404).json({ error: 'Post não encontrado' })
  }

  if (post.user_id !== userId) {
    return res.status(403).json({ error: 'Você não tem permissão para apagar este post' })
  }

  // deletar imagem do storage se existir
  if (post.image_url) {
    const path = post.image_url.split('/storage/v1/object/public/posts/')[1]
    if (path) {
      await supabase.storage.from('posts').remove([path])
    }
  }

  // deletar o post
  const { error: deleteError } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return res.status(500).json({ error: 'Erro ao apagar post' })
  }

  return res.status(204).send()
}
