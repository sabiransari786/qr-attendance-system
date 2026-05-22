const { execSync } = require('child_process');
const API_URL = process.env.API_URL || 'https://qr-attendance-system-sw08.onrender.com/api';

function run(cmd) {
  try { return execSync(cmd, { encoding: 'utf8' }); }
  catch (e) { return e.stdout ? e.stdout.toString() : e.message; }
}

console.log('Logging in as demo teacher...');
const login = run(`curl -s -X POST "${API_URL}/auth/login" -H "Content-Type: application/json" -d '{"email":"teacher@demo.com","password":"demo1234"}'`);
let token = '';
try { token = JSON.parse(login).data.token; } catch (e) { console.error('Login failed:', login); process.exit(1); }

console.log('Fetching teacher courses...');
const coursesRaw = run(`curl -s -X GET "${API_URL}/faculty/my-courses" -H "Authorization: Bearer ${token}"`);
let courses = [];
try { courses = JSON.parse(coursesRaw).data || []; } catch (e) { console.error('Failed to parse courses:', coursesRaw); process.exit(1); }

console.log('Fetching teacher upcoming sessions...');
const sessionsRaw = run(`curl -s -X GET "${API_URL}/session/active" -H "Authorization: Bearer ${token}"`);
let sessions = [];
try { sessions = JSON.parse(sessionsRaw).data || []; } catch (e) { sessions = []; }

const existingCourseIds = new Set(sessions.map(s => s.course_id).filter(Boolean));

let created = 0;
for (let i = 0; i < courses.length; i++) {
  const c = courses[i];
  if (existingCourseIds.has(c.id)) {
    console.log(`Skipping (already has active session): ${c.name} (${c.code})`);
    continue;
  }
  const subject = `${c.name} (${c.code})`;
  const start = new Date(); start.setDate(start.getDate() + 1 + i);
  start.setHours(10, 0, 0, 0);
  const startIso = start.toISOString();
  const duration = 60;
  const payload = JSON.stringify({ subject, location: 'Room 101', startTime: startIso, duration });
  const out = run(`curl -s -X POST "${API_URL}/session" -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" -d '${payload}'`);
  try {
    const j = JSON.parse(out);
    if (j && j.success) { created++; console.log(`Created: ${subject}`); }
    else console.log(`Failed to create: ${subject} — ${out}`);
  } catch (e) { console.log(`Unexpected response for ${subject}: ${out}`); }
}

console.log(`Done. Created ${created} new sessions.`);
