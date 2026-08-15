/**
 * 输入验证工具
 * 防止 XSS 和其他输入漏洞
 */

// 最大长度限制
export const MAX_LENGTHS = {
  username: 20,
  email: 254,
  title: 100,
  content: 5000,
  comment: 1000,
  password: 128
}

// 危险字符检测
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:/gi,
  /vbscript:/gi
]

/**
 * 检查输入是否包含危险内容
 */
export const isDangerous = (input) => {
  if (!input || typeof input !== 'string') return false
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(input))
}

/**
 * 清理输入内容
 */
export const sanitize = (input) => {
  if (!input || typeof input !== 'string') return ''
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * 验证输入长度
 */
export const validateLength = (input, maxLength) => {
  if (!input) return { valid: true }
  if (input.length > maxLength) {
    return {
      valid: false,
      message: `内容不能超过 ${maxLength} 个字符`
    }
  }
  return { valid: true }
}

/**
 * 验证邮箱格式
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, message: '邮箱格式不正确' }
  }
  if (email.length > MAX_LENGTHS.email) {
    return { valid: false, message: '邮箱过长' }
  }
  return { valid: true }
}

/**
 * 验证用户名
 */
export const validateUsername = (username) => {
  if (!username || username.length < 2) {
    return { valid: false, message: '用户名至少需要2个字符' }
  }
  if (username.length > MAX_LENGTHS.username) {
    return { valid: false, message: `用户名不能超过${MAX_LENGTHS.username}个字符` }
  }
  if (!/^[a-zA-Z0-9一-龥_]+$/.test(username)) {
    return { valid: false, message: '用户名只能包含字母、数字、下划线或中文' }
  }
  return { valid: true }
}

/**
 * 验证密码强度
 * 规则与注册页展示的提示保持一致：至少6位，且包含大写字母、小写字母和数字
 */
export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return { valid: false, message: '密码至少需要6个字符' }
  }
  if (password.length > MAX_LENGTHS.password) {
    return { valid: false, message: '密码过长' }
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, message: '密码需包含大写字母、小写字母和数字' }
  }
  return { valid: true }
}

/**
 * 验证帖子标题
 */
export const validateTitle = (title) => {
  if (!title || title.trim().length === 0) {
    return { valid: false, message: '标题不能为空' }
  }
  if (title.length > MAX_LENGTHS.title) {
    return { valid: false, message: `标题不能超过${MAX_LENGTHS.title}个字符` }
  }
  if (isDangerous(title)) {
    return { valid: false, message: '标题包含非法内容' }
  }
  return { valid: true }
}

/**
 * 验证帖子内容
 */
export const validateContent = (content) => {
  if (!content || content.trim().length === 0) {
    return { valid: false, message: '内容不能为空' }
  }
  if (content.length > MAX_LENGTHS.content) {
    return { valid: false, message: `内容不能超过${MAX_LENGTHS.content}个字符` }
  }
  if (isDangerous(content)) {
    return { valid: false, message: '内容包含非法内容' }
  }
  return { valid: true }
}

/**
 * 验证评论内容
 */
export const validateComment = (comment) => {
  if (!comment || comment.trim().length === 0) {
    return { valid: false, message: '评论不能为空' }
  }
  if (comment.length > MAX_LENGTHS.comment) {
    return { valid: false, message: `评论不能超过${MAX_LENGTHS.comment}个字符` }
  }
  if (isDangerous(comment)) {
    return { valid: false, message: '评论包含非法内容' }
  }
  return { valid: true }
}

export default {
  MAX_LENGTHS,
  isDangerous,
  sanitize,
  validateLength,
  validateEmail,
  validateUsername,
  validatePassword,
  validateTitle,
  validateContent,
  validateComment
}
