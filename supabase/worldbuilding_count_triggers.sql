-- ============================================
-- 噶宇宙创作 点赞数 / 评论数 自动维护
-- 用数据库触发器替代前端手动读写计数，避免并发下计数漂移
-- 可重复执行（幂等）
-- ============================================

-- 1. 按现有数据校准一次计数
UPDATE worldbuilding w
SET
  likes_count = (SELECT COUNT(*) FROM worldbuilding_likes l WHERE l.worldbuilding_id = w.id),
  comments_count = (SELECT COUNT(*) FROM worldbuilding_comments c WHERE c.worldbuilding_id = w.id);

-- 2. 点赞计数触发器函数
CREATE OR REPLACE FUNCTION public.sync_worldbuilding_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE worldbuilding
       SET likes_count = (SELECT COUNT(*) FROM worldbuilding_likes WHERE worldbuilding_id = NEW.worldbuilding_id)
     WHERE id = NEW.worldbuilding_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE worldbuilding
       SET likes_count = (SELECT COUNT(*) FROM worldbuilding_likes WHERE worldbuilding_id = OLD.worldbuilding_id)
     WHERE id = OLD.worldbuilding_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_worldbuilding_like_count ON worldbuilding_likes;
CREATE TRIGGER trg_sync_worldbuilding_like_count
AFTER INSERT OR DELETE ON worldbuilding_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_worldbuilding_like_count();

-- 3. 评论计数触发器函数
CREATE OR REPLACE FUNCTION public.sync_worldbuilding_comment_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE worldbuilding
       SET comments_count = (SELECT COUNT(*) FROM worldbuilding_comments WHERE worldbuilding_id = NEW.worldbuilding_id)
     WHERE id = NEW.worldbuilding_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE worldbuilding
       SET comments_count = (SELECT COUNT(*) FROM worldbuilding_comments WHERE worldbuilding_id = OLD.worldbuilding_id)
     WHERE id = OLD.worldbuilding_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_worldbuilding_comment_count ON worldbuilding_comments;
CREATE TRIGGER trg_sync_worldbuilding_comment_count
AFTER INSERT OR DELETE ON worldbuilding_comments
FOR EACH ROW EXECUTE FUNCTION public.sync_worldbuilding_comment_count();
