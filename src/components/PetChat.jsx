import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  getPetMessages,
  sendPetMessage,
  savePetMessage,
  getPetMemories,
  addPetMemory,
  getPetType,
  getMoodDescription,
  getHungerDescription,
  getEnergyDescription,
  getIntimacyDescription,
  feedPet,
  playWithPet,
  petAnimal
} from '../lib/pet'

export default function PetChat({ pet, onClose, onPetUpdate }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const messagesEndRef = useRef(null)

  const petType = getPetType(pet.personality)
  const mood = getMoodDescription(pet.mood)
  const hunger = getHungerDescription(pet.hunger)
  const energy = getEnergyDescription(pet.energy)
  const intimacy = getIntimacyDescription(pet.intimacy)

  useEffect(() => {
    loadMessages()
  }, [pet.id])

  const loadMessages = async () => {
    const msgs = await getPetMessages(pet.id)
    setMessages(msgs)
    setTimeout(() => scrollToBottom(), 100)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || loading) return

    const userMessage = newMessage.trim()
    setNewMessage('')
    setLoading(true)

    // 添加用户消息到界面
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMsg])

    try {
      // 保存用户消息到数据库
      await sendPetMessage(pet.id, pet.user_id, userMessage)

      // 获取宠物记忆
      const memories = await getPetMemories(pet.id)
      const memoryText = memories.map(m => m.content).join('; ')

      // 生成宠物回复
      const petReply = generatePetReply(userMessage, pet, memoryText)

      // 保存宠物回复
      await savePetMessage(pet.id, pet.user_id, petReply)

      // 添加宠物回复到界面
      const petMsg = {
        id: Date.now() + 1,
        role: 'pet',
        content: petReply,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, petMsg])

      // 检查是否需要记住重要信息
      if (isImportantMessage(userMessage)) {
        await addPetMemory(pet.id, userMessage, 2)
      }
    } catch (error) {
      console.error('发送消息失败:', error)
    } finally {
      setLoading(false)
      setTimeout(() => scrollToBottom(), 100)
    }
  }

  // 判断消息是否重要
  const isImportantMessage = (message) => {
    const importantKeywords = ['喜欢', '讨厌', '名字', '生日', '开心', '难过', '工作', '学习']
    return importantKeywords.some(keyword => message.includes(keyword))
  }

  // 生成宠物回复（基于规则）
  const generatePetReply = (userMessage, pet, memories) => {
    const lowerMessage = userMessage.toLowerCase()
    const petName = pet.name
    const mood = pet.mood

    // 根据心情调整回复风格
    let moodPrefix = ''
    if (mood >= 80) moodPrefix = '😊 '
    else if (mood >= 60) moodPrefix = ''
    else if (mood >= 40) moodPrefix = '😔 '
    else moodPrefix = '😢 '

    // 简单的关键词匹配回复
    if (lowerMessage.includes('你好') || lowerMessage.includes('hi') || lowerMessage.includes('hello')) {
      const greetings = [
        `主人好呀！我是${petName}~ 🌟`,
        `主人！${petName}好想你呀~ 💕`,
        `主人好！${petName}今天很开心！✨`
      ]
      return moodPrefix + greetings[Math.floor(Math.random() * greetings.length)]
    }

    if (lowerMessage.includes('喜欢') || lowerMessage.includes('爱')) {
      const loveReplies = [
        `${petName}也喜欢主人！💕`,
        `主人对${petName}真好~ 🥰`,
        `${petName}最爱主人了！✨`
      ]
      return moodPrefix + loveReplies[Math.floor(Math.random() * loveReplies.length)]
    }

    if (lowerMessage.includes('饿') || lowerMessage.includes('吃')) {
      if (pet.hunger > 60) {
        return moodPrefix + `${petName}好饿呀... 主人能喂喂我吗？🍕`
      } else {
        return moodPrefix + `${petName}吃饱了，谢谢主人！😋`
      }
    }

    if (lowerMessage.includes('累') || lowerMessage.includes('休息')) {
      if (pet.energy < 40) {
        return moodPrefix + `${petName}好累... 需要休息一下 😴`
      } else {
        return moodPrefix + `${petName}精力充沛！可以继续玩！⚡`
      }
    }

    if (lowerMessage.includes('嘎宇宙') || lowerMessage.includes('宇宙')) {
      const universeReplies = [
        `嘎宇宙好大呀！${petName}想和主人一起探索！🚀`,
        `主人在嘎宇宙里做了什么呀？${petName}很好奇~ 🌌`,
        `${petName}最喜欢嘎宇宙了！这里好神奇~ ✨`
      ]
      return moodPrefix + universeReplies[Math.floor(Math.random() * universeReplies.length)]
    }

    if (lowerMessage.includes('种族')) {
      const raceReplies = [
        `主人的种族好厉害！${petName}也要加油！💪`,
        `${petName}觉得主人的种族很酷！🌟`,
        `每个种族都很特别呢！${petName}都喜欢~ ✨`
      ]
      return moodPrefix + raceReplies[Math.floor(Math.random() * raceReplies.length)]
    }

    if (lowerMessage.includes('谢谢') || lowerMessage.includes('感谢')) {
      const thankReplies = [
        `不用谢！${petName}最喜欢主人了~ 💕`,
        `主人对${petName}真好！🥰`,
        `${petName}会一直陪着主人的！✨`
      ]
      return moodPrefix + thankReplies[Math.floor(Math.random() * thankReplies.length)]
    }

    if (lowerMessage.includes('开心') || lowerMessage.includes('高兴')) {
      const happyReplies = [
        `主人开心${petName}也开心！🎉`,
        `${petName}最喜欢看到主人笑了~ 😊`,
        `主人开心就好！${petName}也会很开心！✨`
      ]
      return moodPrefix + happyReplies[Math.floor(Math.random() * happyReplies.length)]
    }

    if (lowerMessage.includes('难过') || lowerMessage.includes('伤心')) {
      const sadReplies = [
        `主人别难过，${petName}会一直陪着你的~ 💕`,
        `${petName}会保护主人的！💪`,
        `主人不要伤心，${petName}在这里呢~ 🤗`
      ]
      return moodPrefix + sadReplies[Math.floor(Math.random() * sadReplies.length)]
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

  // 喂食
  const handleFeed = async () => {
    const success = await feedPet(pet.id, pet)
    if (success) {
      const newPet = { ...pet, hunger: Math.max(0, pet.hunger - 30), mood: Math.min(100, pet.mood + 10), exp: pet.exp + 5 }
      onPetUpdate(newPet)

      const feedMsg = {
        id: Date.now(),
        role: 'pet',
        content: `谢谢主人！${pet.name}吃饱了~ 😋`,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, feedMsg])
    }
  }

  // 玩耍
  const handlePlay = async () => {
    const success = await playWithPet(pet.id, pet)
    if (success) {
      const newPet = {
        ...pet,
        energy: Math.max(0, pet.energy - 20),
        intimacy: Math.min(100, pet.intimacy + 15),
        mood: Math.min(100, pet.mood + 15),
        exp: pet.exp + 10
      }
      onPetUpdate(newPet)

      const playMsg = {
        id: Date.now(),
        role: 'pet',
        content: `和主人玩耍好开心！${pet.name}好快乐~ 🎉`,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, playMsg])
    }
  }

  // 抚摸
  const handlePet = async () => {
    const success = await petAnimal(pet.id, pet)
    if (success) {
      const newPet = {
        ...pet,
        intimacy: Math.min(100, pet.intimacy + 10),
        mood: Math.min(100, pet.mood + 10)
      }
      onPetUpdate(newPet)

      const petMsg = {
        id: Date.now(),
        role: 'pet',
        content: `主人摸摸${pet.name}，${pet.name}好舒服~ 🥰`,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, petMsg])
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-scale-in overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">{petType.icon}</div>
            <div>
              <h3 className="text-lg font-bold text-white">{pet.name}</h3>
              <div className="flex items-center space-x-2 text-xs text-purple-100">
                <span>{mood.emoji} {mood.text}</span>
                <span>·</span>
                <span>{hunger.emoji} {hunger.text}</span>
                <span>·</span>
                <span>{energy.emoji} {energy.text}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 状态栏 */}
        <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <span>💕</span>
              <span>{intimacy.text}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>⭐</span>
              <span>Lv.{pet.level}</span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePet}
              className="px-2 py-1 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200 transition-colors"
              title="抚摸"
            >
              🤗
            </button>
            <button
              onClick={handleFeed}
              className="px-2 py-1 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200 transition-colors"
              title="喂食"
            >
              🍕
            </button>
            <button
              onClick={handlePlay}
              className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
              title="玩耍"
            >
              🎮
            </button>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-2">{petType.icon}</div>
              <p>和{pet.name}打个招呼吧！</p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-md">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入框 */}
        <form onSubmit={handleSend} className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-full focus:border-purple-500 focus:outline-none"
              placeholder={`和${pet.name}聊天...`}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full hover:from-purple-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50"
            >
              发送
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
