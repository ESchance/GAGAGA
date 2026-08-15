import { defineConfig } from 'vitest/config'

// 单元测试配置（测试纯逻辑模块，node 环境即可，无需浏览器）
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js']
  }
})
