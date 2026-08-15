# 嘎宇宙项目 - Claude 专用指南

## 快速开始

```bash
cd C:\Users\Administrator\Desktop\web\forum-app
npm install
npm run dev
```

## 质量检查

```bash
npm run lint    # 代码检查（oxlint）
npm run test    # 单元测试（vitest，src/lib/*.test.js）
npm run build   # 生产构建
```

CI 已配置：推送到 GitHub 会自动运行 lint + test + build（`.github/workflows/ci.yml`）。

## 项目信息

- **网站**: https://gagaga-d99.pages.dev
- **GitHub**: https://github.com/ESchance/GAGAGA
- **Supabase**: https://supabase.com/dashboard/project/whdzgwnxyyyodspcvxha

## 技术栈

- React 19 + Vite 8 + React Router 7 + Tailwind CSS 4
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
- `src/lib/validation.js` - 输入校验（发帖/评论/创作/注册统一使用）
- `src/components/Toast.jsx` - Toast 轻量提示条系统，用法：`const { showToast } = useToast()`，`showToast('消息', 'success'|'error'|'warning'|'info')`
- `src/pages/UserManagement.jsx` - 用户管理
- `src/animation/` - 入场动画

> 提示约定：操作结果提示统一用 `showToast`；高风险操作的确认框保留原生 `confirm`（删除帖子/评论）。

## 入场动画架构（Three.js 升级版）

- **渲染器分层**：`src/animation/core/RendererSwitch.jsx` 按设备选择渲染器——
  - PC（≥640px + WebGL2）→ `ThreeAnimationCanvas`（Three.js，动态 import）
  - 移动端 / 无 WebGL2 / 加载失败 → `AnimationCanvas`（Canvas 2D，原版）
  - 档位判定见 `src/animation/utils/webgl.js`
- **Three.js 模块**（`src/animation/three/`）：GalaxyStars（银河星空）、Singularity（奇点）、ExplosionSystem（爆炸+冲击波）、TraverseField（穿梭）、NebulaVolume（星云体积）、bloom（泛光，仅高配）、CameraShake、phaseRenderers
- **科技感字体**：Orbitron / JetBrains Mono 用 @fontsource 自托管，在动画播放时动态 import
- **时间轴**：`AnimationTimeline` 是唯一控制器，7 阶段约 35 秒，渲染层与叙事逻辑解耦。阶段：黑暗(0-2s)→诞生(2-5s)→爆炸(5-10s)→HUD穿梭(10-18s)→探索按钮(18s起等待点击，穿梭持续循环)→快速穿梭→进入

## 数据库表

- profiles, posts, comments, worldbuilding, worldbuilding_likes, worldbuilding_comments, worldbuilding_stories, member_codes, announcements（公告条/警示语）, site_announcements（弹出公告/更新说明）

## 数据库函数与触发器

- `get_registered_emails()` - 已注册邮箱列表（授权 anon）
- `get_next_member_code()` - 生成编号 GZ-XXXX（授权 authenticated）
- `delete_user(UUID)` - 删除用户，**函数内部校验调用者必须为 superadmin**（授权 authenticated）
- `handle_new_user()` 触发器 - 注册后自动创建 profiles
- 新环境初始化可直接执行 `supabase/p0_apply_all.sql`

## Edge Functions

- delete-user: 删除用户（使用 service_role）

## 注意事项

1. 删除用户需要先删除关联数据；`delete_user` 函数内部已有超级管理员权限校验
2. RLS 策略保护所有表
3. 环境变量不上传到 GitHub
4. 只有 user01 是超级管理员
5. 密码规则：至少6位，须含大写字母、小写字母和数字（`validation.js` 强制）
6. `PostCard` 不再自查管理员，由 Home/Profile 页面层通过 props 传入 `isAdmin` / `currentUserId`
7. 两套公告：`announcements` 表=页面顶部公告条（警示语，管理员可编辑）；`site_announcements` 表=弹出公告（更新说明，**仅超级管理员**可在首页"管理公告"入口维护），初始化执行 `supabase/setup_site_announcements.sql`
8. 入场动画：新用户首次注册必看；老用户登录自动跳过，可在首页"回放开场动画"回顾（回顾时保留跳过按钮）
