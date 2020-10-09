const jwt = require('jsonwebtoken')
const ACCESS_SECRET = 'Chine$eCl0ze4160'
const REFRESH_SECRET = 'Cl0zeChine$e3139'

function getUserId(context) {
  const Authorization = context.request.get('Authorization')
  if (Authorization) {
    const token = Authorization.replace('Bearer ', '')
    const { userId } = jwt.verify(token, APP_SECRET)
    return userId
  }

  throw new Error('Not authenticated')
}

module.exports = {
  ACCESS_SECRET,
  REFRESH_SECRET,
  getUserId,
}
