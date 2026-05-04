import React from "react"
import { getScoreColor } from "../utils/helpers"

export default function ScoreRing({ score, size = 160 }) {
  const { text, label } = getScoreColor(score)
  const radius = (size / 2) - 12
  const circumference = 2 * Math.PI * radius
  const progress = circumference - (score / 100) * circumference
  const gradId = `scoreGrad-${size}`

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
          <circle
            cx={size/2} cy={size/2} r={radius} fill="none"
            stroke={`url(#${gradId})`} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={progress}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold font-mono ${text}`}>{score}</span>
          <span className="text-xs text-slate-400 font-semibold mt-0.5">ATS Score</span>
        </div>
      </div>
      <div className={`badge text-sm font-semibold px-4 py-1.5 ${
        score >= 80 ? "badge-green" :
        score >= 60 ? "badge-yellow" :
        score >= 40 ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
        "badge-red"
      }`}>{label}</div>
    </div>
  )
}
