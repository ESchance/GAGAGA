import { useState } from 'react'
import { getAllPetTypes, createPet } from '../lib/pet'

export default function PetAdopt({ userId, onComplete }) {
  const [step, setStep] = useState(1) // 1: 选择类型, 2: 起名字
  const [selectedType, setSelectedType] = useState(null)
  const [petName, setPetName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const petTypes = getAllPetTypes()

  const handleSelectType = (type) => {
    setSelectedType(type)
    setStep(2)
  }

  const handleCreatePet = async () => {
    if (!petName.trim()) {
      setError('请输入宠物名字')
      return
    }

    setLoading(true)
    setError('')

    try {
      const pet = await createPet(userId, petName.trim(), selectedType)
      if (pet) {
        onComplete(pet)
      } else {
        setError('创建宠物失败，请重试')
      }
    } catch (err) {
      setError('创建宠物失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-scale-in overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-4">
          <h3 className="text-xl font-bold text-white">
            🐾 领养你的专属宠物
          </h3>
          <p className="text-purple-100 text-sm mt-1">
            它将陪伴你在嘎宇宙中探索
          </p>
        </div>

        <div className="p-6">
          {/* 步骤1：选择宠物类型 */}
          {step === 1 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                选择你的宠物类型
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {petTypes.map((type) => (
                  <button
                    key={type.key}
                    onClick={() => handleSelectType(type.key)}
                    className="p-4 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 text-center"
                  >
                    <div className="text-4xl mb-2">{type.icon}</div>
                    <div className="font-medium text-gray-800">{type.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 步骤2：起名字 */}
          {step === 2 && (
            <div>
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">
                  {petTypes.find(t => t.key === selectedType)?.icon}
                </div>
                <h4 className="text-lg font-semibold text-gray-800">
                  给你的宠物起个名字
                </h4>
              </div>

              <input
                type="text"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-center text-lg"
                placeholder="输入宠物名字"
                maxLength={20}
                autoFocus
              />

              {error && (
                <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium"
                >
                  返回
                </button>
                <button
                  onClick={handleCreatePet}
                  disabled={loading || !petName.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? '创建中...' : '领养'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
