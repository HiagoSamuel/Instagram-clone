const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const supabase = require('../services/supabase')

exports.register = async (req, res) => {
  const { email, password, username, full_name } = req.body

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, usuário e senha são obrigatórios.' })
  }

  // FIX: validação mínima de senha
  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' })
  }

  const { data: existingByUsername, error: usernameError } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single()

  if (usernameError && usernameError.code !== 'PGRST116') {
    return res.status(500).json({ error: usernameError.message })
  }

  if (existingByUsername) {
    return res.status(400).json({ error: 'Username já em uso.' })
  }

  const { data: existingByEmail, error: emailError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (emailError && emailError.code !== 'PGRST116') {
    return res.status(500).json({ error: emailError.message })
  }

  if (existingByEmail) {
    return res.status(400).json({ error: 'Email já cadastrado.' })
  }

  const password_hash = await bcrypt.hash(password, 10)

  const { data: user, error } = await supabase
    .from('users')
    .insert({ email, username, full_name, password_hash })
    .select('id, username, full_name, email, avatar_url')
    .single()

  if (error) return res.status(400).json({ error: error.message })

  let avatar_url = user.avatar_url
  const file = req.file

  if (file) {
    const fileName = `avatars/${user.id}/${Date.now()}-${file.originalname}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      })

    // FIX: checagem única de uploadError (removida checagem duplicada)
    if (uploadError) {
      console.error('[authController.register] uploadError:', uploadError)
      await supabase.from('users').delete().eq('id', user.id)
      return res.status(500).json({ error: 'Erro ao enviar o avatar para o storage.' })
    }

    const { data: publicData, error: publicError } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // FIX: checagem única de publicError (removida checagem duplicada)
    if (publicError) {
      console.error('[authController.register] publicError:', publicError)
      await supabase.from('users').delete().eq('id', user.id)
      return res.status(500).json({ error: 'Erro ao gerar URL pública do avatar.' })
    }

    avatar_url = publicData.publicUrl

    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url })
      .eq('id', user.id)

    if (updateError) {
      await supabase.from('users').delete().eq('id', user.id)
      return res.status(500).json({ error: 'Erro ao salvar a URL do avatar.' })
    }
  }

  res.status(201).json({
    message: 'Conta criada com sucesso!',
    user: {
      ...user,
      avatar_url,
    },
  })
}

exports.login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' })
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !user) {
    return res.status(401).json({ error: 'Credenciais inválidas.' })
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return res.status(401).json({ error: 'Credenciais inválidas.' })

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      email: user.email,
    },
  })
}

exports.me = async (req, res) => {
  const { userId } = req.user

  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, full_name, email, avatar_url, bio')
    .eq('id', userId)
    .single()

  if (error || !user) return res.status(404).json({ error: 'Usuário não encontrado.' })

  res.json(user)
}

exports.updateMe = async (req, res) => {
  const { userId } = req.user
  const { username, bio } = req.body
  const file = req.file
  const updates = {}

  if (username) {
    const { data: existingUser, error: usernameError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()

    if (usernameError && usernameError.code !== 'PGRST116') {
      return res.status(500).json({ error: usernameError.message })
    }

    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({ error: 'Username já em uso.' })
    }

    updates.username = username
  }

  if (bio !== undefined) {
    updates.bio = bio
  }

  if (file) {
    const fileName = `avatars/${userId}/${Date.now()}-${file.originalname}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      })

    // FIX: checagem única de uploadError (removida checagem duplicada)
    if (uploadError) {
      console.error('[authController.updateMe] uploadError:', uploadError)
      return res.status(500).json({ error: 'Erro ao enviar o avatar para o storage.' })
    }

    const { data: publicData, error: publicError } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // FIX: checagem única de publicError (removida checagem duplicada)
    if (publicError) {
      console.error('[authController.updateMe] publicError:', publicError)
      return res.status(500).json({ error: 'Erro ao gerar URL pública do avatar.' })
    }

    updates.avatar_url = publicData.publicUrl
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Nenhuma alteração enviada.' })
  }

  const { data: user, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select('id, username, full_name, email, avatar_url, bio')
    .single()

  if (error) return res.status(500).json({ error: error.message })

  res.json(user)
}
