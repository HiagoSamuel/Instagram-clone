const path = require('path')
const supabase = require('../services/supabase')
const { getVisibleFeedUserIds } = require('./postController').discoveryHelpers

function isMissingStoriesSchema(error) {
  return error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    /stories|expires_at|media_url/i.test(error?.message || '')
}

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
      .select('id, user_id, media_url, created_at, expires_at')
      .in('user_id', visibleUserIds)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      if (isMissingStoriesSchema(error)) return res.json([])
      return res.status(500).json({ error: error.message })
    }

    const storyUserIds = [...new Set((data || []).map((story) => story.user_id))]
    const { data: users, error: usersError } = storyUserIds.length
      ? await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', storyUserIds)
      : { data: [], error: null }

    if (usersError) return res.status(500).json({ error: usersError.message })

    const usersById = new Map((users || []).map((user) => [user.id, user]))
    const storiesWithUsers = (data || []).map((story) => ({
      ...story,
      users: usersById.get(story.user_id) || null,
    }))

    return res.json(groupStories(storiesWithUsers))
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro ao listar stories.' })
  }
}
