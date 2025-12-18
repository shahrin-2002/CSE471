import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

export default function Documents() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');

  const loadDocs = async () => {
    try {
      const { data } = await api.get('/documents');
      setDocs(data.documents || []);
    } catch (err) {
      setMsg(t('docsLoadFailed'));
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
      setMsg(t('docUploaded'));
    } catch (err) {
      setMsg(err.response?.data?.error || t('uploadFailed'));
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/documents/${id}`);
      await loadDocs();
    } catch (err) {
      setMsg(t('deleteFailed'));
    }
  };

  return (
    <div className="card">
      <h2>{t('myDocuments')}</h2>

      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button className="btn" onClick={upload}>{t('upload')}</button>

      {msg && <p className="kicker">{msg}</p>}

      <ul>
        {docs.map(doc => (
          <li key={doc._id}>
            <a href={`/api/documents/preview/${doc.filename}`} target="_blank" rel="noreferrer">
              {doc.originalName || doc.filename}
            </a>
            {doc.verified ? (
              <span style={{ color: 'green' }}> ✅ {t('verified')}</span>
            ) : (
              <button className="btn" onClick={() => remove(doc._id)}>{t('delete')}</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

