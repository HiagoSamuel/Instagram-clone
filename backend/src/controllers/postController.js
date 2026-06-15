const supabase = require('../services/supabase')
const path = require('path')
const { areFriends, isMissingFriendshipsTable } = require('./friendshipController')

const TEXT_ONLY_IMAGE_URL = 'text-only-post'
const DEFAULT_FEED_LIMIT = 20
const MAX_FEED_LIMIT = 50
const POST_SELECT_WITH_FILES = `
      id,
      image_url,
      caption,
      file_url,
      file_name,
      file_type,
      file_size,
      created_at,
      user_id,
      users!posts_user_id_fkey (
        id,
        username,
        avatar_url
      )
    `
const POST_SELECT_BASE = `
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
    `

function isMissingPostFileColumns(error) {
  return error?.code === 'PGRST204' || /file_(url|name|type|size)/i.test(error?.message || '')
}

function safeFileName(name) {
  const ext = path.extname(name || '').toLowerCase()
  const base = path.basename(name || 'arquivo', ext)
  const cleanBase = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

  return `${cleanBase || 'arquivo'}${ext}`
}

async function uploadPostFile(userId, file, folder) {
  const filename = `${folder}/${userId}/${Date.now()}-${safeFileName(file.originalname)}`
  const { error: uploadError } = await supabase.storage
    .from('posts')
    .upload(filename, file.buffer, { contentType: file.mimetype })

  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filename)
  return urlData.publicUrl
}

function parsePagination(query) {
  const rawLimit = Number.parseInt(query.limit, 10)
  const rawOffset = Number.parseInt(query.offset, 10)
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), MAX_FEED_LIMIT)
    : DEFAULT_FEED_LIMIT
  const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0

  return { limit, offset }
}

exports.getFeed = async (req, res) => {
  const { userId } = req.user
  const { limit, offset } = parsePagination(req.query)

  const { data: friendships, error: friendshipsError } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

  if (friendshipsError) {
    if (!isMissingFriendshipsTable(friendshipsError)) {
      return res.status(500).json({ error: 'Erro ao buscar amigos' })
    }
  }

  const visibleUserIds = [
    userId,
    ...(friendships || []).map((friendship) =>
      friendship.requester_id === userId ? friendship.addressee_id : friendship.requester_id
    ),
  ]

  // FIX: busca posts com contagem de likes e status de curtida em queries otimizadas
  let { data: posts, error } = await supabase
    .from('posts')
    .select(POST_SELECT_WITH_FILES)
    .in('user_id', visibleUserIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error && isMissingPostFileColumns(error)) {
    const fallback = await supabase
      .from('posts')
      .select(POST_SELECT_BASE)
      .in('user_id', visibleUserIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    posts = fallback.data
    error = fallback.error
  }

  if (error) {
    return res.status(500).json({ error: 'Erro ao buscar feed' })
  }

  // FIX: busca todas as curtidas de uma vez (evita N+1)
  const postIds = posts.map((p) => p.id)

  const { data: allLikes } = postIds.length
    ? await supabase
      .from('likes')
      .select('post_id, user_id')
      .in('post_id', postIds)
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
    user: post.users,
    likes_count: likesMap[post.id] || 0,
    liked_by_me: userLikedSet.has(post.id),
  }))

  return res.json(postsWithLikes)
}

exports.createPost = async (req, res) => {
  const { userId } = req.user
  const caption = (req.body.caption || '').trim()
  const imageFile = req.files?.image?.[0] || null
  const attachmentFile = req.files?.attachment?.[0] || null

  if (!imageFile && !attachmentFile && !caption) {
    return res.status(400).json({ error: 'Escreva uma legenda, envie uma imagem ou anexe um arquivo.' })
  }

  let imageUrl = TEXT_ONLY_IMAGE_URL
  let attachment = null

  if (imageFile) {
    try {
      imageUrl = await uploadPostFile(userId, imageFile, 'images')
    } catch (uploadError) {
      return res.status(500).json({ error: 'Erro ao fazer upload da imagem' })
    }
  }

  if (attachmentFile) {
    try {
      attachment = {
        file_url: await uploadPostFile(userId, attachmentFile, 'attachments'),
        file_name: attachmentFile.originalname,
        file_type: attachmentFile.mimetype,
        file_size: attachmentFile.size,
      }
    } catch (uploadError) {
      return res.status(500).json({ error: 'Erro ao fazer upload do arquivo' })
    }
  }

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      image_url: imageUrl,
      caption: caption || null,
      ...(attachment || {}),
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar post no Supabase:', error)
    if (attachment && isMissingPostFileColumns(error)) {
      return res.status(500).json({
        error: 'O banco ainda nao tem as colunas de arquivo. Rode backend/supabase-post-files.sql no Supabase.',
      })
    }
    return res.status(500).json({
      error: error.message || 'Erro ao criar post',
      code: error.code,
      details: error.details,
    })
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

  const isOwnProfile = user.id === userId
  let canViewPosts = isOwnProfile

  if (!canViewPosts) {
    try {
      canViewPosts = await areFriends(userId, user.id)
    } catch (friendshipError) {
      if (!isMissingFriendshipsTable(friendshipError)) {
        return res.status(500).json({ error: 'Erro ao verificar amizade' })
      }
      canViewPosts = false
    }
  }

  if (!canViewPosts) {
    return res.json({
      user,
      posts: [],
      can_view_posts: false,
    })
  }

  let { data: posts, error } = await supabase
    .from('posts')
    .select('id, image_url, caption, file_url, file_name, file_type, file_size, created_at, user_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error && isMissingPostFileColumns(error)) {
    const fallback = await supabase
      .from('posts')
      .select('id, image_url, caption, created_at, user_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    posts = fallback.data
    error = fallback.error
  }

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
  return res.json({ user, posts: postsWithLikes, can_view_posts: true })
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
    .select('id, user_id, image_url, file_url')
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

  if (post.file_url) {
    const path = post.file_url.split('/storage/v1/object/public/posts/')[1]
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
