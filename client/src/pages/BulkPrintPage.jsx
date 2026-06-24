import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import IdCardGenerator from '../components/IdCardGenerator';
import LoadingSpinner from '../components/LoadingSpinner';
import { getParticipants } from '../services/participantService';

const BulkPrintPage = () => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    getParticipants({ limit: 100 })
      .then((res) => setParticipants(res.data.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selected = participants.filter((p) => selectedIds.has(p._id));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-navy dark:text-gold">Bulk ID Card Print</h1>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="card-panel max-h-48 overflow-y-auto">
            {participants.map((p) => (
              <label key={p._id} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.has(p._id)}
                  onChange={() => toggle(p._id)}
                />
                <span className="font-mono text-xs">{p.participantId}</span>
                <span>{p.fullName}</span>
              </label>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {selected.map((p) => (
              <div key={p._id} className="card-panel">
                <IdCardGenerator participant={p} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BulkPrintPage;
