// 成就徽章：基于真实已有数据在前端派生（P5-E 前端骨架，持久化成就表后续接入）
export function deriveAchievements({ posts = 0, creations = 0, hasMemberCode = false, role = '' } = {}) {
  const isAdmin = role === 'admin' || role === 'superadmin'
  return [
    { id: 'member', name: '舱员', description: '已选择种族并获得成员编号', earned: !!hasMemberCode },
    { id: 'pioneer', name: '星域拓荒者', description: '发布第一个帖子', earned: posts >= 1 },
    { id: 'chronicler', name: '星域记录者', description: '记录第一篇星域档案', earned: creations >= 1 },
    { id: 'sentinel', name: '轨道守护者', description: '维护星港秩序的管理员', earned: isAdmin }
  ]
}
