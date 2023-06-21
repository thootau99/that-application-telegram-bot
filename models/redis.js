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
