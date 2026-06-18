const supabase = require('../services/supabase')
const { sendPushToUser } = require('../services/pushService')

async function createNotification({
  io,
  recipientId,
  actorId,
  type,
  postId = null,
  pushTitle,
  pushBody,
  pushUrl = '/',
}) {
  if (!recipientId || !actorId || recipientId === actorId) return null

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: recipientId,
      actor_id: actorId,
      type,
      post_id: postId,
    })
    .select('id, user_id, actor_id, type, post_id, read, created_at')
    .single()

  if (error) {
    console.warn('Nao foi possivel criar notificacao:', error.message)
    return null
  }

  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', recipientId)
    .eq('read', false)

  const { data: actor } = await supabase
    .from('users')
    .select('id, username, full_name, avatar_url')
    .eq('id', actorId)
    .maybeSingle()

  const payload = {
    ...notification,
    actor: actor || null,
    unread_count: count || 0,
  }

  io?.to(`user:${recipientId}`).emit('notification_created', payload)

  if (pushTitle && pushBody) {
    await sendPushToUser(recipientId, {
      title: pushTitle,
      body: pushBody,
      url: pushUrl,
    })
  }

  return payload
}

module.exports = {
  createNotification,
}
