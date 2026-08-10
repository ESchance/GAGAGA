import { supabase } from './supabase'

// 种族配置
export const RACES = {
  human: { name: '人类', icon: '🧑', color: 'blue', description: '平衡型，适应力强' },
  mech: { name: '机械族', icon: '🤖', color: 'gray', description: '理性冷静，擅长逻辑' },
  alien: { name: '星际族', icon: '👽', color: 'green', description: '拥有预知能力' },
  elf: { name: '灵族', icon: '🧝', color: 'purple', description: '擅长魔法，感知力强' },
  dragon: { name: '龙裔', icon: '🐉', color: 'red', description: '力量强大，威严庄重' },
  void: { name: '虚空族', icon: '👻', color: 'black', description: '神秘莫测，难以捉摸' }
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
  } catch (error) {
    console.error('检查种族选择状态失败:', error)
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
  } catch (error) {
    console.error('获取用户种族信息失败:', error)
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
      raceInfo: RACES[profile.race] || RACES.human,
      titleInfo: RACE_TITLES[profile.race] || RACE_TITLES.human,
      defaultStory
    }
  } catch (error) {
    console.error('获取用户世界观信息失败:', error)
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
  } catch (error) {
    console.error('生成编号失败:', error)
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
    console.error('选择种族失败:', error)
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
  } catch (error) {
    console.error('更新背景故事失败:', error)
    return false
  }
}

// 创建噶宇宙创作
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
  } catch (error) {
    console.error('创建创作失败:', error)
    return null
  }
}

// 获取噶宇宙创作列表
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
  } catch (error) {
    console.error('获取创作列表失败:', error)
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
  } catch (error) {
    console.error('获取创作详情失败:', error)
    return null
  }
}

// 删除创作（只有作者可以删除）
export const deleteWorldbuilding = async (id, userId) => {
  try {
    // 验证是否是作者
    const { data: post, error: fetchError } = await supabase
      .from('worldbuilding')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    if (post.user_id !== userId) {
      throw new Error('只有作者可以删除自己的创作')
    }

    const { error } = await supabase
      .from('worldbuilding')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('删除创作失败:', error)
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
  } catch (error) {
    console.error('更新创作失败:', error)
    return null
  }
}

// 点赞/取消点赞
export const toggleLike = async (userId, worldbuildingId) => {
  try {
    // 检查是否已点赞
    const { data: existing } = await supabase
      .from('worldbuilding_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('worldbuilding_id', worldbuildingId)
      .single()

    if (existing) {
      // 取消点赞
      const { error } = await supabase
        .from('worldbuilding_likes')
        .delete()
        .eq('id', existing.id)

      if (error) throw error

      // 更新点赞数
      await supabase
        .from('worldbuilding')
        .update({ likes_count: supabase.rpc('decrement', { x: 1 }) })
        .eq('id', worldbuildingId)

      return false
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

      // 更新点赞数
      await supabase
        .from('worldbuilding')
        .update({ likes_count: supabase.rpc('increment', { x: 1 }) })
        .eq('id', worldbuildingId)

      return true
    }
  } catch (error) {
    console.error('点赞操作失败:', error)
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
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return !!data
  } catch (error) {
    console.error('检查点赞状态失败:', error)
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

    // 更新评论数
    await supabase
      .from('worldbuilding')
      .update({ comments_count: supabase.rpc('increment', { x: 1 }) })
      .eq('id', worldbuildingId)

    return data
  } catch (error) {
    console.error('添加评论失败:', error)
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
  } catch (error) {
    console.error('获取评论列表失败:', error)
    return []
  }
}
