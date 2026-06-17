const supabase = require('./supabase')

let webpush = null
try {
  webpush = require('web-push')
} catch (_error) {
  webpush = null
}

function isPushConfigured() {
  return Boolean(
    webpush &&
    process.env.VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT
  )
}

function configureWebPush() {
  if (!isPushConfigured()) return false

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
  return true
}

async function saveSubscription(userId, subscription) {
  if (!subscription?.endpoint) {
    throw new Error('Assinatura push invalida.')
  }

  const { data, error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: userId,
      endpoint: subscription.endpoint,
      subscription,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'endpoint' })
    .select('id')
    .single()

  if (error) throw error
  return data
}

async function removeSubscription(userId, endpoint) {
  if (!endpoint) return

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint)

  if (error) throw error
}

async function sendPushToUser(userId, payload) {
  if (!configureWebPush()) return

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, subscription')
    .eq('user_id', userId)

  if (error) {
    console.warn('Nao foi possivel buscar assinaturas push:', error.message)
    return
  }

  await Promise.all((subscriptions || []).map(async (row) => {
    try {
      await webpush.sendNotification(row.subscription, JSON.stringify(payload))
    } catch (pushError) {
      if ([404, 410].includes(pushError.statusCode)) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', row.endpoint)
      } else {
        console.warn('Falha ao enviar push:', pushError.message)
      }
    }
  }))
}

module.exports = {
  isPushConfigured,
  saveSubscription,
  removeSubscription,
  sendPushToUser,
}
