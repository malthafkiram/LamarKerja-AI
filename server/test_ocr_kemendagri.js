import { extractJobDetailsFromOCR, extractEmailsFromRawText, extractPhoneNumbersFromRawText } from './services/ai.js';

async function testKemendagriOCR() {
  console.log('Testing Kemendagri Flyer OCR Extraction & Anti-Hallucination...');

  const sampleFlyerText = `
KEMENTERIAN DALAM NEGERI REPUBLIK INDONESIA
GEDUNG A
Lowongan Pekerjaan!
Fullstack Developer

Kualifikasi Khusus:
• Menguasai Node.js (Express.js/AdonisJS) dan React.js (Hooks, Context API, atau Redux)
• Paham konsep REST API dan integrasi antar layanan
• Berpengalaman menggunakan PostgreSQL atau database relasional lainnya.
• Familiar dengan Docker dan manajemen container.
• Terbiasa bekerja dengan Git (GitLab/GitHub) dan workflow CI/CD menjadi nilai tambah.
• Berpengalaman dengan TypeScript dan Python menjadi nilai tambah.
• Familiar dengan Linux server, Nginx, dan deployment pipeline.

Kirim CV dan Portfolio ke:
walidata@kemendagri.go.id
Subject: Posisi - Nama Lengkap

Dirga 0822 2867 4892
Aisha 0813 9851 1998

kemendagri_ri @kemendagri www.kemendagri.go.id https://pelita.kemendagri.go.id
`;

  const emails = extractEmailsFromRawText(sampleFlyerText);
  console.log('Extracted Emails (Regex):', emails);

  const phones = extractPhoneNumbersFromRawText(sampleFlyerText);
  console.log('Extracted Phones (Regex):', phones);

  const details = await extractJobDetailsFromOCR(sampleFlyerText);
  console.log('Final AI Structured Output:', JSON.stringify(details, null, 2));

  // Assertions
  if (details.recipient_email !== 'walidata@kemendagri.go.id') {
    throw new Error(`Expected recipient_email to be 'walidata@kemendagri.go.id', got: '${details.recipient_email}'`);
  }
  if (!details.recipient_email.includes('@')) {
    throw new Error(`recipient_email '${details.recipient_email}' must contain '@'`);
  }
  if (!details.whatsapp_number.startsWith('08') && !details.whatsapp_number.startsWith('628')) {
    throw new Error(`whatsapp_number '${details.whatsapp_number}' must start with 08 or 628`);
  }

  console.log('✅ TEST PASSED: AI correctly extracted Kemendagri email & WhatsApp without hallucinations!');
}

testKemendagriOCR().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
