const assert = require('node:assert/strict')
const test = require('node:test')

const messageControllerPath = require.resolve('../src/controllers/messageController')
const friendshipControllerPath = require.resolve('../src/controllers/friendshipController')
const supabasePath = require.resolve('../src/services/supabase')

function mockModule(modulePath, exports) {
  require.cache[modulePath] = {
    id: modulePath,
    filename: modulePath,
    loaded: true,
    exports,
  }
}

function loadMessageController({ areFriends, supabase }) {
  delete require.cache[messageControllerPath]
  mockModule(friendshipControllerPath, { areFriends })
  mockModule(supabasePath, supabase)
  return require(messageControllerPath)
}

test('getConversationId gera o mesmo id para os dois sentidos', () => {
  const controller = loadMessageController({
    areFriends: async () => true,
    supabase: {},
  })

  const first = controller.getConversationId('user-a', 'user-b')
  const second = controller.getConversationId('user-b', 'user-a')

  assert.equal(first, second)
  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/)
})

test('createMessage bloqueia envio quando usuarios nao sao amigos', async () => {
  const controller = loadMessageController({
    areFriends: async () => false,
    supabase: {
      from() {
        throw new Error('Supabase nao deveria ser chamado para nao-amigos.')
      },
    },
  })

  await assert.rejects(
    () => controller.createMessage('user-a', 'user-b', 'oi'),
    (error) => {
      assert.equal(error.status, 403)
      assert.match(error.message, /amigos/i)
      return true
    }
  )
})

test('createMessage persiste a mensagem quando usuarios sao amigos', async () => {
  let insertedPayload
  const controller = loadMessageController({
    areFriends: async () => true,
    supabase: {
      from(table) {
        assert.equal(table, 'messages')
        return {
          insert(payload) {
            insertedPayload = payload
            return {
              select() {
                return {
                  async single() {
                    return {
                      data: {
                        id: 'message-1',
                        created_at: '2026-06-17T00:00:00.000Z',
                        ...payload,
                      },
                      error: null,
                    }
                  },
                }
              },
            }
          },
        }
      },
    },
  })

  const message = await controller.createMessage('user-a', 'user-b', '  ola  ')

  assert.equal(insertedPayload.sender_id, 'user-a')
  assert.equal(insertedPayload.receiver_id, 'user-b')
  assert.equal(insertedPayload.content, 'ola')
  assert.equal(message.id, 'message-1')
  assert.equal(message.content, 'ola')
})
