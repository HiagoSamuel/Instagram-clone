const {
  isPushConfigured,
  saveSubscription,
  removeSubscription,
} = require('../services/pushService')

exports.getPushConfig = (_req, res) => {
  res.json({
    enabled: isPushConfigured(),
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
  })
}

exports.subscribe = async (req, res) => {
  try {
    const subscription = await saveSubscription(req.user.userId, req.body.subscription)
    return res.status(201).json({ ok: true, id: subscription.id })
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro ao salvar notificacao push.' })
  }
}

exports.unsubscribe = async (req, res) => {
  try {
    await removeSubscription(req.user.userId, req.body.endpoint)
    return res.status(204).send()
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro ao remover notificacao push.' })
  }
}
