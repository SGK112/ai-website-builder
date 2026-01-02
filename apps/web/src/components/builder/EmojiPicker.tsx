'use client'

import { useState, useCallback, useMemo } from 'react'
import { Search, X, Clock, Smile, Heart, Utensils, Plane, Activity, Lightbulb, Flag, Hash } from 'lucide-react'

// Comprehensive emoji data organized by category
const EMOJI_DATA = {
  recent: [] as string[],
  smileys: [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊',
    '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋',
    '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
    '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌',
    '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
    '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓',
    '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦',
    '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
    '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿',
    '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'
  ],
  gestures: [
    '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
    '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
    '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
    '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂',
    '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅',
    '👄', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '👩',
    '🧓', '👴', '👵', '🙍', '🙎', '🙅', '🙆', '💁', '🙋', '🧏'
  ],
  hearts: [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️',
    '💌', '💋', '👫', '👭', '👬', '💑', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '💏'
  ],
  food: [
    '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒',
    '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬',
    '🥒', '🌶️', '🫑', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐',
    '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇',
    '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓',
    '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🍝',
    '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚',
    '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧',
    '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪',
    '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷'
  ],
  travel: [
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
    '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵',
    '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟',
    '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇',
    '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀', '🛸',
    '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '🪝',
    '⛽', '🚧', '🚦', '🚥', '🚏', '🗺️', '🗿', '🗽', '🗼', '🏰',
    '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️', '🏜️',
    '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺', '🏠', '🏡', '🏘️', '🏚️',
    '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪'
  ],
  activities: [
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
    '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
    '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷',
    '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️',
    '🤺', '🤾', '🏌️', '🏇', '⛷️', '🏊', '🤽', '🚣', '🧗', '🚵',
    '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫',
    '🎟️', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼',
    '🎹', '🥁', '🪘', '🎷', '🎺', '🪗', '🎸', '🪕', '🎻', '🎲',
    '♟️', '🎯', '🎳', '🎮', '🎰', '🧩', '🃏', '🀄', '🎴', '🎭'
  ],
  objects: [
    '💡', '🔦', '🏮', '🪔', '📱', '📲', '💻', '🖥️', '🖨️', '⌨️',
    '🖱️', '🖲️', '💽', '💾', '💿', '📀', '🧮', '🎥', '🎞️', '📽️',
    '🎬', '📺', '📷', '📸', '📹', '📼', '🔍', '🔎', '🕯️', '💰',
    '💴', '💵', '💶', '💷', '💸', '💳', '🧾', '💹', '✉️', '📧',
    '📨', '📩', '📤', '📥', '📦', '📫', '📪', '📬', '📭', '📮',
    '🗳️', '✏️', '✒️', '🖋️', '🖊️', '🖌️', '🖍️', '📝', '💼', '📁',
    '📂', '🗂️', '📅', '📆', '🗒️', '🗓️', '📇', '📈', '📉', '📊',
    '📋', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗄️',
    '🗑️', '🔒', '🔓', '🔏', '🔐', '🔑', '🗝️', '🔨', '🪓', '⛏️',
    '⚒️', '🛠️', '🗡️', '⚔️', '🔫', '🪃', '🏹', '🛡️', '🪚', '🔧'
  ],
  symbols: [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✨', '⭐',
    '🌟', '💫', '⚡', '🔥', '💥', '🎉', '🎊', '✅', '❌', '❓',
    '❗', '💯', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪',
    '🟤', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔳',
    '🔲', '⬛', '⬜', '◼️', '◻️', '◾', '◽', '▪️', '▫️', '🔈',
    '🔇', '🔉', '🔊', '🔔', '🔕', '📣', '📢', '💬', '💭', '🗯️',
    '♠️', '♣️', '♥️', '♦️', '🃏', '🎴', '🀄', '🔄', '🔀', '🔁',
    '🔂', '▶️', '⏩', '⏭️', '⏯️', '◀️', '⏪', '⏮️', '🔼', '⏫',
    '🔽', '⏬', '⏸️', '⏹️', '⏺️', '⏏️', '🔃', '🔄', '🔙', '🔚'
  ],
  flags: [
    '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️',
    '🇺🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇩🇪', '🇫🇷', '🇮🇹', '🇪🇸',
    '🇯🇵', '🇰🇷', '🇨🇳', '🇮🇳', '🇧🇷', '🇲🇽', '🇷🇺', '🇿🇦',
    '🇳🇱', '🇧🇪', '🇨🇭', '🇦🇹', '🇸🇪', '🇳🇴', '🇩🇰', '🇫🇮',
    '🇵🇱', '🇵🇹', '🇬🇷', '🇹🇷', '🇮🇪', '🇳🇿', '🇸🇬', '🇦🇪'
  ]
}

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose?: () => void
}

const CATEGORY_ICONS = {
  recent: Clock,
  smileys: Smile,
  gestures: '👋',
  hearts: Heart,
  food: Utensils,
  travel: Plane,
  activities: Activity,
  objects: Lightbulb,
  symbols: Hash,
  flags: Flag
}

const CATEGORY_LABELS: Record<string, string> = {
  recent: 'Recently Used',
  smileys: 'Smileys & Emotion',
  gestures: 'People & Body',
  hearts: 'Love & Hearts',
  food: 'Food & Drink',
  travel: 'Travel & Places',
  activities: 'Activities',
  objects: 'Objects',
  symbols: 'Symbols',
  flags: 'Flags'
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_DATA>('smileys')
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('recent-emojis')
      return stored ? JSON.parse(stored) : []
    }
    return []
  })

  const handleEmojiSelect = useCallback((emoji: string) => {
    // Update recent emojis
    const newRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 20)
    setRecentEmojis(newRecent)
    if (typeof window !== 'undefined') {
      localStorage.setItem('recent-emojis', JSON.stringify(newRecent))
    }
    onSelect(emoji)
  }, [recentEmojis, onSelect])

  // Search through all emojis
  const filteredEmojis = useMemo(() => {
    if (!searchQuery) return null

    const query = searchQuery.toLowerCase()
    const results: string[] = []

    Object.values(EMOJI_DATA).forEach(emojis => {
      emojis.forEach(emoji => {
        // Simple search - could be enhanced with emoji metadata
        if (results.length < 50) {
          results.push(emoji)
        }
      })
    })

    return results.slice(0, 50)
  }, [searchQuery])

  const currentEmojis = useMemo(() => {
    if (filteredEmojis) return filteredEmojis
    if (activeCategory === 'recent') return recentEmojis
    return EMOJI_DATA[activeCategory] || []
  }, [filteredEmojis, activeCategory, recentEmojis])

  return (
    <div className="w-80 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
      {/* Header with search */}
      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search emojis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      {!searchQuery && (
        <div className="flex gap-1 p-2 border-b border-white/10 overflow-x-auto scrollbar-hide">
          {Object.keys(EMOJI_DATA).map((category) => {
            const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]
            const isActive = activeCategory === category

            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category as keyof typeof EMOJI_DATA)}
                className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
                title={CATEGORY_LABELS[category]}
              >
                {typeof Icon === 'string' ? (
                  <span className="text-lg">{Icon}</span>
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Category label */}
      <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
        {searchQuery ? 'Search Results' : CATEGORY_LABELS[activeCategory]}
      </div>

      {/* Emoji grid */}
      <div className="h-64 overflow-y-auto p-2">
        {currentEmojis.length > 0 ? (
          <div className="grid grid-cols-8 gap-1">
            {currentEmojis.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => handleEmojiSelect(emoji)}
                className="w-8 h-8 flex items-center justify-center text-xl hover:bg-white/10 rounded-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Smile className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">
              {activeCategory === 'recent'
                ? 'No recent emojis'
                : 'No emojis found'
              }
            </p>
          </div>
        )}
      </div>

      {/* Footer with close button */}
      {onClose && (
        <div className="p-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}

// Compact inline emoji button for toolbar use
export function EmojiButton({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        title="Insert emoji"
      >
        <Smile className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full mb-2 right-0 z-50">
            <EmojiPicker
              onSelect={(emoji) => {
                onSelect(emoji)
                setIsOpen(false)
              }}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default EmojiPicker
