const supabase = require('../services/supabase')

// GET /posts/:id/comments
exports.getComments = async (req, res) => {
  const { id: postId } = req.params

  const { data: comments, error } = await supabase
    .from('comments')
    .select(`
      id,
      post_id,
      user_id,
      content,
      image_url,
      created_at,
      user:users(id, username, avatar_url)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  res.json(comments)
}

// POST /posts/:id/comments
exports.createComment = async (req, res) => {
  const { userId } = req.user
  const { id: postId } = req.params
  const { content } = req.body
  const file = req.file

  if (!content && !file) {
    return res.status(400).json({ error: 'Comentário precisa ter texto ou imagem.' })
  }

  let image_url = null

  if (file) {
    const fileName = `comments/${postId}/${userId}/${Date.now()}-${file.originalname}`
    const { error: uploadError } = await supabase.storage
      .from('posts')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      })

    if (uploadError) {
      return res.status(500).json({ error: 'Erro ao enviar imagem do comentário.' })
    }

    const { data: publicData } = supabase.storage.from('posts').getPublicUrl(fileName)
    image_url = publicData.publicUrl
  }

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: userId, content: content || null, image_url })
    .select(`
      id,
      post_id,
      user_id,
      content,
      image_url,
      created_at,
      user:users(id, username, avatar_url)
    `)
    .single()

  if (error) return res.status(500).json({ error: error.message })

  res.status(201).json(comment)
}

// DELETE /posts/:postId/comments/:commentId
exports.deleteComment = async (req, res) => {
  const { userId } = req.user
  const { postId, commentId } = req.params

  // fetch the comment to verify ownership
  const { data: comment, error: fetchError } = await supabase
    .from('comments')
    .select('id, user_id, image_url, post_id, posts(user_id)')
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

  const { error: deleteError } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (deleteError) return res.status(500).json({ error: deleteError.message })

  res.json({ message: 'Comentário excluído.' })
}
