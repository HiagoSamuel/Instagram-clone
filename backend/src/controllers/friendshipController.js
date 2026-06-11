const supabase = require('../services/supabase')

function isMissingFriendshipsTable(error) {
  return error?.code === 'PGRST205' || error?.code === '42P01'
}

function friendshipOr(userA, userB) {
  return `and(requester_id.eq.${userA},addressee_id.eq.${userB}),and(requester_id.eq.${userB},addressee_id.eq.${userA})`
}

async function findFriendship(userA, userB) {
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .or(friendshipOr(userA, userB))
    .maybeSingle()

  if (error) throw error
  return data
}

async function areFriends(userA, userB) {
  const friendship = await findFriendship(userA, userB)
  return friendship?.status === 'accepted'
}

exports.findFriendship = findFriendship
exports.areFriends = areFriends
exports.isMissingFriendshipsTable = isMissingFriendshipsTable

exports.sendRequest = async (req, res) => {
  const requesterId = req.user.userId
  const { userId: addresseeId } = req.params

  if (requesterId === addresseeId) {
    return res.status(400).json({ error: 'Voce nao pode adicionar voce mesmo.' })
  }

  try {
    const existing = await findFriendship(requesterId, addresseeId)
    if (existing) {
      return res.status(409).json({ error: 'Ja existe uma relacao de amizade com este usuario.' })
    }

    const { data, error } = await supabase
      .from('friendships')
      .insert({
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: 'pending',
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro ao enviar solicitacao.' })
  }
}

exports.acceptRequest = async (req, res) => {
  const addresseeId = req.user.userId
  const { requesterId } = req.params

  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('requester_id', requesterId)
    .eq('addressee_id', addresseeId)
    .eq('status', 'pending')
    .select()
    .single()

  if (error) return res.status(404).json({ error: 'Solicitacao nao encontrada.' })
  return res.json(data)
}

exports.removeFriendship = async (req, res) => {
  const currentUserId = req.user.userId
  const { userId } = req.params

  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(friendshipOr(currentUserId, userId))

  if (error) {
    if (isMissingFriendshipsTable(error)) return res.json([])
    return res.status(500).json({ error: error.message })
  }
  return res.status(204).send()
}

exports.listFriends = async (req, res) => {
  const currentUserId = req.user.userId

  const { data: friendships, error } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id, created_at, updated_at')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)

  if (error) {
    if (isMissingFriendshipsTable(error)) return res.json([])
    return res.status(500).json({ error: error.message })
  }

  const friendIds = friendships.map((friendship) =>
    friendship.requester_id === currentUserId ? friendship.addressee_id : friendship.requester_id
  )

  if (friendIds.length === 0) return res.json([])

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, username, full_name, avatar_url')
    .in('id', friendIds)

  if (usersError) return res.status(500).json({ error: usersError.message })
  return res.json(users)
}

exports.listPending = async (req, res) => {
  const currentUserId = req.user.userId

  const { data: friendships, error } = await supabase
    .from('friendships')
    .select('id, requester_id, created_at')
    .eq('addressee_id', currentUserId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  const requesterIds = friendships.map((friendship) => friendship.requester_id)
  if (requesterIds.length === 0) return res.json([])

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, username, full_name, avatar_url')
    .in('id', requesterIds)

  if (usersError) return res.status(500).json({ error: usersError.message })

  const usersById = new Map(users.map((user) => [user.id, user]))
  return res.json(friendships.map((friendship) => ({
    id: friendship.id,
    created_at: friendship.created_at,
    requester: usersById.get(friendship.requester_id),
  })))
}

exports.getFriendshipStatus = async (req, res) => {
  const currentUserId = req.user.userId
  const { userId } = req.params

  if (currentUserId === userId) {
    return res.json({ status: 'accepted' })
  }

  try {
    const friendship = await findFriendship(currentUserId, userId)
    if (!friendship) return res.json({ status: 'none' })

    if (friendship.status === 'pending') {
      return res.json({
        status: friendship.requester_id === currentUserId ? 'pending_sent' : 'pending_received',
      })
    }

    return res.json({ status: friendship.status })
  } catch (error) {
    if (isMissingFriendshipsTable(error)) return res.json({ status: 'none' })
    return res.status(500).json({ error: error.message || 'Erro ao buscar status.' })
  }
}
