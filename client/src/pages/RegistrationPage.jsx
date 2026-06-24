import { useState } from 'react';
import toast from 'react-hot-toast';
import ParticipantForm from '../components/ParticipantForm';
import IdCardGenerator from '../components/IdCardGenerator';
import { createParticipant } from '../services/participantService';
import PageHeader from '../components/PageHeader';

const emptyForm = { fullName: '', industryName: '', mobile: '' };

const RegistrationPage = () => {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState([]); // array for multi

  const onChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e, selectedNames) => {
    if (e?.preventDefault) e.preventDefault();
    setLoading(true);
    const namesToRegister = selectedNames?.length > 0 ? selectedNames : [form.fullName];
    const results = [];
    try {
      for (const name of namesToRegister) {
        const res = await createParticipant({ ...form, fullName: name });
        results.push(res.data.data);
        toast.success(`Registered: ${res.data.data.participantId}`);
      }
      setRegistered(results);
      setForm(emptyForm);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Participant Registration"
        subtitle="Register attendees and generate their ID card instantly"
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card-panel-hover">
          <h2 className="mb-4 font-display text-lg font-semibold text-navy dark:text-gold">New Registration</h2>
          <ParticipantForm
            form={form}
            onChange={onChange}
            onSubmit={handleSubmit}
            loading={loading}
            showEmail={false}
          />
        </div>

        <div className="card-panel-hover">
          <h2 className="mb-4 font-display text-lg font-semibold text-navy dark:text-gold">ID Card Preview</h2>
          {registered.length > 0 ? (
            <div className="space-y-8">
              {registered.map((p) => (
                <div key={p.participantId}>
                  {registered.length > 1 && (
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                      {p.fullName}
                    </p>
                  )}
                  <IdCardGenerator participant={p} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center dark:border-slate-600">
              <p className="text-sm text-slate-500">Register a participant to preview and print their ID card.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;
