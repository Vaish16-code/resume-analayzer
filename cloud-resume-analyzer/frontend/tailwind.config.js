export default {
  content: ["./index.html","./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: { 50:"#eff6ff",100:"#dbeafe",300:"#93c5fd",400:"#60a5fa",500:"#3b82f6",600:"#2563eb",700:"#1d4ed8",900:"#1e3a8a" },
        dark:    { 800:"#1e293b",900:"#0f172a",950:"#020617" },
        accent:  { cyan:"#06b6d4", purple:"#8b5cf6" },
      },
      fontFamily: { sans: ["Inter","system-ui","sans-serif"], mono: ["JetBrains Mono","monospace"] },
    },
  },
  plugins: [],
}