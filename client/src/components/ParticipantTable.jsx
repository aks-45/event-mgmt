import { Link } from 'react-router-dom';
import { formatDate } from '../utils/formatDate';
import { useAuth } from '../context/AuthContext';
import EmptyState from './EmptyState';
import { IconUsers } from './ui/Icons';

const ParticipantTable = ({ participants, guests = [], onAddMember, onEdit, onDelete, onPrint }) => {
  const { isAdmin } = useAuth();

  const guestRows = guests.map((g) => ({
    ...g,
    participantId: g.guestId,
    isGuest: true,
  }));

  if (!participants?.length && !guestRows.length) {
    return (
      <EmptyState
        icon={IconUsers}
        title="No participants found"
        description="Try adjusting your search or register a new participant."
      />
    );
  }

  const parentMap = new Map();
  const childrenMap = new Map();

  participants.forEach((p) => {
    if (p.isChildMember && p.parentParticipantId) {
      if (!childrenMap.has(p.parentParticipantId)) childrenMap.set(p.parentParticipantId, []);
      childrenMap.get(p.parentParticipantId).push(p);
    } else {
      parentMap.set(p.participantId, p);
    }
  });

  const rows = [];
  parentMap.forEach((parent) => {
    rows.push({ ...parent, isParent: true, level: 0 });
    (childrenMap.get(parent.participantId) || []).forEach((child) => {
      rows.push({ ...child, isParent: false, isChild: true, level: 1 });
    });
  });
  guestRows.forEach((g) => rows.push(g));

  const rowBg = (p) => {
    if (p.isGuest && p.isHonorary) return 'bg-purple-50 dark:bg-purple-900/20';
    return '';
  };

  return (
    <div className="overflow-x-auto rounded-xl">
      <table className="table-modern w-full">
        <thead>
          <tr>
            <th>Participant ID</th>
            <th>Name</th>
            <th className="hidden md:table-cell">Industry</th>
            <th className="hidden lg:table-cell">Mobile</th>
            <th className="hidden sm:table-cell">Registered</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p._id || p.guestId} className={rowBg(p)}>
              <td>
                <div className={`flex items-center gap-2 ${p.isChild ? 'pl-4' : ''}`}>
                  {p.isChild && (
                    <span className="text-slate-400 text-xs font-semibold">└─</span>
                  )}
                  <span className="badge-navy font-mono">{p.participantId}</span>

                  {/* Type labels */}
                  {!p.isGuest && !p.isChild && (
                    <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-bold text-navy dark:bg-navy/30 dark:text-gold uppercase tracking-wide">
                      Member
                    </span>
                  )}
                  {p.isChild && (
                    <span className="rounded-full bg-slate-200 dark:bg-slate-600 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                      Add Member
                    </span>
                  )}
                  {p.isGuest && !p.isHonorary && (
                    <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                      Guest
                    </span>
                  )}
                  {p.isGuest && p.isHonorary && (
                    <span className="rounded-full bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 text-[10px] font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wide">
                      Honorary
                    </span>
                  )}
                </div>
              </td>
              <td className="font-semibold text-slate-800 dark:text-slate-100">{p.fullName}</td>
              <td className="hidden md:table-cell text-slate-600 dark:text-slate-300">{p.industryName}</td>
              <td className="hidden lg:table-cell">{p.mobile}</td>
              <td className="hidden sm:table-cell text-xs text-slate-500">{formatDate(p.createdAt)}</td>
              <td>
                <div className="flex flex-wrap gap-1">
                  {!p.isGuest && (
                    <Link to={`/participants/${p._id}`} className="action-link text-navy dark:text-gold">View</Link>
                  )}
                  {!p.isChild && !p.isGuest && (
                    <>
                      <button type="button" onClick={() => onEdit(p)} className="action-link text-slate-600">Edit</button>
                      <button type="button" onClick={() => onPrint(p)} className="action-link text-gold-dark dark:text-gold">Print</button>
                      <button type="button" onClick={() => onAddMember(p)} className="action-link text-emerald-700 dark:text-emerald-300">Add Member</button>
                    </>
                  )}
                  {(p.isChild || p.isGuest) && (
                    <button type="button" onClick={() => onPrint(p)} className="action-link text-gold-dark dark:text-gold">Print</button>
                  )}
                  {(isAdmin || p.isChild || p.isGuest) && (
                    <button type="button" onClick={() => onDelete(p)} className="action-link text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Delete</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ParticipantTable;
