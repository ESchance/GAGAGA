-- ============================================
-- 帖子 评论数 自动维护
-- 用数据库触发器替代前端手动读写计数，避免并发下计数漂移
-- 可重复执行（幂等）
-- 执行方式：在 Supabase SQL Editor 中运行本文件
-- ============================================

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
