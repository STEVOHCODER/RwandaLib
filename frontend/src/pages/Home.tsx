import React, { useEffect, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import DocumentCard from '../components/DocumentCard';
import api, { library } from '../services/api';

const Home = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('ALL');
  const [level, setLevel] = useState('ALL');
  const [year, setYear] = useState('');
  const [search, setSearch] = useState('');
  const [userStats, setUserStats] = useState({ uploadCount: 0 });
  const [unlockedDocs, setUnlockedDocs] = useState<number[]>([]);
  const [showBulkUpload, setShowBulkUpload] = useState<number | null>(null);
  
  const [bulkFiles, setBulkFiles] = useState<(File | null)[]>([null, null, null, null, null]);
  const [uploadingBulk, setUploadingBulk] = useState(false);

  const fetchDocs = useCallback(async (q: string = search, cat: string = category, lvl: string = level, yr: string = year) => {
    setLoading(true);
    try {
      const params: any = {};
      if (q) params.search = q;
      if (cat !== 'ALL') params.category = cat;
      if (lvl !== 'ALL') params.level = lvl;
      if (yr) params.year = yr;

      const res = await api.get('/documents', { params });
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, category, level, year]);

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      setUserStats({ uploadCount: res.data.uploadCount });
      
      const reqsRes = await api.get('/download/requests');
      const unlocked = reqsRes.data.filter((r: any) => r.status === 'APPROVED').map((r: any) => r.documentId);
      setUnlockedDocs(unlocked);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocs();
    fetchUser();
  }, [fetchDocs]);

  const triggerDownload = async (id: number, isRead: boolean) => {
    try {
      const response = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      if (isRead) {
        window.open(url, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = url;
        const doc: any = documents.find((d: any) => d.id === id);
        link.setAttribute('download', doc?.fileName || `document-${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setShowBulkUpload(id);
      } else {
        alert('Access check failed. Please ensure you have contributing 5 documents.');
      }
    }
  };

  const handleAction = async (id: number, isRead: boolean) => {
    const token = localStorage.getItem('token');
    if (!token) return alert('Please login to access documents.');

    const isUnlocked = unlockedDocs.includes(id) || userStats.uploadCount >= 5;
    if (!isUnlocked) {
      setShowBulkUpload(id);
      return;
    }

    await triggerDownload(id, isRead);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validFiles = bulkFiles.filter(f => f !== null) as File[];
    if (validFiles.length < 5) return alert('Please upload all 5 documents to continue.');

    setUploadingBulk(true);
    const formData = new FormData();
    formData.append('targetDocId', showBulkUpload!.toString());
    validFiles.forEach(file => formData.append('files', file));

    try {
      await library.uploadBulk(formData);
      alert('Success! Documents verified. Your file will now open.');
      const targetId = showBulkUpload!;
      setShowBulkUpload(null);
      setBulkFiles([null, null, null, null, null]);
      await fetchUser();
      await triggerDownload(targetId, false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Bulk upload failed. Ensure files are unique.');
    } finally {
      setUploadingBulk(false);
    }
  };

  const isGlobalLocked = userStats.uploadCount < 5;
  const progressPercent = Math.min((userStats.uploadCount / 5) * 100, 100);
  const years = Array.from({ length: 15 }, (_, i) => (new Date().getFullYear() - i).toString());
  const currentFilesCount = bulkFiles.filter(f => f !== null).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar onSearch={(q) => { setSearch(q); fetchDocs(q, category, level, year); }} />
      
      {/* HERO */}
      <div className="hero">
        <div className="hero-title">Explore <em>Books, Past Papers & Research</em> for every level</div>
        <div className="hero-sub">A curated collection of academic resources for Rwandan students. Contribute 5 documents to unlock any item instantly.</div>

        <div className="grid" style={{ maxWidth: '760px', margin: '0 auto', gap: '12px' }}>
          <div style={{ border: '1.5px solid var(--br2)', borderRadius: '10px', padding: '16px 18px', background: 'var(--card-bg)', textAlign: 'left' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>📚 Full Library</div>
            <div style={{ fontSize: '12px', color: 'var(--txm)', marginBottom: '12px' }}>Search across all academic resources</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input className="search-input" type="text" placeholder="Search all documents…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--br2)', borderRadius: '7px', background: 'var(--bg2)', color: 'var(--tx)', outline: 'none' }} />
              <button onClick={() => fetchDocs()} style={{ padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 500 }}>Search</button>
            </div>
          </div>
          <div style={{ border: '1.5px solid var(--br2)', borderRadius: '10px', padding: '16px 18px', background: 'var(--card-bg)', textAlign: 'left' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>🔬 Scientific</div>
            <div style={{ fontSize: '12px', color: 'var(--txm)', marginBottom: '12px' }}>Academic journals and research</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input className="search-input" type="text" placeholder="Search subject…" style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--br2)', borderRadius: '7px', background: 'var(--bg2)', color: 'var(--tx)', outline: 'none' }} onChange={(e) => { setSearch(e.target.value); setCategory('SCIENTIFIC_PAPER'); }} />
              <button onClick={() => { setCategory('SCIENTIFIC_PAPER'); fetchDocs(); }} style={{ padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 500 }}>Search</button>
            </div>
          </div>
        </div>
      </div>

      {/* ACCESS BANNER */}
      <div className="access-bar">
        <span className="access-bar-text">
          <strong>{isGlobalLocked ? 'Contributor Status' : 'Full Access Granted'}</strong> 
          {isGlobalLocked ? ` You've contributed ${userStats.uploadCount} of 5 documents required for full archive access.` : ' Thank you for your valuable contributions!'}
        </span>
        <div className="prog"><div className="prog-fill" style={{ width: `${progressPercent}%` }}></div></div>
      </div>

      {/* FILTER TABS */}
      <div className="container" style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--br)', paddingBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {['ALL', 'BOOK', 'PAST_PAPER', 'SCIENTIFIC_PAPER'].map(cat => (
          <button key={cat} onClick={() => { setCategory(cat); fetchDocs(search, cat, level, year); }} style={{ padding: '8px 14px', borderRadius: '6px', fontSize: '13px', background: category === cat ? 'var(--primary)' : 'transparent', color: category === cat ? '#fff' : 'var(--tx)', fontWeight: 600, border: category === cat ? 'none' : '1px solid var(--br)' }}>{cat === 'ALL' ? 'All' : cat.replace('_', ' ')}</button>
        ))}
        <div style={{ width: '1px', height: '24px', background: 'var(--br)', margin: '0 8px' }}></div>
        {['ALL', 'PRIMARY', 'SECONDARY', 'UNIVERSITY'].map(lvl => (
          <button key={lvl} onClick={() => { setLevel(lvl); fetchDocs(search, category, lvl, year); }} style={{ padding: '8px 14px', borderRadius: '6px', fontSize: '13px', background: level === lvl ? 'var(--primary)' : 'var(--bg2)', color: level === lvl ? '#fff' : 'var(--tx)', fontWeight: 600, border: '1px solid var(--br)' }}>{lvl === 'ALL' ? 'All Levels' : lvl.charAt(0) + lvl.slice(1).toLowerCase()}</button>
        ))}
        <div style={{ width: '1px', height: '24px', background: 'var(--br)', margin: '0 8px' }}></div>
        <select value={year} onChange={(e) => { setYear(e.target.value); fetchDocs(search, category, level, e.target.value); }} style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '13px', background: 'var(--bg)', color: 'var(--tx)', border: '1px solid var(--br)', fontWeight: 600, outline: 'none' }}>
          <option value="">Year</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* MAIN CONTENT */}
      <main className="container">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '64px', color: 'var(--txm)' }}>Synchronizing Repository...</div>
          ) : documents.length > 0 ? (
            documents.map((doc: any) => (
              <DocumentCard key={doc.id} doc={doc} onAction={handleAction} isUnlocked={unlockedDocs.includes(doc.id) || !isGlobalLocked} />
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '64px', color: 'var(--txm)' }}>
              <h3>No documents found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </main>

      {/* BULK UPLOAD MODAL */}
      {showBulkUpload && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--bg)', padding: '32px', borderRadius: '24px', maxWidth: '550px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <h2 style={{ marginBottom: '8px' }}>🔐 Unlock this Document</h2>
            <p style={{ color: 'var(--txm)', marginBottom: '24px', fontSize: '14px' }}>
              Upload 5 documents to get instant access. Follow the steps below:
            </p>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, marginBottom: '8px', color: 'var(--primary)', textTransform: 'uppercase' }}>
                <span>Upload Progress</span>
                <span>{currentFilesCount} / 5 COMPLETED</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg2)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--br)' }}>
                <div style={{ height: '100%', background: 'var(--primary)', width: `${(currentFilesCount / 5) * 100}%`, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
              </div>
            </div>

            <form onSubmit={handleBulkSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                {[0, 1, 2, 3, 4].map(idx => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: bulkFiles[idx] ? 'var(--gs)' : 'var(--bg2)', borderRadius: '12px', border: `1.5px solid ${bulkFiles[idx] ? 'var(--primary)' : 'var(--br)'}` }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: bulkFiles[idx] ? 'var(--primary)' : 'var(--br2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900 }}>
                      {bulkFiles[idx] ? '✓' : idx + 1}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      {bulkFiles[idx] ? (
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bulkFiles[idx]?.name}</div>
                      ) : (
                        <label style={{ fontSize: '13px', color: 'var(--txm)', cursor: 'pointer', display: 'block', width: '100%' }}>
                          Upload document {idx + 1}...
                          <input type="file" style={{ display: 'none' }} onChange={(e) => { const newFiles = [...bulkFiles]; newFiles[idx] = e.target.files?.[0] || null; setBulkFiles(newFiles); }} />
                        </label>
                      )}
                    </div>
                    {bulkFiles[idx] && <button type="button" onClick={() => { const newFiles = [...bulkFiles]; newFiles[idx] = null; setBulkFiles(newFiles); }} style={{ color: '#ef4444', fontSize: '16px', fontWeight: 900 }}>×</button>}
                  </div>
                ))}
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => { setShowBulkUpload(null); setBulkFiles([null, null, null, null, null]); }} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--br)', fontWeight: 700, color: 'var(--txm)' }}>Cancel</button>
                <button disabled={uploadingBulk || currentFilesCount < 5} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: currentFilesCount < 5 ? 'var(--br2)' : 'var(--primary)', color: '#fff', fontWeight: 700, cursor: currentFilesCount < 5 ? 'not-allowed' : 'pointer' }}>
                  {uploadingBulk ? 'Processing...' : 'Upload & Unlock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--br)', marginTop: '64px', padding: '48px 20px', background: 'var(--bg2)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '16px' }}>RwandaLib</div>
            <p style={{ fontSize: '12px', color: 'var(--txm)' }}>Empowering students with academic excellence.</p>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '12px' }}>Quick Links</div>
            <a href="/" style={{ display: 'block', fontSize: '12px', color: 'var(--txm)', marginBottom: '8px' }}>Home</a>
            <a href="/upload" style={{ display: 'block', fontSize: '12px', color: 'var(--txm)', marginBottom: '8px' }}>Upload</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
