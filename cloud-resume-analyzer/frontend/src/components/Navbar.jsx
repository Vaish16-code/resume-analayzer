import React, { useState } from "react"
import { Link, useLocation } from "react-router-dom"

const NAV_LINKS = [
  { to: "/",        label: "Home",     icon: "🏠" },
  { to: "/analyze", label: "Analyzer", icon: "🔍" },
  { to: "/history", label: "History",  icon: "📋" },
]

export default function Navbar() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-dark-900/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-lg shadow-lg group-hover:scale-105 transition-transform">
              ☁️
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg gradient-text">Cloud ATS</span>
              <span className="text-slate-400 text-sm ml-2">Resume Analyzer</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                className={`nav-link ${location.pathname === to ? "active" : ""}`}
              >
                <span>{icon}</span>
                {label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="badge badge-blue">⚡ AWS Powered</span>
            <Link to="/analyze" className="btn-primary py-2 px-4 text-sm">
              Analyze Resume
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden px-4 pb-4 border-t border-white/10 animate-fade-in">
          <div className="flex flex-col gap-1 mt-3">
            {NAV_LINKS.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                className={`nav-link ${location.pathname === to ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                <span>{icon}</span>
                {label}
              </Link>
            ))}
            <Link to="/analyze" className="btn-primary mt-2 justify-center" onClick={() => setMenuOpen(false)}>
              Analyze Resume
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
