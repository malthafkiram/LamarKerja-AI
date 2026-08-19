import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookmarkPlus, CheckCircle2, ExternalLink, MapPin, X } from 'lucide-react';
import { aggregateGlobePoints, canUseWebGL } from '../utils/jobGlobeGeo';

const EARTH_NIGHT = 'https://unpkg.com/three-globe/example/img/earth-night.jpg';
const EARTH_BUMP = 'https://unpkg.com/three-globe/example/img/earth-topology.png';
const SEARCH_URL_RE = /\/explore\?|\/jobs\/search\/|\/job-search\/|loker\?search=|jobs\?keyword=/;

function canOpenPosting(job) {
  return Boolean(job?.job_url) && !SEARCH_URL_RE.test(job.job_url);
}

function GlobeJobCard({ job, lang, logged, busy, onLogApplied }) {
  return (
    <article
      className="glass-panel"
      style={{
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      <div>
        <div style={{ fontSize: '0.72rem', color: '#22D3EE', fontWeight: 700, marginBottom: '4px' }}>
          {job.platform}
        </div>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
          {job.title}
        </h3>
        <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '4px' }}>
          {job.company}
        </div>
        {job.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#CBD5E1', marginTop: '6px' }}>
            <MapPin size={11} color="#FBBF24" />
            <span>{job.location}</span>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {canOpenPosting(job) ? (
          <a
            href={job.job_url}
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1,
              minWidth: '110px',
              padding: '8px 12px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.8rem',
              color: '#fff',
              background: 'linear-gradient(135deg, #0891B2, #06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>{lang === 'id' ? `Lamar di ${job.platform}` : `Apply on ${job.platform}`}</span>
            <ExternalLink size={14} />
          </a>
        ) : (
          <span style={{ flex: 1, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {lang === 'id' ? 'Tautan lowongan asli tidak tersedia' : 'Direct job posting URL is not available'}
          </span>
        )}
        <button
          type="button"
          onClick={() => onLogApplied(job)}
          disabled={busy || logged}
          className="btn-secondary"
          style={{
            padding: '8px 10px',
            borderRadius: '10px',
            borderColor: 'rgba(16, 185, 129, 0.4)',
            color: '#34D399',
            fontSize: '0.74rem',
            whiteSpace: 'nowrap'
          }}
        >
          {logged
            ? <><CheckCircle2 size={14} /> {lang === 'id' ? 'Tercatat' : 'Logged'}</>
            : <><BookmarkPlus size={14} /> {lang === 'id' ? 'Catat sebagai dilamar' : 'Mark as applied'}</>}
        </button>
      </div>
    </article>
  );
}

export default function JobGlobeView({
  jobs = [],
  isLoading = false,
  lang = 'id',
  loggedUrls = {},
  logBusyId = null,
  onLogApplied,
  onFallback
}) {
  const mountRef = useRef(null);
  const globeRef = useRef(null);
  const onFallbackRef = useRef(onFallback);
  const [selected, setSelected] = useState(null);
  const [ready, setReady] = useState(false);

  onFallbackRef.current = onFallback;

  const points = useMemo(() => aggregateGlobePoints(jobs), [jobs]);
  const selectedJobs = selected?.jobs || [];

  useEffect(() => {
    setSelected((prev) => {
      if (!prev) return prev;
      return points.find((point) => point.key === prev.key) || null;
    });
  }, [points]);

  useEffect(() => {
    let cancelled = false;
    let globe;
    let resizeObserver;

    const fallback = (reason) => {
      if (!cancelled && onFallbackRef.current) onFallbackRef.current(reason);
    };

    if (!canUseWebGL()) {
      fallback('webgl');
      return undefined;
    }

    (async () => {
      try {
        const mod = await import('globe.gl');
        const Globe = mod.default || mod;
        if (cancelled || !mountRef.current) return;

        const el = mountRef.current;
        globe = new Globe(el)
          .globeImageUrl(EARTH_NIGHT)
          .bumpImageUrl(EARTH_BUMP)
          .backgroundColor('rgba(2, 6, 23, 0)')
          .showAtmosphere(true)
          .atmosphereColor('#38bdf8')
          .atmosphereAltitude(0.22)
          .showGraticules(false)
          .width(el.clientWidth)
          .height(el.clientHeight)
          .pointOfView({ lat: 20, lng: 20, altitude: 2.35 }, 0)
          .pointsData([])
          .pointLat('lat')
          .pointLng('lng')
          .pointAltitude((d) => (d.worldwide ? 0.12 : 0.04 + d.size * 0.08))
          .pointRadius((d) => (d.worldwide ? 0.85 : 0.32 + d.size * 0.35))
          .pointColor((d) => d.color)
          .pointLabel((d) => {
            const countLabel = lang === 'id' ? `${d.count} lowongan` : `${d.count} jobs`;
            const source = d.worldwide ? '' : ` · ${d.source}`;
            return `<div style="font-family:inherit;padding:4px 2px"><strong>${d.label}</strong><br/>${countLabel}${source}</div>`;
          })
          .pointsMerge(false)
          .onPointClick((point) => {
            setSelected(point);
            if (globe?.controls) globe.controls().autoRotate = false;
          });

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        globe.controls().autoRotate = !reducedMotion;
        globe.controls().autoRotateSpeed = 0.35;
        globe.controls().enableDamping = true;
        globe.controls().dampingFactor = 0.08;

        globeRef.current = globe;
        if (!cancelled) setReady(true);

        resizeObserver = new ResizeObserver(() => {
          if (!mountRef.current || !globe) return;
          globe.width(mountRef.current.clientWidth);
          globe.height(mountRef.current.clientHeight);
        });
        resizeObserver.observe(el);
      } catch (err) {
        console.warn('Job globe WebGL init failed:', err?.message || err);
        fallback('webgl');
      }
    })();

    return () => {
      cancelled = true;
      setReady(false);
      if (resizeObserver) resizeObserver.disconnect();
      if (globe) {
        try {
          globe._destructor();
        } catch {
          /* globe already torn down */
        }
      }
      globeRef.current = null;
    };
  }, [lang]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !ready) return;
    globe.pointsData(points);
  }, [points, ready]);

  const closePanel = () => {
    setSelected(null);
    const globe = globeRef.current;
    if (globe?.controls && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      globe.controls().autoRotate = true;
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: selected ? 'minmax(0, 1fr) minmax(280px, 380px)' : '1fr',
        gap: '16px',
        minHeight: '520px'
      }}
      className="job-globe-layout"
    >
      <div
        className="glass-panel"
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '520px',
          background: 'radial-gradient(ellipse at center, rgba(8, 47, 73, 0.45) 0%, rgba(2, 6, 23, 0.95) 70%)'
        }}
      >
        <div
          ref={mountRef}
          style={{ width: '100%', height: '560px', cursor: 'grab' }}
        />
        {(isLoading || !ready) && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(2, 6, 23, 0.45)',
            color: '#7DD3FC',
            fontSize: '0.88rem',
            pointerEvents: 'none'
          }}>
            {lang === 'id' ? 'Memuat globe lowongan remote...' : 'Loading remote job globe...'}
          </div>
        )}
        {!isLoading && ready && points.length === 0 && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '24px',
            pointerEvents: 'none'
          }}>
            <p style={{ margin: 0, color: '#F8FAFC', fontWeight: 700 }}>
              {lang === 'id' ? 'Belum ada titik remote yang bisa dipetakan' : 'No mappable remote jobs yet'}
            </p>
            <p style={{ margin: 0, fontSize: '0.82rem', maxWidth: '360px' }}>
              {lang === 'id'
                ? 'Globe hanya menampilkan lowongan Remotive, Arbeitnow, Jobicy, Himalayas, dan Remote OK. Sinkronkan loker atau pilih filter Remote / Luar Negeri.'
                : 'The globe only plots Remotive, Arbeitnow, Jobicy, Himalayas, and Remote OK jobs. Sync vacancies or pick Remote / Luar Negeri.'}
            </p>
          </div>
        )}
        <div style={{
          position: 'absolute',
          left: '14px',
          bottom: '14px',
          fontSize: '0.72rem',
          color: '#94A3B8',
          background: 'rgba(2, 6, 23, 0.72)',
          border: '1px solid var(--border-glass)',
          borderRadius: '10px',
          padding: '8px 12px',
          maxWidth: '280px',
          lineHeight: 1.45
        }}>
          {lang === 'id'
            ? `${points.length} kota · ${jobs.length} loker remote. Klik titik untuk kartu asli. Emas = Remote / Anywhere (bukan kota acak).`
            : `${points.length} cities · ${jobs.length} remote jobs. Click a point for real cards. Gold = Remote / Anywhere (not a fake city).`}
        </div>
      </div>

      {selected && (
        <aside
          className="glass-panel"
          style={{
            padding: '16px',
            maxHeight: '560px',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#FBBF24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {selected.worldwide ? 'Remote / Anywhere' : selected.source}
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '4px 0 0' }}>{selected.label}</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                {lang === 'id' ? `${selected.count} lowongan` : `${selected.count} jobs`}
              </p>
            </div>
            <button
              type="button"
              onClick={closePanel}
              className="btn-secondary"
              style={{ padding: '6px 8px' }}
              title={lang === 'id' ? 'Tutup' : 'Close'}
            >
              <X size={16} />
            </button>
          </div>
          {selectedJobs.map((job) => (
            <GlobeJobCard
              key={job.id || job.job_url}
              job={job}
              lang={lang}
              logged={Boolean(loggedUrls[job.job_url || String(job.id)])}
              busy={logBusyId === job.id}
              onLogApplied={onLogApplied}
            />
          ))}
        </aside>
      )}

      <style>{`
        @media (max-width: 860px) {
          .job-globe-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
