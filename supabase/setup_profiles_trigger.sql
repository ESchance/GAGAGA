-- ============================================
-- 注册触发器：新用户注册后自动创建 profiles 记录
-- 注册代码依赖此触发器（"profile 由数据库触发器自动创建"）
-- 在 Supabase SQL Editor 中执行一次即可
-- ============================================

-- 1. 创建触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 绑定到 auth.users 表
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 说明：
-- 1. username 取自注册时传入的用户名，缺省时用邮箱兜底
-- 2. ON CONFLICT (id) DO NOTHING 防止重复注册时覆盖已有资料
-- 3. 如果 profiles 表存在 username 唯一约束，两个用户注册了相同用户名
--    会导致触发器失败，需在注册流程中先校验用户名唯一性
-- ============================================
