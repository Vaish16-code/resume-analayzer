import React, { useEffect, useState } from "react"
import { useLocation, useNavigate, Link } from "react-router-dom"
import { toast } from "react-toastify"
import ScoreRing from "../components/ScoreRing"
import { downloadReport } from "../utils/api"
import { getScoreColor, formatDate } from "../utils/helpers"

export default function ResultPage() {
  const location = useLocation()
  const navigate  = useNavigate()
  const result    = location.state?.result
  const [downloading, setDownloading] = useState(false)
  const [activeTab, setActiveTab]     = useState("overview")

  useEffect(() => { if (!result) navigate("/analyze") }, [result, navigate])
  if (!result) return null

  const { score, selectedRole, resumeName, foundKeywords, missingKeywords,
      suggestions, tips, totalKeywords, analysisId, createdAt, isDemo, extractedEmail } = result
  const { text: scoreText } = getScoreColor(score)

  async function handleDownload() {
    try {
      setDownloading(true)
      const { downloadUrl, isDemo: demoDownload } = await downloadReport(analysisId)
      if (demoDownload) {
        // blob URL — trigger download directly
        const a = document.createElement("a")
        a.href = downloadUrl
        a.download = `ATS_Report_${analysisId}.txt`
        a.click()
        URL.revokeObjectURL(downloadUrl)
      } else {
        window.open(downloadUrl, "_blank")
      }
      toast.success("Report download started!")
    } catch (err) {
      toast.error("Download failed. " + err.message)
    } finally {
      setDownloading(false)
    }
  }

  const TABS = ["overview", "keywords", "suggestions", "tips"]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Analysis Result</h1>
          <p className="text-slate-400 mt-1 text-sm">{resumeName}  •  {selectedRole}  •  {formatDate(createdAt)}</p>
          {extractedEmail && <p className="text-slate-500 mt-1 text-xs">Extracted email: {extractedEmail}</p>}
          {isDemo && <span className="badge badge-yellow mt-1">🚀 Demo Mode</span>}
        </div>
        <div className="flex gap-3 flex-wrap">
          <button id="download-report-btn" onClick={handleDownload} disabled={downloading} className="btn-secondary text-sm">
            {downloading ? "⏳ Generating…" : "📥 Download Report"}
          </button>
          <Link to="/analyze" className="btn-primary text-sm">🔄 New Analysis</Link>
        </div>
      </div>

      {/* Score card */}
      <div className="glass-card p-8 animate-slide-up delay-100">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <ScoreRing score={score} size={180} />
          <div className="flex-1 space-y-4 w-full">
            <h2 className="text-2xl font-bold text-slate-100">{selectedRole}</h2>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">ATS Compatibility</span>
                <span className={`font-bold ${scoreText}`}>{score}%</span>
              </div>
              <div className="progress-bar-bg h-3">
                <div className={`progress-bar-fill h-full ${
                  score >= 80 ? "bg-gradient-to-r from-green-500 to-emerald-400" :
                  score >= 60 ? "bg-gradient-to-r from-yellow-500 to-orange-400" :
                  score >= 40 ? "bg-gradient-to-r from-orange-500 to-red-400" :
                               "bg-gradient-to-r from-red-500 to-red-600"
                }`} style={{ width: `${score}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Keywords", value: totalKeywords,           color: "text-slate-300" },
                { label: "Found",          value: foundKeywords.length,    color: "text-green-400" },
                { label: "Missing",        value: missingKeywords.length,  color: "text-red-400"   },
              ].map(({ label, value, color }) => (
                <div key={label} className="glass-card p-3 text-center">
                  <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
                  <div className="text-xs text-slate-400 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-dark-900/60 border border-white/10 animate-fade-in">
        {TABS.map(tab => (
          <button key={tab} id={`tab-${tab}`} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200
              ${activeTab === tab ? "bg-primary-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {activeTab === "overview" && (
          <div className="glass-card p-6 space-y-6">
            <h3 className="section-title">Score Breakdown</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Role Match",          value: `${score}%`,                              icon: "🎯" },
                { label: "Score Rating",         value: getScoreColor(score).label,              icon: "⭐" },
                { label: "Keywords Found",       value: `${foundKeywords.length} / ${totalKeywords}`, icon: "✅" },
                { label: "Improvement Needed",   value: `${missingKeywords.length} keywords`,   icon: "⚠️" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="glass-card p-4 flex items-center gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <div className="text-xs text-slate-400">{label}</div>
                    <div className="font-bold text-slate-100 mt-0.5">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "keywords" && (
          <div className="space-y-6">
            <div className="glass-card p-6 space-y-4">
              <h3 className="section-title flex items-center gap-2">
                <span className="text-green-400">✅</span> Found Keywords
                <span className="badge badge-green ml-2">{foundKeywords.length}</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {foundKeywords.length > 0
                  ? foundKeywords.map(kw => <span key={kw} className="chip-found">✓ {kw}</span>)
                  : <p className="text-slate-400 text-sm">No keywords matched. Try a TXT resume in demo mode.</p>}
              </div>
            </div>
            <div className="glass-card p-6 space-y-4">
              <h3 className="section-title flex items-center gap-2">
                <span className="text-red-400">❌</span> Missing Keywords
                <span className="badge badge-red ml-2">{missingKeywords.length}</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {missingKeywords.length > 0
                  ? missingKeywords.map(kw => <span key={kw} className="chip-missing">✘ {kw}</span>)
                  : <p className="text-green-400 text-sm">🎉 All keywords matched!</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === "suggestions" && (
          <div className="glass-card p-6 space-y-4">
            <h3 className="section-title">💡 Improvement Suggestions</h3>
            {suggestions.length > 0
              ? <div className="space-y-3">{suggestions.map((s, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20" style={{ animationDelay: `${i*60}ms` }}>
                    <div className="w-7 h-7 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-sm font-bold flex-shrink-0">{i+1}</div>
                    <p className="text-slate-300 text-sm leading-relaxed">{s}</p>
                  </div>
                ))}</div>
              : <p className="text-green-400">🎉 No improvements needed!</p>}
          </div>
        )}

        {activeTab === "tips" && (
          <div className="glass-card p-6 space-y-4">
            <h3 className="section-title">📋 General Resume Tips</h3>
            <div className="space-y-3">
              {tips.map((t, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl bg-primary-500/5 border border-primary-500/20" style={{ animationDelay: `${i*60}ms` }}>
                  <div className="w-7 h-7 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-sm font-bold flex-shrink-0">{i+1}</div>
                  <p className="text-slate-300 text-sm leading-relaxed">{t}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
