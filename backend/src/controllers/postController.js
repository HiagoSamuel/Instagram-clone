const supabase = require('../services/supabase')
 
exports.getFeed = async (req, res) => {
  const { userId } = req.user
 
  // buscar todos os posts com dados do usuário
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
      image_url,
      caption,
      created_at,
      user_id,
      users!posts_user_id_fkey (
        id,
        username,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })
 
  if (error) {
    return res.status(500).json({ error: 'Erro ao buscar feed' })
  }
 
  // buscar likes de cada post e verificar se o usuário curtiu
  const postsWithLikes = await Promise.all(
    posts.map(async (post) => {
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id)
 
      const { data: userLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', userId)
        .single()
 
      return {
        ...post,
        user: post.users,
        likes_count: count || 0,
        liked_by_me: !!userLike,
      }
    })
  )
 
  return res.json(postsWithLikes)
}
 
exports.createPost = async (req, res) => {
  const { userId } = req.user
  const { caption } = req.body
  const file = req.file
 
  if (!file) {
    return res.status(400).json({ error: 'Imagem obrigatória' })
  }
 
  // upload para Supabase Storage
  const filename = `${userId}-${Date.now()}.${file.mimetype.split('/')[1]}`
  const { error: uploadError } = await supabase.storage
    .from('posts')
    .upload(filename, file.buffer, { contentType: file.mimetype })
 
  if (uploadError) {
    return res.status(500).json({ error: 'Erro ao fazer upload da imagem' })
  }
 
  const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filename)
  const imageUrl = urlData.publicUrl
 
  // salvar post no banco
  const { data: post, error } = await supabase
    .from('posts')
    .insert({ user_id: userId, image_url: imageUrl, caption })
    .select()
    .single()
 
  if (error) {
    return res.status(500).json({ error: 'Erro ao criar post' })
  }
 
  return res.status(201).json(post)
}
 
exports.getUserPosts = async (req, res) => {
  const { username } = req.params
  const { userId } = req.user
 
  // buscar usuário pelo username
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, username, avatar_url')
    .eq('username', username)
    .single()
 
  if (userError || !user) {
    return res.status(404).json({ error: 'Usuário não encontrado' })
  }
 
  // buscar posts do usuário
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, image_url, caption, created_at, user_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
 
  if (error) {
    return res.status(500).json({ error: 'Erro ao buscar posts' })
  }
 
  // adicionar likes
  const postsWithLikes = await Promise.all(
    posts.map(async (post) => {
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id)
 
      const { data: userLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', userId)
        .single()
 
      return {
        ...post,
        user,
        likes_count: count || 0,
        liked_by_me: !!userLike,
      }
    })
  )
 
  return res.json(postsWithLikes)
}
 
exports.likePost = async (req, res) => {
  const { userId } = req.user
  const { id } = req.params
 
  const { error } = await supabase
    .from('likes')
    .insert({ user_id: userId, post_id: id })
 
  if (error) {
    return res.status(500).json({ error: 'Erro ao curtir post' })
  }
 
  return res.status(201).json({ message: 'Post curtido' })
}
 
exports.unlikePost = async (req, res) => {
  const { userId } = req.user
  const { id } = req.params
 
  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', id)
 
  if (error) {
    return res.status(500).json({ error: 'Erro ao remover curtida' })
  }
 
  return res.status(204).send()
}
 
exports.deletePost = async (req, res) => {
  const { userId } = req.user
  const { id } = req.params
 
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
 
  const { error: deleteError } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)
 
  if (deleteError) {
    return res.status(500).json({ error: 'Erro ao apagar post' })
  }
 
  return res.status(204).send()
}
 