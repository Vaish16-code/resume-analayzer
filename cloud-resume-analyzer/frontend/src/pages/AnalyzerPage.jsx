import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import FileUpload from "../components/FileUpload"
import RoleSelector from "../components/RoleSelector"
import { getUploadUrl, uploadFileToS3, analyzeResume, IS_DEMO } from "../utils/api"
import { getUserId } from "../utils/helpers"

const STEPS = ["Upload Resume", "Select Role", "Analyze"]

export default function AnalyzerPage() {
  const navigate = useNavigate()
  const [file, setFile]                   = useState(null)
  const [selectedRole, setSelectedRole]   = useState("")
  const [step, setStep]                   = useState(0)
  const [isUploading, setIsUploading]     = useState(false)
  const [isAnalyzing, setIsAnalyzing]     = useState(false)
  const [statusMsg, setStatusMsg]         = useState("")

  async function handleAnalyze() {
    if (!file)         { toast.error("Please upload a resume first.");  return }
    if (!selectedRole) { toast.error("Please select a job role.");       return }

    const userId = getUserId()

    try {
      setIsUploading(true)
      setStatusMsg(IS_DEMO ? "Reading resume file…" : "Requesting upload URL from AWS…")
      const { uploadUrl, fileKey } = await getUploadUrl(file.name, file.type || "text/plain", userId)

      if (!IS_DEMO) {
        setStatusMsg("Uploading resume to S3 bucket…")
        await uploadFileToS3(uploadUrl, file)
        toast.success("Resume uploaded to S3 ✓")
      }
      setIsUploading(false)

      setIsAnalyzing(true)
      setStep(2)
      setStatusMsg(IS_DEMO ? "Running keyword analysis locally…" : "Running ATS keyword analysis on Lambda…")

      // Pass the raw file so demo mode can read its text
      const result = await analyzeResume(fileKey, selectedRole, userId, file.name, file)

      toast.success(IS_DEMO ? "Demo analysis complete! 🎉" : "Analysis complete! 🎉")
      navigate("/result", { state: { result } })
    } catch (err) {
      console.error(err)
      toast.error(err.message || "Something went wrong.")
    } finally {
      setIsUploading(false)
      setIsAnalyzing(false)
      setStatusMsg("")
    }
  }

  const isLoading = isUploading || isAnalyzing

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center animate-slide-up">
        <h1 className="text-4xl font-bold gradient-text">Resume Analyzer</h1>
        <p className="text-slate-400 mt-2">
          {IS_DEMO
            ? "Demo mode — analysis runs in your browser. Upload a TXT resume for best results."
            : "Upload your resume, pick a role, and get your ATS score instantly."}
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 animate-fade-in">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                ${step > i ? "bg-primary-500 text-white" : step === i ? "bg-primary-600/40 border-2 border-primary-500 text-primary-300" : "bg-dark-800 border border-white/10 text-slate-500"}`}>
                {step > i ? "✓" : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:block transition-colors duration-300
                ${step === i ? "text-primary-300" : step > i ? "text-slate-400" : "text-slate-600"}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${step > i ? "bg-primary-500" : "bg-white/10"}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Upload */}
      <div className="glass-card p-6 space-y-4 animate-slide-up delay-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-sm font-bold text-primary-400">1</div>
          <h2 className="font-semibold text-slate-100 text-lg">Upload Your Resume</h2>
        </div>
        {IS_DEMO && (
          <p className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
            💡 <strong>Demo tip:</strong> For best results upload a <strong>.txt</strong> file containing your resume text. PDF/DOCX content cannot be read in the browser — a score of 0 will result unless you use a TXT file.
          </p>
        )}
        <FileUpload
          onFileSelect={(f) => { setFile(f); if (f) setStep(Math.max(step, 1)) }}
          file={file}
          isUploading={isUploading}
        />
      </div>

      {/* Step 2: Role */}
      <div className="glass-card p-6 space-y-4 animate-slide-up delay-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-sm font-bold text-primary-400">2</div>
          <h2 className="font-semibold text-slate-100 text-lg">Select Target Job Role</h2>
        </div>
        <RoleSelector selectedRole={selectedRole} onSelect={(role) => { setSelectedRole(role); if (file) setStep(Math.max(step, 2)) }} />
      </div>

      {/* Step 3: Analyze */}
      <div className="glass-card p-6 space-y-4 animate-slide-up delay-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-sm font-bold text-primary-400">3</div>
          <h2 className="font-semibold text-slate-100 text-lg">Run ATS Analysis</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className={`badge ${file ? "badge-green" : "badge-red"}`}>{file ? `✓ ${file.name}` : "✘ No file selected"}</div>
          <div className={`badge ${selectedRole ? "badge-green" : "badge-red"}`}>{selectedRole ? `✓ ${selectedRole}` : "✘ No role selected"}</div>
        </div>
        {statusMsg && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-900/30 border border-primary-500/30 animate-fade-in">
            <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span className="text-sm text-primary-300">{statusMsg}</span>
          </div>
        )}
        <button
          id="analyze-btn"
          onClick={handleAnalyze}
          disabled={isLoading || !file || !selectedRole}
          className="btn-primary w-full justify-center py-4 text-lg"
        >
          {isLoading ? (
            <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing…</>
          ) : (
            <>🔍 Analyze My Resume</>
          )}
        </button>
      </div>
    </div>
  )
}
