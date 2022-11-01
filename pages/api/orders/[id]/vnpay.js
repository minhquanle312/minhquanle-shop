import { getSession } from 'next-auth/react'
import dateFormat from 'dateformat'

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return
  }
  const session = await getSession({ req })
  if (!session) {
    return res.status(401).send('signin required')
  }
  // console.log('req', req)
  // res.send(process.env.PAYPAL_CLIENT_ID || 'sb')
  let ipAddr =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress

  let config = require('config')
  // let dateFormat = require('dateformat')

  let tmnCode = config.get(process.env.VNP_TMN_CODE)
  let secretKey = config.get(process.env.VNP_HASH_SECRET)
  let vnpUrl = config.get(process.env.VPN_URL)
  let returnUrl = config.get(process.env.VPN_RETURN_URL)
  // let tmnCode = config.get('vnp_TmnCode');
  // let secretKey = config.get('vnp_HashSecret');
  // let vnpUrl = config.get('vnp_Url');
  // let returnUrl = config.get('vnp_ReturnUrl');

  let date = new Date()

  let createDate = dateFormat(date, 'yyyymmddHHmmss')
  let orderId = dateFormat(date, 'HHmmss')
  let amount = req.body.amount
  let bankCode = req.body.bankCode

  let orderInfo = req.body.orderDescription
  let orderType = req.body.orderType
  let locale = req.body.language
  if (locale === null || locale === '') {
    locale = 'vn'
  }
  let currCode = 'VND'
  let vnp_Params = {}
  vnp_Params['vnp_Version'] = '2.1.0'
  vnp_Params['vnp_Command'] = 'pay'
  vnp_Params['vnp_TmnCode'] = tmnCode
  // vnp_Params['vnp_Merchant'] = ''
  vnp_Params['vnp_Locale'] = locale
  vnp_Params['vnp_CurrCode'] = currCode
  vnp_Params['vnp_TxnRef'] = orderId
  vnp_Params['vnp_OrderInfo'] = orderInfo
  vnp_Params['vnp_OrderType'] = orderType
  vnp_Params['vnp_Amount'] = amount * 100
  vnp_Params['vnp_ReturnUrl'] = returnUrl
  vnp_Params['vnp_IpAddr'] = ipAddr
  vnp_Params['vnp_CreateDate'] = createDate
  if (bankCode !== null && bankCode !== '') {
    vnp_Params['vnp_BankCode'] = bankCode
  }

  vnp_Params = sortObject(vnp_Params)

  let querystring = require('qs')
  let signData = querystring.stringify(vnp_Params, { encode: false })
  let crypto = require('crypto')
  let hmac = crypto.createHmac('sha512', secretKey)
  let signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex')
  vnp_Params['vnp_SecureHash'] = signed
  vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false })

  res.redirect(vnpUrl)
}
export default handler

function sortObject(obj) {
  var sorted = {}
  var str = []
  var key
  for (key in obj) {
    // eslint-disable-next-line no-prototype-builtins
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key))
    }
  }
  str.sort()
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+')
  }
  return sorted
}
