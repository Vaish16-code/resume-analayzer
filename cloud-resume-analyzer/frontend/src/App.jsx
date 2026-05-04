import React from "react"
import { Routes, Route } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import Navbar from "./components/Navbar"
import HomePage from "./pages/HomePage"
import AnalyzerPage from "./pages/AnalyzerPage"
import ResultPage from "./pages/ResultPage"
import HistoryPage from "./pages/HistoryPage"
import { IS_DEMO } from "./utils/api"

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {IS_DEMO && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-center">
          <span className="text-yellow-300 text-sm">
            🚀 <strong>Demo Mode</strong> — No AWS needed. Analysis runs in your browser. Upload a <strong>.txt</strong> resume for best results.
          </span>
        </div>
      )}
      <main className="flex-1">
        <Routes>
          <Route path="/"        element={<HomePage />} />
          <Route path="/analyze" element={<AnalyzerPage />} />
          <Route path="/result"  element={<ResultPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
      <ToastContainer position="bottom-right" autoClose={4000} theme="dark" newestOnTop />
    </div>
  )
}