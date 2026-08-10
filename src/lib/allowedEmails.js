// 预定义的48个邮箱地址（白名单）
// 只有这些邮箱才能注册
// 已移除不吉利的邮箱：user04@forum.com、user44@forum.com
export const allowedEmails = [
  'user01@forum.com',
  'user02@forum.com',
  'user03@forum.com',
  'user05@forum.com',
  'user06@forum.com',
  'user07@forum.com',
  'user08@forum.com',
  'user09@forum.com',
  'user10@forum.com',
  'user11@forum.com',
  'user12@forum.com',
  'user13@forum.com',
  'user14@forum.com',
  'user15@forum.com',
  'user16@forum.com',
  'user17@forum.com',
  'user18@forum.com',
  'user19@forum.com',
  'user20@forum.com',
  'user21@forum.com',
  'user22@forum.com',
  'user23@forum.com',
  'user24@forum.com',
  'user25@forum.com',
  'user26@forum.com',
  'user27@forum.com',
  'user28@forum.com',
  'user29@forum.com',
  'user30@forum.com',
  'user31@forum.com',
  'user32@forum.com',
  'user33@forum.com',
  'user34@forum.com',
  'user35@forum.com',
  'user36@forum.com',
  'user37@forum.com',
  'user38@forum.com',
  'user39@forum.com',
  'user40@forum.com',
  'user41@forum.com',
  'user42@forum.com',
  'user43@forum.com',
  'user45@forum.com',
  'user46@forum.com',
  'user47@forum.com',
  'user48@forum.com',
  'user49@forum.com',
  'user50@forum.com'
]

// 检查邮箱是否在白名单中
export const isEmailAllowed = (email) => {
  return allowedEmails.includes(email.toLowerCase())
}
