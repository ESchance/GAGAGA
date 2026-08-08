# 🚀 噶宇宙

<div align="center">

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E?style=flat&logo=supabase&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare_Pages-Deployment-F48120?style=flat&logo=cloudflare&logoColor=white)

**一个现代化的多人实时在线交流论坛**

[在线体验](https://gagaga-d99.pages.dev) · [报告问题](https://github.com/ESchance/GAGAGA/issues)

</div>

---

## ✨ 功能特点

| 功能 | 描述 |
|------|------|
| 🔐 **用户认证** | 邮箱注册/登录，安全可靠 |
| 📝 **发帖功能** | 支持发布帖子，分享你的想法 |
| 💬 **评论系统** | 在帖子下发表评论，参与讨论 |
| ⚡ **实时更新** | 新帖子和评论自动实时显示 |
| 👤 **个人主页** | 查看用户信息和发布的帖子 |
| 📱 **响应式设计** | 完美适配手机、平板和电脑 |
| 🗑️ **删除功能** | 用户可以删除自己发布的帖子 |

---

## 🛠️ 技术栈

```
前端: React 18 + Vite + Tailwind CSS
后端: Supabase (PostgreSQL + Realtime + Auth)
部署: Cloudflare Pages
```

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/ESchance/GAGAGA.git
cd GAGAGA
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env`，并填入你的 Supabase 配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
VITE_SUPABASE_URL=你的Supabase项目URL
VITE_SUPABASE_ANON_KEY=你的Supabase匿名密钥
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

---

## 📦 部署到 Cloudflare Pages

### 步骤 1: 推送代码到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/GAGAGA.git
git push -u origin main
```

### 步骤 2: 在 Cloudflare Pages 部署

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **Create application** → **Pages**
3. 点击 **Connect to Git**，选择 GitHub
4. 选择 `GAGAGA` 仓库
5. 配置构建设置：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. 点击 **Save and Deploy**

### 步骤 3: 配置环境变量

1. 在 Cloudflare Pages 项目页面，进入 **Settings** → **Environment variables**
2. 添加：
   - `VITE_SUPABASE_URL` = 你的 Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = 你的 Supabase 匿名密钥
3. 保存后重新部署

---

## 🗄️ 数据库配置

### 创建数据库表

在 Supabase 的 **SQL Editor** 中执行以下 SQL：

```sql
-- 用户资料表
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 帖子表
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 评论表
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用实时更新
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- 启用行级安全
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 安全策略
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Logged in users can insert posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Logged in users can insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);
```

### 创建邮箱白名单函数

```sql
CREATE OR REPLACE FUNCTION get_registered_emails()
RETURNS TABLE(email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT au.email::TEXT
  FROM auth.users au;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_registered_emails() TO anon;
```

---

## 📁 项目结构

```
GAGAGA/
├── public/                 # 静态资源
├── src/
│   ├── components/         # 组件
│   │   ├── AuthForm.jsx    # 登录/注册表单
│   │   ├── CommentList.jsx # 评论列表
│   │   ├── Navbar.jsx      # 导航栏
│   │   └── PostCard.jsx    # 帖子卡片
│   ├── pages/              # 页面
│   │   ├── Home.jsx        # 首页
│   │   ├── Login.jsx       # 登录页
│   │   ├── Register.jsx    # 注册页
│   │   ├── CreatePost.jsx  # 发帖页
│   │   ├── PostDetail.jsx  # 帖子详情
│   │   └── Profile.jsx     # 个人主页
│   ├── lib/
│   │   ├── supabase.js     # Supabase 配置
│   │   └── allowedEmails.js # 邮箱白名单
│   ├── App.jsx             # 路由配置
│   ├── main.jsx            # 入口文件
│   └── index.css           # 全局样式
├── .env.example            # 环境变量模板
└── package.json
```

---

## ❓ 常见问题

<details>
<summary><b>Q: 注册时提示 "email rate limit exceeded"？</b></summary>

这是因为尝试注册次数过多。解决方法：
1. 在 Supabase → Authentication → Emails 中关闭 "Confirm email"
2. 等待几分钟后重试
</details>

<details>
<summary><b>Q: 评论或帖子不显示？</b></summary>

检查以下几点：
1. 浏览器控制台（F12）是否有错误
2. RLS 策略是否正确设置
3. 数据库表是否创建成功
</details>

<details>
<summary><b>Q: 实时更新不工作？</b></summary>

确保执行了以下 SQL：
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
```
</details>

---

## 📄 License

[MIT](LICENSE)

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！**

Made with ❤️ by [ESchance](https://github.com/ESchance)

</div>
