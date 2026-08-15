import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { checkHasPet, getPet, getPetType, getMoodDescription } from '../lib/pet'
import PetAdopt from './PetAdopt'
import PetChat from './PetChat'

export default function PetFloatButton() {
  const [user, setUser] = useState(null)
  const [pet, setPet] = useState(null)
  const [hasPet, setHasPet] = useState(false)
  const [showAdopt, setShowAdopt] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        const has = await checkHasPet(session.user.id)
        setHasPet(has)
        if (has) {
          const petData = await getPet(session.user.id)
          setPet(petData)
        }
      }
      setLoading(false)
    })
  }, [])

  const handleAdoptComplete = async (newPet) => {
    setPet(newPet)
    setHasPet(true)
    setShowAdopt(false)
  }

  const handlePetUpdate = (updatedPet) => {
    setPet(updatedPet)
  }

  if (loading || !user) return null

  const petType = pet ? getPetType(pet.personality) : null
  const mood = pet ? getMoodDescription(pet.mood) : null

  return (
    <>
      {/* 悬浮按钮 */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => {
            if (hasPet) {
              setShowChat(true)
            } else {
              setShowAdopt(true)
            }
          }}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
          title={hasPet ? `和${pet?.name}聊天` : '领养宠物'}
        >
          {hasPet && pet ? (
            <span className="text-2xl">{petType?.icon || '🐾'}</span>
          ) : (
            <span className="text-2xl">🐾</span>
          )}
        </button>

        {/* 心情指示器 */}
        {hasPet && pet && mood && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full shadow-sm flex items-center justify-center text-xs">
            {mood.emoji}
          </div>
        )}
      </div>

      {/* 领养弹窗 */}
      {showAdopt && (
        <PetAdopt
          userId={user.id}
          onComplete={handleAdoptComplete}
        />
      )}

      {/* 聊天弹窗 */}
      {showChat && pet && (
        <PetChat
          pet={pet}
          onClose={() => setShowChat(false)}
          onPetUpdate={handlePetUpdate}
        />
      )}
    </>
  )
}
