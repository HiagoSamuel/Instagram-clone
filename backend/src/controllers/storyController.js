const path = require('path')
const supabase = require('../services/supabase')
const { getVisibleFeedUserIds } = require('./postController')._private

function safeFileName(name) {
  const ext = path.extname(name || '').toLowerCase()
  const base = path.basename(name || 'story', ext)
  const cleanBase = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

  return `${cleanBase || 'story'}${ext}`
}

async function uploadStoryFile(userId, file) {
  const filename = `stories/${userId}/${Date.now()}-${safeFileName(file.originalname)}`
  const { error: uploadError } = await supabase.storage
    .from('posts')
    .upload(filename, file.buffer, { contentType: file.mimetype })

  if (uploadError) throw uploadError
  const { data } = supabase.storage.from('posts').getPublicUrl(filename)
  return data.publicUrl
}

function groupStories(stories = []) {
  const map = new Map()

  stories.forEach((story) => {
    const user = story.users
    if (!map.has(story.user_id)) {
      map.set(story.user_id, {
        user,
        has_unseen: true,
        stories: [],
      })
    }

    map.get(story.user_id).stories.push({
      id: story.id,
      user_id: story.user_id,
      media_url: story.media_url,
      created_at: story.created_at,
      expires_at: story.expires_at,
    })
  })

  return [...map.values()]
}

exports.createStory = async (req, res) => {
  const { userId } = req.user
  const mediaFile = req.file

  if (!mediaFile) {
    return res.status(400).json({ error: 'Envie uma imagem para criar um story.' })
  }

  try {
    const mediaUrl = await uploadStoryFile(userId, mediaFile)
    const { data, error } = await supabase
      .from('stories')
      .insert({
        user_id: userId,
        media_url: mediaUrl,
      })
      .select('id, user_id, media_url, created_at, expires_at')
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro ao criar story.' })
  }
}

exports.listStories = async (req, res) => {
  const { userId } = req.user

  try {
    const visibleUserIds = await getVisibleFeedUserIds(userId)
    const { data, error } = await supabase
      .from('stories')
      .select(`
        id,
        user_id,
        media_url,
        created_at,
        expires_at,
        users!stories_user_id_fkey (
          id,
          username,
          avatar_url
        )
      `)
      .in('user_id', visibleUserIds)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.json(groupStories(data || []))
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro ao listar stories.' })
  }
}
