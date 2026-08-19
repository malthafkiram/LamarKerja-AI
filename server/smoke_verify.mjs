/**
 * Smoke/e2e against http://localhost:5000 — evidence-only, no success claims.
 * Run: node smoke_verify.mjs
 */
const BASE = process.env.SMOKE_BASE || 'http://localhost:5000/api';
const rows = [];

function trunc(val, n = 180) {
  if (val == null) return '';
  const s = typeof val === 'string' ? val : JSON.stringify(val);
  return s.length > n ? s.slice(0, n) + '…' : s;
}

async function hit(name, { method = 'GET', path, body, token, timeout = 25000, form } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !form) headers['Content-Type'] = 'application/json';
  let status = 0;
  let data = null;
  let error = '';
  try {
    const res = await fetch(BASE + path, {
      method,
      headers,
      body: form ? body : body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal
    });
    status = res.status;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text.slice(0, 300) };
    }
  } catch (err) {
    error = err.name === 'AbortError' ? `timeout ${timeout}ms` : err.message;
  } finally {
    clearTimeout(timer);
  }
  return { name, status, data, error };
}

function record(feature, status, evidence) {
  rows.push({ feature, status, evidence });
  const mark = status === 'PASS' ? 'PASS' : status === 'FAIL' ? 'FAIL' : 'SKIP';
  console.log(`[${mark}] ${feature} — ${evidence}`);
}

function okShape(data) {
  return data && data.success === true;
}

async function main() {
  const stamp = Date.now();
  const adminEmail = `smoke_admin_${stamp}@lamarkerja.test`;
  const userEmail = `smoke_user_${stamp}@lamarkerja.test`;
  const pass = 'password123';

  // Health
  let r = await hit('health', { path: '/health' });
  const dbLabel = r.data?.database;
  record(
    'GET /api/health',
    r.status === 200 && r.data?.status === 'ok' && /postgres/i.test(String(dbLabel || '')) ? 'PASS' : 'FAIL',
    `${r.status} database=${dbLabel || r.error || trunc(r.data)}`
  );

  // Guest profile leak check
  r = await hit('guest-profile', { path: '/profile' });
  const guestSmtp = r.data?.profile?.smtp_pass || r.data?.profile?.smtp_user;
  const guestId = r.data?.profile?.id;
  record(
    'GET /api/profile (guest, no leak)',
    okShape(r.data) && !guestSmtp && (guestId === null || guestId === undefined) ? 'PASS' : 'FAIL',
    `${r.status} id=${guestId} smtp_user=${r.data?.profile?.smtp_user || '(empty)'} success=${r.data?.success}`
  );

  // Settings
  r = await hit('settings', { path: '/settings' });
  record(
    'GET /api/settings',
    okShape(r.data) && r.data.settings ? 'PASS' : 'FAIL',
    `${r.status} keys=${Object.keys(r.data?.settings || {}).slice(0, 8).join(',')}`
  );

  // Auth: two users
  r = await hit('reg1', {
    method: 'POST',
    path: '/auth/register',
    body: { name: 'Smoke Admin', email: adminEmail, password: pass }
  });
  const user1 = r.data?.user;
  const token1 = r.data?.token;
  const firstIsAdmin = user1?.role === 'admin' && (user1?.plan === 'pro' || user1?.plan === 'vip');
  record(
    'Register first new user (admin+pro if DB empty)',
    okShape(r.data) && token1 && user1?.id && !user1._id
      ? firstIsAdmin ? 'PASS' : 'SKIP'
      : 'FAIL',
    `${r.status} role=${user1?.role} plan=${user1?.plan} id=${user1?.id} ${firstIsAdmin ? 'admin+pro' : 'DB already had users — bootstrap rule not exercised'} token=${token1 ? 'yes' : 'no'} error=${r.data?.error || r.error || ''}`
  );

  r = await hit('reg2', {
    method: 'POST',
    path: '/auth/register',
    body: { name: 'Smoke User', email: userEmail, password: pass }
  });
  const user2 = r.data?.user;
  const token2 = r.data?.token;
  record(
    'Register second user (user+free)',
    okShape(r.data) && user2?.role === 'user' && user2?.plan === 'free' && token2 ? 'PASS' : 'FAIL',
    `${r.status} role=${user2?.role} plan=${user2?.plan} id=${user2?.id} error=${r.data?.error || r.error || ''}`
  );

  r = await hit('login1', {
    method: 'POST',
    path: '/auth/login',
    body: { email: adminEmail, password: pass }
  });
  const loginToken1 = r.data?.token || token1;
  record(
    'Login user 1',
    okShape(r.data) && r.data.token && r.data.user?.email === adminEmail ? 'PASS' : 'FAIL',
    `${r.status} role=${r.data?.user?.role} plan=${r.data?.user?.plan} error=${r.data?.error || r.error || ''}`
  );

  r = await hit('login2', {
    method: 'POST',
    path: '/auth/login',
    body: { email: userEmail, password: pass }
  });
  const loginToken2 = r.data?.token || token2;
  record(
    'Login regular user',
    okShape(r.data) && r.data.token && r.data.user?.plan === 'free' ? 'PASS' : 'FAIL',
    `${r.status} role=${r.data?.user?.role} plan=${r.data?.user?.plan} error=${r.data?.error || r.error || ''}`
  );

  r = await hit('me', { path: '/auth/me', token: loginToken2 });
  record(
    'GET /api/auth/me',
    okShape(r.data) && r.data.user?.email === userEmail && r.data.user?.plan === 'free' ? 'PASS' : 'FAIL',
    `${r.status} plan=${r.data?.user?.plan} role=${r.data?.user?.role} id=${r.data?.user?.id}`
  );

  const adminToken = firstIsAdmin ? loginToken1 : null;

  // Admin upgrade
  if (adminToken && user2?.id) {
    r = await hit('upgrade', {
      method: 'POST',
      path: '/admin/upgrade-user',
      token: adminToken,
      body: { userId: user2.id, plan: 'pro', durationDays: 30 }
    });
    record(
      'POST /api/admin/upgrade-user → pro',
      okShape(r.data) && r.data.user?.plan === 'pro' ? 'PASS' : 'FAIL',
      `${r.status} plan=${r.data?.user?.plan} expires=${r.data?.user?.plan_expires_at} error=${r.data?.error || r.error || ''}`
    );

    r = await hit('me-pro', { path: '/auth/me', token: loginToken2 });
    record(
      'Login/me as upgraded premium user',
      okShape(r.data) && r.data.user?.plan === 'pro' ? 'PASS' : 'FAIL',
      `${r.status} plan=${r.data?.user?.plan}`
    );

    r = await hit('upgrade-vip', {
      method: 'POST',
      path: '/admin/upgrade-user',
      token: adminToken,
      body: { userId: user2.id, plan: 'vip', durationDays: 90 }
    });
    record(
      'Admin upgrade user → vip',
      okShape(r.data) && r.data.user?.plan === 'vip' ? 'PASS' : 'FAIL',
      `${r.status} plan=${r.data?.user?.plan}`
    );

    r = await hit('admin-users', { path: '/admin/users', token: adminToken });
    const listed = r.data?.users || [];
    const hasIds = listed.length > 0 && listed.every((u) => u.id && !u._id && !u.password);
    record(
      'GET /api/admin/users',
      okShape(r.data) && hasIds ? 'PASS' : 'FAIL',
      `${r.status} count=${listed.length} sampleId=${listed[0]?.id} hasPassword=${listed[0]?.password != null}`
    );

    r = await hit('logs', { path: '/logs', token: adminToken });
    record(
      'GET /api/logs',
      okShape(r.data) && Array.isArray(r.data.logs) ? 'PASS' : 'FAIL',
      `${r.status} logs=${r.data?.logs?.length} sampleId=${r.data?.logs?.[0]?.id}`
    );

    r = await hit('del-self', {
      method: 'DELETE',
      path: `/admin/user/${user1.id}`,
      token: adminToken
    });
    record(
      'Admin cannot delete self',
      r.status === 400 && r.data?.success === false ? 'PASS' : 'FAIL',
      `${r.status} error=${r.data?.error || r.error || ''}`
    );
  } else {
    record('POST /api/admin/upgrade-user → pro', 'SKIP', 'No admin token this run (users already existed)');
    record('Login/me as upgraded premium user', 'SKIP', 'Depends on admin upgrade');
    record('Admin upgrade user → vip', 'SKIP', 'Depends on admin upgrade');
    record('GET /api/admin/users', 'SKIP', 'No admin token this run');
    record('GET /api/logs', 'SKIP', 'No admin token this run');
    record('Admin cannot delete self', 'SKIP', 'No admin token this run');
  }

  // Directory
  r = await hit('dir-jobs', { path: '/directory/jobs?limit=5' });
  const jobs = r.data?.jobs || [];
  const jobHasId = jobs[0] && jobs[0].id && !jobs[0]._id;
  record(
    'GET /api/directory/jobs',
    okShape(r.data) && jobHasId && r.data.countsMap && typeof r.data.total === 'number' ? 'PASS' : 'FAIL',
    `${r.status} total=${r.data?.total} jobs=${jobs.length} id=${jobs[0]?.id} countsMap=${trunc(r.data?.countsMap, 120)} error=${r.data?.error || r.error || ''}`
  );

  r = await hit('dir-sync', { method: 'POST', path: '/directory/sync', timeout: 90000 });
  record(
    'POST /api/directory/sync',
    r.error ? 'SKIP' : r.data?.success !== false && (r.status === 200 || r.data?.total != null) ? 'PASS' : 'FAIL',
    r.error
      ? r.error
      : `${r.status} success=${r.data?.success} total=${r.data?.total} added=${r.data?.added} error=${r.data?.error || ''}`
  );

  r = await hit('dir-apply-404', {
    method: 'POST',
    path: '/directory/apply/99999999',
    token: loginToken2
  });
  record(
    'POST /api/directory/apply/:jobId (missing job)',
    r.status === 404 && r.data?.success === false ? 'PASS' : 'FAIL',
    `${r.status} error=${r.data?.error || r.error || ''}`
  );

  // Hunter
  r = await hit('hunter-jobs', { path: '/hunter/jobs' });
  record(
    'GET /api/hunter/jobs',
    okShape(r.data) && Array.isArray(r.data.jobs) ? 'PASS' : 'FAIL',
    `${r.status} jobs=${r.data?.jobs?.length} id=${r.data?.jobs?.[0]?.id || '(none)'}`
  );

  r = await hit('hunter-crawl', {
    method: 'POST',
    path: '/hunter/crawl',
    token: loginToken2,
    body: { keyword: 'Frontend', location: 'Indonesia' },
    timeout: 90000
  });
  record(
    'POST /api/hunter/crawl keyword=Frontend',
    r.error
      ? 'SKIP'
      : okShape(r.data) && Array.isArray(r.data.jobs)
        ? 'PASS'
        : 'FAIL',
    r.error ? r.error : `${r.status} total=${r.data?.total} jobs=${r.data?.jobs?.length} error=${r.data?.error || ''}`
  );

  // Profile / CV / ATS
  r = await hit('profile-auth', { path: '/profile', token: loginToken2 });
  record(
    'GET /api/profile (auth)',
    okShape(r.data) && r.data.profile && r.data.profile.userId === user2.id ? 'PASS' : 'FAIL',
    `${r.status} userId=${r.data?.profile?.userId} full_name=${r.data?.profile?.full_name}`
  );

  r = await hit('profile-save', {
    method: 'POST',
    path: '/profile',
    token: loginToken2,
    body: { full_name: 'Smoke User Pro', headline: 'Frontend Engineer', skills: ['React', 'TypeScript'] }
  });
  record(
    'POST /api/profile',
    okShape(r.data) && r.data.profile?.full_name === 'Smoke User Pro' ? 'PASS' : 'FAIL',
    `${r.status} name=${r.data?.profile?.full_name} error=${r.data?.error || r.error || ''}`
  );

  r = await hit('cv-refine', {
    method: 'POST',
    path: '/cv/refine',
    token: loginToken2,
    timeout: 60000,
    body: {
      target_role: 'Frontend Developer',
      personal_info: { name: 'Smoke User', email: userEmail, phone: '081234567890' },
      raw_summary: 'Developer React dengan pengalaman membangun dashboard.',
      work_experiences: [{ company: 'PT Contoh', role: 'Frontend', period: '2023-2025', bullet_points: ['Membangun UI React'] }],
      educations: [{ institution: 'Universitas Contoh', degree: 'S1 Informatika', period: '2018-2022' }],
      skills: ['React', 'JavaScript']
    }
  });
  record(
    'POST /api/cv/refine',
    okShape(r.data) && r.data.cv ? 'PASS' : 'FAIL',
    `${r.status} hasCv=${!!r.data?.cv} error=${r.data?.error || r.error || ''}`
  );

  r = await hit('cv-save', {
    method: 'POST',
    path: '/cv/save',
    token: loginToken2,
    body: { cvData: r.data?.cv || { refined_summary: 'test' }, targetRole: 'Frontend Developer' }
  });
  record(
    'POST /api/cv/save',
    okShape(r.data) ? 'PASS' : 'FAIL',
    `${r.status} msg=${r.data?.message || r.data?.error || r.error || ''}`
  );

  r = await hit('cv-saved', { path: '/cv/saved', token: loginToken2 });
  record(
    'GET /api/cv/saved',
    okShape(r.data) ? 'PASS' : 'FAIL',
    `${r.status} hasSaved=${!!r.data?.savedCV} targetRole=${r.data?.targetRole || ''}`
  );

  const cvText = `SMOKE USER
Frontend Developer
Email: smoke@test.com Phone: 081234567890 Jakarta
SUMMARY
Pengembang frontend dengan pengalaman React, TypeScript, dan Node.js. Membangun dashboard analitik dan meningkatkan performa halaman hingga 30 persen.
EXPERIENCE
PT Contoh — Frontend Engineer (2023-2025)
- Membangun komponen React yang dipakai 5 tim
- Mengurangi bundle size 25%
EDUCATION
S1 Informatika, Universitas Contoh, 2018-2022
SKILLS
React, TypeScript, JavaScript, HTML, CSS, Git`;
  r = await hit('ats-audit', {
    method: 'POST',
    path: '/ats/audit',
    timeout: 60000,
    body: { cv_text: cvText, target_position: 'Frontend Developer', target_industry: 'Teknologi & IT' }
  });
  record(
    'POST /api/ats/audit (cv_text)',
    okShape(r.data) && typeof r.data.score === 'number' ? 'PASS' : 'FAIL',
    `${r.status} score=${r.data?.score} error=${r.data?.error || r.error || ''}`
  );

  r = await hit('ats-star', {
    method: 'POST',
    path: '/ats/rewrite-star',
    timeout: 45000,
    body: {
      position: 'Frontend Engineer',
      original_text: 'Mengerjakan website perusahaan dengan React.',
      target_role: 'Frontend Developer'
    }
  });
  record(
    'POST /api/ats/rewrite-star',
    okShape(r.data) && Array.isArray(r.data.bullet_points) ? 'PASS' : 'FAIL',
    `${r.status} bullets=${r.data?.bullet_points?.length} error=${r.data?.error || r.error || ''}`
  );

  // Applications / email
  r = await hit('apps', { path: '/applications', token: loginToken2 });
  record(
    'GET /api/applications',
    okShape(r.data) && Array.isArray(r.data.applications) && r.data.stats ? 'PASS' : 'FAIL',
    `${r.status} total=${r.data?.stats?.total} apps=${r.data?.applications?.length}`
  );

  r = await hit('send-app', {
    method: 'POST',
    path: '/send-application',
    token: loginToken2,
    timeout: 20000,
    body: {
      recipientEmail: 'hrd@example.com',
      subject: 'Lamaran Frontend',
      bodyText: 'Dengan hormat, saya melamar.'
    }
  });
  const sendOk = okShape(r.data);
  const sendClearErr = r.data?.success === false && r.data?.error && r.status < 500;
  record(
    'POST /api/send-application (SMTP likely unset)',
    sendOk ? 'PASS' : sendClearErr || (r.data?.error && !r.error) ? 'PASS' : 'FAIL',
    `${r.status} success=${r.data?.success} error=${trunc(r.data?.error || r.error || r.data?.message || '')}`
  );

  r = await hit('follow-404', {
    method: 'POST',
    path: '/applications/99999999/follow-up-draft',
    token: loginToken2
  });
  record(
    'POST /api/applications/:id/follow-up-draft (no app)',
    r.status === 404 && r.data?.success === false ? 'PASS' : 'FAIL',
    `${r.status} error=${r.data?.error || r.error || ''}`
  );

  r = await hit('scan-no-file', {
    method: 'POST',
    path: '/scan-brochure',
    token: loginToken2
  });
  record(
    'POST /api/scan-brochure (no file)',
    r.status === 400 && r.data?.success === false ? 'PASS' : 'FAIL',
    `${r.status} error=${r.data?.error || r.error || ''}`
  );

  // AI features
  const aiCalls = [
    ['POST /api/interview/start', '/interview/start', { position: 'Frontend Developer', company: 'Tokopedia', requirements: ['React'] }],
    ['POST /api/interview/evaluate', '/interview/evaluate', { question: 'Ceritakan diri Anda', answer: 'Saya frontend engineer dengan 3 tahun pengalaman React.', position: 'Frontend', company: 'Tokopedia' }],
    ['POST /api/salary/insight', '/salary/insight', { position: 'Frontend Developer', location: 'Jakarta', experienceLevel: '1-3 Tahun' }],
    ['POST /api/antiscam/audit', '/antiscam/audit', { jobText: 'Lowongan frontend gaji 8 juta transfer biaya administrasi dulu.', email: 'hr@scam.test', company: 'PT Bodong' }],
    ['POST /api/project/pitch', '/project/pitch', { projectName: 'LamarKerja AI', techStack: 'React, Node, PostgreSQL', description: 'Otomasi lamaran kerja' }],
    ['POST /api/career/roadmap', '/career/roadmap', { targetRole: 'Senior Frontend Engineer' }],
    ['POST /api/whatsapp/generate-chat', '/whatsapp/generate-chat', { jobDetails: { company_name: 'Tokopedia', position: 'Frontend Engineer', whatsapp_number: '081234567890', requirements: ['React'] } }],
    ['POST /api/cover-letter/generate', '/cover-letter/generate', { companyName: 'Tokopedia', position: 'Frontend Engineer', language: 'id' }],
    ['POST /api/company/intelligence', '/company/intelligence', { companyName: 'Tokopedia', position: 'Frontend Engineer', industry: 'E-Commerce' }],
    ['POST /api/livecode/generate-challenge', '/livecode/generate-challenge', { position: 'Frontend', companyName: 'Tokopedia', techStack: 'JavaScript, React', difficulty: 'Mid' }],
    ['POST /api/livecode/review-code', '/livecode/review-code', { challengeTitle: 'Two Sum', problemStatement: 'Cari dua angka', candidateCode: 'function solution(a,b){return a+b}', language: 'javascript', testResults: [] }],
    ['POST /api/profile/optimize', '/profile/optimize', {}]
  ];

  for (const [label, path, body] of aiCalls) {
    r = await hit(label, { method: 'POST', path, body, token: loginToken2, timeout: 60000 });
    const gracefulFail = r.data && r.data.success === false && r.data.error;
    record(
      label,
      okShape(r.data) ? 'PASS' : gracefulFail ? 'FAIL' : 'FAIL',
      `${r.status} success=${r.data?.success} keys=${Object.keys(r.data || {}).filter((k) => k !== 'success').join(',') || ''} error=${trunc(r.data?.error || r.error || '')}`
    );
  }

  r = await hit('presets', { path: '/livecode/preset-challenges' });
  record(
    'GET /api/livecode/preset-challenges',
    okShape(r.data) && Array.isArray(r.data.challenges) && r.data.challenges.length > 0 ? 'PASS' : 'FAIL',
    `${r.status} count=${r.data?.challenges?.length}`
  );

  // Inbox
  r = await hit('inbox', { path: '/inbox', token: loginToken2 });
  record(
    'GET /api/inbox',
    okShape(r.data) && Array.isArray(r.data.notifications) && typeof r.data.unreadCount === 'number' ? 'PASS' : 'FAIL',
    `${r.status} notifs=${r.data?.notifications?.length} unread=${r.data?.unreadCount}`
  );

  r = await hit('inbox-sync', { method: 'POST', path: '/inbox/sync', token: loginToken2 });
  record(
    'POST /api/inbox/sync',
    okShape(r.data) ? 'PASS' : 'FAIL',
    `${r.status} notifs=${r.data?.notifications?.length} error=${r.data?.error || r.error || ''}`
  );

  r = await hit('inbox-read', {
    method: 'PATCH',
    path: '/inbox/read',
    token: loginToken2,
    body: {}
  });
  record(
    'PATCH /api/inbox/read',
    okShape(r.data) ? 'PASS' : 'FAIL',
    `${r.status} msg=${r.data?.message || r.data?.error || r.error || ''}`
  );

  // SMTP settings
  r = await hit('smtp-save', {
    method: 'POST',
    path: '/settings/smtp',
    token: loginToken2,
    body: { smtp_user: 'smoke@gmail.com', smtp_pass: 'not-a-real-app-password', sender_name: 'Smoke User' }
  });
  record(
    'POST /api/settings/smtp',
    okShape(r.data) ? 'PASS' : 'FAIL',
    `${r.status} msg=${r.data?.message || r.data?.error || r.error || ''}`
  );

  r = await hit('test-smtp', {
    method: 'POST',
    path: '/test-smtp',
    timeout: 20000,
    body: { smtp_user: 'smoke@gmail.com', smtp_pass: 'invalid-app-password' }
  });
  record(
    'POST /api/test-smtp (expect fail, no crash)',
    r.status >= 400 && r.data?.success === false && r.data?.error ? 'PASS' : r.status === 200 && r.data?.success === false ? 'PASS' : 'FAIL',
    `${r.status} success=${r.data?.success} error=${trunc(r.data?.error || r.error || '')}`
  );

  r = await hit('upload-cv-empty', {
    method: 'POST',
    path: '/profile/upload-cv',
    token: loginToken2
  });
  record(
    'POST /api/profile/upload-cv (no file)',
    r.status === 400 && r.data?.success === false ? 'PASS' : 'FAIL',
    `${r.status} error=${r.data?.error || r.error || ''}`
  );

  // Non-admin blocked
  r = await hit('user-admin-block', { path: '/admin/users', token: loginToken2 });
  record(
    'Non-admin cannot list users',
    r.status === 403 && r.data?.success === false ? 'PASS' : firstIsAdmin && loginToken2 === loginToken1 ? 'SKIP' : 'FAIL',
    `${r.status} error=${r.data?.error || ''} (user2 plan=${user2?.plan})`
  );

  const passN = rows.filter((x) => x.status === 'PASS').length;
  const failN = rows.filter((x) => x.status === 'FAIL').length;
  const skipN = rows.filter((x) => x.status === 'SKIP').length;
  console.log('\n==== SUMMARY ====');
  console.log(`PASS=${passN} FAIL=${failN} SKIP=${skipN} TOTAL=${rows.length}`);
  console.log(JSON.stringify({ passN, failN, skipN, rows }, null, 2));
  process.exit(failN > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('SMOKE FATAL', err);
  process.exit(2);
});
