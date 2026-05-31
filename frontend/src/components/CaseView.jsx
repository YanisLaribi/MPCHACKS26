import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import JuryPanel from './JuryPanel'
import ClaudeExplanation from './ClaudeExplanation'
import QueueCounter from './QueueCounter'
import SwipeCard from './SwipeCard'
import GeoMap from './evidence/GeoMap'
import VelocityChart from './evidence/VelocityChart'
import SpendingChart from './evidence/SpendingChart'
import DeviceIPEvidence from './evidence/DeviceIPEvidence'
import ChannelEvidence from './evidence/ChannelEvidence'
import MerchantEvidence from './evidence/MerchantEvidence'
import Tooltip from './Tooltip'

const JURY_SEQUENCE = [
  { phase: 'entering',     delay: 0 },
  { phase: 'deliberating', delay: 1200 },
  { phase: 'voting',       delay: 2400 },
  { phase: 'complete',     delay: 3000 },
]

function EvidenceSection({ tx }) {
  const ev = tx?.evidence_snapshot ?? {}
  return (
    <div className="grid grid-cols-2 gap-3">
      <EvidenceCard title="Geographic" icon="🗺">
        <GeoMap geo={ev.geo} />
      </EvidenceCard>
      <EvidenceCard title="Velocity" icon="⚡">
        <VelocityChart velocity={ev.velocity} />
      </EvidenceCard>
      <EvidenceCard title="Spending" icon="💰">
        <SpendingChart spending={ev.spending} />
      </EvidenceCard>
      <EvidenceCard title="Device & IP" icon="🔌">
        <DeviceIPEvidence device_ip={ev.device_ip} />
      </EvidenceCard>
      <EvidenceCard title="Channel" icon="📡">
        <ChannelEvidence channel={ev.channel} tx={tx} />
      </EvidenceCard>
      <EvidenceCard title="Merchant" icon="🏪">
        <MerchantEvidence merchant={ev.merchant} tx={tx} />
      </EvidenceCard>
    </div>
  )
}

function EvidenceCard({ title, icon, children }) {
  return (
    <div
      className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4"
    >
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {icon} {title}
      </div>
      {children}
    </div>
  )
}

function TransactionMeta({ tx }) {
  const score = Math.round(tx.anomaly_score ?? 0)
  const scoreColor = score > 700 ? '#ef4444' : score > 400 ? '#f59e0b' : '#22c55e'
  const dangerLevel = score > 700 ? 'High' : score > 400 ? 'Medium' : 'Low'
  const gaugeWidth = Math.min(100, Math.max(0, (score / 1000) * 100))

  const ev = tx?.evidence_snapshot ?? {}
  const usualSpending = ev.spending?.avg_amt ? `$${ev.spending.avg_amt.toFixed(2)}` : 'Unknown'
  const currentSpending = `$${(tx.amount || 0).toFixed(2)}`

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
      
      {/* Risk Gauge Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Danger Level: {dangerLevel}
            </span>
          </div>
          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${gaugeWidth}%` }} 
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: scoreColor }}
            />
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-black font-mono leading-none" style={{ color: scoreColor }}>
            {score}
          </div>
          <div className="text-[10px] text-gray-500 font-medium">/ 1000 AI SCORE</div>
        </div>
      </div>

      {/* Profile Comparison */}
      <div className="p-4 bg-gray-50 flex flex-col md:flex-row gap-4 divide-y md:divide-y-0 md:divide-x divide-gray-200">
        <div className="flex-1 space-y-3">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            👤 Client's Usual Profile
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MetaRow label="Avg Spending" value={usualSpending} />
            <MetaRow label="Home Country" value={tx.cardholder_country} />
          </div>
        </div>
        
        <div className="flex-1 space-y-3 md:pl-4 pt-4 md:pt-0">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            ⚡ This Transaction
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MetaRow label="Amount" value={currentSpending} highlight />
            <MetaRow label="Merchant Geo" value={tx.merchant_country} highlight={tx.merchant_country !== tx.cardholder_country} />
            <MetaRow label="Merchant" value={tx.merchant_name} />
            <MetaRow label="Channel" value={tx.channel} />
          </div>
        </div>
      </div>
      
    </div>
  )
}

function MetaRow({ label, value, highlight, mono }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] text-gray-400 uppercase tracking-wider">
        {label}
      </div>
      <div className={`text-sm truncate mt-0.5 ${highlight ? 'font-bold text-red-600' : 'text-gray-800'} ${mono ? 'font-mono text-xs' : ''}`}>
        {value ?? '—'}
      </div>
    </div>
  )
}

function TriageHints({ onTriage }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <button 
        onClick={() => onTriage('APPROVE')}
        className="group flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-green-50 hover:border-green-300 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600 text-xl font-bold shrink-0">✓</div>
        <div>
          <div className="text-sm font-bold text-gray-800 group-hover:text-green-700">Approve</div>
          <div className="text-[10px] text-gray-500 leading-tight mt-0.5">Transaction proceeds normally. Client is not interrupted.</div>
        </div>
      </button>

      <button 
        onClick={() => onTriage('ESCALATE')}
        className="group flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-orange-50 hover:border-orange-300 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 text-xl font-bold shrink-0">⚠</div>
        <div>
          <div className="text-sm font-bold text-gray-800 group-hover:text-orange-700">Escalate</div>
          <div className="text-[10px] text-gray-500 leading-tight mt-0.5">Flag for Senior Review. Transaction held temporarily.</div>
        </div>
      </button>

      <button 
        onClick={() => onTriage('BLOCK')}
        className="group flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-red-50 hover:border-red-300 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 text-xl font-bold shrink-0">🚫</div>
        <div>
          <div className="text-sm font-bold text-gray-800 group-hover:text-red-700">Block</div>
          <div className="text-[10px] text-gray-500 leading-tight mt-0.5">Decline transaction, freeze card, and send SMS to client.</div>
        </div>
      </button>
    </div>
  )
}

export default function CaseView() {
  const { queue, activeCase, juryPhase, setJuryPhase, triage, explanation, loadingExpl, loadExplanation, setMode, loadQueue, exportFlaggedCSV, lastTriagedTxId, undoTriage } = useStore()
  const [exitDirection, setExitDirection] = useState(null)
  const timersRef = useRef([])

  // Load queue on mount
  useEffect(() => {
    loadQueue()
  }, [])

  // Run logic when new case loads
  useEffect(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setExitDirection(null)

    if (!activeCase) return

    JURY_SEQUENCE.forEach(({ phase, delay }) => {
      const t = setTimeout(() => setJuryPhase(phase), delay)
      timersRef.current.push(t)
    })

    // Load explanation after jury completes
    const explTimer = setTimeout(() => {
      loadExplanation(activeCase.transaction_id)
    }, 3200)
    timersRef.current.push(explTimer)

    return () => timersRef.current.forEach(clearTimeout)
  }, [activeCase?.transaction_id])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (!activeCase || exitDirection) return
      if (e.key === 'a' || e.key === 'ArrowLeft')  handleTriage('APPROVE')
      if (e.key === 'd' || e.key === 'ArrowRight') handleTriage('BLOCK')
      if (e.key === 'w' || e.key === 'ArrowUp')    handleTriage('ESCALATE')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeCase, exitDirection])

  const handleTriage = (decision) => {
    const dirMap = { APPROVE: 'approve', BLOCK: 'block', ESCALATE: 'escalate' }
    setExitDirection(dirMap[decision])
    setTimeout(() => triage(decision), 400)
  }

  if (!activeCase) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-400">
        <div className="text-5xl">🎉</div>
        <div className="text-xl font-semibold text-gray-600">Queue Empty</div>
        <div className="text-sm">All cases have been reviewed.</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 flex items-center justify-between px-6 py-3 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMode('queue')}
            className="text-sm font-semibold text-indigo-700"
          >
            Fraud Investigation
          </button>
        </div>
        <QueueCounter count={queue.length} />
        <div className="flex items-center gap-3">
          {lastTriagedTxId && (
            <button
              onClick={() => undoTriage()}
              className="text-xs px-3 py-1.5 rounded-lg text-gray-800 hover:text-gray-900 transition-colors flex items-center gap-1 bg-yellow-50 border border-yellow-200"
            >
              ↩ Undo
            </button>
          )}
          <button
            onClick={() => exportFlaggedCSV()}
            className="text-xs px-3 py-1.5 rounded-lg text-gray-800 hover:text-gray-900 transition-colors flex items-center gap-1"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            ↓ Export Flagged
          </button>
          <button
            onClick={() => setMode('history')}
            className="bg-white border border-gray-200 shadow-sm text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-800 transition-colors"
          >
            History
          </button>
        </div>
      </div>

      {/* Case content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCase.transaction_id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 max-w-4xl mx-auto"
          >
            <TransactionMeta tx={activeCase} />
            <JuryPanel tx={activeCase} phase={juryPhase} />

            <AnimatePresence>
              {juryPhase === 'complete' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  <ClaudeExplanation explanation={explanation} loading={loadingExpl} />
                  <EvidenceSection tx={activeCase} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Triage action cards */}
      <div className="bg-gray-50 border-t border-gray-200 shrink-0 px-6 py-4">
        <TriageHints onTriage={handleTriage} />
      </div>
    </div>
  )
}
