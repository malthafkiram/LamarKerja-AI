import axios from 'axios';
import { Op } from 'sequelize';
import { getProfile, logAction } from '../helpers/dbHelpers.js';
import { HunterJob, JobDirectory } from '../models/index.js';
import { isDirectJobPostingUrl } from './jobHubParsers.js';

/**
 * Cari loker dari direktori PostgreSQL + API Remotive/Arbeitnow.
 */
export async function crawlJobs({ keyword = 'Developer', location = 'Indonesia' }, userId = null) {
  const profile = await getProfile(userId);
  const candidateSkills = Array.isArray(profile?.skills) ? profile.skills : [];
  const foundJobs = [];

  const searchKeyword = keyword.trim().toLowerCase();
  const searchLocation = (location || 'Indonesia').trim().toLowerCase();

  console.log(`[Auto-Hunter] Mencari loker: "${keyword}", lokasi: "${location}"...`);

  try {
    const like = `%${searchKeyword}%`;
    let dbJobs = await JobDirectory.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: like } },
          { company: { [Op.iLike]: like } },
          { category: { [Op.iLike]: like } },
          { description: { [Op.iLike]: like } }
        ]
      },
      limit: 30
    });

    if (dbJobs.length === 0 && (searchKeyword.length <= 3 || searchKeyword.includes('semua') || searchKeyword.includes('loker') || searchKeyword.includes('kerja'))) {
      dbJobs = await JobDirectory.findAll({ limit: 25 });
    }

    if (dbJobs.length === 0) {
      dbJobs = await JobDirectory.findAll({ order: [['posted_at', 'DESC']], limit: 15 });
    }

    for (const job of dbJobs) {
      if (isDirectJobPostingUrl(job.job_url)) {
        foundJobs.push({
          source: `${job.platform} Verified Directory`,
          platform: job.platform || 'Portal Karir',
          title: job.title,
          company: job.company,
          location: job.location || 'Indonesia',
          job_url: job.job_url,
          contact_email: job.contact_email || '',
          requirements: job.requirements || [],
          description: job.description || `${job.title} di ${job.company} (${job.location})`
        });
      }
    }
    console.log(`✓ [Auto-Hunter] Menemukan ${foundJobs.length} loker relevan dari Database Direktori Indonesia`);
  } catch (err) {
    console.warn('Job Directory search note:', err.message);
  }

  // =========================================================================
  // 2. SOURCE 2: Live Remotive API (Real Global Remote & Tech Vacancies)
  // =========================================================================
  try {
    const remotiveUrl = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(keyword)}&limit=20`;
    const res = await axios.get(remotiveUrl, { timeout: 8000 });
    if (res.data && res.data.jobs) {
      for (const item of res.data.jobs) {
        if (isDirectJobPostingUrl(item.url)) {
          const emailMatch = item.description.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi);
          const email = emailMatch ? emailMatch[0] : '';

          foundJobs.push({
            source: 'Remotive Global API',
            platform: 'Remotive',
            title: item.title,
            company: item.company_name,
            location: item.candidate_required_location || 'Remote Global',
            job_url: item.url,
            contact_email: email,
            requirements: (item.tags || []).slice(0, 5),
            description: item.description.replace(/<[^>]*>?/gm, '').slice(0, 450)
          });
        }
      }
      console.log(`✓ [Auto-Hunter] Total sekarang ${foundJobs.length} loker (termasuk Remotive API)`);
    }
  } catch (e) {
    console.warn('Remotive API crawl note:', e.message);
  }

  // =========================================================================
  // 3. SOURCE 3: Live Arbeitnow Job Board API
  // =========================================================================
  try {
    const arbeitnowUrl = `https://www.arbeitnow.com/api/job-board-api`;
    const res = await axios.get(arbeitnowUrl, { timeout: 8000 });
    if (res.data && res.data.data) {
      for (const item of res.data.data) {
        const itemText = (item.title + ' ' + (item.description || '')).toLowerCase();
        if (itemText.includes(searchKeyword) || searchKeyword.length <= 3) {
          if (isDirectJobPostingUrl(item.url)) {
            const emailMatch = (item.description || '').match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi);
            const email = emailMatch ? emailMatch[0] : '';

            foundJobs.push({
              source: 'Arbeitnow Global API',
              platform: 'Arbeitnow',
              title: item.title,
              company: item.company_name,
              location: item.location || 'Remote / Worldwide',
              job_url: item.url,
              contact_email: email,
              requirements: item.tags || [],
              description: (item.description || '').replace(/<[^>]*>?/gm, '').slice(0, 450)
            });
          }
        }
      }
      console.log(`✓ [Auto-Hunter] Total sekarang ${foundJobs.length} loker (termasuk Arbeitnow API)`);
    }
  } catch (e) {
    console.warn('Arbeitnow API crawl note:', e.message);
  }

  // =========================================================================
  // 4. Never invent search-hub apply cards (Glints/JobStreet/Indeed/Kalibrr are blocked).
  // =========================================================================

  const processedJobs = [];
  const seenUrls = new Set();

  for (const job of foundJobs) {
    if (!isDirectJobPostingUrl(job.job_url) || seenUrls.has(job.job_url)) continue;
    seenUrls.add(job.job_url);

    let matchScore = 70;
    const jobText = (job.title + ' ' + (job.requirements || []).join(' ') + ' ' + (job.description || '')).toLowerCase();
    const matchedSkills = candidateSkills.filter((s) => jobText.includes(s.toLowerCase()));
    if (matchedSkills.length > 0) {
      matchScore = Math.min(98, 70 + matchedSkills.length * 6);
    } else if (jobText.includes(searchKeyword)) {
      matchScore = 85;
    }

    try {
      let existing = await HunterJob.findOne({ where: { job_url: job.job_url } });

      if (!existing) {
        const newJob = await HunterJob.create({
          source: job.source,
          platform: job.platform || 'Portal Karir',
          title: job.title,
          company: job.company,
          location: job.location,
          job_url: job.job_url,
          contact_email: job.contact_email || '',
          requirements: job.requirements || [],
          description: job.description,
          match_score: matchScore,
          match_analysis: { matched_skills: matchedSkills, score: matchScore },
          status: 'found'
        });
        processedJobs.push(toPublic(newJob));
      } else {
        existing.match_score = matchScore;
        existing.source = job.source;
        existing.platform = job.platform || existing.platform;
        existing.requirements = job.requirements || existing.requirements;
        await existing.save();
        processedJobs.push(toPublic(existing));
      }
    } catch (saveErr) {
      console.warn('Error saving HunterJob:', saveErr.message);
    }
  }

  // Sort by highest match score first
  processedJobs.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

  await logAction('CRAWLER', `Auto-Hunter berhasil menemukan ${processedJobs.length} loker terverifikasi untuk keyword "${keyword}"`, {
    keyword,
    location,
    total: processedJobs.length
  });

  return processedJobs;
}
