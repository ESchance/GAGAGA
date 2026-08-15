import { describe, it, expect } from 'vitest'
import {
  isDangerous,
  sanitize,
  validateEmail,
  validateUsername,
  validatePassword,
  validateTitle,
  validateContent,
  validateComment,
  MAX_LENGTHS
} from './validation'

describe('密码校验', () => {
  it('长度不足6位不通过', () => {
    expect(validatePassword('Abc1').valid).toBe(false)
    expect(validatePassword('Abc12').valid).toBe(false)
  })

  it('缺少大写字母不通过', () => {
    expect(validatePassword('abc123').valid).toBe(false)
  })

  it('缺少小写字母不通过', () => {
    expect(validatePassword('ABC123').valid).toBe(false)
  })

  it('缺少数字不通过', () => {
    expect(validatePassword('Abcdef').valid).toBe(false)
  })

  it('超过128位不通过', () => {
    expect(validatePassword('Abc123' + 'a'.repeat(130)).valid).toBe(false)
  })

  it('满足大小写+数字且>=6位通过', () => {
    expect(validatePassword('Abc123').valid).toBe(true)
  })
})

describe('用户名校验', () => {
  it('少于2个字符不通过', () => {
    expect(validateUsername('a').valid).toBe(false)
    expect(validateUsername('').valid).toBe(false)
  })

  it('超过20个字符不通过', () => {
    expect(validateUsername('a'.repeat(21)).valid).toBe(false)
  })

  it('含非法字符不通过', () => {
    expect(validateUsername('user name').valid).toBe(false)
    expect(validateUsername('user!@#').valid).toBe(false)
  })

  it('字母、数字、下划线、中文通过', () => {
    expect(validateUsername('user_01').valid).toBe(true)
    expect(validateUsername('用户001').valid).toBe(true)
  })
})

describe('标题校验', () => {
  it('空标题不通过', () => {
    expect(validateTitle('').valid).toBe(false)
    expect(validateTitle('   ').valid).toBe(false)
  })

  it('超过100字符不通过', () => {
    expect(validateTitle('x'.repeat(101)).valid).toBe(false)
  })

  it('包含脚本标记不通过', () => {
    expect(validateTitle('<script>alert(1)</script>').valid).toBe(false)
    expect(validateTitle('onclick="x"').valid).toBe(false)
  })

  it('正常标题通过', () => {
    expect(validateTitle('今天天气不错').valid).toBe(true)
  })
})

describe('内容校验', () => {
  it('空内容不通过', () => {
    expect(validateContent('').valid).toBe(false)
  })

  it(`超过${MAX_LENGTHS.content}字符不通过`, () => {
    expect(validateContent('x'.repeat(MAX_LENGTHS.content + 1)).valid).toBe(false)
  })

  it('包含 javascript: 协议不通过', () => {
    expect(validateContent('javascript:alert(1)').valid).toBe(false)
  })

  it('正常内容通过', () => {
    expect(validateContent('这是一段正常的内容。').valid).toBe(true)
  })
})

describe('评论校验', () => {
  it('空评论不通过', () => {
    expect(validateComment('').valid).toBe(false)
  })

  it(`超过${MAX_LENGTHS.comment}字符不通过`, () => {
    expect(validateComment('x'.repeat(MAX_LENGTHS.comment + 1)).valid).toBe(false)
  })

  it('包含 data: 不通过', () => {
    expect(validateComment('data:text/html;base64,xxx').valid).toBe(false)
  })

  it('正常评论通过', () => {
    expect(validateComment('写得真好！').valid).toBe(true)
  })
})

describe('邮箱格式校验', () => {
  it('格式不正确不通过', () => {
    expect(validateEmail('not-an-email').valid).toBe(false)
    expect(validateEmail('a@b').valid).toBe(false)
  })

  it('正常邮箱通过', () => {
    expect(validateEmail('user01@forum.com').valid).toBe(true)
  })
})

describe('危险内容检测', () => {
  it('检测到 script 标签', () => {
    expect(isDangerous('<script>alert(1)</script>')).toBe(true)
  })

  it('检测到 javascript: 协议', () => {
    expect(isDangerous('javascript:void(0)')).toBe(true)
  })

  it('检测到事件属性', () => {
    expect(isDangerous('onclick="evil()"')).toBe(true)
  })

  it('检测到 data: 协议', () => {
    expect(isDangerous('data:text/html')).toBe(true)
  })

  it('正常文本不误报', () => {
    expect(isDangerous('这是一段正常的内容')).toBe(false)
  })
})

describe('HTML 转义', () => {
  it('转义尖括号', () => {
    expect(sanitize('<b>hi</b>')).toBe('&lt;b&gt;hi&lt;/b&gt;')
  })

  it('转义引号', () => {
    expect(sanitize('"quoted"')).toBe('&quot;quoted&quot;')
    expect(sanitize("'single'")).toBe('&#x27;single&#x27;')
  })
})
