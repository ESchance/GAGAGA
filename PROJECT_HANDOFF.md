# 嘎宇宙项目交接文档

## 项目概述

**项目名称：** 嘎宇宙（GAGAGA）
**项目类型：** 多人实时在线交流论坛
**网站地址：** https://gagaga-d99.pages.dev
**GitHub 仓库：** https://github.com/ESchance/GAGAGA

---

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React | 19.x |
| 构建工具 | Vite | 8.x |
| 样式框架 | Tailwind CSS | 4.x |
| 路由 | React Router | 7.x |
| 后端/数据库 | Supabase | PostgreSQL + Realtime + Auth |
| 部署 | Cloudflare Pages | 全球 CDN |

---

## 项目结构

```
forum-app/
├── public/
│   ├── _headers              # Cloudflare 安全头
│   ├── favicon.svg           # 网站图标
│   ├── robots.txt            # 搜索引擎配置
│   └── sitemap.xml           # 站点地图
├── src/
│   ├── animation/            # 入场动画系统
│   │   ├── IntroAnimation.jsx
│   │   ├── components/
│   │   │   ├── HUDOverlay.jsx
│   │   │   ├── MobileHUD.jsx
│   │   │   └── SkipButton.jsx
│   │   ├── core/
│   │   │   ├── AnimationCanvas.jsx
│   │   │   ├── NebulaCluster.js
│   │   │   ├── NebulaEffect.js
│   │   │   ├── ParticleSystem.js
│   │   │   └── StarSystem.js
│   │   ├── timeline/
│   │   │   └── AnimationTimeline.js
│   │   └── utils/
│   │       └── MathUtils.js
│   ├── components/             # 可复用组件
│   │   ├── AnnouncementBar.jsx
│   │   ├── AnnouncementModal.jsx
│   │   ├── AuthForm.jsx
│   │   ├── Avatar.jsx
│   │   ├── AvatarUpload.jsx
│   │   ├── CommentList.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── Icons.jsx
│   │   ├── Navbar.jsx
│   │   ├── PostCard.jsx
│   │   ├── RaceSelector.jsx
│   │   ├── ThemeToggle.jsx
│   │   └── WorldInfo.jsx
│   ├── hooks/                  # 自定义 Hook
│   │   ├── useAuth.js
│   │   └── useWorldbuilding.js
│   ├── lib/                    # 工具函数
│   │   ├── admin.js
│   │   ├── allowedEmails.js
│   │   ├── supabase.js
│   │   ├── validation.js
│   │   └── worldbuilding.js
│   ├── pages/                  # 页面组件
│   │   ├── CreatePost.jsx
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── PostDetail.jsx
│   │   ├── Profile.jsx
│   │   ├── Register.jsx
│   │   ├── UserManagement.jsx
│   │   ├── Worldbuilding.jsx
│   │   ├── WorldbuildingCreate.jsx
│   │   ├── WorldbuildingDetail.jsx
│   │   └── WorldbuildingEdit.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── supabase/
│   └── functions/
│       └── delete-user/        # Edge Function
├── .env                        # 环境变量（不上传）
├── .env.example                # 环境变量模板
├── .gitignore                  # Git 忽略配置
├── index.html                  # 入口文件
└── package.json                # 项目配置
```

---

## 核心功能

### 1. 用户系统
- 邮箱白名单注册（48个邮箱，避开0004和0044）
- 用户登录/登出
- 个人主页
- 用户头像上传

### 2. 帖子系统
- 发帖（标题+内容）
- 帖子列表（首页显示）
- 帖子详情
- 删除帖子（作者和管理员）
- 置顶帖子（管理员）
- 实时更新

### 3. 评论系统
- 发表评论
- 删除评论（作者和管理员）
- 实时更新

### 4. 嘎宇宙创作板块
- 创作类型：故事、角色、设定、点子
- 种族限制：需要选择种族才能创作
- 点赞功能
- 评论功能

### 5. 世界观系统
- 6种种族：人类、机械族、星际族、灵族、龙裔、虚空族
- 编号系统：GZ-XXXX（避开0004和0044）
- 背景故事：每个种族3个故事
- 种族称号

### 6. 管理员系统
- 超级管理员（user01）：可删除用户、管理管理员
- 管理员（user02、user03）：可删除帖子、评论、置顶

### 7. 入场动画
- 宇宙大爆发主题（30秒）
- Canvas 2D 渲染
- 粒子系统 + 星云效果 + HUD界面
- 点击"开始探索"后进入后续流程

### 8. 其他功能
- 暗色/浅色模式切换
- 移动端适配
- 实时更新

---

## 管理员账号

| 邮箱 | 角色 | 权限 |
|------|------|------|
| user01@forum.com | 超级管理员 | 删除用户、管理管理员 |
| user02@forum.com | 管理员 | 删除帖子、评论、置顶 |
| user03@forum.com | 管理员 | 删除帖子、评论、置顶 |

---

## 数据库表结构

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| profiles | 用户资料 | id, username, role, race, member_code |
| posts | 帖子 | id, title, content, user_id, is_pinned |
| comments | 评论 | id, content, post_id, user_id |
| worldbuilding | 嘎宇宙创作 | id, type, title, content, user_id |
| worldbuilding_likes | 创作点赞 | id, user_id, worldbuilding_id |
| worldbuilding_comments | 创作评论 | id, content, worldbuilding_id, user_id |
| worldbuilding_stories | 背景故事 | id, race, story_index, title, content |
| member_codes | 编号记录 | id, user_id, code |
| announcements | 公告 | id, content, is_active |

---

## 环境变量

```
VITE_SUPABASE_URL=https://whdzgwnxyyyodspcvxha.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 部署流程

1. 代码推送到 GitHub
2. Cloudflare Pages 自动构建部署
3. 构建命令：`npm run build`
4. 输出目录：`dist`

---

## Edge Functions

| 函数 | 用途 | 说明 |
|------|------|------|
| delete-user | 删除用户 | 使用 service_role 权限 |

---

## 数据库函数与触发器

| 名称 | 用途 | 权限 | 脚本位置 |
|------|------|------|----------|
| get_registered_emails() | 已注册邮箱列表 | anon | supabase/get_registered_emails.sql |
| get_next_member_code() | 生成编号 GZ-XXXX | authenticated | supabase/fix_member_code_function.sql |
| delete_user(UUID) | 删除用户，内部校验调用者为 superadmin | authenticated | supabase/fix_delete_user_function.sql |
| handle_new_user() 触发器 | 注册后自动创建 profiles | - | supabase/setup_profiles_trigger.sql |

> 新环境初始化：直接执行合并脚本 `supabase/p0_apply_all.sql`。

---

## 关键注意事项

1. **删除用户**：需要先删除关联数据，再删除 profiles，最后删除 auth.users；`delete_user` 函数内部已校验调用者必须是超级管理员
2. **RLS 策略**：所有表都启用了 RLS，用户只能操作自己的数据
3. **环境变量**：.env 文件不上传到 GitHub
4. **管理员权限**：只有 user01 是超级管理员，可以删除用户
5. **密码规则**：至少6位，须含大写字母、小写字母和数字（由 `src/lib/validation.js` 强制）
6. **P0 修复记录**（2026-08-15）：修复创作评论计数、delete_user 越权、注册触发器缺失、编号函数授权缺失，并把输入校验接入全部提交入口

---

## 测试账号

| 邮箱 | 密码 | 角色 |
|------|------|------|
| user01@forum.com | （自定义） | 超级管理员 |
| user02@forum.com | （自定义） | 管理员 |
| user03@forum.com | （自定义） | 管理员 |

---

## 常见问题

### Q: 删除用户失败？
A: 检查 delete_user 函数是否存在，以及 RLS 策略是否正确。

### Q: 注册时提示邮箱已注册？
A: 检查邮箱是否在白名单中，或是否已被其他用户使用。

### Q: 帖子不显示？
A: 检查 RLS 策略和网络连接。

---

## 联系方式

如有问题，请查看 GitHub 仓库的 Issues 或联系项目负责人。
