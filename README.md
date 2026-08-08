# 多人实时在线交流论坛

一个基于 React + Supabase 的实时论坛/留言板应用。

## 功能特点

- ✅ 用户注册/登录（邮箱认证）
- ✅ 发帖和查看帖子列表
- ✅ 在帖子下发表评论
- ✅ 新帖子和评论实时自动更新
- ✅ 个人主页显示用户信息和发布的帖子
- ✅ 响应式设计，支持移动端

## 技术栈

- **前端**: React 18 + Vite + Tailwind CSS
- **后端/数据库**: Supabase（PostgreSQL + Realtime + Auth）
- **部署**: Cloudflare Pages

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，并填入你的 Supabase 配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```
VITE_SUPABASE_URL=你的Supabase项目URL
VITE_SUPABASE_ANON_KEY=你的Supabase匿名密钥
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

## 部署到 Cloudflare Pages

### 第一步：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 输入仓库名称（例如 `forum-app`）
3. 点击 "Create repository"
4. 按照页面提示，将本地代码推送到 GitHub：

```bash
cd forum-app
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/forum-app.git
git push -u origin main
```

### 第二步：在 Cloudflare Pages 部署

1. 访问 https://dash.cloudflare.com/
2. 登录你的 Cloudflare 账号
3. 点击左侧菜单 "Workers & Pages"
4. 点击 "Create application"
5. 选择 "Pages" 标签
6. 点击 "Connect to Git"
7. 选择你的 GitHub 账号
8. 选择刚才创建的 `forum-app` 仓库
9. 配置构建设置：
   - **Production branch**: `main`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
10. 点击 "Save and Deploy"
11. 等待部署完成，你会得到一个 `xxx.pages.dev` 的域名

### 第三步：配置环境变量（重要！）

1. 在 Cloudflare Pages 项目页面，点击 "Settings" 标签
2. 点击左侧 "Environment variables"
3. 点击 "Add variable"
4. 添加以下两个变量：
   - **Variable name**: `VITE_SUPABASE_URL`
   - **Value**: 你的 Supabase 项目 URL
   - 点击 "Add"
   - **Variable name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: 你的 Supabase 匿名密钥
   - 点击 "Add"
5. 点击 "Save"
6. 回到 "Deployments" 标签，点击最新部署旁的 "..." -> "Retry deployment"

## Supabase 配置指南

### 1. 创建 Supabase 项目

1. 访问 https://supabase.com/
2. 点击右上角 "Start your project"
3. 使用 GitHub 账号登录
4. 点击 "New project"
5. 填写项目名称和数据库密码
6. 选择离你最近的区域
7. 点击 "Create new project"

### 2. 获取 API 密钥

1. 在项目仪表板，点击左侧 "Settings"（齿轮图标）
2. 点击 "API"
3. 复制以下两个值：
   - **Project URL**: 类似 `https://xxxxx.supabase.co`
   - **anon public key**: 类似 `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. 创建数据库表

在 Supabase 仪表板，点击左侧 "SQL Editor"，然后执行以下 SQL：

```sql
-- 创建 profiles 表（用户资料）
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 posts 表（帖子）
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 comments 表（评论）
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- 启用 RLS（行级安全）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Profiles 策略：所有人可查看，用户只能编辑自己的
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Posts 策略：所有人可查看，登录用户可发帖，用户只能删自己的
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Logged in users can insert posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Comments 策略：所有人可查看，登录用户可评论，用户只能删自己的
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Logged in users can insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);
```

### 4. 启用邮箱认证

1. 在 Supabase 仪表板，点击左侧 "Authentication"
2. 点击 "Providers"
3. 确保 "Email" 已启用
4. （可选）如果想跳过邮箱验证，在 "Email" 设置中关闭 "Confirm email"

## 常见问题

### Q: 注册后收不到验证邮件？
A: 检查垃圾邮件文件夹。或者在 Supabase 的 Authentication -> Providers -> Email 中关闭 "Confirm email"。

### Q: 评论或帖子不显示？
A: 检查浏览器控制台（F12）是否有错误。确保 RLS 策略已正确设置。

### Q: 实时更新不工作？
A: 确保在 SQL 中执行了 `ALTER PUBLICATION supabase_realtime ADD TABLE` 语句。

## License

MIT
