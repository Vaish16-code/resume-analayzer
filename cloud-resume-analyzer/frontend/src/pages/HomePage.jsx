import React from "react"
import { Link } from "react-router-dom"
import { IS_DEMO } from "../utils/api"

const STATS = [
  { value: "8+",   label: "Job Roles" },
  { value: "100+", label: "Keywords" },
  { value: "Free", label: "Forever" },
  { value: "AWS",  label: "Powered" },
]

const FEATURES = [
  { icon: "📤", title: "Upload Resume",     desc: "Upload PDF, DOCX, or TXT. Stored securely in AWS S3 via pre-signed URL.", color: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/25" },
  { icon: "🎯", title: "Select Job Role",   desc: "Choose from 8 popular tech roles, each with a curated keyword list.",      color: "from-purple-500/20 to-purple-600/10", border: "border-purple-500/25" },
  { icon: "🔍", title: "Keyword Analysis",  desc: "Deterministic keyword matching compares your resume to role requirements.", color: "from-cyan-500/20 to-cyan-600/10",   border: "border-cyan-500/25" },
  { icon: "📊", title: "ATS Score",         desc: "Get an instant ATS compatibility score shown on an animated ring.",         color: "from-green-500/20 to-green-600/10", border: "border-green-500/25" },
  { icon: "💡", title: "Improvement Tips",  desc: "Actionable suggestions to add missing keywords and improve your resume.",   color: "from-yellow-500/20 to-yellow-600/10", border: "border-yellow-500/25" },
  { icon: "📥", title: "Download Report",   desc: "Save your full analysis report as a downloadable text file.",              color: "from-pink-500/20 to-pink-600/10",   border: "border-pink-500/25" },
]

const ARCH_STEPS = [
  { icon: "🖥️", label: "React Frontend" },
  { icon: "🌐", label: "API Gateway" },
  { icon: "⚡", label: "AWS Lambda" },
  { icon: "🗄️", label: "DynamoDB" },
  { icon: "🪣", label: "S3 Bucket" },
]

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-24">

      {/* HERO */}
      <section className="text-center space-y-8 animate-slide-up">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-900/40 border border-primary-500/30 text-primary-300 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse-slow"></span>
          {IS_DEMO ? "Demo Mode — Works without AWS" : "AWS Lambda + Terraform Powered"}
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight">
          <span className="gradient-text">Cloud ATS</span>
          <br />
          <span className="text-slate-100">Resume Analyzer</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Upload your resume, select a target role, and instantly get your
          <span className="text-primary-400 font-semibold"> ATS score</span>,
          missing skills, and <span className="text-accent-cyan font-semibold">actionable improvements</span>.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/analyze" id="hero-analyze-btn" className="btn-primary text-lg px-8 py-4">
            🚀 Analyze My Resume
          </Link>
          <Link to="/history" className="btn-secondary text-lg px-8 py-4">
            📋 View History
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mt-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="glass-card p-4 text-center">
              <div className="text-2xl font-bold gradient-text">{value}</div>
              <div className="text-xs text-slate-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-100">How It Works</h2>
          <p className="text-slate-400 mt-2">Six simple steps from upload to report</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon, title, desc, color, border }, i) => (
            <div key={title} className="glass-card-hover p-6 space-y-4 animate-slide-up" style={{ animationDelay: `${i*80}ms` }}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} border ${border} flex items-center justify-center text-2xl`}>{icon}</div>
              <div>
                <h3 className="font-semibold text-slate-100 text-lg">{title}</h3>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-100">AWS Architecture</h2>
          <p className="text-slate-400 mt-2">Serverless, scalable, and free-tier friendly</p>
        </div>
        <div className="glass-card p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {ARCH_STEPS.map(({ icon, label }, i) => (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600/20 to-accent-purple/20 border border-white/10 flex items-center justify-center text-3xl hover:scale-110 transition-transform">{icon}</div>
                  <span className="text-xs text-slate-400 font-medium text-center">{label}</span>
                </div>
                {i < ARCH_STEPS.length - 1 && <div className="text-primary-400 text-2xl hidden sm:block">→</div>}
              </React.Fragment>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-8 pt-6 border-t border-white/10">
            {["Lambda","API Gateway","S3","DynamoDB","CloudWatch","IAM","Terraform"].map(s => (
              <span key={s} className="badge badge-blue">{s}</span>
            ))}
          </div>
        </div>
      </section>

      <footer className="text-center text-slate-500 text-sm pb-8 space-y-2">
        <p>☁️ Cloud ATS Resume Analyzer — Built with AWS Lambda, S3, DynamoDB & Terraform</p>
        <p>Fully serverless • Free-tier friendly • No AI/ML — pure keyword matching</p>
      </footer>
    </div>
  )
}
