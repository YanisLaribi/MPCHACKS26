import { motion } from 'framer-motion'

const ACTION_COLORS = {
  BLOCK: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.25)', text: '#ef4444' },
  ESCALATE: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.25)', text: '#f59e0b' },
  APPROVE: { bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.25)', text: '#22c55e' },
}

// Translate complex technical ML feature names into plain English for non-tech people
const TECHNICAL_TRANSLATIONS = {
  opposite_channel_30min: "Mixed transaction types (e.g. paying online and in-store simultaneously)",
  opposite_channel_60min: "Mixed transaction types (e.g. paying online and in-store simultaneously)",
  opposite_channel_12hr: "Mixed transaction types (e.g. paying online and in-store simultaneously)",
  opposite_channel_1day: "Mixed transaction types (e.g. paying online and in-store simultaneously)",
  tx_velocity_30min: "High transaction speed (buying multiple things within 30 minutes)",
  tx_velocity_1hr: "High transaction speed (buying multiple things within an hour)",
  tx_velocity_1day: "High transaction speed (unusual amount of purchases in one day)",
  is_impossible_travel: "Impossible physical travel (card used in two different countries in less than 6 hours)",
  amount_vs_avg_ratio: "Unusually high price (spending way more than this card's normal average)",
  card_unique_ips_1day: "Suspicious device hopping (internet connection changed multiple times in a day)",
  ip_shared_with_multiple_cards: "Shared network (multiple different credit cards using the same internet connection)",
  unique_cards_on_device: "Shared device (this phone or computer is paying with multiple different cards)",
  country_mismatch: "Geography mismatch (merchant country is different from the cardholder's country)",
  ip_mismatch: "Network mismatch (internet country does not match the cardholder's home country)",
}

function getNonTechFriendlyName(techName) {
  if (!techName) return "";
  
  // Find substring match
  for (const [key, value] of Object.entries(TECHNICAL_TRANSLATIONS)) {
    if (techName.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Generic fallback if no mapping exists
  return techName.replace(/_/g, ' ');
}

function Skeleton({ lines = 3 }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded"
          style={{ background: 'rgba(0,0,0,0.04)', width: `${70 + (i % 3) * 10}%` }}
        />
      ))}
    </div>
  )
}

export default function ClaudeExplanation({ explanation, loading }) {
  const colors = ACTION_COLORS[explanation?.recommended_action] ?? ACTION_COLORS.ESCALATE

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 space-y-4 text-left"
    >
      <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Risk Assessment & AI Copilot</span>
        </div>
        <div className="text-[10px] text-gray-400 font-mono">Model: claude-3-5-sonnet</div>
      </div>

      {loading ? (
        <Skeleton lines={4} />
      ) : explanation ? (
        <div className="space-y-4">
          {/* Main Executive Summary */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Executive Summary</div>
            <p className="text-sm text-gray-900 font-medium leading-relaxed font-medium">{explanation.summary}</p>
          </div>

          {/* Fraud Type Classification */}
          {explanation.fraud_type && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Fraud Classification:</span>
              <span className="text-xs font-bold text-red-600 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20">
                {explanation.fraud_type}
              </span>
            </div>
          )}

          {/* Non-Technical Risk Breakdown (Plain English Translation) */}
          {explanation.why_suspicious?.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>💡</span> Why is this transaction flagged? (Non-Technical Explanation)
              </div>
              <div className="grid grid-cols-1 gap-2">
                {explanation.why_suspicious.map((r, i) => {
                  const plainEnglishReason = getNonTechFriendlyName(r);
                  return (
                    <div 
                      key={i} 
                      className="bg-gray-50 border border-gray-200 shadow-sm flex items-start gap-2.5 p-3 rounded-xl transition-all"
                    >
                      <span className="text-red-600 font-bold mt-0.5">•</span>
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-gray-800">{r}</div>
                        {plainEnglishReason && plainEnglishReason !== r && (
                          <div className="text-[11px] text-gray-500 font-medium italic">
                            Simple Translation: {plainEnglishReason}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">Detailed copilot explanation will appear shortly.</p>
      )}
    </motion.div>
  )
}
