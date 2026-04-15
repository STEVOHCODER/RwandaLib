import { useEffect, useState } from 'react';
import { admin } from '../services/api';
import Navbar from '../components/Navbar';

const Admin = () => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'library' | 'analytics'>('approvals');
  const [pendingDocs, setPendingDocs] = useState([]);
  const [allDocs, setAllDocs] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const [docsRes, reqsRes, allDocsRes, statsRes] = await Promise.all([
        admin.getPendingDocs(),
        admin.getPendingRequests(),
        admin.getAllDocs(),
        admin.getStats()
      ]);
      
      setPendingDocs(docsRes.data);
      setPendingRequests(reqsRes.data);
      setAllDocs(allDocsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveDoc = async (id: number) => {
    try {
      await admin.approveDoc(id);
      alert('Document approved!');
      fetchData();
    } catch (err) { alert('Action failed'); }
  };

  const handleApproveRequest = async (id: number) => {
    try {
      await admin.approveRequest(id);
      alert('Request approved!');
      fetchData();
    } catch (err) { alert('Action failed'); }
  };

  const handleEditDoc = async (doc: any) => {
    const newTitle = prompt('Enter new title:', doc.title);
    if (newTitle === null) return;
    
    const newYear = prompt('Enter new year:', doc.year || '');
    if (newYear === null) return;

    try {
      await admin.updateDoc(doc.id, { 
        ...doc, 
        title: newTitle, 
        year: newYear ? Number(newYear) : null 
      });
      alert('Document updated!');
      fetchData();
    } catch (err) { alert('Update failed'); }
  };

  const handleDeleteDoc = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await admin.deleteDoc(id);
      fetchData();
    } catch (err) { alert('Delete failed'); }
  };

  const renderApprovals = () => (
    <div className="grid">
      <div style={{ gridColumn: '1 / -1' }}>
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📂 Pending Documents <span className="badge cat-exam">{pendingDocs.length}</span>
        </h3>
        {pendingDocs.length === 0 && <p style={{ color: 'var(--txm)', padding: '20px', background: 'var(--bg2)', borderRadius: '8px' }}>No documents awaiting review.</p>}
      </div>
      {pendingDocs.map((doc: any) => (
        <div key={doc.id} style={{ padding: '20px', border: '1px solid var(--br)', borderRadius: '12px', background: 'var(--card-bg)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span className="badge cat-book">{doc.category}</span>
            <span style={{ fontSize: '11px', color: 'var(--txm)' }}>{new Date(doc.createdAt).toLocaleDateString()}</span>
          </div>
          <h4 style={{ marginBottom: '4px', fontSize: '15px' }}>{doc.title}</h4>
          <p style={{ fontSize: '12px', color: 'var(--txm)', marginBottom: '16px' }}>By: <strong>{doc.uploader.username}</strong></p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleApproveDoc(doc.id)} style={{ flex: 1, padding: '10px', background: 'var(--primary)', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Approve</button>
            <button style={{ flex: 1, padding: '10px', border: '1px solid var(--br)', borderRadius: '6px', fontSize: '12px', color: '#ef4444' }}>Reject</button>
          </div>
        </div>
      ))}

      <div style={{ gridColumn: '1 / -1', marginTop: '48px' }}>
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📩 Download Requests <span className="badge cat-paper">{pendingRequests.length}</span>
        </h3>
        {pendingRequests.length === 0 && <p style={{ color: 'var(--txm)', padding: '20px', background: 'var(--bg2)', borderRadius: '8px' }}>No pending requests.</p>}
      </div>
      {pendingRequests.map((req: any) => (
        <div key={req.id} style={{ padding: '20px', border: '1px solid var(--br)', borderRadius: '12px', background: 'var(--card-bg)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ marginBottom: '4px', fontSize: '14px' }}>{req.document.title}</h4>
          <p style={{ fontSize: '12px', color: 'var(--txm)', marginBottom: '8px' }}>Requested by: <strong>{req.user.username}</strong></p>
          <div style={{ background: 'var(--gs)', color: 'var(--primary)', padding: '8px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, marginBottom: '16px' }}>
            📞 CALL: {req.phoneNumber || 'No number provided'}
          </div>
          <button onClick={() => handleApproveRequest(req.id)} style={{ width: '100%', padding: '10px', background: 'var(--primary)', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Grant Access</button>
        </div>
      ))}
    </div>
  );

  const renderLibrary = () => (
    <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--br)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ background: 'var(--bg2)' }}>
          <tr>
            <th style={{ padding: '16px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--txm)' }}>Document Info</th>
            <th style={{ padding: '16px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--txm)' }}>Category & Level</th>
            <th style={{ padding: '16px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--txm)' }}>Performance</th>
            <th style={{ padding: '16px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--txm)' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {allDocs.map((doc: any) => (
            <tr key={doc.id} style={{ borderBottom: '1px solid var(--br)' }}>
              <td style={{ padding: '16px' }}>
                <div style={{ fontWeight: 600, color: 'var(--tx)', fontSize: '14px' }}>{doc.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--txm)', marginTop: '4px' }}>Uploaded by {doc.uploader?.username} · {new Date(doc.createdAt).toLocaleDateString()}</div>
              </td>
              <td style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: '4px', flexDirection: 'column' }}>
                  <span className="badge cat-book" style={{ width: 'fit-content' }}>{doc.category}</span>
                  <span style={{ fontSize: '11px', color: 'var(--txm)' }}>{doc.educationLevel}</span>
                </div>
              </td>
              <td style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{doc.views}</div>
                    <div style={{ fontSize: '9px', color: 'var(--txm)', textTransform: 'uppercase' }}>Views</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{doc.downloads}</div>
                    <div style={{ fontSize: '9px', color: 'var(--txm)', textTransform: 'uppercase' }}>Dls</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => handleEditDoc(doc)} style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '13px' }}>Edit</button>
                  <button onClick={() => handleDeleteDoc(doc.id)} style={{ color: '#ef4444', fontWeight: 600, fontSize: '13px' }}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAnalytics = () => (
    <div>
      {/* Top Cards: General Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {[
          { label: 'Total Users', val: stats?.totalUsers, icon: '👥' },
          { label: 'Total Documents', val: stats?.totalDocs, icon: '📚' },
          { label: 'Pending Reviews', val: stats?.pendingDocs, icon: '⏳' },
          { label: 'Pending Requests', val: stats?.pendingRequests, icon: '📩' },
        ].map(s => (
          <div key={s.label} style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--br)', background: 'var(--card-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--txm)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</span>
              <span>{s.icon}</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--tx)' }}>{s.val || 0}</div>
          </div>
        ))}
      </div>

      {/* Upload Velocity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--br)', background: 'var(--card-bg)' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>📈 Upload Velocity</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 700 }}>{stats?.dailyUploads}</div>
              <div style={{ fontSize: '11px', color: 'var(--txm)' }}>TODAY</div>
            </div>
            <div style={{ width: '1px', background: 'var(--br)' }}></div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 700 }}>{stats?.weeklyUploads}</div>
              <div style={{ fontSize: '11px', color: 'var(--txm)' }}>THIS WEEK</div>
            </div>
            <div style={{ width: '1px', background: 'var(--br)' }}></div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 700 }}>{stats?.monthlyUploads}</div>
              <div style={{ fontSize: '11px', color: 'var(--txm)' }}>THIS MONTH</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--br)', background: 'var(--card-bg)' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>📊 Daily Visits</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '100px' }}>
            {stats?.visits && [...stats.visits].reverse().map((v: any) => (
              <div 
                key={v.id} 
                style={{ 
                  flex: 1, background: 'var(--primary)', opacity: 0.8,
                  height: `${Math.max((v.count / (Math.max(...stats.visits.map((vis: any) => vis.count)) || 1)) * 100, 5)}%`,
                  borderRadius: '2px 2px 0 0'
                }}
                title={`${new Date(v.date).toLocaleDateString()}: ${v.count} visits`}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', color: 'var(--txm)' }}>
            <span>30 DAYS AGO</span>
            <span>TODAY</span>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--br)', padding: '24px' }}>
        <h3 style={{ marginBottom: '20px' }}>🏆 Most Viewed Documents</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {stats?.topDocs.map((doc: any, i: number) => (
            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)', minWidth: '24px' }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--txm)' }}>{doc.views} views · {doc.downloads} downloads</div>
              </div>
              <span className="badge cat-exam" style={{ fontSize: '8px' }}>{doc.category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="container" style={{ padding: '48px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>Admin Reach Dashboard</h1>
            <p style={{ color: 'var(--txm)', fontSize: '14px' }}>Manage the national archive and analyze platform growth.</p>
          </div>
          <button onClick={fetchData} className="nav-btn" style={{ background: 'transparent', color: 'var(--primary)', border: '1.5px solid var(--primary)' }}>🔄 Refresh Data</button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--br)', marginBottom: '32px' }}>
          {['approvals', 'library', 'analytics'].map((t: any) => (
            <button 
              key={t}
              onClick={() => setActiveTab(t)}
              style={{ 
                padding: '12px 4px', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                color: activeTab === t ? 'var(--primary)' : 'var(--txm)',
                borderBottom: activeTab === t ? '3px solid var(--primary)' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {loading && !stats ? (
          <div style={{ textAlign: 'center', padding: '100px', color: 'var(--txm)' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }} className="animate-pulse">📂</div>
            <div style={{ fontWeight: 600 }}>Synchronizing Archive Data...</div>
          </div>
        ) : (
          <div className="animate-fade-in">
            {activeTab === 'approvals' && renderApprovals()}
            {activeTab === 'library' && renderLibrary()}
            {activeTab === 'analytics' && renderAnalytics()}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
