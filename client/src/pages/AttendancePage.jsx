import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/formatDate';
import { getAttendance } from '../services/attendanceService';

const AttendancePage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAttendance({ limit: 100 })
      .then((res) => setLogs(res.data.data))
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-navy dark:text-gold">Attendance Logs</h1>
      <div className="card-panel">
        {loading ? (
          <LoadingSpinner />
        ) : logs.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No attendance records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2 px-2">Participant ID</th>
                  <th className="py-2 px-2">Scan Time</th>
                  <th className="py-2 px-2">Scanner</th>
                  <th className="py-2 px-2">Location</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="py-2 px-2 font-mono text-xs">{log.participantId}</td>
                    <td className="py-2 px-2">{formatDate(log.scanTime)}</td>
                    <td className="py-2 px-2">{log.scannerName || log.verifiedBy?.name || '-'}</td>
                    <td className="py-2 px-2">{log.location}</td>
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

export default AttendancePage;
