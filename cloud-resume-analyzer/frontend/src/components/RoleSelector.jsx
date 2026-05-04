import React from "react"
import { JOB_ROLES } from "../utils/helpers"

export default function RoleSelector({ selectedRole, onSelect }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {JOB_ROLES.map((role) => {
          const isSelected = selectedRole === role.label
          return (
            <button
              key={role.id}
              id={`role-${role.id}`}
              type="button"
              onClick={() => onSelect(role.label)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 text-center group
                ${isSelected
                  ? "bg-primary-600/20 border-primary-500/60 shadow-lg shadow-primary-900/30"
                  : "bg-dark-900/40 border-white/10 hover:border-white/20 hover:bg-dark-800/60"
                }`}
            >
              <span className={`text-2xl transition-transform duration-200 group-hover:scale-110 ${isSelected ? "scale-110" : ""}`}>{role.icon}</span>
              <span className={`text-xs font-semibold leading-tight ${isSelected ? "text-primary-300" : "text-slate-400"}`}>{role.label}</span>
              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>
      {selectedRole && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-900/30 border border-primary-500/30 animate-fade-in">
          <span className="text-primary-400 text-sm">✓ Selected:</span>
          <span className="text-white font-semibold text-sm">{selectedRole}</span>
        </div>
      )}
    </div>
  )
}
