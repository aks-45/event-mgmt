import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ParticipantTable from '../components/ParticipantTable';
import ParticipantForm from '../components/ParticipantForm';
import IdCardGenerator from '../components/IdCardGenerator';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import { useDebounce } from '../hooks/useDebounce';
import {
  getParticipants,
  addSameIndustryMember,
  updateParticipant,
  deleteParticipant,
} from '../services/participantService';
import { getGuests } from '../services/guestService';

const ADD_MEMBER_PASSWORD = '2627';

const ParticipantsPage = () => {
  const [participants, setParticipants] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verified, setVerified] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [editModal, setEditModal] = useState(false);
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [printModal, setPrintModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [memberForm, setMemberForm] = useState({ fullName: '', industryName: '', mobile: '' });
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberPwd, setMemberPwd] = useState('');
  const [memberPwdError, setMemberPwdError] = useState('');
  const debouncedSearch = useDebounce(search);

  const fetchList = async () => {
    setLoading(true);
    try {
      const [pRes, gRes] = await Promise.all([
        getParticipants({
          search: debouncedSearch,
          verified: verified || undefined,
          attendanceStatus: attendanceStatus || undefined,
          page,
          limit: 15,
        }),
        getGuests({ limit: 1000 }),
      ]);
      setParticipants(pRes.data.data);
      setPagination(pRes.data.pagination);
      setGuests(gRes.data.data || []);
    } catch {
      toast.error('Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, [debouncedSearch, verified, attendanceStatus, page]);

  const openEdit = (p) => {
    setSelected(p);
    setForm({ fullName: p.fullName, industryName: p.industryName, mobile: p.mobile, email: p.email });
    setEditModal(true);
  };

  const openAddMember = (p) => {
    setSelected(p);
    setMemberForm({ fullName: '', industryName: p.industryName, mobile: '' });
    setMemberPwd('');
    setMemberPwdError('');
    setAddMemberModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateParticipant(selected._id, form);
      toast.success('Participant updated');
      setEditModal(false);
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete ${p.participantId}?`)) return;
    try {
      await deleteParticipant(p._id);
      toast.success('Deleted');
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (memberPwd !== ADD_MEMBER_PASSWORD) {
      setMemberPwdError('Incorrect password');
      setMemberPwd('');
      return;
    }
    setMemberSaving(true);
    try {
      const res = await addSameIndustryMember(selected._id, memberForm);
      toast.success('Member added successfully');
      setAddMemberModal(false);
      setSelected(res.data.data);
      setPrintModal(true);
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setMemberSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Participants" subtitle="Search, edit, and manage all event registrations" />

      <div className="card-panel flex flex-wrap gap-3">
        <input
          className="input-field flex-1 min-w-[200px]"
          placeholder="Search by ID, name, industry, mobile..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select className="input-field w-auto" value={verified} onChange={(e) => { setVerified(e.target.value); setPage(1); }}>
          <option value="">All Verified</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
        <select className="input-field w-auto" value={attendanceStatus} onChange={(e) => { setAttendanceStatus(e.target.value); setPage(1); }}>
          <option value="">All Attendance</option>
          <option value="Pending">Pending</option>
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
        </select>
      </div>

      <div className="card-panel overflow-hidden p-0">
        {loading ? (
          <div className="p-6"><LoadingSpinner /></div>
        ) : (
          <>
            <div className="p-4 md:p-2">
              <ParticipantTable
                participants={participants}
                guests={guests}
                onEdit={openEdit}
                onAddMember={openAddMember}
                onDelete={handleDelete}
                onPrint={(p) => { setSelected(p); setPrintModal(true); }}
              />
            </div>
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 border-t border-slate-100 p-4 dark:border-slate-700">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-outline text-sm">Prev</button>
                <span className="py-2 text-sm">Page {page} of {pagination.pages}</span>
                <button type="button" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="btn-outline text-sm">Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Participant">
        <ParticipantForm
          form={form}
          onChange={(f, v) => setForm((prev) => ({ ...prev, [f]: v }))}
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
        />
      </Modal>

      {/* Add Member Modal */}
      <Modal open={addMemberModal} onClose={() => setAddMemberModal(false)} title="Add Same Industry Member">
        <form onSubmit={handleAddMember} className="space-y-4">

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium mb-1">Industry *</label>
            <input
              className="input-field bg-slate-50 dark:bg-slate-700/50"
              value={memberForm.industryName}
              required
              readOnly
            />
          </div>

          {/* Name */}
          <div className="relative">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Name *</label>
            <input
              className="input-field"
              value={memberForm.fullName}
              onChange={(e) => setMemberForm((prev) => ({ ...prev, fullName: e.target.value }))}
              required
              placeholder="Member name"
              autoComplete="off"
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium mb-1">Mobile Number *</label>
            <input
              className="input-field"
              value={memberForm.mobile}
              onChange={(e) => setMemberForm((prev) => ({ ...prev, mobile: e.target.value }))}
              required
              placeholder="9876543210"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password *</label>
            <input
              type="password"
              className="input-field"
              value={memberPwd}
              onChange={(e) => { setMemberPwd(e.target.value); setMemberPwdError(''); }}
              required
              placeholder="Enter password to confirm"
            />
            {memberPwdError && <p className="text-xs text-red-600 mt-1">{memberPwdError}</p>}
          </div>

          <button type="submit" disabled={memberSaving} className="btn-primary w-full">
            {memberSaving ? 'Adding...' : 'Add Member'}
          </button>
        </form>
      </Modal>

      {/* Print Modal */}
      <Modal open={printModal} onClose={() => setPrintModal(false)} title="Print ID Card" size="lg">
        {selected && (
          <IdCardGenerator
            participant={selected}
            previewWidth={280}
            templateSrc={selected.isHonorary ? '/honorary.jpeg' : selected.guestId ? '/guest.jpeg' : '/id-card-template.jpeg'}
          />
        )}
      </Modal>
    </div>
  );
};

export default ParticipantsPage;
