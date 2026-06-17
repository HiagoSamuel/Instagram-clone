const supabase = require('../services/supabase')
const { discoveryHelpers } = require('./postController')

const {
  POST_SELECT_WITH_FILES,
  POST_SELECT_BASE,
  enrichPostsForUser,
  isMissingDiscoveryTables,
  isMissingPostFileColumns,
} = discoveryHelpers

function escapeSearch(value) {
  return String(value || '').replace(/[%_]/g, '\\$&')
}

function normalizeTag(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^#/, '')
    .toLowerCase()
    .trim()
}

async function runPostQuery(queryBuilder, userId) {
  let { data: posts, error } = await queryBuilder(POST_SELECT_WITH_FILES)

  if (error && isMissingPostFileColumns(error)) {
    const fallback = await queryBuilder(POST_SELECT_BASE)
    posts = fallback.data
    error = fallback.error
  }

  if (error) throw error
  return enrichPostsForUser(posts || [], userId)
}

exports.searchUsers = async (req, res) => {
  const currentUserId = req.user.userId
  const query = (req.query.q || '').trim()

  if (query.length < 2) {
    return res.json([])
  }

  // Busca de usuarios usa ILIKE porque e simples e suficiente para prefixos/nomes curtos.
  // Para escalar, o SQL da Fase 4 adiciona indices trigram em username/full_name.
  const escapedQuery = escapeSearch(query)
  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, full_name, avatar_url, bio')
    .or(`username.ilike.%${escapedQuery}%,full_name.ilike.%${escapedQuery}%`)
    .neq('id', currentUserId)
    .limit(20)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.json(users || [])
}

exports.searchPosts = async (req, res) => {
  const { userId } = req.user
  const query = (req.query.q || '').trim()

  if (query.length < 2) {
    return res.json([])
  }

  try {
    const posts = await runPostQuery((select) =>
      supabase
        .from('posts')
        .select(select)
        .textSearch('search_vector', query, { type: 'plain' })
        .order('created_at', { ascending: false })
        .limit(30),
    userId)

    return res.json(posts)
  } catch (error) {
    if (!isMissingDiscoveryTables(error)) {
      return res.status(500).json({ error: 'Erro ao buscar posts' })
    }

    const escapedQuery = escapeSearch(query)
    try {
      const posts = await runPostQuery((select) =>
        supabase
          .from('posts')
          .select(select)
          .ilike('caption', `%${escapedQuery}%`)
          .order('created_at', { ascending: false })
          .limit(30),
      userId)

      return res.json(posts)
    } catch (_fallbackError) {
      return res.status(500).json({ error: 'Erro ao buscar posts' })
    }
  }
}

exports.searchHashtagPosts = async (req, res) => {
  const { userId } = req.user
  const tag = normalizeTag(req.params.tag)

  if (!tag) {
    return res.status(400).json({ error: 'Hashtag invalida' })
  }

  try {
    const { data: links, error } = await supabase
      .from('post_hashtags')
      .select(`hashtags!inner(tag), posts!inner(${POST_SELECT_WITH_FILES})`)
      .eq('hashtags.tag', tag)
      .order('created_at', { foreignTable: 'posts', ascending: false })
      .limit(50)

    if (error) throw error

    const posts = (links || []).map((link) => link.posts).filter(Boolean)
    return res.json(await enrichPostsForUser(posts, userId))
  } catch (error) {
    if (!isMissingDiscoveryTables(error)) {
      return res.status(500).json({ error: 'Erro ao buscar hashtag' })
    }

    const escapedTag = escapeSearch(tag)
    try {
      const posts = await runPostQuery((select) =>
        supabase
          .from('posts')
          .select(select)
          .ilike('caption', `%#${escapedTag}%`)
          .order('created_at', { ascending: false })
          .limit(50),
      userId)

      return res.json(posts)
    } catch (_fallbackError) {
      return res.status(500).json({ error: 'Erro ao buscar hashtag' })
    }
  }
}
