import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { uploadBulkMembers, getBulkMembersStats, clearAllBulkMembers } from '../services/bulkMembersService';

const BulkMembersPage = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await getBulkMembersStats();
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
      // Validate file type
      if (
        !selectedFile.type.includes(
          'spreadsheet'
        ) &&
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
      const response = await uploadBulkMembers(file);
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
    if (!window.confirm('Clear all bulk members? This cannot be undone.')) return;

    try {
      await clearAllBulkMembers();
      toast.success('Bulk members cleared');
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Clear failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Members Import"
        subtitle="Upload Excel sheet with member data to auto-populate add member form"
      />

      {loading ? (
        <div className="card-panel p-6">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Upload Section */}
          <div className="card-panel p-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
              Upload Excel Sheet
            </h2>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Excel File *
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Required columns: <strong>Name</strong>, <strong>Contact person</strong>, <strong>Mobile No.</strong>
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

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>📝 Instructions:</strong>
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                  <li>• Column 1: <strong>Name</strong> - Industry name to match</li>
                  <li>• Column 2: <strong>Contact person</strong> - Full names (can use comma, slash, or &amp; to separate multiple)</li>
                  <li>• Column 3: <strong>Mobile No.</strong> - Phone number</li>
                  <li>• Example: Contact person "John, Jane &amp; Bob" will create 3 separate names</li>
                </ul>
              </div>

              <button type="submit" disabled={uploading} className="btn-primary w-full">
                {uploading ? 'Uploading...' : 'Upload Members'}
              </button>
            </form>
          </div>

          {/* Statistics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-panel p-6 text-center">
              <div className="text-3xl font-bold text-navy dark:text-gold">
                {stats?.totalMembers || 0}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Members in Database
              </p>
            </div>

            <div className="card-panel p-6 text-center">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {stats?.totalMembers ? '✓ Ready' : '✗ No data'}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Auto-Fill Status
              </p>
            </div>

            <div className="card-panel p-6">
              <button
                onClick={handleClear}
                disabled={!stats?.totalMembers}
                className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="card-panel p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>ℹ️ How it works:</strong> Once you upload an Excel sheet, the "Add Member" form will automatically fetch and populate Contact person and Mobile No. when you enter an Industry Name.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default BulkMembersPage;
