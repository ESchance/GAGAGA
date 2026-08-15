# 🚀 噶宇宙

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)
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
前端: React 19 + Vite 8 + React Router 7 + Tailwind CSS 4
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

> 所有数据库脚本统一存放在 `supabase/` 目录，在 Supabase **SQL Editor** 中执行。

### 数据表一览

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| profiles | 用户资料 | id, username, avatar_url, role, race, member_code, title, race_selected, default_story_id, custom_backstory, achievements |
| posts | 帖子 | id, title, content, user_id, is_pinned |
| comments | 评论 | id, content, post_id, user_id |
| worldbuilding | 嘎宇宙创作 | id, type, title, content, user_id, likes_count, comments_count, is_published |
| worldbuilding_likes | 创作点赞 | id, user_id, worldbuilding_id |
| worldbuilding_comments | 创作评论 | id, content, worldbuilding_id, user_id |
| worldbuilding_stories | 种族背景故事 | id, race, story_index, title, content |
| member_codes | 编号记录 | id, user_id, code |
| announcements | 公告条（警示语） | id, content, is_active |
| site_announcements | 弹出公告（更新说明） | id, version, title, sections(JSONB), is_active |

### 数据库函数与触发器

| 名称 | 用途 | 脚本位置 |
|------|------|----------|
| get_registered_emails() | 获取已注册邮箱列表 | `supabase/get_registered_emails.sql` |
| get_next_member_code() | 生成用户编号 GZ-XXXX（避开 4、44） | `supabase/fix_member_code_function.sql` |
| delete_user(UUID) | 删除用户（含超级管理员权限校验） | `supabase/fix_delete_user_function.sql` |
| handle_new_user() | 注册后自动创建 profiles（触发器） | `supabase/setup_profiles_trigger.sql` |

> 💡 新环境快速初始化，可直接执行合并脚本 `supabase/p0_apply_all.sql`。
> 弹出公告表初始化：执行 `supabase/setup_site_announcements.sql`；管理员在首页"管理公告"按钮中维护公告内容，无需改代码。

---

## 📁 项目结构

```
forum-app/
├── public/                 # 静态资源（含 _headers 安全头）
├── src/
│   ├── animation/          # 入场动画（Canvas 2D 粒子/星云系统）
│   ├── components/         # 可复用组件（Navbar、PostCard、CommentList 等）
│   ├── hooks/              # 自定义 Hook（useAuth）
│   ├── lib/                # 核心逻辑（supabase、admin、worldbuilding、validation、allowedEmails）
│   ├── pages/              # 页面（Home、Login、Register、Worldbuilding 系列等）
│   ├── App.jsx             # 路由配置 + 动画/种族选择管理
│   ├── main.jsx            # 入口文件
│   └── index.css           # 全局样式（明暗主题设计系统）
├── supabase/               # 数据库脚本 + Edge Function
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
