const supabase = require('../services/supabase')
const { discoveryHelpers } = require('./postController')

const {
  POST_SELECT_WITH_FILES,
  POST_SELECT_BASE,
  enrichPostsForUser,
  getVisibleFeedUserIds,
  isMissingDiscoveryTables,
  isMissingPostFileColumns,
} = discoveryHelpers

const TRENDING_CACHE_TTL_MS = 60 * 1000
let trendingCache = {
  expiresAt: 0,
  data: [],
}

async function fetchPosts(select, userId, visibleUserIds, limit) {
  let query = supabase
    .from('posts')
    .select(select)
    .not('user_id', 'in', `(${visibleUserIds.join(',')})`)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  let { data, error } = await query

  if (error && isMissingDiscoveryTables(error)) {
    const fallback = await supabase
      .from('posts')
      .select(select)
      .not('user_id', 'in', `(${visibleUserIds.join(',')})`)
      .order('created_at', { ascending: false })
      .limit(limit)
    data = fallback.data
    error = fallback.error
  }

  if (error && isMissingPostFileColumns(error)) {
    return fetchPosts(POST_SELECT_BASE, userId, visibleUserIds, limit)
  }

  if (error) throw error
  return enrichPostsForUser(data || [], userId)
}

async function countByPost(table, postIds) {
  const counts = {}
  if (!postIds.length) return counts

  const { data } = await supabase
    .from(table)
    .select('post_id')
    .in('post_id', postIds)

  for (const row of data || []) {
    counts[row.post_id] = (counts[row.post_id] || 0) + 1
  }

  return counts
}

exports.getExplorePosts = async (req, res) => {
  const { userId } = req.user
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 30, 1), 60)

  try {
    const visibleUserIds = await getVisibleFeedUserIds(userId)
    const posts = await fetchPosts(POST_SELECT_WITH_FILES, userId, visibleUserIds, limit)
    const postIds = posts.map((post) => post.id)
    const [likeCounts, commentCounts] = await Promise.all([
      countByPost('likes', postIds),
      countByPost('comments', postIds),
    ])

    const scoredPosts = posts
      .map((post) => {
        const ageHours = Math.max(
          (Date.now() - new Date(post.created_at).getTime()) / 36e5,
          1
        )
        const score = ((likeCounts[post.id] || 0) * 2 + (commentCounts[post.id] || 0) * 3) / ageHours
        return {
          ...post,
          comments_count: commentCounts[post.id] || 0,
          explore_score: Number(score.toFixed(4)),
        }
      })
      .sort((a, b) => b.explore_score - a.explore_score || new Date(b.created_at) - new Date(a.created_at))

    return res.json(scoredPosts)
  } catch (error) {
    console.error('Erro ao buscar explorar:', error)
    return res.status(500).json({ error: 'Erro ao buscar explorar' })
  }
}

exports.getTrendingHashtags = async (_req, res) => {
  const now = Date.now()
  if (trendingCache.expiresAt > now) {
    return res.json({ items: trendingCache.data, cache: 'hit' })
  }

  const start = Date.now()

  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('post_hashtags')
      .select('hashtags!inner(tag), created_at')
      .gte('created_at', since)
      .limit(500)

    if (error) throw error

    const counts = new Map()
    for (const row of data || []) {
      const tag = row.hashtags?.tag
      if (tag) counts.set(tag, (counts.get(tag) || 0) + 1)
    }

    const items = [...counts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
      .slice(0, 10)

    trendingCache = {
      expiresAt: now + TRENDING_CACHE_TTL_MS,
      data: items,
    }

    return res.json({ items, cache: 'miss', duration_ms: Date.now() - start })
  } catch (error) {
    if (isMissingDiscoveryTables(error)) {
      return res.json({ items: [], cache: 'miss', duration_ms: Date.now() - start })
    }

    console.error('Erro ao buscar hashtags em alta:', error)
    return res.status(500).json({ error: 'Erro ao buscar hashtags em alta' })
  }
}
