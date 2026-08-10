import { createClient } from '@supabase/supabase-js'

// 从环境变量读取 Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 验证环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 缺少 Supabase 环境变量，请检查 .env 文件')
  console.error('需要 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY')
}

// 创建 Supabase 客户端
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)
