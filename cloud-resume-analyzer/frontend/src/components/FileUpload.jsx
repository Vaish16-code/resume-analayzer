import React, { useState, useRef } from "react"

const ALLOWED_EXTENSIONS = ["pdf", "docx", "txt"]
const MAX_SIZE_MB = 5

export default function FileUpload({ onFileSelect, file, isUploading }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  function handleFile(selected) {
    if (!selected) return
    const ext = selected.name.split(".").pop().toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      alert("Unsupported file type. Please upload PDF, DOCX, or TXT.")
      return
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`File too large. Maximum size is ${MAX_SIZE_MB} MB.`)
      return
    }
    onFileSelect(selected)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div
      className={`upload-zone ${dragOver ? "drag-over" : ""} ${file ? "border-primary-500/60 bg-primary-900/10" : ""}`}
      onDrop={onDrop}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onClick={() => !file && inputRef.current.click()}
    >
      <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" className="hidden"
        onChange={(e) => handleFile(e.target.files[0])} />

      {file ? (
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-primary-600/20 border border-primary-500/40 flex items-center justify-center text-3xl">
            {file.name.endsWith(".pdf") ? "📄" : file.name.endsWith(".docx") ? "📝" : "📃"}
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-100 truncate max-w-xs">{file.name}</p>
            <p className="text-sm text-slate-400 mt-1">{(file.size/1024).toFixed(1)} KB</p>
          </div>
          <button className="btn-secondary text-sm py-1.5 px-4"
            onClick={(e) => { e.stopPropagation(); onFileSelect(null) }}>
            ✕ Remove
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 pointer-events-none">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl bg-gradient-to-br from-primary-600/20 to-accent-purple/20 border border-white/10 ${dragOver ? "scale-110" : ""} transition-transform duration-200`}>
            {dragOver ? "⬇️" : "☁️"}
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-200">{dragOver ? "Drop your resume here" : "Upload your Resume"}</p>
            <p className="text-sm text-slate-400 mt-1">Drag & drop or click to browse</p>
            <p className="text-xs text-slate-500 mt-2">Supported: <span className="text-primary-400">PDF, DOCX, TXT</span>  •  Max {MAX_SIZE_MB} MB</p>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="absolute inset-0 rounded-2xl bg-dark-900/70 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-primary-300 font-medium">Uploading to S3…</p>
        </div>
      )}
    </div>
  )
}
