import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'

const JURORS = [
  {
    id: 'iforest',
    emoji: '🌲',
    name: 'Isolation Forest',
    role: 'Forest Ranger',
    line: 'Unusual behavior detected.',
  },
  {
    id: 'ecod',
    emoji: '📊',
    name: 'ECOD',
    role: 'Data Scientist',
    line: 'Strong statistical deviation.',
  },
  {
    id: 'copod',
    emoji: '🔗',
    name: 'COPOD',
    role: 'Detective',
    line: 'Pattern inconsistent with history.',
  },
  {
    id: 'hbos',
    emoji: '📦',
    name: 'HBOS',
    role: 'Accountant',
    line: 'Distribution anomaly confirmed.',
  },
]

function JurorCard({ juror, score, vote, index, phase }) {
  const isFraud = vote === 1
  const showVote = phase === 'voting' || phase === 'complete'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, type: 'spring', stiffness: 120 }}
      className={`flex flex-col items-center gap-2 flex-1 min-w-0 ${phase === 'deliberating' || phase === 'entering' ? 'z-10' : ''}`}
    >
      {/* Avatar */}
      <div
        className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.08)' }}
      >
        {juror.emoji}
      </div>

      {/* Name and Text */}
      <div className="flex flex-col items-center gap-2 mt-2">
        <div className="text-center">
          <div className="text-xs font-semibold text-gray-800 leading-tight truncate w-full px-1">{juror.name}</div>
          <div className="text-[10px] text-gray-500 truncate">{juror.role}</div>
        </div>
      </div>

      {/* Vote reveal */}
      <AnimatePresence>
        {showVote && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.2, type: 'spring', stiffness: 300 }}
            className="flex flex-col items-center gap-1"
          >
            <div
              className="px-2 py-0.5 rounded-full text-[11px] font-bold"
              style={{
                background: isFraud ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
                color: isFraud ? '#ef4444' : '#22c55e',
                border: `1px solid ${isFraud ? '#ef4444' : '#22c55e'}40`,
              }}
            >
              {isFraud ? 'FRAUD' : 'NORMAL'}
            </div>
            <div className="text-[11px] font-mono text-gray-600">
              {score != null ? `${Math.round(score)}/1000` : '—'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function JuryPanel({ tx, phase, onComplete }) {
  const modelVotes = tx?.model_votes ?? {}
  const modelScores = tx?.model_scores ?? {}
  const voteCount = Object.values(modelVotes).filter(v => v === 1).length

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 text-center">
        Model Jury
      </div>

      <div className="flex items-start justify-center gap-4 mt-2">
        {JURORS.map((juror, i) => (
          <JurorCard
            key={juror.id}
            juror={juror}
            score={modelScores[juror.id]}
            vote={modelVotes[juror.id]}
            index={i}
            phase={phase}
          />
        ))}
      </div>

      {/* Verdict banner */}
      <AnimatePresence>
        {(phase === 'complete') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 rounded-xl px-4 py-3 text-center"
            style={{
              background: voteCount >= 3 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
              border: `1px solid ${voteCount >= 3 ? '#ef444430' : '#10b98130'}`,
            }}
          >
            <span className="text-sm font-bold" style={{ color: voteCount >= 3 ? '#ef4444' : '#10b981' }}>
              {voteCount >= 3 ? `🚨 Fraud Detected (${voteCount}/4 Judges Agree)` : `✅ Normal (${voteCount}/4 Judges Agree)`}
            </span>
            <span className="text-xs text-gray-500 ml-2">
              · Score {Math.round(tx?.anomaly_score ?? 0)}/1000 · {tx?.fraud_confidence?.toUpperCase()} confidence
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
