const supabase = require('../services/supabase')

exports.getFeed = async (req, res) => {
  const { userId } = req.user

  // FIX: busca posts com contagem de likes e status de curtida em queries otimizadas
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

  // FIX: busca todas as curtidas de uma vez (evita N+1)
  const postIds = posts.map((p) => p.id)

  const { data: allLikes } = await supabase
    .from('likes')
    .select('post_id, user_id')
    .in('post_id', postIds)

  const likesMap = {}
  const userLikedSet = new Set()

  for (const like of allLikes || []) {
    likesMap[like.post_id] = (likesMap[like.post_id] || 0) + 1
    if (like.user_id === userId) {
      userLikedSet.add(like.post_id)
    }
  }

  const postsWithLikes = posts.map((post) => ({
    ...post,
    user: post.users,
    likes_count: likesMap[post.id] || 0,
    liked_by_me: userLikedSet.has(post.id),
  }))

  return res.json(postsWithLikes)
}

exports.createPost = async (req, res) => {
  const { userId } = req.user
  const caption = (req.body.caption || '').trim()
  const file = req.file

  if (!file && !caption) {
    return res.status(400).json({ error: 'Escreva uma legenda ou envie uma imagem.' })
  }

  let imageUrl = ''

  if (file) {
    const filename = `${userId}-${Date.now()}.${file.mimetype.split('/')[1]}`
    const { error: uploadError } = await supabase.storage
      .from('posts')
      .upload(filename, file.buffer, { contentType: file.mimetype })

    if (uploadError) {
      return res.status(500).json({ error: 'Erro ao fazer upload da imagem' })
    }

    const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filename)
    imageUrl = urlData.publicUrl
  }

  const { data: post, error } = await supabase
    .from('posts')
    .insert({ user_id: userId, image_url: imageUrl, caption: caption || null })
    .select()
    .single()

  if (error) {
    return res.status(500).json({ error: 'Erro ao criar post' })
  }

  // FIX: busca dados do usuário para incluir no retorno (necessário para o PostCard)
  const { data: user } = await supabase
    .from('users')
    .select('id, username, avatar_url')
    .eq('id', userId)
    .single()

  return res.status(201).json({
    ...post,
    user: user || { id: userId, username: '', avatar_url: null },
    likes_count: 0,
    liked_by_me: false,
  })
}

exports.getUserPosts = async (req, res) => {
  const { username } = req.params
  const { userId } = req.user

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, username, avatar_url, full_name, bio')
    .eq('username', username)
    .single()

  if (userError || !user) {
    return res.status(404).json({ error: 'Usuário não encontrado' })
  }

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, image_url, caption, created_at, user_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: 'Erro ao buscar posts' })
  }

  // FIX: busca todas as curtidas de uma vez (evita N+1)
  const postIds = posts.map((p) => p.id)

  const { data: allLikes } = postIds.length
    ? await supabase.from('likes').select('post_id, user_id').in('post_id', postIds)
    : { data: [] }

  const likesMap = {}
  const userLikedSet = new Set()

  for (const like of allLikes || []) {
    likesMap[like.post_id] = (likesMap[like.post_id] || 0) + 1
    if (like.user_id === userId) {
      userLikedSet.add(like.post_id)
    }
  }

  const postsWithLikes = posts.map((post) => ({
    ...post,
    user,
    likes_count: likesMap[post.id] || 0,
    liked_by_me: userLikedSet.has(post.id),
  }))

  // FIX: retorna objeto {user, posts} para compatibilidade com ProfilePage
  return res.json({ user, posts: postsWithLikes })
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
