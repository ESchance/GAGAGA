-- ============================================
-- P0 修复一键执行脚本
-- 在 Supabase SQL Editor 中粘贴整个文件内容并运行即可
-- 本脚本可重复执行（幂等）
-- ============================================

-- --------------------------------------------------
-- 1. 删除用户函数：增加超级管理员权限校验
--    （防止普通用户越权删除任意账号）
-- --------------------------------------------------
DROP FUNCTION IF EXISTS delete_user(UUID);

CREATE OR REPLACE FUNCTION delete_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- 权限校验：只有超级管理员可以调用本函数
  -- auth.uid() 取自调用者的登录令牌，SECURITY DEFINER 下依然有效
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION '无权限：只有超级管理员可以删除用户';
  END IF;

  -- 按正确顺序删除关联数据（从最外层到最内层）
  DELETE FROM worldbuilding_comments WHERE user_id = target_user_id;
  DELETE FROM worldbuilding_likes WHERE user_id = target_user_id;
  DELETE FROM worldbuilding WHERE user_id = target_user_id;
  DELETE FROM member_codes WHERE user_id = target_user_id;
  DELETE FROM comments WHERE user_id = target_user_id;
  DELETE FROM posts WHERE user_id = target_user_id;
  DELETE FROM profiles WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN true;
EXCEPTION
  WHEN foreign_key_violation THEN
    RAISE NOTICE '外键约束错误: %', SQLERRM;
    RETURN false;
  WHEN OTHERS THEN
    RAISE NOTICE '其他错误: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授权给登录用户调用（真正的越权防护在函数内部的权限校验中）
GRANT EXECUTE ON FUNCTION delete_user(UUID) TO authenticated;

-- --------------------------------------------------
-- 2. 编号生成函数：补充授权，让"选择种族"功能可用
-- --------------------------------------------------
CREATE OR REPLACE FUNCTION get_next_member_code()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  new_code TEXT;
BEGIN
  -- 咨询锁：保证同一时刻只有一个请求在计算编号（事务结束自动释放）
  PERFORM pg_advisory_xact_lock(hashtext('member_code_generation'));

  -- 获取当前最大编号
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM member_codes;

  -- 跳过不吉利数字 4 和 44
  IF next_number = 4 THEN
    next_number := 5;
  ELSIF next_number = 44 THEN
    next_number := 45;
  END IF;

  -- 格式化为 GZ-XXXX
  new_code := 'GZ-' || LPAD(next_number::TEXT, 4, '0');

  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_next_member_code() TO authenticated;

-- --------------------------------------------------
-- 3. 注册触发器：新用户注册后自动创建 profiles 记录
--    （注册流程依赖此触发器，没有它新用户资料会是空的）
-- --------------------------------------------------
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 执行完成后，可自行验证：
-- 1. 删除用户：用超级管理员登录后操作用户管理页，应能正常删除
-- 2. 普通用户若在浏览器控制台调用 delete_user，应收到"无权限"错误
-- 3. 新注册一个邮箱（白名单内）后，登录应能看到自己的个人资料
-- 4. 新用户选择种族时，应能正常生成 GZ-XXXX 编号
-- ============================================

-- --------------------------------------------------
-- 10. 帖子评论数自动维护（posts.comments_count 触发器）
-- --------------------------------------------------
-- 0. 给 posts 表补充 comments_count 字段
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS comments_count INTEGER NOT NULL DEFAULT 0;

-- 1. 按现有数据校准一次计数
UPDATE posts p
SET
  comments_count = (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id);

-- 2. 评论计数触发器函数
CREATE OR REPLACE FUNCTION public.sync_post_comment_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
       SET comments_count = (SELECT COUNT(*) FROM comments WHERE post_id = NEW.post_id)
     WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
       SET comments_count = (SELECT COUNT(*) FROM comments WHERE post_id = OLD.post_id)
     WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_post_comment_count ON comments;
CREATE TRIGGER trg_sync_post_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION public.sync_post_comment_count();
