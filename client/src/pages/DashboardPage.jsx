import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import StatCard from '../components/StatCard';
import TrendChart from '../components/TrendChart';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { getDashboardStats } from '../services/participantService';
import { downloadExcel } from '../services/exportService';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((res) => setStats(res.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    try {
      await downloadExcel();
      toast.success('Excel exported');
    } catch {
      toast.error('Export failed');
    }
  };

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;
  if (!stats) return null;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of registrations and attendance for IIA Annual Industrial Meet 2026"
      >
        <button type="button" onClick={handleExport} className="btn-gold">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Excel
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Registrations" value={stats.totalRegistrations} accent="navy" delay={50} />
        <StatCard title="Today's Registrations" value={stats.todayRegistrations} accent="gold" delay={100} />
        <StatCard title="Total Verified" value={stats.totalVerified} accent="green" delay={150} />
        <StatCard title="Pending Verification" value={stats.pendingVerification} accent="amber" delay={200} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard title="Total Guests" value={stats.totalGuests ?? 0} accent="navy" delay={250} />
        <StatCard
          title="Total Collection"
          value={`₹${(stats.totalCollection ?? 0).toLocaleString('en-IN')}`}
          accent="green"
          delay={300}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TrendChart data={stats.registrationTrends} title="Registration Trends" color="#002147" />
        <TrendChart data={stats.attendanceTrends} title="Attendance Trends" color="#D4AF37" />
      </div>
    </>
  );
};

export default DashboardPage;
