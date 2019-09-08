// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}

const db = cloud.database()
const _ = db.command
exports.main = async (event, context) => {
  try {
    return await db.collection('student_location').where({
      openid: event._openid,
      time: _.gte(event.start_time).lte(event.stop_time)
    }).remove()
  } catch (e) {
    console.error(e)
  }
}
