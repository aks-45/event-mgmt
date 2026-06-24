import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/formatDate';
import api from '../services/api';

const AuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/audit')
      .then((res) => setLogs(res.data.data))
      .catch(() => toast.error('Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-navy dark:text-gold">Audit Logs</h1>
      <div className="card-panel">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto text-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2">Action</th>
                  <th className="py-2">Entity</th>
                  <th className="py-2">By</th>
                  <th className="py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b border-slate-100">
                    <td className="py-2">{log.action}</td>
                    <td className="py-2">
                      {log.entity} {log.entityId && `#${log.entityId.slice(-6)}`}
                    </td>
                    <td className="py-2">{log.performedByName || '-'}</td>
                    <td className="py-2">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditPage;
