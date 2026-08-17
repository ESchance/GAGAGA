-- ============================================
-- 弹出公告（更新说明）数据库化管理
-- 说明：公告条（警示语）仍用 announcements 表；
-- 弹出公告（每次网站更新后的告知）用本表 site_announcements
-- 前端通过 version 判断是否需要弹出
-- 在 Supabase SQL Editor 中执行一次即可（幂等）
-- ============================================

-- 1. 建表
CREATE TABLE IF NOT EXISTS site_announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '📢 嘎宇宙公告',
  sections JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 启用 RLS
ALTER TABLE site_announcements ENABLE ROW LEVEL SECURITY;

-- 3. 所有人可读
CREATE POLICY "site_announcements readable by all"
  ON site_announcements FOR SELECT USING (true);

-- 4. 仅超级管理员（superadmin）可写
CREATE POLICY "admins can insert site_announcements"
  ON site_announcements FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "admins can update site_announcements"
  ON site_announcements FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "admins can delete site_announcements"
  ON site_announcements FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

-- 5. 初始化当前公告内容（版本 4.0，可重复执行）
-- 公告内容仅面向普通用户
INSERT INTO site_announcements (version, title, sections) VALUES
(
  '4.0',
  '📢 嘎宇宙公告',
  '[
    {"icon": "🎉", "title": "最新更新", "items": ["支持暗色/浅色模式手动切换", "新增嘎宇宙创作板块（故事、角色、设定、点子）", "新增嘎宇宙种族系统（6种种族+独特编号）", "优化移动端和PC端视觉体验", "修复点赞计数等问题"]},
    {"icon": "📖", "title": "功能说明", "items": ["注册后可选择种族，获得唯一编号（GZ-XXXX）", "首页发帖无需选择种族，所有用户可参与", "嘎宇宙创作需要选择种族才能参与", "支持暗色/浅色模式切换"]},
    {"icon": "⚠️", "title": "注意事项", "items": ["种族选择后不可更改，请慎重选择", "编号中的 4 和 44 已跳过（不吉利）", "请遵守社区规则，文明交流"]}
  ]'::jsonb
)
ON CONFLICT (version) DO NOTHING;

-- 6. 停用旧版本公告，仅保留最新（4.0）
UPDATE site_announcements
SET is_active = false
WHERE is_active = true AND version <> '4.0';
