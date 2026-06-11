const supabase = require('../services/supabase')
const crypto = require('crypto')
const { areFriends } = require('./friendshipController')

function getConversationId(userA, userB) {
  const hash = crypto
    .createHash('sha256')
    .update([userA, userB].sort().join(':'))
    .digest('hex')
    .slice(0, 32)

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `8${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join('-')
}

async function ensureFriends(userId, friendId, res) {
  const allowed = await areFriends(userId, friendId)
  if (!allowed) {
    res.status(403).json({ error: 'Vocês não são amigos.' })
    return false
  }
  return true
}

exports.getConversationId = getConversationId

exports.createMessage = async (senderId, receiverId, content) => {
  const cleanContent = (content || '').trim()
  if (!cleanContent) {
    const error = new Error('Mensagem vazia.')
    error.status = 400
    throw error
  }

  const allowed = await areFriends(senderId, receiverId)
  if (!allowed) {
    const error = new Error('Vocês não são amigos.')
    error.status = 403
    throw error
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: getConversationId(senderId, receiverId),
      sender_id: senderId,
      receiver_id: receiverId,
      content: cleanContent,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

exports.getHistory = async (req, res) => {
  const userId = req.user.userId
  const { friendId } = req.params

  try {
    if (!(await ensureFriends(userId, friendId, res))) return

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', getConversationId(userId, friendId))
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return res.status(500).json({ error: error.message })
    return res.json((data || []).reverse())
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro ao buscar mensagens.' })
  }
}

exports.sendMessage = async (req, res) => {
  const userId = req.user.userId
  const { friendId } = req.params

  try {
    const message = await exports.createMessage(userId, friendId, req.body.content)
    return res.status(201).json(message)
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || 'Erro ao enviar mensagem.' })
  }
}

exports.getNewMessages = async (req, res) => {
  const userId = req.user.userId
  const { friendId } = req.params
  const { after } = req.query

  if (!after) {
    return res.status(400).json({ error: 'Informe o timestamp after.' })
  }

  try {
    if (!(await ensureFriends(userId, friendId, res))) return

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', getConversationId(userId, friendId))
      .gt('created_at', after)
      .order('created_at', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })
    return res.json(data || [])
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro ao buscar mensagens novas.' })
  }
}

exports.listConversations = async (req, res) => {
  const userId = req.user.userId

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  const conversations = new Map()
  for (const message of messages || []) {
    if (!conversations.has(message.conversation_id)) {
      conversations.set(message.conversation_id, {
        conversation_id: message.conversation_id,
        last_message: message,
        other_user_id: message.sender_id === userId ? message.receiver_id : message.sender_id,
        unread_count: 0,
      })
    }

    const conversation = conversations.get(message.conversation_id)
    if (message.receiver_id === userId && !message.read_at) {
      conversation.unread_count += 1
    }
  }

  const items = [...conversations.values()]
  const otherUserIds = [...new Set(items.map((item) => item.other_user_id))]

  if (otherUserIds.length === 0) return res.json([])

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, username, full_name, avatar_url')
    .in('id', otherUserIds)

  if (usersError) return res.status(500).json({ error: usersError.message })

  const usersById = new Map(users.map((user) => [user.id, user]))
  return res.json(items.map((item) => ({
    ...item,
    user: usersById.get(item.other_user_id),
  })))
}

exports.markAsRead = async (req, res) => {
  const userId = req.user.userId
  const { friendId } = req.params

  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', getConversationId(userId, friendId))
    .eq('receiver_id', userId)
    .is('read_at', null)

  if (error) return res.status(500).json({ error: error.message })
  return res.status(204).send()
}
