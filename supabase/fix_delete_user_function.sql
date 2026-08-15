-- 修复删除用户函数，按正确顺序删除外键关联数据
-- v2: 增加超级管理员权限校验，防止普通用户越权删除
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
