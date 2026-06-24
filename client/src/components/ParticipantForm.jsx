import { useState, useEffect, useRef } from 'react';
import { liveSearchMembers, checkInExcel } from '../services/participantService';

const OVERRIDE_PASSWORD = '3119';

const ParticipantForm = ({
  form,
  onChange,
  onSubmit,
  loading,
  submitLabel = 'Register',
  showEmail = true,
  onSelectedNamesChange,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null); // 'industry' | 'name' | 'mobile'
  const [names, setNames] = useState([]);
  const [selectedNames, setSelectedNames] = useState([]);
  const [autoFilled, setAutoFilled] = useState(false);
  const [warningModal, setWarningModal] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');
  const [overridePwd, setOverridePwd] = useState('');
  const [overrideError, setOverrideError] = useState('');
  const [pendingSubmit, setPendingSubmit] = useState(null);
  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSuggestions([]);
        setActiveField(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const triggerSearch = (q, field) => {
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setSuggestions([]); setActiveField(null); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await liveSearchMembers(q);
        setSuggestions(res.data.data || []);
        setActiveField(field);
      } catch { setSuggestions([]); }
    }, 250);
  };

  const handleIndustryChange = (value) => {
    onChange('industryName', value);
    if (!autoFilled) { setNames([]); setSelectedNames([]); }
    setAutoFilled(false);
    triggerSearch(value, 'industry');
  };

  const handleNameChange = (value) => {
    onChange('fullName', value);
    setAutoFilled(false);
    triggerSearch(value, 'name');
  };

  const handleMobileChange = (value) => {
    onChange('mobile', value);
    setAutoFilled(false);
    triggerSearch(value, 'mobile');
  };

  const handleSelect = (member) => {
    onChange('industryName', member.industryName);
    onChange('mobile', member.mobileNo);
    setSuggestions([]);
    setActiveField(null);
    setAutoFilled(true);
    setNames(member.names);
    if (member.names.length === 1) {
      onChange('fullName', member.names[0]);
      setSelectedNames([member.names[0]]);
    } else {
      onChange('fullName', '');
      setSelectedNames([]);
    }
  };

  const toggleName = (name) => {
    setSelectedNames((prev) => {
      const next = prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name];
      onChange('fullName', next[0] || '');
      if (onSelectedNamesChange) onSelectedNamesChange(next);
      return next;
    });
  };

  const doSubmit = (e) => {
    if (onSelectedNamesChange) onSelectedNamesChange(selectedNames);
    onSubmit(e, selectedNames.length > 1 ? selectedNames : null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await checkInExcel(form.industryName, form.fullName);
      const { found, nameMatch } = res.data.data;
      if (!found) {
        setWarningMsg(`"${form.industryName}" is not found in the uploaded Excel sheet.`);
        setPendingSubmit(e); setWarningModal(true); return;
      }
      if (!nameMatch) {
        setWarningMsg(`"${form.fullName}" is not listed under "${form.industryName}" in the Excel sheet.`);
        setPendingSubmit(e); setWarningModal(true); return;
      }
    } catch { /* allow on check failure */ }
    doSubmit(e);
  };

  const handleOverrideSubmit = (e) => {
    e.preventDefault();
    if (overridePwd === OVERRIDE_PASSWORD) {
      setWarningModal(false); setOverridePwd(''); setOverrideError('');
      doSubmit(pendingSubmit);
    } else {
      setOverrideError('Incorrect password. Registration not allowed.');
      setOverridePwd('');
    }
  };

  const DropdownList = () =>
    suggestions.length > 0 && activeField ? (
      <ul className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800 max-h-52 overflow-y-auto">
        {suggestions.map((m, i) => (
          <li key={i} onMouseDown={() => handleSelect(m)} className="cursor-pointer px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700">
            <span className="font-medium text-slate-800 dark:text-slate-100">{m.industryName}</span>
            <span className="ml-2 text-slate-400 text-xs">{m.names.join(', ')} · {m.mobileNo}</span>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <>
      <form onSubmit={handleFormSubmit} className="space-y-5">

        {/* Industry Name */}
        <div ref={activeField === 'industry' ? dropdownRef : null} className="relative">
          <label className="block text-sm font-medium mb-1">Industry Name *</label>
          <input
            className="input-field"
            value={form.industryName}
            onChange={(e) => handleIndustryChange(e.target.value)}
            required
            placeholder="Type industry name..."
            autoComplete="off"
          />
          {activeField === 'industry' && <DropdownList />}
        </div>

        {/* Full Name */}
        <div ref={activeField === 'name' ? dropdownRef : null} className="relative">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Full Name *
            {names.length > 1 && <span className="ml-2 text-xs font-normal text-slate-400">Select one or both</span>}
          </label>
          {names.length > 1 ? (
            <div className="space-y-2">
              {names.map((n, i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <input type="checkbox" className="h-4 w-4 rounded accent-navy" checked={selectedNames.includes(n)} onChange={() => toggleName(n)} />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{n}</span>
                  {selectedNames.includes(n) && <span className="ml-auto text-xs text-navy dark:text-gold font-semibold">Selected</span>}
                </label>
              ))}
              {selectedNames.length > 0 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {selectedNames.length === 1 ? '1 ID card will be printed' : `${selectedNames.length} ID cards will be printed`}
                </p>
              )}
            </div>
          ) : (
            <>
              <input
                className="input-field"
                value={form.fullName}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="Type name..."
                autoComplete="off"
              />
              {activeField === 'name' && <DropdownList />}
            </>
          )}
        </div>

        {/* Mobile */}
        <div ref={activeField === 'mobile' ? dropdownRef : null} className="relative">
          <label className="block text-sm font-medium mb-1">Mobile Number *</label>
          <input
            className={`input-field ${autoFilled ? 'bg-slate-50 dark:bg-slate-700/50' : ''}`}
            value={form.mobile}
            onChange={(e) => handleMobileChange(e.target.value)}
            required
            placeholder="Type mobile number..."
            autoComplete="off"
            readOnly={autoFilled}
          />
          {autoFilled && <p className="text-xs text-slate-400 mt-1">Auto-filled — shared across all members of this industry</p>}
          {activeField === 'mobile' && <DropdownList />}
        </div>

        {showEmail && (
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input type="email" className="input-field" value={form.email || ''} onChange={(e) => onChange('email', e.target.value)} placeholder="rahul@example.com" />
          </div>
        )}

        <button type="submit" disabled={loading || (names.length > 1 && selectedNames.length === 0)} className="btn-primary w-full">
          {loading ? 'Processing...' : submitLabel}
        </button>
      </form>

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
    </>
  );
};

export default ParticipantForm;
