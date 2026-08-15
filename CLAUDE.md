# 嘎宇宙项目 - Claude 专用指南

## 快速开始

```bash
cd C:\Users\Administrator\Desktop\web\forum-app
npm install
npm run dev
```

## 项目信息

- **网站**: https://gagaga-d99.pages.dev
- **GitHub**: https://github.com/ESchance/GAGAGA
- **Supabase**: https://supabase.com/dashboard/project/whdzgwnxyyyodspcvxha

## 技术栈

- React 18 + Vite + Tailwind CSS
- Supabase (PostgreSQL + Realtime + Auth)
- Cloudflare Pages

## 管理员账号

| 邮箱 | 角色 |
|------|------|
| user01@forum.com | 超级管理员 |
| user02@forum.com | 管理员 |
| user03@forum.com | 管理员 |

## 核心功能

1. 用户系统（邮箱白名单注册）
2. 帖子系统（发帖、评论、点赞）
3. 嘎宇宙创作（故事、角色、设定、点子）
4. 世界观系统（6种种族、编号、背景故事）
5. 管理员系统（超级管理员、管理员）
6. 入场动画（宇宙大爆发主题）
7. 暗色/浅色模式
8. 移动端适配

## 关键文件

- `src/lib/admin.js` - 管理员功能
- `src/lib/worldbuilding.js` - 世界观功能
- `src/pages/UserManagement.jsx` - 用户管理
- `src/animation/` - 入场动画

## 数据库表

- profiles, posts, comments, worldbuilding, worldbuilding_likes, worldbuilding_comments, worldbuilding_stories, member_codes, announcements

## Edge Functions

- delete-user: 删除用户（使用 service_role）

## 注意事项

1. 删除用户需要先删除关联数据
2. RLS 策略保护所有表
3. 环境变量不上传到 GitHub
4. 只有 user01 是超级管理员
