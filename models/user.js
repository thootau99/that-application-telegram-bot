import { redisCreate } from './redis.js'
import getUser from '../handlers/message/get-user.js'

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
 * @param {string} authKey
 * @return {Promise<Object.<string, User>>}
 */
export const getRecentTalkedUsers = async (authKey) => {
  const redis = await redisCreate()
  try {
    const cache = await redis.HGETALL('RECENT_TALKED_USER_LIST')
    if (Object.keys(cache).length === 0) throw new Error('data does not exists')
    let result = {}
    Object.keys(cache).forEach((publicKey) => { result = { ...result, [publicKey]: JSON.parse(cache[publicKey]) } })
    return result
  } catch {
    const userList = await getUser(authKey, 491)

    if (userList.result === 12) {
      throw new Error('authKey bô ha̍phoat')
    }

    let result = {}
    userList.data.forEach(user => {
      result = { ...result, [user.public_key]: user }
      redis.HSET('RECENT_TALKED_USER_LIST', user.public_key, JSON.stringify(user))
    })
    return result
  }
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
