import { supabase } from './supabase'

// 宠物类型配置
const PET_TYPES = {
  star: { name: '星际精灵', icon: '⭐', color: 'from-yellow-400 to-orange-500' },
  cloud: { name: '云端小兽', icon: '☁️', color: 'from-blue-400 to-cyan-500' },
  flame: { name: '火焰精灵', icon: '🔥', color: 'from-red-400 to-orange-500' },
  leaf: { name: '森林精灵', icon: '🍃', color: 'from-green-400 to-teal-500' },
  crystal: { name: '水晶精灵', icon: '💎', color: 'from-purple-400 to-pink-500' }
}

// 获取宠物类型
export const getPetType = (type) => {
  return PET_TYPES[type] || PET_TYPES.star
}

// 获取所有宠物类型
export const getAllPetTypes = () => {
  return Object.entries(PET_TYPES).map(([key, value]) => ({
    key,
    ...value
  }))
}

// 检查用户是否有宠物
export const checkHasPet = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('pets')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return !!data
  } catch (error) {
    console.error('检查宠物失败:', error)
    return false
  }
}

// 获取用户的宠物
export const getPet = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('获取宠物失败:', error)
    return null
  }
}

// 创建宠物
export const createPet = async (userId, name, type) => {
  try {
    const { data, error } = await supabase
      .from('pets')
      .insert([
        {
          user_id: userId,
          name: name,
          personality: type,
          mood: 70,
          hunger: 50,
          energy: 80,
          intimacy: 30,
          level: 1,
          exp: 0
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('创建宠物失败:', error)
    return null
  }
}

// 更新宠物状态
export const updatePet = async (petId, updates) => {
  try {
    const { error } = await supabase
      .from('pets')
      .update(updates)
      .eq('id', petId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('更新宠物失败:', error)
    return false
  }
}

// 获取宠物消息历史
export const getPetMessages = async (petId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('pet_messages')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('获取消息失败:', error)
    return []
  }
}

// 发送消息给宠物
export const sendPetMessage = async (petId, userId, content) => {
  try {
    const { data, error } = await supabase
      .from('pet_messages')
      .insert([
        {
          pet_id: petId,
          user_id: userId,
          role: 'user',
          content: content
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('发送消息失败:', error)
    return null
  }
}

// 保存宠物回复
export const savePetMessage = async (petId, userId, content) => {
  try {
    const { data, error } = await supabase
      .from('pet_messages')
      .insert([
        {
          pet_id: petId,
          user_id: userId,
          role: 'pet',
          content: content
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('保存消息失败:', error)
    return null
  }
}

// 获取宠物记忆
export const getPetMemories = async (petId) => {
  try {
    const { data, error } = await supabase
      .from('pet_memories')
      .select('*')
      .eq('pet_id', petId)
      .order('importance', { ascending: false })
      .limit(10)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('获取记忆失败:', error)
    return []
  }
}

// 添加宠物记忆
export const addPetMemory = async (petId, content, importance = 1) => {
  try {
    const { data, error } = await supabase
      .from('pet_memories')
      .insert([
        {
          pet_id: petId,
          content: content,
          importance: importance
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('添加记忆失败:', error)
    return null
  }
}

// 喂食宠物
export const feedPet = async (petId, currentPet) => {
  const newHunger = Math.max(0, currentPet.hunger - 30)
  const newMood = Math.min(100, currentPet.mood + 10)
  const newExp = currentPet.exp + 5

  return await updatePet(petId, {
    hunger: newHunger,
    mood: newMood,
    exp: newExp
  })
}

// 和宠物玩耍
export const playWithPet = async (petId, currentPet) => {
  const newEnergy = Math.max(0, currentPet.energy - 20)
  const newIntimacy = Math.min(100, currentPet.intimacy + 15)
  const newMood = Math.min(100, currentPet.mood + 15)
  const newExp = currentPet.exp + 10

  return await updatePet(petId, {
    energy: newEnergy,
    intimacy: newIntimacy,
    mood: newMood,
    exp: newExp
  })
}

// 抚摸宠物
export const petAnimal = async (petId, currentPet) => {
  const newIntimacy = Math.min(100, currentPet.intimacy + 10)
  const newMood = Math.min(100, currentPet.mood + 10)

  return await updatePet(petId, {
    intimacy: newIntimacy,
    mood: newMood
  })
}

// 获取心情描述
export const getMoodDescription = (mood) => {
  if (mood >= 80) return { text: '开心', emoji: '😊', color: 'text-green-500' }
  if (mood >= 60) return { text: '普通', emoji: '😐', color: 'text-yellow-500' }
  if (mood >= 40) return { text: '有点难过', emoji: '😢', color: 'text-orange-500' }
  return { text: '很难过', emoji: '😭', color: 'text-red-500' }
}

// 获取饥饿描述
export const getHungerDescription = (hunger) => {
  if (hunger <= 20) return { text: '饱了', emoji: '😋', color: 'text-green-500' }
  if (hunger <= 50) return { text: '正常', emoji: '😊', color: 'text-yellow-500' }
  if (hunger <= 80) return { text: '有点饿', emoji: '😐', color: 'text-orange-500' }
  return { text: '很饿', emoji: '😢', color: 'text-red-500' }
}

// 获取精力描述
export const getEnergyDescription = (energy) => {
  if (energy >= 80) return { text: '充沛', emoji: '⚡', color: 'text-green-500' }
  if (energy >= 50) return { text: '正常', emoji: '😊', color: 'text-yellow-500' }
  if (energy >= 30) return { text: '疲惫', emoji: '😴', color: 'text-orange-500' }
  return { text: '很累', emoji: '😩', color: 'text-red-500' }
}

// 获取亲密度描述
export const getIntimacyDescription = (intimacy) => {
  if (intimacy >= 80) return { text: '信任', emoji: '💕', color: 'text-pink-500' }
  if (intimacy >= 50) return { text: '熟悉', emoji: '😊', color: 'text-yellow-500' }
  if (intimacy >= 30) return { text: '普通', emoji: '😐', color: 'text-gray-500' }
  return { text: '陌生', emoji: '😶', color: 'text-gray-400' }
}
