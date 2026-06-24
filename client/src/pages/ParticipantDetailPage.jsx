import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import IdCardGenerator from '../components/IdCardGenerator';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/formatDate';
import { getParticipant } from '../services/participantService';

const ParticipantDetailPage = () => {
  const { id } = useParams();
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getParticipant(id)
      .then((res) => setParticipant(res.data.data))
      .catch(() => toast.error('Participant not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!participant) return null;

  return (
    <div className="space-y-6">
      <Link to="/participants" className="text-sm text-navy dark:text-gold hover:underline">
        ← Back to participants
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-panel space-y-3">
          <h1 className="text-xl font-bold text-navy dark:text-gold">{participant.fullName}</h1>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between">
              <dt className="text-slate-500">Participant ID</dt>
              <dd className="font-mono">{participant.participantId}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Industry</dt>
              <dd>{participant.industryName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Mobile</dt>
              <dd>{participant.mobile}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Email</dt>
              <dd>{participant.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Attendance</dt>
              <dd>{participant.attendanceStatus}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Verified</dt>
              <dd>{participant.isVerified ? 'Yes' : 'No'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Registered</dt>
              <dd>{formatDate(participant.createdAt)}</dd>
            </div>
          </dl>
        </div>
        <div className="card-panel">
          <IdCardGenerator participant={participant} />
        </div>
      </div>
    </div>
  );
};

export default ParticipantDetailPage;
