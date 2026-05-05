/**
 * API Utility — centralises all calls to the backend.
 * Set VITE_API_URL in your .env file to the API Gateway endpoint.
 * If VITE_API_URL is not set or equals the placeholder, DEMO MODE runs locally.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

// Demo mode: true when no real API URL is configured
export const IS_DEMO = !API_BASE || API_BASE.includes('your-api-id') || API_BASE.includes('YOUR_API');

// ─── DEMO keyword database (mirrors Lambda) ───────────────────
const ROLE_KEYWORDS = {
  'Frontend Developer':   ['html','css','javascript','react','redux','tailwind','responsive','git','webpack','typescript','vue','angular','sass','rest api','jest','accessibility','figma'],
  'Backend Developer':    ['node.js','express','python','django','rest api','sql','postgresql','mongodb','redis','docker','git','aws','microservices','jwt','authentication','linux','kafka'],
  'Full Stack Developer': ['react','node.js','express','mongodb','sql','rest api','html','css','javascript','typescript','docker','git','aws','redux','postgresql','linux','microservices'],
  'Java Developer':       ['java','spring','spring boot','sql','rest api','git','aws','microservices','hibernate','maven','gradle','junit','kafka','docker','linux','multithreading','jpa'],
  'Python Developer':     ['python','django','flask','fastapi','sql','pandas','numpy','rest api','git','docker','aws','postgresql','celery','redis','linux','pytest','sqlalchemy'],
  'Data Analyst':         ['excel','sql','python','pandas','tableau','power bi','data visualization','statistics','machine learning','numpy','matplotlib','r','google analytics','etl','git'],
  'Cloud Engineer':       ['aws','terraform','iam','s3','lambda','cloudwatch','vpc','api gateway','docker','kubernetes','linux','ec2','rds','cloudformation','ansible','ci/cd','route 53','load balancer'],
  'DevOps Engineer':      ['docker','kubernetes','ci/cd','jenkins','git','aws','terraform','ansible','linux','bash','prometheus','grafana','nginx','helm','vault','github actions','monitoring','logging'],
};

const SUGGESTIONS_MAP = {
  'aws':          'Add cloud projects using AWS services (S3, Lambda, EC2, etc.).',
  'terraform':    'Mention Infrastructure-as-Code experience using Terraform.',
  'git':          'Include version control experience with Git/GitHub in your projects.',
  'docker':       'Add containerisation experience using Docker.',
  'kubernetes':   'Mention container orchestration skills with Kubernetes.',
  'react':        'Add frontend projects built with React.js.',
  'node.js':      'Include backend projects built with Node.js and Express.',
  'python':       'Highlight Python projects or scripts in your experience.',
  'java':         'Showcase Java applications or enterprise projects.',
  'spring boot':  'Add a Spring Boot microservice or REST API project.',
  'sql':          'Mention relational database experience (MySQL, PostgreSQL).',
  'postgresql':   'Include PostgreSQL projects in your portfolio.',
  'mongodb':      'Add NoSQL database experience using MongoDB.',
  'rest api':     'Describe REST API design or integration experience.',
  'typescript':   'Refactor a project to TypeScript and mention it.',
  'ci/cd':        'Describe CI/CD pipelines you have set up (GitHub Actions, Jenkins).',
  'linux':        'Mention Linux/Unix command-line skills.',
  'microservices':'Describe microservices architecture experience.',
  'html':         'Ensure your resume explicitly mentions HTML5.',
  'css':          'Mention CSS, Flexbox/Grid skills.',
  'javascript':   'Highlight JavaScript experience with concrete projects.',
  'tailwind':     'Add Tailwind CSS to a frontend project.',
  'pandas':       'Use pandas for a data cleaning/analysis project.',
  'ansible':      'Write Ansible playbooks for configuration management.',
};

function genericSuggestion(kw) {
  return `Gain hands-on experience with "${kw}" and add it to your resume with examples.`;
}

function generalTips(score) {
  if (score >= 80) return [
    'Great ATS compatibility! Tailor the resume further for each specific job posting.',
    'Keep bullet points results-oriented (quantify achievements).',
    'Ensure consistent formatting and no spelling errors.',
  ];
  if (score >= 50) return [
    'Add more role-relevant keywords naturally in your experience section.',
    'Use a single-column layout for better ATS parsing.',
    'Replace generic phrases with specific technical accomplishments.',
  ];
  return [
    'Your resume needs significant keyword optimisation for this role.',
    'Start by adding a dedicated Skills section listing missing keywords.',
    'Build 1-2 projects showcasing the missing technologies.',
    'Use action verbs: Built, Developed, Designed, Optimised, Deployed.',
  ];
}

function runDemoAnalysis(resumeText, selectedRole, userId, resumeName) {
  const keywords = ROLE_KEYWORDS[selectedRole] || [];
  const text = resumeText.toLowerCase().replace(/[^\w\s.+#]/g, ' ');
  const found = [];
  const missing = [];
  keywords.forEach(kw => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[\\s,;:()])${escaped}([\\s,;:()]|$)`, 'i');
    if (regex.test(text)) found.push(kw); else missing.push(kw);
  });
  const score = keywords.length > 0 ? Math.round((found.length / keywords.length) * 100) : 0;
  const suggestions = missing.map(kw => SUGGESTIONS_MAP[kw] || genericSuggestion(kw));
  const tips = generalTips(score);
  return {
    analysisId:      'demo-' + Date.now(),
    userId,
    resumeName,
    selectedRole,
    score,
    totalKeywords:   keywords.length,
    foundKeywords:   found,
    missingKeywords: missing,
    suggestions,
    tips,
    roleMatchPercent: score,
    createdAt:       new Date().toISOString(),
    isDemo:          true,
  };
}

// ─────────────────────────────────────────────────────────────
// PUBLIC API FUNCTIONS
// ─────────────────────────────────────────────────────────────

export async function getUploadUrl(fileName, fileType, userId = 'demo-user') {
  if (IS_DEMO) return { uploadUrl: null, fileKey: `demo/${userId}/${fileName}`, isDemo: true };
  const res = await fetch(`${API_BASE}/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, fileType, userId }),
  });
  if (!res.ok) throw new Error('Failed to get upload URL');
  return res.json();
}

export async function uploadFileToS3(uploadUrl, file) {
  if (!uploadUrl) return true; // demo mode — skip
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error('Failed to upload file to S3');
  return true;
}

export async function analyzeResume(fileKey, selectedRole, userId = 'demo-user', resumeName = 'resume', file = null) {
  if (IS_DEMO) {
    // Read file text in browser and run analysis locally
    await new Promise(r => setTimeout(r, 1200)); // fake latency
    let text = '';
    if (file) {
      text = await file.text().catch(() => '');
    }
    const result = runDemoAnalysis(text, selectedRole, userId, resumeName);
    // Save to localStorage for history
    const history = JSON.parse(localStorage.getItem('ats_history') || '[]');
    history.unshift(result);
    localStorage.setItem('ats_history', JSON.stringify(history.slice(0, 20)));
    return result;
  }
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileKey, selectedRole, userId, resumeName }),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Analysis failed'); }
  return res.json();
}

export async function getHistory(userId = 'demo-user') {
  if (IS_DEMO) {
    await new Promise(r => setTimeout(r, 400));
    const history = JSON.parse(localStorage.getItem('ats_history') || '[]');
    return { count: history.length, analyses: history };
  }
  const res = await fetch(`${API_BASE}/history?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export async function downloadReport(analysisId) {
  if (IS_DEMO) {
    // Build a plain-text report in the browser
    const history = JSON.parse(localStorage.getItem('ats_history') || '[]');
    const a = history.find(h => h.analysisId === analysisId);
    if (!a) throw new Error('Analysis not found in demo history.');
    const text = [
      '='.repeat(50),
      '   CLOUD ATS RESUME ANALYZER — DEMO REPORT',
      '='.repeat(50),
      `Resume    : ${a.resumeName}`,
      `Role      : ${a.selectedRole}`,
      `ATS Score : ${a.score}%`,
      `Generated : ${a.createdAt}`,
      '',
      'FOUND KEYWORDS',
      '-'.repeat(50),
      ...(a.foundKeywords.map(k => `  ✔  ${k}`)),
      '',
      'MISSING KEYWORDS',
      '-'.repeat(50),
      ...(a.missingKeywords.map(k => `  ✘  ${k}`)),
      '',
      'SUGGESTIONS',
      '-'.repeat(50),
      ...(a.suggestions.map((s, i) => `  ${i+1}. ${s}`)),
      '',
      '='.repeat(50),
      '  [DEMO MODE] Deploy to AWS to enable cloud storage.',
      '='.repeat(50),
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    return { downloadUrl: url, isDemo: true };
  }
  const res = await fetch(`${API_BASE}/report?analysisId=${encodeURIComponent(analysisId)}`);
  if (!res.ok) throw new Error('Failed to generate report');
  return res.json();
}

export async function sendReportEmail(analysisId, email) {
  if (IS_DEMO) {
    // Demo mode: simulate sending email
    await new Promise(r => setTimeout(r, 800));
    return {
      success: true,
      message: `[DEMO] Report would be sent to: ${email}`,
      email,
      analysisId,
    };
  }
  const res = await fetch(`${API_BASE}/send-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysisId, email }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to send report');
  }
  return res.json();
}
