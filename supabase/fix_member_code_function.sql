-- 修改编号生成函数，避开不吉利数字 4 和 44
CREATE OR REPLACE FUNCTION get_next_member_code()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  new_code TEXT;
BEGIN
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
