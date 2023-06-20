import { createClient } from 'redis'

export const redisCreate = () => {
  const client = createClient({ url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}` })
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    client.on('error', (err) => reject(err))
    client.on('connect', () => {
      resolve(client)
    })
    await client.connect()
  })
}

/**
 * @param {string} chatId
 * @return {Promise<import('../structs/user-in-redis.struct').UserInRedis>}
 */
export const getUserData = async (chatId) => {
  const redis = await redisCreate()
  /** @type {import('../structs/user-in-redis.struct').UserInRedis} */
  return JSON.parse(await redis.GET(chatId) ?? '')
}

/**
 *
 * @param {string} chatId
 * @param {string} authKey
 * @return {Promise<void>}
 */
export const setUserAuthKey = async (chatId, authKey) => {
  const redis = await redisCreate()
  try {
    const oldUserData = await getUserData(chatId)
    await redis.SET(chatId, JSON.stringify({ ...oldUserData, authKey }))
  } catch {
    /** @type {import('../structs/user-in-redis.struct').UserInRedis} */
    const initUserData = {
      authKey,
      targetPublicKey: ''
    }
    console.log(initUserData)
    await redis.SET(chatId, JSON.stringify(initUserData))
  }
}

/**
 *
 * @param {string} chatId
 * @param {string} targetPublicKey
 * @return {Promise<void>}
 */
export const setUserTargetPublicKey = async (chatId, targetPublicKey) => {
  const redis = await redisCreate()
  try {
    const oldUserData = await getUserData(chatId)
    await redis.SET(chatId, JSON.stringify({ ...oldUserData, targetPublicKey }))
  } catch {
    /** @type {import('../structs/user-in-redis.struct').UserInRedis} */
    const initUserData = {
      authKey: '',
      targetPublicKey: ''
    }
    await redis.SET(chatId, JSON.stringify(initUserData))
  }
}
