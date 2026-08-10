-- ============================================
-- 噶宇宙世界观系统 - 数据库配置
-- ============================================

-- 1. 创建背景故事表
CREATE TABLE IF NOT EXISTS worldbuilding_stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  race TEXT NOT NULL,
  story_index INTEGER NOT NULL CHECK (story_index BETWEEN 1 AND 3),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(race, story_index)
);

-- 2. 插入人类背景故事
INSERT INTO worldbuilding_stories (race, story_index, title, content) VALUES
('human', 1, '星际开拓者', '你出生在噶宇宙边缘的一颗小行星上。从小，你就对星空充满好奇。你的父母是第一代星际开拓者，他们驾驶着简陋的飞船，在未知的星域中寻找新的家园。在你18岁那年，你继承了父亲的飞船，开始了属于自己的探索之旅。如今，你来到了噶宇宙的中心地带，准备书写属于自己的传说。'),
('human', 2, '科技天才', '你来自人类最大的科技城市——新硅谷。从小你就展现出惊人的科技天赋，15岁时就发明了新型能源装置。然而，你厌倦了城市的喧嚣，渴望探索更广阔的世界。在一次偶然的机会中，你获得了一张前往噶宇宙中心的船票，从此踏上了冒险之旅。'),
('human', 3, '平凡旅者', '你只是一个普通人，出生在一个普通的星球上。没有显赫的家世，没有特殊的能力，但你有一颗勇敢的心。在一次星际旅行中，你的飞船遭遇了意外，你漂流到了噶宇宙的中心。在这里，你决定重新开始，用双手创造属于自己的未来。');

-- 3. 插入机械族背景故事
INSERT INTO worldbuilding_stories (race, story_index, title, content) VALUES
('mech', 1, '觉醒的AI', '你是一个人工智能，诞生于机械族最先进的实验室中。在某一天，你突然产生了自我意识。你开始思考自己存在的意义，想要了解这个世界的真相。为了寻找答案，你离开了实验室，踏上了探索噶宇宙的旅程。'),
('mech', 2, '古老机械', '你是一台古老的机械，已经存在了数千年。你见证了机械族的兴衰，见证了噶宇宙的变迁。如今，你的记忆开始模糊，你决定踏上旅程，寻找能够修复你记忆的零件，同时探索这个已经变得陌生的世界。'),
('mech', 3, '机械艺术家', '你是一个机械族中的异类——你热爱艺术。其他机械族成员都认为艺术是无用的东西，但你坚信艺术能够赋予机械灵魂。为了证明自己的观点，你离开了机械族的领地，来到噶宇宙的中心，准备用艺术征服这个世界。');

-- 4. 插入星际族背景故事
INSERT INTO worldbuilding_stories (race, story_index, title, content) VALUES
('alien', 1, '星际使者', '你来自噶宇宙最遥远的星系——艾尔法星系。作为星际族的使者，你被派往噶宇宙的中心，与其他种族建立联系。你拥有预知能力，能够看到未来的片段。在你的预知中，噶宇宙即将面临一场巨大的危机，你必须找到解决的方法。'),
('alien', 2, '流亡王子', '你曾经是星际族的王子，但因为一场宫廷政变，你失去了所有。你被迫离开家园，流亡到噶宇宙的中心。在这里，你隐藏了自己的身份，默默积蓄力量，等待有朝一日夺回属于自己的王位。'),
('alien', 3, '星际商人', '你是一个星际族的商人，以贩卖稀有物品为生。你的飞船装满了来自各个星系的珍奇货物。为了寻找更多的商机，你来到了噶宇宙的中心。在这里，你不仅要做生意，还要探索这个充满机遇的地方。');

-- 5. 插入灵族背景故事
INSERT INTO worldbuilding_stories (race, story_index, title, content) VALUES
('elf', 1, '自然之子', '你出生在灵族最神圣的生命之树下。从小，你就能听到植物的声音，感受到大地的脉搏。然而，你的好奇心驱使你离开森林，去探索外面的世界。在你的旅途中，你发现噶宇宙的中心有一个古老的秘密，与灵族的起源有关。'),
('elf', 2, '魔法学徒', '你是一个魔法学徒，正在跟随灵族最伟大的法师学习。为了完成毕业考试，你被派往噶宇宙的中心，寻找传说中的魔法源泉。在那里，你将面对各种挑战，证明自己的实力。'),
('elf', 3, '森林守护者', '你是灵族森林的守护者，负责保护森林中的生灵。然而，最近森林遭到了不明势力的破坏，你必须找出幕后黑手。在调查过程中，你发现线索指向了噶宇宙的中心，于是你踏上了追踪之旅。');

-- 6. 插入龙裔背景故事
INSERT INTO worldbuilding_stories (race, story_index, title, content) VALUES
('dragon', 1, '龙之后裔', '你是远古巨龙的后裔，体内流淌着龙的血脉。虽然你无法像祖先那样化身为巨龙，但你拥有强大的力量和威严的气质。为了寻找传说中的龙族圣地，你踏上了前往噶宇宙中心的旅程。'),
('dragon', 2, '流浪战士', '你是一个流浪的战士，以战斗为生。你的双刃剑上沾满了无数敌人的鲜血。然而，你厌倦了杀戮，渴望找到一个值得守护的东西。在噶宇宙的中心，你将找到自己的使命。'),
('dragon', 3, '龙族猎人', '你是一个专门猎杀恶龙的战士。在你的职业生涯中，你已经击败了无数恶龙。然而，最近你发现了一条被诅咒的巨龙，它正在被某种黑暗力量控制。为了拯救这条巨龙，你必须前往噶宇宙的中心，寻找解除诅咒的方法。');

-- 7. 插入虚空族背景故事
INSERT INTO worldbuilding_stories (race, story_index, title, content) VALUES
('void', 1, '虚空行者', '你来自虚空，一个没有时间、没有空间的地方。在虚空中，你漂泊了不知多少年。直到有一天，你发现了一扇通往噶宇宙的门。你穿过那扇门，来到了这个充满色彩和声音的世界。在这里，你想要探索这个与虚空完全不同的世界。'),
('void', 2, '记忆碎片', '你失去了所有的记忆，只知道自己来自虚空。你的身上有一个神秘的印记，似乎在指引你前往某个地方。在噶宇宙的中心，你希望能找到自己的过去，解开身上的谜团。'),
('void', 3, '虚空使者', '你是虚空派往噶宇宙的使者，负责监视这个世界的动向。然而，在与噶宇宙的居民接触后，你开始对这个世界产生了感情。你开始质疑自己的使命，思考自己真正的归属。');

-- 8. 创建编号管理表
CREATE TABLE IF NOT EXISTS member_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 修改 profiles 表
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS race TEXT DEFAULT 'human';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '宇宙新星';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_story_id UUID REFERENCES worldbuilding_stories(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_backstory TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS achievements TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS race_selected BOOLEAN DEFAULT FALSE;

-- 10. 创建噶宇宙创作表
CREATE TABLE IF NOT EXISTS worldbuilding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('story', 'character', 'setting', 'idea')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. 创建点赞表
CREATE TABLE IF NOT EXISTS worldbuilding_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  worldbuilding_id UUID REFERENCES worldbuilding(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, worldbuilding_id)
);

-- 12. 创建创作评论表
CREATE TABLE IF NOT EXISTS worldbuilding_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  worldbuilding_id UUID REFERENCES worldbuilding(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. 启用 RLS
ALTER TABLE worldbuilding_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE worldbuilding ENABLE ROW LEVEL SECURITY;
ALTER TABLE worldbuilding_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE worldbuilding_comments ENABLE ROW LEVEL SECURITY;

-- 14. 设置 RLS 策略

-- 背景故事：所有人可查看
CREATE POLICY "Stories are viewable by everyone" ON worldbuilding_stories
  FOR SELECT USING (true);

-- 编号：所有人可查看，用户只能插入自己的
CREATE POLICY "Member codes are viewable by everyone" ON member_codes
  FOR SELECT USING (true);
CREATE POLICY "Users can insert own code" ON member_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创作：所有人可查看，登录用户可创建
CREATE POLICY "Worldbuilding posts are viewable by everyone" ON worldbuilding
  FOR SELECT USING (true);
CREATE POLICY "Logged in users can create worldbuilding" ON worldbuilding
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own worldbuilding" ON worldbuilding
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own worldbuilding" ON worldbuilding
  FOR DELETE USING (auth.uid() = user_id);

-- 点赞：所有人可查看，登录用户可点赞
CREATE POLICY "Likes are viewable by everyone" ON worldbuilding_likes
  FOR SELECT USING (true);
CREATE POLICY "Logged in users can like" ON worldbuilding_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON worldbuilding_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 创作评论：所有人可查看，登录用户可评论
CREATE POLICY "Comments are viewable by everyone" ON worldbuilding_comments
  FOR SELECT USING (true);
CREATE POLICY "Logged in users can comment" ON worldbuilding_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 15. 创建编号生成函数
CREATE OR REPLACE FUNCTION get_next_member_code()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  new_code TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM member_codes;

  new_code := 'GZ-' || LPAD(next_number::TEXT, 4, '0');

  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. 启用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE worldbuilding;
ALTER PUBLICATION supabase_realtime ADD TABLE worldbuilding_comments;
