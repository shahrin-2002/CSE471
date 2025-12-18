import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { labAPI } from '../services/api';

// Simple page to manage/view lab orders for doctors and patients

const sampleOrders = [
  {
    _id: 'demo1',
    patientId: { name: 'John Doe' },
    doctorId: { name: 'Dr. Kamal Uddin' },
    testName: 'Complete Blood Count (CBC)',
    status: 'completed',
    resultUrl: '#',
    notes: 'Routine pre-op check. All parameters within normal range.',
  },
  {
    _id: 'demo2',
    patientId: { name: 'Aisha Rahman' },
    doctorId: { name: 'Dr. Rehana Parvin' },
    testName: 'Chest X-Ray',
    status: 'in-progress',
    resultUrl: '',
    notes: 'Suspected pneumonia. Radiology report pending.',
  },
];

const LabOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Doctor form
  const [form, setForm] = useState({
    patientId: '',
    testName: '',
    notes: '',
  });

  // Patient upload
  const [uploading, setUploading] = useState(false);

  const isDoctor = user?.role === 'doctor';
  const isLab = user?.role === 'lab';

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = isDoctor ? await labAPI.mineDoctor() : isLab ? await labAPI.listLab() : await labAPI.mine();
      setOrders(resp.data.orders || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load lab orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await labAPI.create(form);
      setForm({ patientId: '', testName: '', notes: '' });
      await loadOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create lab order');
    }
  };

  const handleUpdate = async (id) => {
    const status = window.prompt('New status (ordered, in-progress, completed):', 'completed');
    const resultUrl = window.prompt('Result URL (optional):', '');
    try {
      await labAPI.update(id, { status, resultUrl });
      await loadOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update lab order');
    }
  };

  const handleUpload = async (id, file) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('result', file);
    try {
      await labAPI.uploadResult(id, formData);
      await loadOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload result');
    } finally {
      setUploading(false);
    }
  };

  const handleLabUpdate = async (id) => {
    const status = window.prompt('New status (in-progress, completed):', 'in-progress');
    if (!status) return;
    try {
      await labAPI.updateLabStatus(id, { status });
      await loadOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleLabUpload = async (id, file) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('result', file);
    try {
      await labAPI.uploadLabResult(id, formData);
      await loadOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload result');
    } finally {
      setUploading(false);
    }
  };

  const displayOrders = orders.length ? orders : sampleOrders;

  return (
    <div className="card" style={{ maxWidth: '900px', margin: '30px auto' }}>
      <h2>{isDoctor ? 'Lab Orders (Doctor)' : isLab ? 'Lab Orders (Lab)' : 'My Lab Orders'}</h2>

      {isDoctor && (
        <form onSubmit={handleCreate} style={{ marginBottom: '20px' }}>
          <div className="row">
            <input
              className="input"
              placeholder="Patient User ID"
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
            />
            <input
              className="input"
              placeholder="Test name (e.g. CBC, X-Ray Chest)"
              value={form.testName}
              onChange={(e) => setForm({ ...form, testName: e.target.value })}
            />
          </div>
          <div className="row">
            <input
              className="input"
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <button className="btn" type="submit">
            Create Lab Order
          </button>
        </form>
      )}

      {loading && <p>Loading lab orders...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !orders.length && !error && (
        <p style={{ marginBottom: '10px', color: '#555' }}>
          Showing lab orders.
        </p>
      )}

      <ul className="appointment-list">
        {displayOrders.map((o) => (
          <li key={o._id} className="appointment-item">
            <div>
              <strong>Patient:</strong> {o.patientId?.name || o.patientId}
              <br />
              <strong>Doctor:</strong> {o.doctorId?.name || o.doctorId}
              <br />
              <strong>Test:</strong> {o.testName}
              <br />
              <strong>Status:</strong>{' '}
              <span className={`badge ${o.status}`}>
                {o.status === 'completed'
                  ? '✅ Completed'
                  : o.status === 'in-progress'
                  ? '⏳ In Progress'
                  : '📝 Ordered'}
              </span>
              <br />
              {o.resultUrl && (
                <>
                  <strong>Result:</strong>{' '}
                  <a href={o.resultUrl} target="_blank" rel="noreferrer">
                    View
                  </a>
                  <br />
                </>
              )}
              {o.notes && (
                <>
                  <strong>Notes:</strong> {o.notes}
                  <br />
                </>
              )}
            </div>
            {!isDoctor && o.status !== 'completed' && o._id && !o._id.startsWith('demo') && (
              <div className="actions">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) handleUpload(o._id, file);
                  }}
                  disabled={uploading}
                />
                {uploading && <span>Uploading...</span>}
              </div>
            )}
            {isDoctor && o._id && !o._id.startsWith('demo') && (
              <div className="actions">
                <button className="btn secondary" onClick={() => handleUpdate(o._id)}>
                  Update
                </button>
              </div>
            )}
            {isLab && o._id && !o._id.startsWith('demo') && (
              <div className="actions">
                <button className="btn secondary" onClick={() => handleLabUpdate(o._id)}>
                  Update Status
                </button>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) handleLabUpload(o._id, file);
                  }}
                  disabled={uploading}
                />
                {uploading && <span>Uploading...</span>}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LabOrders;


