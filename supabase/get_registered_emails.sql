-- 创建函数获取已注册的邮箱列表
CREATE OR REPLACE FUNCTION get_registered_emails()
RETURNS TABLE(email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT au.email::TEXT
  FROM auth.users au;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授予匿名用户执行权限
GRANT EXECUTE ON FUNCTION get_registered_emails() TO anon;
