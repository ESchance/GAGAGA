import { describe, it, expect } from 'vitest'
import { allowedEmails, isEmailAllowed } from './allowedEmails'

describe('邮箱白名单', () => {
  it('白名单共 48 个邮箱', () => {
    expect(allowedEmails).toHaveLength(48)
  })

  it('不包含不吉利的 user04 和 user44', () => {
    expect(allowedEmails).not.toContain('user04@forum.com')
    expect(allowedEmails).not.toContain('user44@forum.com')
  })

  it('包含正常的邮箱', () => {
    expect(allowedEmails).toContain('user01@forum.com')
    expect(allowedEmails).toContain('user50@forum.com')
  })

  it('白名单内邮箱允许注册（不区分大小写）', () => {
    expect(isEmailAllowed('user01@forum.com')).toBe(true)
    expect(isEmailAllowed('USER01@forum.com')).toBe(true)
  })

  it('白名单外邮箱不允许注册', () => {
    expect(isEmailAllowed('guest@example.com')).toBe(false)
    expect(isEmailAllowed('hacker@gmail.com')).toBe(false)
  })

  it('不吉利的邮箱不允许注册', () => {
    expect(isEmailAllowed('user04@forum.com')).toBe(false)
    expect(isEmailAllowed('user44@forum.com')).toBe(false)
  })
})
