import { supabase } from './supabase'

// 种族配置
export const RACES = {
  human: { name: '人类', color: 'blue', description: '群星之子，以平凡之躯丈量宇宙。' },
  mech: { name: '机械族', color: 'gray', description: '钢铁躯壳之下，涌动着求知的灵魂。' },
  alien: { name: '星际族', color: 'green', description: '目光越过当下，投向群星尽头的命运。' },
  elf: { name: '灵族', color: 'purple', description: '聆听星辰与生命的低语。' },
  dragon: { name: '龙裔', color: 'red', description: '龙血在胸，燃尽万古长夜。' },
  void: { name: '虚空族', color: 'black', description: '从虚无中来，向无尽处去。' }
}

// 种族称号映射
export const RACE_TITLES = {
  human: { initial: '人类之子', advanced: '人类先驱' },
  mech: { initial: '机械之心', advanced: '机械大师' },
  alien: { initial: '星际旅者', advanced: '星际使者' },
  elf: { initial: '灵族之友', advanced: '灵族长老' },
  dragon: { initial: '龙之后裔', advanced: '龙之王者' },
  void: { initial: '虚空行者', advanced: '虚空使者' }
}

// 检查用户是否已选择种族
export const checkRaceSelected = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('race_selected')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data?.race_selected || false
  } catch {
    return false
  }
}

// 获取用户的种族信息
export const getUserRace = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('race, title, member_code, default_story_id, custom_backstory')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch {
    return null
  }
}

// 获取用户的完整世界观信息
export const getUserWorldInfo = async (userId) => {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError

    // 获取默认背景故事
    let defaultStory = null
    if (profile.default_story_id) {
      const { data: story, error: storyError } = await supabase
        .from('worldbuilding_stories')
        .select('*')
        .eq('id', profile.default_story_id)
        .single()

      if (!storyError) {
        defaultStory = story
      }
    }

    return {
      ...profile,
      raceInfo: profile.race ? RACES[profile.race] : null,
      titleInfo: profile.race ? RACE_TITLES[profile.race] : null,
      defaultStory
    }
  } catch {
    return null
  }
}

// 生成下一个编号
export const generateMemberCode = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_next_member_code')

    if (error) throw error
    return data
  } catch {
    return null
  }
}

// 选择种族
export const selectRace = async (userId, race) => {
  try {
    // 检查种族是否有效
    if (!RACES[race]) {
      throw new Error('无效的种族')
    }

    // 检查用户是否已选择种族
    const isSelected = await checkRaceSelected(userId)
    if (isSelected) {
      throw new Error('你已经选择过种族了')
    }

    // 生成编号
    const code = await generateMemberCode()
    if (!code) {
      throw new Error('生成编号失败')
    }

    // 随机选择一个背景故事
    const storyIndex = Math.floor(Math.random() * 3) + 1
    const { data: story, error: storyError } = await supabase
      .from('worldbuilding_stories')
      .select('id')
      .eq('race', race)
      .eq('story_index', storyIndex)
      .single()

    if (storyError) throw storyError

    // 获取种族称号
    const title = RACE_TITLES[race]?.initial || '宇宙新星'

    // 更新用户资料
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        race: race,
        member_code: code,
        title: title,
        default_story_id: story.id,
        race_selected: true
      })
      .eq('id', userId)

    if (updateError) throw updateError

    // 插入编号记录
    const { error: codeError } = await supabase
      .from('member_codes')
      .insert([
        {
          user_id: userId,
          code: code
        }
      ])

    if (codeError) throw codeError

    return {
      success: true,
      code,
      race,
      title,
      storyId: story.id
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// 更新自定义背景故事
export const updateCustomBackstory = async (userId, backstory) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ custom_backstory: backstory })
      .eq('id', userId)

    if (error) throw error
    return true
  } catch {
    return false
  }
}

// 创建嘎宇宙创作
export const createWorldbuilding = async (userId, type, title, content) => {
  try {
    const { data, error } = await supabase
      .from('worldbuilding')
      .insert([
        {
          user_id: userId,
          type,
          title,
          content
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  } catch {
    return null
  }
}

// 获取嘎宇宙创作列表
export const getWorldbuildingList = async (type = null, page = 1, limit = 10) => {
  try {
    let query = supabase
      .from('worldbuilding')
      .select('*, profiles(username, avatar_url, race, member_code, title)')
      .eq('is_published', true)

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) throw error
    return data || []
  } catch {
    return []
  }
}

// 获取单个创作详情
export const getWorldbuildingDetail = async (id) => {
  try {
    const { data, error } = await supabase
      .from('worldbuilding')
      .select('*, profiles(username, avatar_url, race, member_code, title)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch {
    return null
  }
}

// 删除创作（作者和管理员都可以删除）
export const deleteWorldbuilding = async (id, userId, isAdmin = false) => {
  try {
    // 验证权限：作者或管理员
    const { data: post, error: fetchError } = await supabase
      .from('worldbuilding')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    if (post.user_id !== userId && !isAdmin) {
      throw new Error('没有权限删除此创作')
    }

    const { error } = await supabase
      .from('worldbuilding')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch {
    return false
  }
}

// 更新创作（只有作者可以更新）
export const updateWorldbuilding = async (id, userId, type, title, content) => {
  try {
    // 验证是否是作者
    const { data: post, error: fetchError } = await supabase
      .from('worldbuilding')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    if (post.user_id !== userId) {
      throw new Error('只有作者可以编辑自己的创作')
    }

    const { data, error } = await supabase
      .from('worldbuilding')
      .update({ type, title, content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch {
    return null
  }
}

// 点赞/取消点赞
// 返回 { isLiked, count }，供前端乐观更新，避免整篇重新拉取
export const toggleLike = async (userId, worldbuildingId) => {
  try {
    // 检查是否已点赞
    const { data: existing } = await supabase
      .from('worldbuilding_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('worldbuilding_id', worldbuildingId)
      .limit(1)

    let isLiked = false

    if (existing && existing.length > 0) {
      // 取消点赞
      const { error } = await supabase
        .from('worldbuilding_likes')
        .delete()
        .eq('id', existing[0].id)

      if (error) throw error
      isLiked = false
    } else {
      // 点赞
      const { error } = await supabase
        .from('worldbuilding_likes')
        .insert([
          {
            user_id: userId,
            worldbuilding_id: worldbuildingId
          }
        ])

      if (error) throw error
      isLiked = true
    }

    // 用 count 查询直接获取点赞数（head 只取计数，不拉取全表）
    const { count } = await supabase
      .from('worldbuilding_likes')
      .select('id', { count: 'exact', head: true })
      .eq('worldbuilding_id', worldbuildingId)

    const likeCount = count ?? 0

    return { isLiked, count: likeCount }
  } catch {
    return null
  }
}

// 检查是否已点赞
export const checkLiked = async (userId, worldbuildingId) => {
  try {
    const { data, error } = await supabase
      .from('worldbuilding_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('worldbuilding_id', worldbuildingId)
      .limit(1)

    if (error) return false
    return data && data.length > 0
  } catch {
    return false
  }
}

// 添加创作评论
export const addWorldbuildingComment = async (userId, worldbuildingId, content) => {
  try {
    const { data, error } = await supabase
      .from('worldbuilding_comments')
      .insert([
        {
          user_id: userId,
          worldbuilding_id: worldbuildingId,
          content
        }
      ])
      .select()
      .single()

    if (error) throw error

    return data
  } catch {
    return null
  }
}

// 获取创作评论列表
export const getWorldbuildingComments = async (worldbuildingId) => {
  try {
    const { data, error } = await supabase
      .from('worldbuilding_comments')
      .select('*, profiles(username, avatar_url, race, member_code)')
      .eq('worldbuilding_id', worldbuildingId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  } catch {
    return []
  }
}
