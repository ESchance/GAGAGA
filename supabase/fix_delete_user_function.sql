-- 修复删除用户函数，按正确顺序删除外键关联数据
DROP FUNCTION IF EXISTS delete_user(UUID);

CREATE OR REPLACE FUNCTION delete_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
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
