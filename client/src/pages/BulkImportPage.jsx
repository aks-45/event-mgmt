import { useState } from 'react';
import toast from 'react-hot-toast';
import { bulkImport } from '../services/participantService';

const BulkImportPage = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!file) return toast.error('Select an Excel file');
    setLoading(true);
    try {
      const res = await bulkImport(file);
      setResult(res.data.data);
      toast.success(`Imported ${res.data.data.created.length} participants`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold text-navy dark:text-gold">Bulk Import</h1>
      <div className="card-panel space-y-4">
        <p className="text-sm text-slate-600">
          Upload Excel with columns: <strong>Name</strong>, <strong>Industry</strong>,{' '}
          <strong>Mobile</strong>, <strong>Email</strong>
        </p>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0])}
          className="input-field"
        />
        <button type="button" onClick={handleImport} disabled={loading} className="btn-primary">
          {loading ? 'Importing...' : 'Import Participants'}
        </button>
        {result && (
          <div className="text-sm space-y-2">
            <p className="text-emerald-600">Created: {result.created.length}</p>
            {result.failed.length > 0 && (
              <div>
                <p className="text-red-600">Failed: {result.failed.length}</p>
                <ul className="list-disc pl-5 text-xs text-slate-500 max-h-40 overflow-y-auto">
                  {result.failed.map((f, i) => (
                    <li key={i}>{f.error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkImportPage;
