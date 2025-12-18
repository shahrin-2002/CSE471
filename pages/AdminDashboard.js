import { useEffect, useState } from 'react';
import { reviewAPI, documentAPI, userAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function AdminDashboard() {
  const [pendingDocs, setPendingDocs] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [msg, setMsg] = useState('');
  const { t } = useLanguage();

  const load = async () => {
    try {
      const { data: docsData } = await documentAPI.listPending();
      setPendingDocs(docsData.documents || []);
    } catch {
      setMsg('Failed to load pending documents');
    }
    try {
      const { data: reviewsData } = await reviewAPI.listPending();
      setPendingReviews(reviewsData.reviews || []);
    } catch {
      setMsg('Failed to load pending reviews');
    }
  };

  useEffect(() => { load(); }, []);

  const verify = async (id) => {
    await documentAPI.verify(id);
    load();
  };

  const reject = async (id) => {
    const notes = prompt('Rejection reason?') || '';
    await documentAPI.reject(id, { notes });
    load();
  };

  const lockUser = async (userId) => {
    await userAPI.lock(userId);
    setMsg('User locked');
  };

  const approveReview = async (reviewId) => {
    await reviewAPI.approve(reviewId);
    load();
  };

  const rejectReview = async (reviewId) => {
    await reviewAPI.reject(reviewId);
    load();
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{t('adminDashboard')}</h2>

        <h3>Pending Documents</h3>
        <ul>
          {pendingDocs.map(d => (
            <li key={d._id}>
              {d.user?.name} – {d.originalName} – {d.verified ? '✅ Verified' : '⏳ Pending'} –
              <a href={`/api/documents/preview/${d.filename}`} target="_blank" rel="noreferrer">Preview</a>
              {!d.verified && (
                <>
                  <button onClick={() => verify(d._id)}>Verify</button>
                  <button onClick={() => reject(d._id)}>Reject</button>
                </>
              )}
              <button onClick={() => lockUser(d.user?._id)}>Lock User</button>
            </li>
          ))}
        </ul>

        <h3>Pending Reviews</h3>
        <ul>
          {pendingReviews.map(r => (
            <li key={r._id}>
              {r.patientId?.name} – {r.targetType}: {r.targetId?.name || r.targetId} – Rating: {r.rating} – {r.comment}
              <button onClick={() => approveReview(r._id)}>Approve</button>
              <button onClick={() => rejectReview(r._id)}>Reject</button>
            </li>
          ))}
        </ul>

        {msg && <p>{msg}</p>}
      </div>
    </div>
  );
}
