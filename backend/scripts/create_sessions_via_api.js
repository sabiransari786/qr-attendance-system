const { execSync } = require('child_process');
const API_URL = process.env.API_URL || 'https://qr-attendance-system-sw08.onrender.com/api';

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) {
    return e.stdout ? e.stdout.toString() : e.message;
  }
}

console.log('Logging in as demo teacher...');
const loginCmd = `curl -s -X POST "${API_URL}/auth/login" -H "Content-Type: application/json" -d '{"email":"teacher@demo.com","password":"demo1234"}'`;
const loginRes = run(loginCmd);
let token = '';
try { token = JSON.parse(loginRes).data.token; } catch(e) { console.error('Login failed:', loginRes); process.exit(1); }
console.log('Token obtained. Fetching courses...');
const coursesRes = run(`curl -s -X GET "${API_URL}/faculty/my-courses" -H "Authorization: Bearer ${token}"`);
let courses = [];
try { courses = JSON.parse(coursesRes).data || []; } catch(e) { console.error('Failed to parse courses:', coursesRes); process.exit(1); }
console.log(`Fetched ${courses.length} courses. Creating sessions...`);

let created = 0;
for (let i = 0; i < courses.length; i++) {
  const c = courses[i];
  const subject = `${c.name} (${c.code})`;
  const start = new Date(); start.setDate(start.getDate() + 1 + i);
  start.setHours(10, 0, 0, 0);
  const startIso = start.toISOString();
  const duration = 60;
  const payload = JSON.stringify({ subject, location: 'Room 101', startTime: startIso, duration });
  const cmd = `curl -s -X POST "${API_URL}/session" -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" -d '${payload}'`;
  const out = run(cmd);
  try {
    const j = JSON.parse(out);
    if (j && j.success) { created++; console.log(`Created: ${subject}`); }
    else console.log(`Skipped/Failed: ${subject} — ${out}`);
  } catch (e) { console.log(`Unexpected response for ${subject}: ${out}`); }
}

console.log(`Done. Created ${created} sessions.`);
