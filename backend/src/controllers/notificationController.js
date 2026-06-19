const supabase = require('../services/supabase')

function isMissingNotificationSchema(error) {
  return error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    error?.code === 'PGRST204' ||
    /notifications|actor_id|post_id|read|full_name/i.test(error?.message || '')
}

async function getUnreadTotal(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error && isMissingNotificationSchema(error)) return 0
  if (error) throw error
  return count || 0
}

exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await getUnreadTotal(req.user.userId)
    return res.json({ unread_count: unreadCount })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

exports.listNotifications = async (req, res) => {
  const userId = req.user.userId
  const limit = Math.min(Number.parseInt(req.query.limit, 10) || 30, 100)

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('id, user_id, actor_id, type, post_id, read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (isMissingNotificationSchema(error)) return res.json([])
    return res.status(500).json({ error: error.message })
  }

  const actorIds = [...new Set((notifications || []).map((item) => item.actor_id))]
  const postIds = [...new Set((notifications || []).map((item) => item.post_id).filter(Boolean))]

  const { data: actors, error: actorsError } = actorIds.length
    ? await supabase.from('users').select('id, username, avatar_url').in('id', actorIds)
    : { data: [] }

  if (actorsError) return res.status(500).json({ error: actorsError.message })

  const { data: posts, error: postsError } = postIds.length
    ? await supabase.from('posts').select('id, caption').in('id', postIds)
    : { data: [] }

  if (postsError) return res.status(500).json({ error: postsError.message })

  const actorsById = new Map((actors || []).map((actor) => [actor.id, actor]))
  const postsById = new Map((posts || []).map((post) => [post.id, post]))

  return res.json((notifications || []).map((notification) => ({
    ...notification,
    actor: actorsById.get(notification.actor_id) || null,
    post: postsById.get(notification.post_id) || null,
  })))
}

exports.markNotificationRead = async (req, res) => {
  const userId = req.user.userId
  const { id } = req.params

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    if (isMissingNotificationSchema(error)) return res.json({ unread_count: 0 })
    return res.status(500).json({ error: error.message })
  }

  try {
    const unreadCount = await getUnreadTotal(userId)
    return res.json({ unread_count: unreadCount })
  } catch (countError) {
    return res.status(500).json({ error: countError.message })
  }
}

exports.markAllNotificationsRead = async (req, res) => {
  const userId = req.user.userId

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) {
    if (isMissingNotificationSchema(error)) return res.json({ unread_count: 0 })
    return res.status(500).json({ error: error.message })
  }
  return res.json({ unread_count: 0 })
}
