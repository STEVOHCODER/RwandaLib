import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Upload = () => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'BOOK',
    level: 'UNIVERSITY',
    subject: '',
    examBoard: '',
    examSource: '',
    year: '',
    description: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Please select a file');

    setLoading(true);
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    data.append('file', file);
    if (cover) data.append('cover', cover);

    try {
      await api.post('/documents/upload', data);
      alert('Upload successful! Your document is now pending review and has been added to your contribution count.');
      navigate('/');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="container" style={{ maxWidth: '600px', padding: '64px 20px' }}>
        <h1 style={{ marginBottom: '8px' }}>Contribute to the Archive</h1>
        <p style={{ color: 'var(--txm)', marginBottom: '32px' }}>Share your academic resources and help others. Your contribution will earn you download credits.</p>

        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Document Title</label>
            <input 
              required
              className="search-input"
              style={{ width: '100%', padding: '10px', border: '1.5px solid var(--br2)', borderRadius: '8px', background: 'var(--bg)', color: 'var(--tx)' }}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Advanced Organic Chemistry"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Category</label>
              <select 
                className="search-input"
                style={{ width: '100%', padding: '10px', border: '1.5px solid var(--br2)', borderRadius: '8px', background: 'var(--bg)', color: 'var(--tx)' }}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="BOOK">Book</option>
                <option value="PAST_PAPER">Past Paper</option>
                <option value="SCIENTIFIC_PAPER">Scientific Paper</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Level</label>
              <select 
                className="search-input"
                style={{ width: '100%', padding: '10px', border: '1.5px solid var(--br2)', borderRadius: '8px', background: 'var(--bg)', color: 'var(--tx)' }}
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              >
                <option value="PRIMARY">Primary</option>
                <option value="SECONDARY">Secondary</option>
                <option value="UNIVERSITY">University</option>
              </select>
            </div>
          </div>

          {formData.category === 'PAST_PAPER' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'var(--bg2)', padding: '16px', borderRadius: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Subject</label>
                <input 
                  className="search-input"
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--br2)', borderRadius: '6px', background: 'var(--bg)' }}
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Mathematics"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Exam Board</label>
                <input 
                  className="search-input"
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--br2)', borderRadius: '6px', background: 'var(--bg)' }}
                  value={formData.examBoard}
                  onChange={(e) => setFormData({ ...formData, examBoard: e.target.value })}
                  placeholder="e.g. NESA"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Source</label>
                <input 
                  className="search-input"
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--br2)', borderRadius: '6px', background: 'var(--bg)' }}
                  value={formData.examSource}
                  onChange={(e) => setFormData({ ...formData, examSource: e.target.value })}
                  placeholder="e.g. Official"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Year</label>
                <input 
                  type="number"
                  className="search-input"
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--br2)', borderRadius: '6px', background: 'var(--bg)' }}
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="2024"
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Select Document (PDF/DOCX/Images)</label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ color: 'var(--txm)', width: '100%', padding: '8px', border: '1px dashed var(--br2)', borderRadius: '8px' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Cover Image (Optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] || null)} style={{ color: 'var(--txm)', width: '100%', padding: '8px', border: '1px dashed var(--br2)', borderRadius: '8px' }} />
          </div>

          <button 
            disabled={loading}
            className="nav-btn" 
            style={{ padding: '12px', fontSize: '15px', marginTop: '12px' }}
          >
            {loading ? 'Processing...' : 'Submit Document'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Upload;
