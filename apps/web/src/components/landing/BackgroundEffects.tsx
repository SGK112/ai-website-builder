'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// Generate random stars
function generateStars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 5,
  }))
}

// Real constellation data
const CONSTELLATIONS = {
  orion: {
    name: 'Orion',
    stars: [
      { x: 15, y: 25, size: 3, name: 'Betelgeuse', color: '#ffccaa' },
      { x: 22, y: 25, size: 2.5, name: 'Bellatrix', color: '#aaccff' },
      { x: 16, y: 32, size: 2, name: 'Belt 1' },
      { x: 18.5, y: 33, size: 2.2, name: 'Belt 2' },
      { x: 21, y: 34, size: 2, name: 'Belt 3' },
      { x: 14, y: 42, size: 2, name: 'Saiph', color: '#aaccff' },
      { x: 23, y: 40, size: 3.5, name: 'Rigel', color: '#aaddff' },
      { x: 17, y: 37, size: 1.5, name: 'Sword 1' },
      { x: 18, y: 39, size: 1.8, name: 'Orion Nebula', color: '#ff99cc' },
    ],
    lines: [[0, 1], [0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6], [3, 7], [7, 8]],
  },
  bigDipper: {
    name: 'Big Dipper',
    stars: [
      { x: 60, y: 12, size: 2.5, name: 'Dubhe', color: '#ffddaa' },
      { x: 65, y: 10, size: 2.3, name: 'Merak' },
      { x: 70, y: 11, size: 2, name: 'Phecda' },
      { x: 74, y: 9, size: 2, name: 'Megrez' },
      { x: 78, y: 7, size: 2.2, name: 'Alioth' },
      { x: 83, y: 8, size: 2.3, name: 'Mizar' },
      { x: 88, y: 10, size: 2, name: 'Alkaid', color: '#aaccff' },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [0, 3]],
  },
  cassiopeia: {
    name: 'Cassiopeia',
    stars: [
      { x: 42, y: 8, size: 2.2, name: 'Schedar', color: '#ffccaa' },
      { x: 46, y: 5, size: 2, name: 'Caph' },
      { x: 50, y: 9, size: 2.5, name: 'Gamma Cas', color: '#aaddff' },
      { x: 54, y: 6, size: 1.8, name: 'Ruchbah' },
      { x: 58, y: 10, size: 2, name: 'Segin' },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  scorpius: {
    name: 'Scorpius',
    stars: [
      { x: 75, y: 65, size: 3.5, name: 'Antares', color: '#ff6644' },
      { x: 72, y: 60, size: 2, name: 'Graffias' },
      { x: 70, y: 55, size: 1.8, name: 'Dschubba', color: '#aaccff' },
      { x: 78, y: 70, size: 1.8, name: 'Tau Sco' },
      { x: 82, y: 75, size: 1.5, name: 'Epsilon Sco' },
      { x: 85, y: 78, size: 2, name: 'Shaula', color: '#aaddff' },
      { x: 87, y: 76, size: 1.8, name: 'Lesath' },
    ],
    lines: [[0, 1], [1, 2], [0, 3], [3, 4], [4, 5], [5, 6]],
  },
  cygnus: {
    name: 'Cygnus',
    stars: [
      { x: 35, y: 55, size: 2.8, name: 'Deneb', color: '#ffffff' },
      { x: 38, y: 62, size: 2, name: 'Sadr', color: '#ffffcc' },
      { x: 32, y: 60, size: 1.5, name: 'Gienah' },
      { x: 44, y: 64, size: 1.5, name: 'Delta Cyg' },
      { x: 40, y: 72, size: 2.2, name: 'Albireo', color: '#ffcc66' },
    ],
    lines: [[0, 1], [1, 2], [1, 3], [1, 4]],
  },
}

// Constellation component
function Constellation({
  constellation,
  baseOpacity = 0.8,
  delay = 0,
  duration = 20,
  showDuration = 12,
}: {
  constellation: typeof CONSTELLATIONS.orion
  baseOpacity?: number
  delay?: number
  duration?: number
  showDuration?: number
}) {
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, baseOpacity, baseOpacity, 0] }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        times: [0, 0.15, 0.15 + (showDuration / duration), 1],
        ease: 'easeInOut',
      }}
    >
      {constellation.stars.map((star, i) => (
        <g key={`star-${i}`}>
          <circle cx={`${star.x}%`} cy={`${star.y}%`} r={star.size * 5} fill={star.color || '#ffffff'} opacity={0.08} />
          <circle cx={`${star.x}%`} cy={`${star.y}%`} r={star.size * 3} fill={star.color || '#ffffff'} opacity={0.15} />
          <circle cx={`${star.x}%`} cy={`${star.y}%`} r={star.size * 1.8} fill={star.color || '#ffffff'} opacity={0.3} />
          <motion.circle
            cx={`${star.x}%`}
            cy={`${star.y}%`}
            r={star.size}
            fill={star.color || '#ffffff'}
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </g>
      ))}
    </motion.g>
  )
}

// Starry Night Background
export function StarryNight() {
  const starGroups = useMemo(() => {
    const allStars = generateStars(300)
    return [
      allStars.slice(0, 60),
      allStars.slice(60, 120),
      allStars.slice(120, 180),
      allStars.slice(180, 240),
      allStars.slice(240, 300),
    ]
  }, [])
  const brightStars = useMemo(() => generateStars(40).map(s => ({ ...s, size: s.size + 1.5 })), [])
  const shootingStars = useMemo(() => generateStars(2), [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Deep space gradient */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(to bottom, #000000 0%, #010103 10%, #020206 25%, #030309 40%, #02020a 60%, #010108 80%, #000004 100%)`,
      }} />

      {/* Vignette */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)' }} />

      {/* Nebula */}
      <div className="absolute inset-0 opacity-30" style={{
        background: `radial-gradient(ellipse 80% 50% at 20% 80%, rgba(30, 20, 60, 0.4) 0%, transparent 50%),
          radial-gradient(ellipse 60% 40% at 85% 20%, rgba(20, 30, 50, 0.3) 0%, transparent 50%),
          radial-gradient(ellipse 100% 60% at 50% 100%, rgba(15, 10, 35, 0.5) 0%, transparent 50%)`,
      }} />

      {/* Milky Way */}
      <motion.div
        className="absolute inset-0 opacity-25"
        style={{
          background: `linear-gradient(130deg, transparent 0%, transparent 30%, rgba(80, 60, 120, 0.04) 35%, rgba(100, 120, 180, 0.07) 42%, rgba(120, 100, 160, 0.1) 50%, rgba(100, 120, 180, 0.07) 58%, rgba(80, 60, 120, 0.04) 65%, transparent 70%, transparent 100%)`,
        }}
        animate={{ opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Constellations */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 5 }}>
        <Constellation constellation={CONSTELLATIONS.orion} delay={5} duration={50} showDuration={35} />
        <Constellation constellation={CONSTELLATIONS.bigDipper} delay={20} duration={55} showDuration={38} />
        <Constellation constellation={CONSTELLATIONS.cassiopeia} delay={35} duration={48} showDuration={32} />
        <Constellation constellation={CONSTELLATIONS.scorpius} delay={50} duration={52} showDuration={36} baseOpacity={0.7} />
        <Constellation constellation={CONSTELLATIONS.cygnus} delay={12} duration={45} showDuration={30} />
      </svg>

      {/* Star groups */}
      {starGroups.map((group, groupIndex) => (
        <motion.div
          key={`star-group-${groupIndex}`}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 4, delay: groupIndex * 3, ease: 'easeOut' }}
        >
          {group.map((star) => (
            <motion.div
              key={star.id}
              className="absolute rounded-full"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size * 0.7,
                height: star.size * 0.7,
                backgroundColor: star.id % 8 === 0 ? '#c4b5fd' : star.id % 11 === 0 ? '#93c5fd' : star.id % 13 === 0 ? '#fcd34d' : '#ffffff',
              }}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: star.duration * 2, delay: star.delay + groupIndex * 3, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </motion.div>
      ))}

      {/* Bright stars */}
      {brightStars.slice(0, 12).map((star, i) => (
        <motion.div
          key={`bright-${star.id}`}
          className="absolute"
          style={{ left: `${star.x}%`, top: `${star.y}%`, zIndex: 10 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.6, 0.9, 0.6], scale: [1, 1.08, 1] }}
          transition={{ duration: 6 + i * 0.8, delay: 8 + i * 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ width: star.size * 8, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)' }} />
          <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ width: '1px', height: star.size * 8, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.6), transparent)' }} />
          <div className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ width: star.size * 3, height: star.size * 3, background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)' }} />
          <div className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" style={{ width: star.size, height: star.size }} />
        </motion.div>
      ))}

      {/* Shooting stars */}
      {shootingStars.map((star, i) => (
        <motion.div
          key={`shooting-${star.id}`}
          className="absolute"
          style={{ left: `${10 + star.x * 0.5}%`, top: `${5 + star.y * 0.3}%`, zIndex: 20 }}
          initial={{ opacity: 0 }}
          animate={{ x: [0, 350], y: [0, 180], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2, delay: 20 + i * 40, repeat: Infinity, repeatDelay: 60 + i * 30, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="w-2 h-2 bg-white rounded-full" style={{ boxShadow: '0 0 12px 6px rgba(255,255,255,0.8), 0 0 24px 12px rgba(139,92,246,0.4)' }} />
          <div className="absolute right-full top-1/2 -translate-y-1/2 h-[2px]" style={{ width: '100px', background: 'linear-gradient(to right, transparent, rgba(139,92,246,0.2), rgba(255,255,255,0.9))' }} />
        </motion.div>
      ))}

      {/* Moon */}
      <motion.div
        className="absolute top-12 right-16 sm:right-24"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 3, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} className="relative w-24 h-24 sm:w-28 sm:h-28">
          {/* Moon glow */}
          <div className="absolute rounded-full" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '180px', height: '180px', zIndex: 3, background: 'radial-gradient(circle, rgba(255,220,120,0.5) 0%, rgba(255,180,80,0.3) 50%, transparent 70%)', filter: 'blur(10px)' }} />
          {/* Moon body */}
          <div className="absolute rounded-full overflow-hidden" style={{
            left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '100%', zIndex: 10,
            background: 'radial-gradient(circle at 35% 35%, #f8fafc 0%, #e2e8f0 30%, #cbd5e1 60%, #9ca3af 100%)',
            boxShadow: '0 0 60px 15px rgba(241,245,249,0.25), 0 0 100px 30px rgba(241,245,249,0.12), inset -8px -8px 25px rgba(0,0,0,0.2), inset 4px 4px 15px rgba(255,255,255,0.1)',
          }}>
            <div className="absolute inset-0 opacity-35">
              <div className="absolute top-[25%] left-[35%] w-10 h-8 rounded-full bg-slate-500/40" style={{ filter: 'blur(3px)', transform: 'rotate(-15deg)' }} />
              <div className="absolute top-[15%] left-[45%] w-8 h-7 rounded-full bg-slate-500/35" style={{ filter: 'blur(2px)' }} />
              <div className="absolute top-[55%] left-[30%] w-7 h-6 rounded-full bg-slate-500/35" style={{ filter: 'blur(2px)' }} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

// Volumetric Cloud Component
function VolumetricCloud({ className, scale = 1, opacity = 1 }: { className?: string; scale?: number; opacity?: number }) {
  const cloudId = useMemo(() => Math.random().toString(36).substr(2, 9), [])

  return (
    <div className={cn("relative pointer-events-none", className)} style={{ transform: `scale(${scale})`, opacity }}>
      <div className="relative w-full h-full">
        <div className="absolute inset-0" style={{ filter: 'blur(20px)', transform: 'translateY(15px) scale(0.9)', opacity: 0.3 }}>
          <div className="w-full h-full bg-gradient-to-b from-slate-300 to-slate-400 rounded-full" />
        </div>
        <div className="relative" style={{ filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.15))' }}>
          <svg viewBox="0 0 300 150" className="w-full h-full">
            <defs>
              <linearGradient id={`cloudBody-${cloudId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#f5f5f5" />
                <stop offset="100%" stopColor="#d4d4d4" />
              </linearGradient>
            </defs>
            <ellipse cx="150" cy="130" rx="120" ry="15" fill="#94a3b8" opacity="0.1" />
            <g opacity="0.9">
              <ellipse cx="60" cy="100" rx="50" ry="40" fill={`url(#cloudBody-${cloudId})`} />
              <ellipse cx="240" cy="95" rx="55" ry="42" fill={`url(#cloudBody-${cloudId})`} />
            </g>
            <g>
              <ellipse cx="100" cy="80" rx="55" ry="45" fill={`url(#cloudBody-${cloudId})`} />
              <ellipse cx="200" cy="75" rx="58" ry="48" fill={`url(#cloudBody-${cloudId})`} />
              <ellipse cx="150" cy="70" rx="60" ry="50" fill={`url(#cloudBody-${cloudId})`} />
            </g>
            <g>
              <ellipse cx="80" cy="60" rx="45" ry="38" fill="#ffffff" />
              <ellipse cx="130" cy="50" rx="50" ry="42" fill="#ffffff" />
              <ellipse cx="180" cy="55" rx="48" ry="40" fill="#ffffff" />
              <ellipse cx="220" cy="65" rx="42" ry="35" fill="#fefefe" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}

// Sunrise Background
export function SunriseBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ perspective: '1200px' }}>
      {/* Sky gradient */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 3 }}
        style={{
          background: `linear-gradient(to bottom, #7dd3fc 0%, #a5f3fc 15%, #bae6fd 30%, #fef3c7 50%, #fde68a 65%, #fdba74 80%, #fed7aa 100%)`,
        }}
      />

      {/* Sun */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2"
        initial={{ top: '25%', scale: 0.8, opacity: 0 }}
        animate={{ top: '6%', scale: 1, opacity: 1 }}
        transition={{ duration: 4, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 4 }}>
          {/* Sun glow */}
          <div className="absolute rounded-full" style={{
            left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '220px', height: '220px', zIndex: 2,
            background: 'radial-gradient(circle, rgba(255,236,179,0.4) 0%, rgba(255,213,128,0.2) 40%, transparent 70%)',
          }} />
          {/* Sun body */}
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="relative rounded-full"
            style={{
              width: '112px', height: '112px', zIndex: 10,
              background: 'radial-gradient(circle at 30% 30%, #FFFEF5 0%, #FFF3CD 20%, #FFE082 50%, #FFB74D 80%, #FF9800 100%)',
              boxShadow: '0 0 80px 30px rgba(255,200,100,0.5), 0 0 120px 60px rgba(255,150,50,0.3)',
            }}
          >
            <div className="absolute top-4 left-5 w-8 h-8 rounded-full bg-white/60 blur-sm" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Parting clouds */}
      <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
        <motion.div
          className="absolute w-[45vw] h-48"
          style={{ top: '0%', transform: 'translateZ(-30px)' }}
          initial={{ left: '28%' }}
          animate={{ left: '-10%' }}
          transition={{ duration: 5, delay: 1, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.div animate={{ x: [0, -20, 0] }} transition={{ duration: 35, repeat: Infinity, ease: 'easeInOut', delay: 6 }}>
            <VolumetricCloud scale={1.6} opacity={0.85} />
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute w-[45vw] h-48"
          style={{ top: '-2%', transform: 'translateZ(-30px)' }}
          initial={{ right: '28%' }}
          animate={{ right: '-10%' }}
          transition={{ duration: 5, delay: 1, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.div animate={{ x: [0, 25, 0] }} transition={{ duration: 38, repeat: Infinity, ease: 'easeInOut', delay: 6 }}>
            <VolumetricCloud scale={1.5} opacity={0.82} />
          </motion.div>
        </motion.div>
      </div>

      {/* Flying birds */}
      {[
        { top: '22%', delay: 0, duration: 30, size: 28 },
        { top: '18%', delay: 8, duration: 35, size: 22 },
        { top: '26%', delay: 15, duration: 40, size: 18 },
      ].map((bird, i) => (
        <motion.div
          key={`bird-${i}`}
          className="absolute -left-12"
          style={{ top: bird.top }}
          animate={{ x: ['0%', '120vw'], y: [0, -15, 5, -10, 0, 10, -5, 0] }}
          transition={{
            duration: bird.duration,
            delay: bird.delay,
            repeat: Infinity,
            ease: 'linear',
            y: { duration: bird.duration / 4, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <motion.svg
            width={bird.size}
            height={bird.size / 2}
            viewBox="0 0 28 14"
            className="text-slate-700/30"
            animate={{ scaleX: [1, 0.9, 1, 1.1, 1] }}
            transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d="M0 7 Q7 0 14 7 Q21 0 28 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </motion.svg>
        </motion.div>
      ))}
    </div>
  )
}
