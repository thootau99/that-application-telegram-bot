import got from 'got'

/**
 *
 * @param {string} authKey
 * @param {string} publicKey
 * @param {number} applicationVersion
 * @return {Promise<import('../../structs/message/get.struct').MessageGetResponse>}
 */
async function apiGetMessage (authKey, publicKey, applicationVersion) {
  const API_HOST = process.env.API_HOST ?? 'example.com'

  return got.get(`https://${API_HOST}/message/get`, {
    headers: {
      Host: API_HOST,
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
      'user-agent': `iOS 16.2 iPhone14,4 ja-JP 4.12.6 (${applicationVersion})`,
      'accept-language': 'ja-JP;q=1.0, en-JP;q=0.9, ko-JP;q=0.8, zh-Hant-JP;q=0.7, vi-JP;q=0.6'
    },
    searchParams: {
      auth_key: authKey,
      public_key: publicKey,
      start: 0,
      version: applicationVersion
    }
  }).json()
}

export default apiGetMessage
