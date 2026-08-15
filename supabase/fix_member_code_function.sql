-- 修改编号生成函数，避开不吉利数字 4 和 44
-- v2: 增加咨询锁，防止并发下两人同时选种族拿到相同编号
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

-- 授权给登录用户调用（选择种族时生成编号需要）
GRANT EXECUTE ON FUNCTION get_next_member_code() TO authenticated;
