/** Available job roles and their color themes */
export const JOB_ROLES = [
  { id: 'frontend',   label: 'Frontend Developer',   icon: '🎨', color: 'from-blue-500 to-cyan-500' },
  { id: 'backend',    label: 'Backend Developer',    icon: '⚙️', color: 'from-green-500 to-emerald-500' },
  { id: 'fullstack',  label: 'Full Stack Developer', icon: '🔗', color: 'from-purple-500 to-pink-500' },
  { id: 'java',       label: 'Java Developer',       icon: '☕', color: 'from-orange-500 to-red-500' },
  { id: 'python',     label: 'Python Developer',     icon: '🐍', color: 'from-yellow-500 to-orange-500' },
  { id: 'data',       label: 'Data Analyst',         icon: '📊', color: 'from-teal-500 to-cyan-500' },
  { id: 'cloud',      label: 'Cloud Engineer',       icon: '☁️', color: 'from-sky-500 to-blue-500' },
  { id: 'devops',     label: 'DevOps Engineer',      icon: '🚀', color: 'from-indigo-500 to-purple-500' },
];

export const ROLE_LABEL_MAP = {
  frontend:  'Frontend Developer',
  backend:   'Backend Developer',
  fullstack: 'Full Stack Developer',
  java:      'Java Developer',
  python:    'Python Developer',
  data:      'Data Analyst',
  cloud:     'Cloud Engineer',
  devops:    'DevOps Engineer',
};

export function getScoreColor(score) {
  if (score >= 80) return { text: 'text-green-400',  bg: 'bg-green-400',  ring: 'ring-green-400',  label: 'Excellent' };
  if (score >= 60) return { text: 'text-yellow-400', bg: 'bg-yellow-400', ring: 'ring-yellow-400', label: 'Good' };
  if (score >= 40) return { text: 'text-orange-400', bg: 'bg-orange-400', ring: 'ring-orange-400', label: 'Fair' };
  return              { text: 'text-red-400',    bg: 'bg-red-400',    ring: 'ring-red-400',    label: 'Needs Work' };
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function getUserId() {
  let id = localStorage.getItem('ats_user_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('ats_user_id', id);
  }
  return id;
}
