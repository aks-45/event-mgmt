import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  uploadHonoraryGuests,
  getHonoraryGuestStats,
  clearAllHonoraryGuests,
} from '../services/honoraryGuestService';

const HonoraryGuestsPage = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await getHonoraryGuestStats();
      setStats(res.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchStats().finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (
        !selectedFile.type.includes('spreadsheet') &&
        !selectedFile.name.endsWith('.xlsx') &&
        !selectedFile.name.endsWith('.xls')
      ) {
        toast.error('Please upload an Excel file (.xlsx or .xls)');
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const response = await uploadHonoraryGuests(file);
      toast.success(response.data.message);
      setFile(null);
      e.target.reset();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear all honorary guests? This cannot be undone.')) return;

    try {
      await clearAllHonoraryGuests();
      toast.success('Honorary guests cleared');
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Clear failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Honorary Guests Import"
        subtitle="Upload Excel sheet with honorary guest names and mobile numbers"
      />

      {loading ? (
        <div className="card-panel p-6">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Upload Section — Gold Accent */}
          <div className="card-panel p-6 border-gold/30 dark:border-gold/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-dark shadow-glow">
                <svg className="h-5 w-5 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-navy dark:text-gold">
                Upload Honorary Guest Excel Sheet
              </h2>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Excel File *
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Required column: <strong>NAME</strong> · Optional column: <strong>MOB NO.</strong> · Industry column is <strong>ignored</strong>
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="input-field"
                  required
                />
                {file && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    ✓ File selected: {file.name}
                  </p>
                )}
              </div>

              <div className="rounded-lg bg-gradient-to-r from-gold/10 to-amber-50 dark:from-gold/5 dark:to-amber-900/10 border border-gold/30 dark:border-gold/20 p-4">
                <p className="text-sm text-amber-900 dark:text-gold font-semibold">
                  ⭐ Instructions:
                </p>
                <ul className="text-sm text-amber-800 dark:text-amber-200 mt-2 space-y-1">
                  <li>• Column: <strong>NAME</strong> — Full name of the honorary guest</li>
                  <li>• Column: <strong>MOB NO.</strong> — Mobile number (optional)</li>
                  <li>• Any <strong>Industry</strong> column will be ignored</li>
                  <li>• These guests will appear with a <span className="inline-flex items-center rounded-full bg-gradient-to-r from-gold to-gold-light px-2 py-0.5 text-xs font-bold text-navy">★ Gold</span> badge in the registration forms</li>
                </ul>
              </div>

              <button type="submit" disabled={uploading} className="btn-gold w-full">
                {uploading ? 'Uploading...' : '⭐ Upload Honorary Guests'}
              </button>
            </form>
          </div>

          {/* Statistics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-panel p-6 text-center border-gold/30 dark:border-gold/20">
              <div className="text-3xl font-bold bg-gradient-to-r from-gold to-gold-dark bg-clip-text text-transparent">
                {stats?.totalGuests || 0}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Honorary Guests
              </p>
            </div>

            <div className="card-panel p-6 text-center">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {stats?.totalGuests ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Ready — Visible in Registration
                  </span>
                ) : (
                  '✗ No data uploaded'
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Auto-Fill Status
              </p>
            </div>

            <div className="card-panel p-6">
              <button
                onClick={handleClear}
                disabled={!stats?.totalGuests}
                className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed rounded-xl border-2 border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition-all duration-300 hover:bg-red-100 hover:border-red-300 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/40"
              >
                Clear All Honorary Guests
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="card-panel p-4 bg-gradient-to-r from-gold/5 to-amber-50/50 dark:from-gold/5 dark:to-amber-900/10 border border-gold/30 dark:border-gold/20">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>⭐ How it works:</strong> Once you upload an Excel sheet, honorary guest names will appear with a <strong>gold badge</strong> in both the "Add Member" and "Guest Registration" forms. Their industry field is automatically set to "Honorary Guest".
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default HonoraryGuestsPage;
