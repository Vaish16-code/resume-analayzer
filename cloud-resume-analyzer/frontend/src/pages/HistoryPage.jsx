import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { toast } from "react-toastify"
import { getHistory, downloadReport, IS_DEMO } from "../utils/api"
import { getUserId, getScoreColor, formatDate } from "../utils/helpers"
import ScoreRing from "../components/ScoreRing"

export default function HistoryPage() {
  const [analyses, setAnalyses]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [expanded, setExpanded]   = useState(null)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const userId = getUserId()
        const data = await getHistory(userId)
        setAnalyses(data.analyses || [])
      } catch (err) {
        toast.error("Failed to load history.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  async function handleDownload(analysisId) {
    try {
      setDownloading(analysisId)
      const { downloadUrl, isDemo: demoDownload } = await downloadReport(analysisId)
      if (demoDownload) {
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
      toast.error("Download failed.")
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Analysis History</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {IS_DEMO ? "Stored locally in your browser (demo mode)" : "Fetched from DynamoDB"}
          </p>
        </div>
        <Link to="/analyze" className="btn-primary text-sm">+ New Analysis</Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">{IS_DEMO ? "Loading local history…" : "Loading from DynamoDB…"}</p>
        </div>
      ) : analyses.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-4 animate-fade-in">
          <div className="text-6xl">📋</div>
          <h2 className="text-xl font-semibold text-slate-300">No analyses yet</h2>
          <p className="text-slate-400">Upload your first resume to see your history here.</p>
          <Link to="/analyze" className="btn-primary inline-flex mt-2">🚀 Analyze Now</Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 animate-slide-up">
            {[
              { label: "Total Analyses", value: analyses.length,                                                         icon: "📊" },
              { label: "Best Score",     value: `${Math.max(...analyses.map(a => a.score))}%`,                           icon: "🏆" },
              { label: "Avg Score",      value: `${Math.round(analyses.reduce((s,a) => s+a.score,0)/analyses.length)}%`, icon: "📈" },
            ].map(({ label, value, icon }) => (
              <div key={label} className="glass-card p-4 text-center">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xl font-bold gradient-text">{value}</div>
                <div className="text-xs text-slate-400 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {analyses.map((analysis, idx) => {
            const { text: scoreText } = getScoreColor(analysis.score)
            const isExpanded    = expanded === analysis.analysisId
            const isDownloading = downloading === analysis.analysisId

            return (
              <div key={analysis.analysisId} className="glass-card-hover animate-slide-up" style={{ animationDelay: `${idx*60}ms` }}>
                <div className="p-5 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : analysis.analysisId)}>
                  <ScoreRing score={analysis.score} size={72} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-100 truncate">{analysis.resumeName || "Untitled Resume"}</p>
                    <p className="text-sm text-slate-400 mt-0.5">{analysis.selectedRole}</p>
                    {analysis.extractedEmail && <p className="text-xs text-slate-500 mt-1 truncate">{analysis.extractedEmail}</p>}
                    <p className="text-xs text-slate-500 mt-1">{formatDate(analysis.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-2xl font-bold font-mono ${scoreText}`}>{analysis.score}%</span>
                    <div className="text-slate-400 text-xs">{isExpanded ? "▲ Less" : "▼ More"}</div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/10 p-5 space-y-4 animate-fade-in">
                    <div>
                      <p className="text-xs text-slate-400 mb-2 font-semibold">FOUND KEYWORDS</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(analysis.foundKeywords || []).map(kw => <span key={kw} className="chip-found text-xs">{kw}</span>)}
                        {(analysis.foundKeywords || []).length === 0 && <span className="text-slate-500 text-xs">None matched</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2 font-semibold">MISSING KEYWORDS</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(analysis.missingKeywords || []).map(kw => <span key={kw} className="chip-missing text-xs">{kw}</span>)}
                        {(analysis.missingKeywords || []).length === 0 && <span className="text-green-400 text-xs">All matched ✓</span>}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => handleDownload(analysis.analysisId)} disabled={isDownloading} className="btn-secondary text-xs py-2 px-4">
                        {isDownloading ? "⏳ Generating…" : "📥 Download Report"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
