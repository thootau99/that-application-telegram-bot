import TelegramBot from 'node-telegram-bot-api'
import { getRecentTalkedUsers, getUserData, setUserAuthKey, setUserTargetPublicKey } from './models/user.js'
import apiGetMessage from './handlers/message/get.js'
import apiSendMessage from './handlers/message/send.js'

const token = process.env.TELEGRAM_BOT_KEY ?? ''
const bot = new TelegramBot(token, { polling: true })

bot.setMyCommands([
  {
    command: 'set_auth_key',
    description: 'setAuthKey'
  }, {
    command: 'get_auth_key',
    description: 'getAuthKey'
  }, {
    command: 'list_message_target',
    description: 'listMessageTarget'
  }, {
    command: 'get_message',
    description: 'getMessage'
  }, {
    command: 'send_message',
    description: 'sendMessage'
  }
], { scope: { type: 'all_private_chats' }, language_code: 'en' }).then(() => {
  console.log('command set ok')
})

bot.onText(/^\/set_auth_key/, async (msg) => {
  try {
    const chatId = msg.chat.id
    const { groups: { authToken } } = /\/set_auth_key (?<authToken>[^ $]*)/.exec(msg.text)
    await setUserAuthKey(chatId.toString(), authToken)
    await bot.sendMessage(msg.chat.id, 'authKey Siáli̍p sêngkong.')
  } catch (error) {
    console.log(error)
    await bot.sendMessage(msg.chat.id, 'authKey Siáli̍p sitpāi.')
  }
})

bot.onText(/^\/get_auth_key/, async (msg) => {
  try {
    const chatId = msg.chat.id
    const key = await getUserData(chatId.toString())
    await bot.sendMessage(msg.chat.id, key.authKey)
  } catch (error) {
    console.log(error)
    await bot.sendMessage(msg.chat.id, 'Che súiōngchiá iábô chuliāu.')
  }
})

bot.onText(/^\/list_message_target$/, async (msg) => {
  const chatId = msg.chat.id
  /** @type {UserInRedis} */
  let userData
  try {
    userData = await getUserData(chatId.toString())
  } catch (error) {
    await bot.sendMessage(chatId, 'authKey bô ha̍phoat')
    return
  }
  if (!userData) {
    await bot.sendMessage(chatId, 'Chhiáⁿ seng kali̍p 1 ê authKey')
    return
  }
  try {
    /** @type {Object.<string, User>} */
    const userTalkedRecently = await getRecentTalkedUsers(userData.authKey)
    console.log(userTalkedRecently, 'test')
    const opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: {
        resize_keyboard: true,
        one_time_keyboard: true,
        inline_keyboard: Object.keys(userTalkedRecently).map((publicKey) => [{ text: userTalkedRecently[publicKey].name, callback_data: `/set_message_target ${userTalkedRecently[publicKey].public_key}` }])
      }
    }

    await bot.sendMessage(msg.chat.id, 'Chhiáⁿ soánte̍k beh khaikáng ê súiōngchiá ', opts)
  } catch (error) {
    await bot.sendMessage(msg.chat.id, error.toString())
  }
})

bot.onText(/^\/get_message/, async (msg) => {
  const chatId = msg.chat.id
  /** @type {UserInRedis} */
  let userData
  try {
    userData = await getUserData(chatId.toString())
  } catch (error) {
    await bot.sendMessage(chatId, 'authKey bô ha̍phoat')
    return
  }
  if (!userData) {
    await bot.sendMessage(chatId, 'Chhiáⁿ seng kali̍p 1 ê authKey')
    return
  }
  let messageLimitCount
  try {
    const { groups: { limitCount } } = /\/get_message (?<limitCount>[^ $]*)/.exec(msg.text)
    messageLimitCount = parseInt(limitCount)
  } catch {}
  /** @type {MessageGetResponse} */
  const messageWithTarget = await apiGetMessage(userData.authKey, userData.targetPublicKey, 491)

  // check if api called successful
  if (messageWithTarget.result === 12 || messageWithTarget.result === 2) {
    await bot.sendMessage(chatId, 'authKey bô ha̍phoat')
    return
  }

  // add user data
  const userRecentTalked = await getRecentTalkedUsers(userData.authKey)
  const userNameReference = {
    [userData.targetPublicKey]: userData.targetPublicKey in userRecentTalked ? userRecentTalked[userData.targetPublicKey].name : ''
  }

  const messages = messageLimitCount
    ? messageWithTarget.data.slice(0, messageLimitCount)
    : messageWithTarget.data

  const response = messages.map((message) => `${userNameReference[message.public_key] ?? '自分'}: ${message.message}`).join('\n') ?? 'no message can be provided'
  await bot.sendMessage(msg.chat.id, response)
})

bot.onText(/^\/send_message/, async (msg) => {
  try {
    const chatId = msg.chat.id
    /** @type {UserInRedis} */
    let userData
    try {
      userData = await getUserData(chatId.toString())
    } catch (error) {
      await bot.sendMessage(chatId, 'authKey bô ha̍phoat')
      return
    }
    const { groups: { messageContent } } = /\/send_message (?<messageContent>[^$]*)/.exec(msg.text)

    if (!userData) {
      await bot.sendMessage(chatId, 'Chhiáⁿ seng kali̍p 1 ê authKey')
      return
    }
    /** @type {MessageGetResponse} */
    const messageWithTarget = await apiSendMessage(
      userData.authKey,
      userData.targetPublicKey,
      messageContent,
      491
    )

    if (messageWithTarget.result === 12) {
      await bot.sendMessage(chatId, 'authKey bô ha̍phoat')
      return
    }

    await bot.sendMessage(msg.chat.id, 'ok.')
  } catch (error) {
    console.log(error)
    await bot.sendMessage(msg.chat.id, 'error.')
  }
})

bot.on('callback_query', async (callbackQuery) => {
  const action = callbackQuery.data
  const msg = callbackQuery.message
  try {
    const chatId = msg.chat.id
    const { groups: { publicToken } } = /\/set_message_target (?<publicToken>[^$]*)/.exec(action)
    await setUserTargetPublicKey(chatId.toString(), publicToken)
    await bot.sendMessage(msg.chat.id, 'authKey Siáli̍p sêngkong.')
  } catch (error) {
    await bot.sendMessage(msg.chat.id, 'authKey Siáli̍p sitpāi.')
  }
})
