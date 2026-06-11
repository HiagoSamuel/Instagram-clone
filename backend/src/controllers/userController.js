const supabase = require('../services/supabase')

exports.searchUsers = async (req, res) => {
  const currentUserId = req.user.userId
  const query = (req.query.q || '').trim()

  if (query.length < 2) {
    return res.json([])
  }

  const escapedQuery = query.replace(/[%_]/g, '\\$&')
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

exports.getUserById = async (req, res) => {
  const { id } = req.params

  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, full_name, avatar_url, bio')
    .eq('id', id)
    .single()

  if (error || !user) {
    return res.status(404).json({ error: 'Usuario nao encontrado.' })
  }

  return res.json(user)
}
