import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

export default function Documents() {
  const { user } = useAuth();
  const { toggleLanguage, language } = useLanguage();
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');

  const loadDocs = async () => {
    try {
      const { data } = await api.get('/documents');
      setDocs(data.documents || []);
    } catch (err) {
      setMsg('Failed to load documents');
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const upload = async () => {
    if (!file) return;
    setMsg('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/documents', formData);
      setFile(null);
      await loadDocs();
      setMsg('Document uploaded');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Upload failed');
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/documents/${id}`);
      await loadDocs();
    } catch (err) {
      setMsg('Delete failed');
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>My Documents</h2>
        <button onClick={toggleLanguage} style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>{language === 'en' ? 'বাংলা' : 'English'}</button>
      </div>

      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button className="btn" onClick={upload}>Upload</button>

      {msg && <p className="kicker">{msg}</p>}

      <ul>
        {docs.map(doc => (
          <li key={doc._id}>
            <a href={`/api/documents/preview/${doc.filename}`} target="_blank" rel="noreferrer">
              {doc.originalName || doc.filename}
            </a>
            {doc.verified ? (
              <span style={{ color: 'green' }}> ✅ Verified</span>
            ) : (
              <button className="btn" onClick={() => remove(doc._id)}>Delete</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

