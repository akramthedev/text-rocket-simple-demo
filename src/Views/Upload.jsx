import  { 
  useState, 
  useEffect, 
  useRef 
} from 'react';
   



 
const Upload = () => {

  const now = () => new Date().toISOString();

  const fileRef = useRef(null);
  const timersRef = useRef([]);
  const jobCounterRef = useRef(0);
  const runningRef = useRef(false);

  const [jobs, setJobs] = useState([]);
  const [fileDetails, setFileDetails] = useState({ name: '—', size: 0, type: '—' });
  const [modalOpen, setModalOpen] = useState(false);
  const [activeJobId, setActiveJobId] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [seoLoading, setSeoLoading] = useState(false);
 
  const workflowSteps = [
    'Research',
    'SERP Analysis',
    'Extract Headings',
    'Intent',
    'FAQs',
    'Outline',
    'Draft Generation',
    'SEO Optimization',
    'Done'
  ];



  useEffect(() => {
    return () => {
      timersRef.current.forEach(id => clearTimeout(id));
      timersRef.current = [];
    };
  }, []);


  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };


  

  const resetTimers = () => {
    timersRef.current.forEach(id => clearTimeout(id));
    timersRef.current = [];
    runningRef.current = false;
  };




  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileDetails({
      name: file?.name ?? '—',
      size: formatFileSize(file?.size ?? 0),
      type: file?.type ?? '—'
    });

    const reader = new FileReader();
    reader.onload = (e) => {
      let text = e.target.result ?? '';
      text = text.replace(/^\uFEFF/, '');
      const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');

      const newJobs = rows.map((row) => {
        const [mainKeyword = '', secondary = ''] = row.split(',');
        const secondaryKeywords = secondary ? secondary.split('|') : [];
        jobCounterRef.current += 1;
        return {
          job_id: jobCounterRef.current,
          main_keyword: mainKeyword.trim(),
          secondary_keywords: secondaryKeywords.map(s => s.trim()),
          status: 'Pending',
          progress: 0,
          current_step: 'waiting',
          draft: null,
          original_ai_draft: null,
          ai_generated_at: null,
          versions: [],
          edited: false,
          last_edited_at: null,
          last_edited_by: null,
          regeneration_count: 0,
          url: null
        };
      });

      setJobs(prev => [...prev, ...newJobs]);
      if (fileRef.current) fileRef.current.value = '';
    };
    reader.readAsText(file, 'UTF-8');
  };



  const schedule = (fn, delay) => {
    const id = setTimeout(fn, delay);
    timersRef.current.push(id);
    return id;
  };




  const startWorkflow = () => {
    if (runningRef.current) return;
    const pendingJobs = jobs.filter(j => j.status === 'Pending' || j.status === 'Failed');
    if (pendingJobs.length === 0) {
      alert('All jobs are already done');
      return;
    }
    runningRef.current = true;

    pendingJobs.forEach((origJob, i) => {
      let stepIndex = 0;
      const localJobId = origJob.job_id;

      const nextStep = () => {
        const jobNow = (() => jobs.find(j => j.job_id === localJobId) )();
        const step = workflowSteps[stepIndex] ?? 'Done';

        setJobs(prev => prev.map(j => {
          if (j.job_id !== localJobId) return j;
          return {
            ...j,
            current_step: step,
            status: 'Running',
            progress: Math.min(Math.round((stepIndex / (workflowSteps.length - 1)) * 100), 100)
          };
        }));

        if (step === 'Draft Generation') {
          const generated = `Draft for ${origJob.main_keyword} with secondary keywords: ${origJob.secondary_keywords.join(', ')}`;
          setJobs(prev => prev.map(j => {
            if (j.job_id !== localJobId) return j;
            return {
              ...j,
              draft: generated,
              original_ai_draft: generated,
              ai_generated_at: now(),
              versions: [],
              edited: false,
              last_edited_at: null,
              last_edited_by: null,
              regeneration_count: 0
            };
          }));
        }

        if (step === 'SEO Optimization') {
          setJobs(prev => prev.map(j => {
            if (j.job_id !== localJobId) return j;
            return {
              ...j,
              seo: {
                keywordDensity: Math.round(Math.random() * 5 + 1),
                readability: Math.round(Math.random() * 50 + 50),
                metaLength: 150 + Math.floor(Math.random() * 50),
                backlinks: Math.floor(Math.random() * 20),
                score: Math.floor(Math.random() * 100)
              }
            };
          }));
        }

        stepIndex++;
        if (stepIndex < workflowSteps.length) {
          schedule(nextStep, 1000 + i * 200);
        } else {
          schedule(() => {
            setJobs(prev => prev.map(j => {
              if (j.job_id !== localJobId) return j;
              return {
                ...j,
                status: 'Done',
                progress: 100,
                current_step: 'Done',
                url: `https://fakewebsite.com/articles/${j.job_id}`
              };
            }));
            const anyRunning = (jobs.filter(j => {
              if (j.job_id === localJobId) return false;
              return j.status === 'Running';
            })).length > 0;
            if (!anyRunning) runningRef.current = false;
          }, 1000 + i * 200);
        }
      };

      schedule(nextStep, 200 + i * 100);
    });
  };




  const openEditor = (jobId) => {
    const job = jobs.find(j => j.job_id === jobId);
    setActiveJobId(jobId);
    setDraftText(job?.draft ?? '');
    setModalOpen(true);
  };



  const appendVersion = (job, note = '') => {
    const version = {
      id: (job.versions?.length ?? 0) + 1,
      content: job.draft ?? '',
      timestamp: now(),
      user: 'You',
      note
    };
    return [...(job.versions || []), version];
  };

 

  const saveDraft = () => {
    if (!draftText || !draftText.trim()) {
      alert('Draft is empty');
      return;
    }

    setSeoLoading(true);

    setTimeout(() => { 
      setJobs(prev => prev.map(j => {
        if (j.job_id !== activeJobId) return j;

        const versions = appendVersion(j, 'manual save');

        const seo = {
          keywordDensity: Math.round(Math.random() * 5 + 1),
          readability: Math.round(Math.random() * 50 + 50),
          metaLength: 150 + Math.floor(Math.random() * 50),
          backlinks: Math.floor(Math.random() * 20),
          score: Math.floor(Math.random() * 100)
        };

        return {
          ...j,
          draft: draftText,
          versions,
          edited: j.original_ai_draft !== draftText,
          last_edited_at: now(),
          last_edited_by: 'You',
          seo
        };
      }));

      setSeoLoading(false);
      
    }, 800);  
  };
 

  
  const closeDraft = () => {
    const job = jobs.find(j => j.job_id === activeJobId);

    if (job && draftText !== job.draft) {
      const confirmClose = window.confirm(
        "You have unsaved changes. Are you sure you want to close?"
      );
      if (!confirmClose) return;
    }

    setModalOpen(false);
    setActiveJobId(null);
    setDraftText('');
  };
 

      
  const cancelEdit = () => {
    const job = jobs.find(j => j.job_id === activeJobId);

    if (job && draftText !== job.draft) {
      const confirmCancel = window.confirm(
        "Are you sure? All your unsaved work will be lost."
      );
      if (!confirmCancel) return;
    }

    setModalOpen(false);
    setActiveJobId(null);
    setDraftText('');
  };




  const revertToAI = () => {
    const job = jobs.find(j => j.job_id === activeJobId);
    if (!job) return;
    const versions = appendVersion(job, 'revert backup');
    setJobs(prev => prev.map(j => {
      if (j.job_id !== activeJobId) return j;
      return {
        ...j,
        versions,
        draft: j.original_ai_draft ?? '',
        edited: false,
        last_edited_at: now(),
        last_edited_by: 'You'
      };
    }));
    setDraftText(job.original_ai_draft ?? '');
  };



  const regenerateDraft = () => {
    const job = jobs.find(j => j.job_id === activeJobId);
    if (!job) return;
    const newDraft = `Regenerated draft for ${job.main_keyword} (regen ${job.regeneration_count + 1}) with keywords: ${job.secondary_keywords.join(', ')}`;
    const versions = appendVersion(job, 'regenerate backup');
    setJobs(prev => prev.map(j => {
      if (j.job_id !== activeJobId) return j;
      return {
        ...j,
        versions,
        draft: newDraft,
        edited: newDraft !== j.original_ai_draft,
        last_edited_at: now(),
        last_edited_by: 'You',
        regeneration_count: (j.regeneration_count || 0) + 1
      };
    }));
    setDraftText(newDraft);
  };




  const clearAll = () => {
    resetTimers();
    setJobs([]);
    setFileDetails({ name: '—', size: 0, type: '—' });
    if (fileRef.current) fileRef.current.value = '';
    setModalOpen(false);
    setActiveJobId(null);
    setDraftText('');
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && modalOpen) cancelEdit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalOpen]);


  const activeJob = jobs.find(j => j.job_id === activeJobId);

  

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>

      <h1>Upload CSV</h1>
      <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} />
      <div style={{ marginTop: 12, marginBottom: 16, color: '#444' }}>
        Name: {fileDetails.name} &nbsp;|&nbsp; Size: {fileDetails.size} &nbsp;|&nbsp; Type: {fileDetails.type}
      </div>

      {jobs.length > 0 && (
        <>
          <table className="jobs-table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Main Keyword</th>
                <th>Secondary Keywords</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Step</th>
                <th>Edited</th>
                <th>Versions</th>
                <th>Regenerations</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.job_id} style={{ opacity: job.status === 'Done' ? 0.85 : 1 }}>
                  <td>{job.job_id}</td>
                  <td style={{ maxWidth: 200 }}>{job.main_keyword}</td>
                  <td style={{ maxWidth: 200 }}>{job.secondary_keywords.join(', ')}</td>
                  <td>{job.status}</td>
                  <td>{job.progress}%</td>
                  <td>{job.current_step}</td>
                  <td>{job.edited ? <span className="badge">Edited</span> : '—'}</td>
                  <td>{(job.versions?.length ?? 0) > 0 ? <span className="badge">{job.versions.length}</span> : '—'}</td>
                  <td>{job.regeneration_count ?? 0}</td>
                  <td>
                    <button
                      className="btn ghost"
                      onClick={() => openEditor(job.job_id)}
                      disabled={!job.draft}
                      style={{ cursor: job.draft ? 'pointer' : 'not-allowed', opacity: job.draft ? 1 : 0.5 }}
                    >
                      View & Edit Article
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
            <button className="btn secondary" onClick={clearAll}>Clear</button>
            <button
              className="btn"
              onClick={() => {
                const canStart = jobs.some(j => j.status === 'Pending' || j.status === 'Failed');
                const anyRunning = jobs.some(j => j.status === 'Running');
                if (!canStart) {
                  alert('All jobs are already done');
                  return;
                }
                if (anyRunning || runningRef.current) {
                  alert('Processing already in progress');
                  return;
                }
                startWorkflow();
              }}
            >Start Batch Processing</button>
          </div>
        </>
      )}

      {modalOpen && (
        <div className="overlay">
          <div className={`panel open`} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {activeJob?.main_keyword ?? 'Article'}
                  {activeJob?.edited && <span className="badge">Edited</span>}
                </div>
                <div className="meta">
                  Job ID: {activeJobId} · Status: {activeJob?.status ?? ''}
                </div>
                <div className="small">Last edited: {activeJob?.last_edited_at ? new Date(activeJob.last_edited_at).toLocaleString() : '—'}</div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn ghost" onClick={revertToAI}>Revert to AI</button>
                <button className="btn ghost" onClick={regenerateDraft}>Regenerate again</button>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <button className="btn ghost" onClick={cancelEdit}>Cancel</button>
                <button className="btn" onClick={saveDraft}>Save Draft</button>
                <button className='btn ghost' onClick={closeDraft}>Close</button>
              </div>
            </div>

            <div className="panel-body">
              <div className="draft-column">
                <div style={{ marginBottom: 12, color: '#333', fontSize: 14, fontWeight: 600 }}>Draft</div>
                <textarea className="draft-area" value={draftText} onChange={(e) => setDraftText(e.target.value)} />
                <div style={{ marginTop: 18, color: '#555' }}>
                  <div style={{ marginBottom: 6, fontWeight: 600 }}>Secondary Keywords</div>
                  <div style={{ color: '#444' }}>{activeJob?.secondary_keywords.join(', ') ?? '—'}</div>
                </div>
              </div>

              <div className="seo-column">
                <div style={{ fontWeight: 600, marginBottom: 10 }}>SEO Performance :&nbsp;&nbsp;&nbsp;{seoLoading ? "SEO checking..." : ""}</div>
                <div>Keyword Density: {activeJob?.seo?.keywordDensity ?? '—'}%</div>
                <div>Readability: {activeJob?.seo?.readability ?? '—'}</div>
                <div>Meta Description Length: {activeJob?.seo?.metaLength ?? '—'} chars</div>
                <div>Backlinks Count: {activeJob?.seo?.backlinks ?? '—'}</div>
                <div>SEO Score: {activeJob?.seo?.score ?? '—'} / 100</div>
              </div>
            </div>

            <div className="panel-footer">
              <div style={{ marginRight: 'auto' }} className="small">
                AI generated: {activeJob?.ai_generated_at ? new Date(activeJob.ai_generated_at).toLocaleString() : '—'}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};


export default Upload;