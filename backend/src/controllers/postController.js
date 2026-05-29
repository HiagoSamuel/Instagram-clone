const supabase = require('../services/supabase')

exports.getFeed = async (req, res) => {
  const { userId } = req.user

  const { data: following, error: followingError } = await supabase
    .from('followers')
    .select('following_id')
    .eq('follower_id', userId)

  if (followingError) {
    return res.status(500).json({ error: followingError.message })
  }

  const followingIds = following.map((item) => item.following_id)
  followingIds.push(userId)

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
      user_id,
      image_url,
      caption,
      created_at,
      user:users(id, username, avatar_url),
      likes(user_id)
    `)
    .in('user_id', followingIds)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  const formatted = posts.map((post) => ({
    ...post,
    likes_count: post.likes?.length || 0,
    liked_by_me: post.likes?.some((like) => like.user_id === userId) || false,
    likes: undefined,
  }))

  res.json(formatted)
}

exports.createPost = async (req, res) => {
  const { userId } = req.user
  const { caption } = req.body
  const file = req.file

  if (!file) {
    return res.status(400).json({ error: 'Arquivo de imagem obrigatório.' })
  }

  const fileName = `${userId}/${Date.now()}-${file.originalname}`
  const { error: uploadError } = await supabase.storage
    .from('posts')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    })

  if (uploadError) {
    return res.status(500).json({ error: 'Erro ao enviar imagem para o storage.' })
  }

  const { data: publicData, error: publicError } = supabase.storage
    .from('posts')
    .getPublicUrl(fileName)

  if (publicError) {
    return res.status(500).json({ error: 'Erro ao gerar URL pública da imagem.' })
  }

  const image_url = publicData.publicUrl

  const { data: post, error } = await supabase
    .from('posts')
    .insert({ user_id: userId, image_url, caption })
    .select('id, user_id, image_url, caption, created_at')
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.status(201).json(post)
}

exports.getUserPosts = async (req, res) => {
  const { username } = req.params

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, username, avatar_url, full_name, bio')
    .eq('username', username)
    .single()

  if (userError || !user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' })
  }

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
      user_id,
      image_url,
      caption,
      created_at,
      likes(user_id)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  const formatted = posts.map((post) => ({
    ...post,
    likes_count: post.likes?.length || 0,
    liked_by_me: false,
    likes: undefined,
  }))

  res.json({ user, posts: formatted })
}

exports.likePost = async (req, res) => {
  const { userId } = req.user
  const { id: postId } = req.params

  const { error } = await supabase
    .from('likes')
    .insert({ user_id: userId, post_id: postId })

  if (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Post já curtido.' })
    }
    return res.status(500).json({ error: error.message })
  }

  res.json({ message: 'Post curtido.' })
}

exports.unlikePost = async (req, res) => {
  const { userId } = req.user
  const { id: postId } = req.params

  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json({ message: 'Curtida removida.' })
}
