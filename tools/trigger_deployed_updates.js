#!/usr/bin/env node
/*
  Usage:
    DEPLOYMENT_URL=https://your-app.com ADMIN_JWT=ey... node tools/trigger_deployed_updates.js

  This script POSTS to two admin endpoints on your deployed backend:
    POST /api/admin/import-diploma-courses
    POST /api/admin/fix-sessions

  Both endpoints require an admin-authenticated JWT passed as `Authorization: Bearer <token>`.
*/

const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL;
const ADMIN_JWT = process.env.ADMIN_JWT;

if (!DEPLOYMENT_URL || !ADMIN_JWT) {
  console.error('Missing DEPLOYMENT_URL or ADMIN_JWT. Example: DEPLOYMENT_URL=https://app.example.com ADMIN_JWT=ey... node tools/trigger_deployed_updates.js');
  process.exit(1);
}

async function post(path) {
  const url = new URL(path, DEPLOYMENT_URL).toString();
  console.log('POST', url);
  const res = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${ADMIN_JWT}`, 'Content-Type': 'application/json' } });
  const text = await res.text();
  let body = text;
  try { body = JSON.parse(text); } catch (e) {}
  return { status: res.status, body };
}

(async () => {
  try {
    console.log('Calling import-diploma-courses...');
    const a = await post('/api/admin/import-diploma-courses');
    console.log('Response:', a.status, a.body);

    console.log('Calling fix-sessions...');
    const b = await post('/api/admin/fix-sessions');
    console.log('Response:', b.status, b.body);

    console.log('Done. If responses show success, deployed DB is updated.');
  } catch (err) {
    console.error('Error calling deployed endpoints:', err);
    process.exit(2);
  }
})();
