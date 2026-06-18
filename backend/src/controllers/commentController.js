const supabase = require('../services/supabase')
const path = require('path')

const COMMENT_SELECT_WITH_FILES = `
      id,
      post_id,
      user_id,
      content,
      image_url,
      file_url,
      file_name,
      file_type,
      file_size,
      created_at,
      user:users(id, username, avatar_url)
    `

const COMMENT_SELECT_BASE = `
      id,
      post_id,
      user_id,
      content,
      image_url,
      created_at,
      user:users(id, username, avatar_url)
    `

function safeFileName(name) {
  const ext = path.extname(name || '').toLowerCase()
  const base = path.basename(name || 'arquivo', ext)
  const cleanBase = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

  return `${cleanBase || 'arquivo'}${ext}`
}

function isMissingCommentFileColumns(error) {
  return error?.code === 'PGRST204' || /file_(url|name|type|size)/i.test(error?.message || '')
}

async function uploadCommentFile(postId, userId, file, folder) {
  const fileName = `comments/${folder}/${postId}/${userId}/${Date.now()}-${safeFileName(file.originalname)}`
  const { error: uploadError } = await supabase.storage
    .from('posts')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    })

  if (uploadError) throw uploadError

  const { data: publicData } = supabase.storage.from('posts').getPublicUrl(fileName)
  return publicData.publicUrl
}

async function getPostAudienceUserIds(postId, fallbackUserId) {
  const audience = new Set([fallbackUserId].filter(Boolean))

  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single()

  if (postError || !post?.user_id) return [...audience]

  audience.add(post.user_id)

  const { data: friendships } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${post.user_id},addressee_id.eq.${post.user_id}`)

  ;(friendships || []).forEach((friendship) => {
    audience.add(friendship.requester_id)
    audience.add(friendship.addressee_id)
  })

  return [...audience]
}

async function emitCommentEvent(req, eventName, postId, payload, fallbackUserId) {
  const io = req.app.get('io')
  if (!io) return

  const audienceUserIds = await getPostAudienceUserIds(postId, fallbackUserId)
  audienceUserIds.forEach((audienceUserId) => {
    io.to(`user:${audienceUserId}`).emit(eventName, {
      postId,
      ...payload,
    })
  })
}

// GET /posts/:id/comments
exports.getComments = async (req, res) => {
  const { id: postId } = req.params

  let { data: comments, error } = await supabase
    .from('comments')
    .select(COMMENT_SELECT_WITH_FILES)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error && isMissingCommentFileColumns(error)) {
    const fallback = await supabase
      .from('comments')
      .select(COMMENT_SELECT_BASE)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    comments = fallback.data
    error = fallback.error
  }

  if (error) return res.status(500).json({ error: error.message })

  res.json(comments)
}

// POST /posts/:id/comments
exports.createComment = async (req, res) => {
  const { userId } = req.user
  const { id: postId } = req.params
  const { content } = req.body
  const imageFile = req.files?.image?.[0] || null
  const attachmentFile = req.files?.attachment?.[0] || null

  if (!content && !imageFile && !attachmentFile) {
    return res.status(400).json({ error: 'Comentario precisa ter texto, imagem ou arquivo.' })
  }

  let image_url = null
  let attachment = null

  if (imageFile) {
    try {
      image_url = await uploadCommentFile(postId, userId, imageFile, 'images')
    } catch (uploadError) {
      return res.status(500).json({ error: 'Erro ao enviar imagem do comentário.' })
    }
  }

  if (attachmentFile) {
    try {
      attachment = {
        file_url: await uploadCommentFile(postId, userId, attachmentFile, 'attachments'),
        file_name: attachmentFile.originalname,
        file_type: attachmentFile.mimetype,
        file_size: attachmentFile.size,
      }
    } catch (uploadError) {
      return res.status(500).json({ error: 'Erro ao enviar arquivo do comentario.' })
    }
  }

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content: content || null,
      image_url,
      ...(attachment || {}),
    })
    .select(COMMENT_SELECT_WITH_FILES)
    .single()

  if (error) {
    if (attachment && isMissingCommentFileColumns(error)) {
      return res.status(500).json({
        error: 'O banco ainda nao tem as colunas de arquivo em comentarios. Rode backend/supabase-comment-files.sql no Supabase.',
      })
    }
    return res.status(500).json({ error: error.message })
  }

  await emitCommentEvent(req, 'new_comment', postId, { comment }, userId)

  res.status(201).json(comment)
}

// DELETE /posts/:postId/comments/:commentId
exports.deleteComment = async (req, res) => {
  const { userId } = req.user
  const { postId, commentId } = req.params

  // fetch the comment to verify ownership
  const { data: comment, error: fetchError } = await supabase
    .from('comments')
    .select('id, user_id, image_url, file_url, post_id, posts(user_id)')
    .eq('id', commentId)
    .eq('post_id', postId)
    .single()

  if (fetchError || !comment) {
    return res.status(404).json({ error: 'Comentário não encontrado.' })
  }

  const isCommentOwner = comment.user_id === userId
  const isPostOwner    = comment.posts?.user_id === userId

  if (!isCommentOwner && !isPostOwner) {
    return res.status(403).json({ error: 'Sem permissão para excluir este comentário.' })
  }

  // delete image from storage if it exists
  if (comment.image_url) {
    const path = comment.image_url.split('/posts/')[1]
    if (path) {
      await supabase.storage.from('posts').remove([path])
    }
  }

  if (comment.file_url) {
    const path = comment.file_url.split('/posts/')[1]
    if (path) {
      await supabase.storage.from('posts').remove([path])
    }
  }

  const { error: deleteError } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (deleteError) return res.status(500).json({ error: deleteError.message })

  await emitCommentEvent(req, 'comment_deleted', postId, { commentId }, userId)

  res.json({ message: 'Comentário excluído.' })
}
