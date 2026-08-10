import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { RACES, RACE_TITLES } from '../lib/worldbuilding'

export function useWorldbuilding() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 获取用户世界观信息
  const getUserWorldInfo = useCallback(async (userId) => {
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
        const { data: story } = await supabase
          .from('worldbuilding_stories')
          .select('*')
          .eq('id', profile.default_story_id)
          .single()

        if (story) defaultStory = story
      }

      return {
        ...profile,
        raceInfo: profile.race ? RACES[profile.race] : null,
        titleInfo: profile.race ? RACE_TITLES[profile.race] : null,
        defaultStory
      }
    } catch (error) {
      console.error('获取世界观信息失败:', error)
      return null
    }
  }, [])

  // 选择种族
  const selectRace = useCallback(async (userId, race) => {
    try {
      if (!race) {
        // 跳过选择
        return { success: true, skipped: true }
      }

      // 检查种族是否有效
      if (!RACES[race]) {
        throw new Error('无效的种族')
      }

      // 检查用户是否已选择种族
      const { data: profile } = await supabase
        .from('profiles')
        .select('race_selected')
        .eq('id', userId)
        .single()

      if (profile?.race_selected) {
        throw new Error('你已经选择过种族了')
      }

      // 生成编号
      const { data: code, error: codeError } = await supabase
        .rpc('get_next_member_code')

      if (codeError) throw codeError

      // 随机选择一个背景故事
      const storyIndex = Math.floor(Math.random() * 3) + 1
      const { data: story } = await supabase
        .from('worldbuilding_stories')
        .select('id')
        .eq('race', race)
        .eq('story_index', storyIndex)
        .single()

      // 获取种族称号
      const title = RACE_TITLES[race]?.initial || '宇宙新星'

      // 更新用户资料
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          race: race,
          member_code: code,
          title: title,
          default_story_id: story?.id,
          race_selected: true
        })
        .eq('id', userId)

      if (updateError) throw updateError

      // 插入编号记录
      const { error: insertError } = await supabase
        .from('member_codes')
        .insert([{ user_id: userId, code: code }])

      if (insertError) throw insertError

      return {
        success: true,
        code,
        race,
        title,
        storyId: story?.id
      }
    } catch (error) {
      console.error('选择种族失败:', error)
      return { success: false, error: error.message }
    }
  }, [])

  // 检查是否已选择种族
  const checkRaceSelected = useCallback(async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('race_selected')
        .eq('id', userId)
        .single()

      return data?.race_selected || false
    } catch (error) {
      console.error('检查种族选择状态失败:', error)
      return false
    }
  }, [])

  return {
    loading,
    error,
    getUserWorldInfo,
    selectRace,
    checkRaceSelected
  }
}
