import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { createGuest } from '../services/guestService';
import { liveSearchMembers, checkInExcel } from '../services/participantService';
import IdCardGenerator from '../components/IdCardGenerator';
import PageHeader from '../components/PageHeader';

const HONORARY_PASSWORD = '2627';
const OVERRIDE_PASSWORD = '2627';
const emptyForm = { fullName: '', industryName: '', mobile: '', paymentMode: 'Cash', honorGuest: false };

const GuestRegistrationPage = () => {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [names, setNames] = useState([]);
  const [honoraryPwd, setHonoraryPwd] = useState('');
  const [warningModal, setWarningModal] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');
  const [overridePwd, setOverridePwd] = useState('');
  const [overrideError, setOverrideError] = useState('');
  const [autoFilled, setAutoFilled] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const onChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleHonoraryCheck = (checked) => {
    onChange('honorGuest', checked);
    setHonoraryPwd('');
    if (checked) onChange('paymentMode', '');
    else onChange('paymentMode', 'Cash');
  };

  const clearAutoFill = () => {
    setAutoFilled(false);
    setNames([]);
    onChange('industryName', '');
    onChange('fullName', '');
    onChange('mobile', '');
    onChange('honorGuest', false);
    onChange('paymentMode', 'Cash');
    setHonoraryPwd('');
    setSuggestions([]); setShowDropdown(false);
  };

  const handleIndustryChange = (value) => {
    onChange('industryName', value);
    onChange('fullName', '');
    setNames([]);
    clearTimeout(debounceRef.current);
    if (!value.trim()) { setSuggestions([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await liveSearchMembers(value);
        setSuggestions(res.data.data || []);
        setShowDropdown(true);
      } catch { setSuggestions([]); }
    }, 250);
  };

  const handleSelect = (member) => {
    onChange('industryName', member.industryName);
    onChange('mobile', member.mobileNo);
    setShowDropdown(false);
    setSuggestions([]);
    setAutoFilled(true);
    setNames(member.names);
    if (member.names.length === 1) onChange('fullName', member.names[0]);
    else onChange('fullName', '');

    if (member.isHonorary) {
      onChange('honorGuest', true);
      onChange('paymentMode', '');
      setHonoraryPwd(HONORARY_PASSWORD);
    } else {
      onChange('honorGuest', false);
      onChange('paymentMode', 'Cash');
      setHonoraryPwd('');
    }
  };

  const doRegister = async () => {
    setLoading(true);
    try {
      const res = await createGuest(form);
      setRegistered(res.data.data);
      setForm(emptyForm);
      setNames([]);
      setHonoraryPwd('');
      setAutoFilled(false);
      toast.success(`Guest registered: ${res.data.data.guestId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate honorary password on submit
    if (form.honorGuest) {
      if (honoraryPwd !== HONORARY_PASSWORD) {
        toast.error('Incorrect honorary password');
        return;
      }
      await doRegister();
      return;
    }

    // Excel check for regular guests
    if (form.industryName) {
      try {
        const res = await checkInExcel(form.industryName, form.fullName);
        const { found, nameMatch } = res.data.data;
        if (!found) {
          setWarningMsg(`"${form.industryName}" is not found in the uploaded Excel sheet.`);
          setWarningModal(true);
          return;
        }
        if (!nameMatch) {
          setWarningMsg(`"${form.fullName}" is not listed under "${form.industryName}" in the Excel sheet.`);
          setWarningModal(true);
          return;
        }
      } catch { /* allow on check failure */ }
    }
    await doRegister();
  };

  const handleOverrideSubmit = (e) => {
    e.preventDefault();
    if (overridePwd === OVERRIDE_PASSWORD) {
      setWarningModal(false);
      setOverridePwd('');
      setOverrideError('');
      doRegister();
    } else {
      setOverrideError('Incorrect password. Registration not allowed.');
      setOverridePwd('');
    }
  };

  const templateSrc = registered?.isHonorary ? '/honorary.jpeg' : '/guest.jpeg';

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Guest Registration" subtitle="Register guests and generate their ID card — ₹1,500 per guest" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card-panel-hover">
          <h2 className="mb-4 font-display text-lg font-semibold text-navy dark:text-gold">New Guest</h2>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Industry Name */}
            <div ref={wrapperRef} className="relative">
              <label className="block text-sm font-medium mb-1">Industry Name <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                className={`input-field ${autoFilled ? 'bg-slate-50 dark:bg-slate-700/50' : ''}`}
                value={form.industryName}
                onChange={(e) => handleIndustryChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                placeholder="Start typing or leave blank..."
                autoComplete="off"
                readOnly={autoFilled}
              />
              {autoFilled && (
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-slate-400">Auto-filled from selection{form.honorGuest ? ' — Honorary Guest' : ''}</p>
                  <button type="button" onClick={clearAutoFill} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear</button>
                </div>
              )}
              {showDropdown && suggestions.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800 max-h-52 overflow-y-auto">
                  {suggestions.map((m, i) => (
                    <li
                      key={i}
                      onMouseDown={() => handleSelect(m)}
                      className={`cursor-pointer px-4 py-2.5 text-sm transition-colors ${
                        m.isHonorary
                          ? 'bg-gradient-to-r from-gold/10 to-amber-50 hover:from-gold/20 hover:to-amber-100 dark:from-gold/10 dark:to-amber-900/20 dark:hover:from-gold/20 dark:hover:to-amber-900/30 border-l-4 border-gold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {m.isHonorary && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-gold to-gold-light px-2 py-0.5 text-[10px] font-bold text-navy shadow-sm">
                            ★ Honorary
                          </span>
                        )}
                        <span className={`font-medium ${m.isHonorary ? 'text-amber-900 dark:text-gold' : 'text-slate-800 dark:text-slate-100'}`}>
                          {m.isHonorary ? m.names[0] : m.industryName}
                        </span>
                        <span className="ml-auto text-slate-400 text-xs">
                          {m.isHonorary ? m.mobileNo : `${m.names.join(', ')} · ${m.mobileNo}`}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
              {names.length > 1 ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {names.map((n, i) => (
                      <button key={i} type="button" onClick={() => onChange('fullName', n)}
                        className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                          form.fullName === n
                            ? 'border-navy bg-navy text-white dark:border-gold dark:bg-gold dark:text-navy'
                            : 'border-slate-300 bg-slate-50 text-slate-700 hover:border-navy dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200'
                        }`}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <input className="input-field" value={form.fullName} onChange={(e) => onChange('fullName', e.target.value)} required placeholder="Or type name..." />
                </div>
              ) : (
                <input className="input-field" value={form.fullName} onChange={(e) => onChange('fullName', e.target.value)} required placeholder="Rahul Sharma" />
              )}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium mb-1">Mobile Number *</label>
              <input className="input-field" value={form.mobile} onChange={(e) => onChange('mobile', e.target.value)} required placeholder="9876543210" pattern="[0-9+\-\s]{10,15}" />
            </div>

            {/* Honorary Guest */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 accent-navy"
                  checked={form.honorGuest}
                  onChange={(e) => handleHonoraryCheck(e.target.checked)}
                />
                <span className="text-sm font-semibold text-navy dark:text-gold tracking-wide uppercase">Honorary Guest</span>
              </label>
              {form.honorGuest && (
                <input
                  type="password"
                  className="input-field"
                  placeholder="Enter honorary password"
                  value={honoraryPwd}
                  onChange={(e) => setHonoraryPwd(e.target.value)}
                  autoFocus
                />
              )}
            </div>

            {/* Payment Mode — hidden for honorary */}
            {!form.honorGuest && (
              <div>
                <label className="block text-sm font-medium mb-1">Payment Mode *</label>
                <select className="input-field" value={form.paymentMode} onChange={(e) => onChange('paymentMode', e.target.value)} required>
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                </select>
              </div>
            )}

            {form.honorGuest ? (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
                Honorary Guest — <strong>no fee charged</strong>
              </div>
            ) : (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                Guest fee: <strong>₹1,500</strong> · Payment: <strong>{form.paymentMode}</strong>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Registering...' : 'Register Guest'}
            </button>
          </form>
        </div>

        <div className="card-panel-hover">
          <h2 className="mb-4 font-display text-lg font-semibold text-navy dark:text-gold">ID Card Preview</h2>
          {registered ? (
            <IdCardGenerator participant={registered} templateSrc={templateSrc} />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center dark:border-slate-600">
              <p className="text-sm text-slate-500">Register a guest to preview and print their ID card.</p>
            </div>
          )}
        </div>
      </div>

      {/* Override password modal */}
      {warningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Not in Excel Sheet</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{warningMsg}</p>
              </div>
            </div>
            <form onSubmit={handleOverrideSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Enter override password to proceed</label>
                <input type="password" className="input-field" value={overridePwd} onChange={(e) => { setOverridePwd(e.target.value); setOverrideError(''); }} placeholder="Password" autoFocus />
                {overrideError && <p className="text-xs text-red-600 mt-1">{overrideError}</p>}
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">Proceed</button>
                <button type="button" className="btn-outline flex-1" onClick={() => { setWarningModal(false); setOverridePwd(''); setOverrideError(''); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestRegistrationPage;
