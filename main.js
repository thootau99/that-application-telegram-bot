import TelegramBot from 'node-telegram-bot-api'
import getUser from './handlers/message/getUser.js'
import { getUserData, setUserAuthKey, setUserTargetPublicKey } from './models/redis.js'
import apiGetMessage from './handlers/message/get.js'
import apiSendMessage from './handlers/message/send.js'

const token = process.env.TELEGRAM_BOT_KEY ?? ''
const bot = new TelegramBot(token, { polling: true })

bot.request('setMyCommands', {
  commands: [
    {
      command: 'setAuthKey'
    }, {
      command: 'getAuthKey'
    }, {
      command: 'listMessageTarget'
    }, {
      command: 'getMessage'
    }, {
      command: 'sendMessage'
    }
  ],
  scope: { type: 'all_private_chats' },
  language_code: 'en'
}).then(r => console.log(r))

bot.onText(/^\/setAuthKey/, async (msg) => {
  try {
    const chatId = msg.chat.id
    const { groups: { authToken } } = /\/setAuthKey (?<authToken>[^ $]*)/.exec(msg.text)
    await setUserAuthKey(chatId.toString(), authToken)
    await bot.sendMessage(msg.chat.id, 'authKey Siáli̍p sêngkong.')
  } catch (error) {
    await bot.sendMessage(msg.chat.id, 'authKey Siáli̍p sitpāi.')
  }
})

bot.onText(/^\/getAuthKey/, async (msg) => {
  try {
    const chatId = msg.chat.id
    const key = await getUserData(chatId.toString())
    await bot.sendMessage(msg.chat.id, key.authKey)
  } catch (error) {
    console.log(error)
    await bot.sendMessage(msg.chat.id, 'Che súiōngchiá iábô chuliāu.')
  }
})

bot.onText(/^\/listMessageTarget$/, async (msg) => {
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
  /** @type {MessageGetUserResponse} */
  const userTalkedRecently = await getUser(userData.authKey, 491)

  if (userTalkedRecently.result === 12) {
    await bot.sendMessage(chatId, 'authKey bô ha̍phoat')
    return
  }

  const opts = {
    reply_to_message_id: msg.message_id,
    reply_markup: {
      resize_keyboard: true,
      one_time_keyboard: true,
      inline_keyboard: userTalkedRecently.data.map((user) => [{ text: user.name, callback_data: `/setMessageTarget ${user.public_key}` }])
    }
  }

  await bot.sendMessage(msg.chat.id, 'Chhiáⁿ soánte̍k beh khaikáng ê súiōngchiá ', opts)
})

bot.onText(/^\/getMessage$/, async (msg) => {
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
  /** @type {MessageGetResponse} */
  const messageWithTarget = await apiGetMessage(userData.authKey, userData.targetPublicKey, 491)

  if (messageWithTarget.result === 12) {
    await bot.sendMessage(chatId, 'authKey bô ha̍phoat')
    return
  }

  await bot.sendMessage(msg.chat.id, messageWithTarget.data.map((message) => `${message.public_key}: ${message.message}`).join('\n'))
})

bot.onText(/^\/sendMessage/, async (msg) => {
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
    const { groups: { messageContent } } = /\/sendMessage (?<messageContent>[^ $]*)/.exec(msg.text)

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
    await bot.sendMessage(msg.chat.id, 'error.')
  }
})

bot.on('callback_query', async (callbackQuery) => {
  const action = callbackQuery.data
  const msg = callbackQuery.message
  try {
    const chatId = msg.chat.id
    const { groups: { publicToken } } = /\/setMessageTarget (?<publicToken>[^ $]*)/.exec(action)
    await setUserTargetPublicKey(chatId.toString(), publicToken)
    await bot.sendMessage(msg.chat.id, 'authKey Siáli̍p sêngkong.')
  } catch (error) {
    await bot.sendMessage(msg.chat.id, 'authKey Siáli̍p sitpāi.')
  }
})
