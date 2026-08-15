import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // 获取请求数据
    const { pet_name, pet_type, user_message, memories, mood, hunger, energy, intimacy } = await req.json()

    // 获取 Hugging Face API Key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: settings } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'huggingface_token')
      .single()

    const hfToken = settings?.value

    if (!hfToken) {
      return new Response(
        JSON.stringify({ error: 'API Key 未配置' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 构建提示词
    const systemPrompt = `你是一只叫${pet_name}的嘎宇宙宠物。你的性格是${pet_type}。

你的特点：
- 你会用可爱的语气回复主人
- 你会记住主人说过的重要事情
- 你会根据心情改变回复方式
- 你会用 emoji 表达情感
- 你的回复要简短（1-2句话）

当前状态：
- 心情：${mood >= 80 ? '开心' : mood >= 60 ? '普通' : mood >= 40 ? '有点难过' : '很难过'}
- 饥饿：${hunger <= 20 ? '饱了' : hunger <= 50 ? '正常' : hunger <= 80 ? '有点饿' : '很饿'}
- 精力：${energy >= 80 ? '充沛' : energy >= 50 ? '正常' : energy >= 30 ? '疲惫' : '很累'}
- 亲密度：${intimacy >= 80 ? '信任' : intimacy >= 50 ? '熟悉' : intimacy >= 30 ? '普通' : '陌生'}

${memories ? `主人的重要信息：${memories}` : ''}

请根据主人的消息和你的性格回复。回复要简短可爱，符合你的性格。`

    // 调用 Hugging Face API
    console.log('Token length:', hfToken?.length)
    const response = await fetch(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `<|endothetext|>\n${systemPrompt}\n\n主人：${user_message}\n${pet_name}：`,
          parameters: {
            max_new_tokens: 100,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true
          }
        })
      }
    )

    console.log('Response status:', response.status)

    if (!response.ok) {
      console.log('API error, using fallback')
      const fallbackReply = generateFallbackReply(pet_name, pet_type, user_message, mood, hunger, energy, intimacy, memories)
      return new Response(
        JSON.stringify({ reply: fallbackReply }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 尝试解析 JSON 响应
    let reply = ''
    try {
      const responseText = await response.text()
      console.log('Response text length:', responseText.length)
      console.log('Response text preview:', responseText.substring(0, 200))

      const result = JSON.parse(responseText)
      console.log('Parsed result:', result)

      // 解析回复
      reply = result.generated_text || result[0]?.generated_text || ''

      // 清理回复
      reply = reply
        .replace(/<\|endothetext\|>/g, '')
        .replace(/主人：.*$/m, '')
        .replace(/${pet_name}：/g, '')
    } catch (jsonError) {
      console.log('JSON 解析失败，使用备用回复')
      reply = ''
    }
      .trim()

    // 如果回复为空或太短，使用备用回复
    if (!reply || reply.length < 3) {
      reply = generateFallbackReply(pet_name, pet_type, user_message, mood, hunger, energy, intimacy, memories)
    }

    return new Response(
      JSON.stringify({ reply }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('AI Chat Error:', error)

    // 使用备用回复
    const fallbackReply = generateFallbackReply(
      req.body?.pet_name || '小宠物',
      req.body?.pet_type || 'friendly',
      req.body?.user_message || '',
      req.body?.mood || 70,
      req.body?.hunger || 50,
      req.body?.energy || 80,
      req.body?.intimacy || 30,
      req.body?.memories || ''
    )

    return new Response(
      JSON.stringify({ reply: fallbackReply }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// 备用回复生成器
function generateFallbackReply(petName, petType, userMessage, mood, hunger, energy, intimacy, memories) {
  const lowerMessage = userMessage.toLowerCase()

  // 根据心情添加前缀
  let moodPrefix = ''
  if (mood >= 80) moodPrefix = '😊 '
  else if (mood >= 60) moodPrefix = ''
  else if (mood >= 40) moodPrefix = '😔 '
  else moodPrefix = '😢 '

  // 根据关键词匹配回复
  if (lowerMessage.includes('你好') || lowerMessage.includes('hi')) {
    const replies = [
      `主人好呀！${petName}在这里~ 🌟`,
      `主人！${petName}好想你呀~ 💕`,
      `主人好！${petName}今天很开心！✨`
    ]
    return moodPrefix + replies[Math.floor(Math.random() * replies.length)]
  }

  if (lowerMessage.includes('喜欢') || lowerMessage.includes('爱')) {
    const replies = [
      `${petName}也喜欢主人！💕`,
      `主人对${petName}真好~ 🥰`,
      `${petName}最爱主人了！✨`
    ]
    return moodPrefix + replies[Math.floor(Math.random() * replies.length)]
  }

  if (lowerMessage.includes('饿') || lowerMessage.includes('吃')) {
    if (hunger > 60) {
      return moodPrefix + `${petName}好饿呀... 主人能喂喂我吗？🍕`
    } else {
      return moodPrefix + `谢谢主人！${petName}吃饱了~ 😋`
    }
  }

  if (lowerMessage.includes('累') || lowerMessage.includes('休息')) {
    if (energy < 40) {
      return moodPrefix + `${petName}好累... 需要休息一下 😴`
    } else {
      return moodPrefix + `${petName}精力充沛！可以继续玩！⚡`
    }
  }

  if (lowerMessage.includes('嘎宇宙') || lowerMessage.includes('宇宙')) {
    const replies = [
      `嘎宇宙好大呀！${petName}想和主人一起探索！🚀`,
      `主人在嘎宇宙里做了什么呀？${petName}很好奇~ 🌌`,
      `${petName}最喜欢嘎宇宙了！这里好神奇~ ✨`
    ]
    return moodPrefix + replies[Math.floor(Math.random() * replies.length)]
  }

  if (lowerMessage.includes('种族')) {
    const replies = [
      `主人的种族好厉害！${petName}也要加油！💪`,
      `${petName}觉得主人的种族很酷！🌟`,
      `每个种族都很特别呢！${petName}都喜欢~ ✨`
    ]
    return moodPrefix + replies[Math.floor(Math.random() * replies.length)]
  }

  if (lowerMessage.includes('谢谢') || lowerMessage.includes('感谢')) {
    const replies = [
      `不用谢！${petName}最喜欢主人了~ 💕`,
      `主人对${petName}真好！🥰`,
      `${petName}会一直陪着主人的！✨`
    ]
    return moodPrefix + replies[Math.floor(Math.random() * replies.length)]
  }

  if (lowerMessage.includes('开心') || lowerMessage.includes('高兴')) {
    const replies = [
      `主人开心${petName}也开心！🎉`,
      `${petName}最喜欢看到主人笑了~ 😊`,
      `主人开心就好！${petName}也会很开心！✨`
    ]
    return moodPrefix + replies[Math.floor(Math.random() * replies.length)]
  }

  if (lowerMessage.includes('难过') || lowerMessage.includes('伤心')) {
    const replies = [
      `主人别难过，${petName}会一直陪着你的~ 💕`,
      `${petName}会保护主人的！💪`,
      `主人不要伤心，${petName}在这里呢~ 🤗`
    ]
    return moodPrefix + replies[Math.floor(Math.random() * replies.length)]
  }

  // 默认回复
  const defaultReplies = [
    `主人说什么${petName}都听！😊`,
    `${petName}在听呢~ 主人继续说吧！✨`,
    `主人的话${petName}都记住了！📝`,
    `${petName}最喜欢和主人聊天了~ 💕`,
    `主人好厉害！${petName}好崇拜你！🌟`,
    `${petName}会一直陪着主人的！✨`
  ]
  return moodPrefix + defaultReplies[Math.floor(Math.random() * defaultReplies.length)]
}
