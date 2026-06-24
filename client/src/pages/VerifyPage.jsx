import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import toast from 'react-hot-toast';
import { verifyQr } from '../services/verifyService';
import { getPendingAttendance, markManualAttendance } from '../services/attendanceService';

const VerifyPage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const processingRef = useRef(false);

  const [scanning, setScanning] = useState(false);
  const [manualQr, setManualQr] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [pending, setPending] = useState([]);
  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingLoading, setPendingLoading] = useState(false);

  const fetchPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      const res = await getPendingAttendance();
      setPending(res.data.data || []);
    } catch {
      toast.error('Failed to load pending list');
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const processQr = useCallback(async (qrData) => {
    if (processingRef.current) return;
    processingRef.current = true;
    stopCamera();
    setLoading(true);
    try {
      const res = await verifyQr(qrData);
      setResult(res.data);
      toast[res.data.valid ? 'success' : 'error'](res.data.message || (res.data.valid ? 'Verified' : 'Invalid QR'));
      if (res.data.valid && !res.data.duplicateScan) fetchPending();
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed';
      setResult({ valid: false, message: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  }, [stopCamera, fetchPending]);

  const tick = useCallback(() => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c || v.videoWidth === 0) { return; }
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const imageData = ctx.getImageData(0, 0, c.width, c.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
    if (code?.data) processQr(code.data);
  }, [processQr]);

  const startCamera = async () => {
    setResult(null);
    processingRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await new Promise((resolve, reject) => {
        videoRef.current.onloadedmetadata = () => videoRef.current.play().then(resolve).catch(reject);
        videoRef.current.onerror = reject;
      });
      setScanning(true);
      intervalRef.current = setInterval(tick, 300);
    } catch {
      toast.error('Camera access denied or unavailable');
    }
  };

  const handleManualMark = async (person) => {
    try {
      await markManualAttendance({ id: person.id, type: person.type });
      toast.success(`Attendance marked: ${person.name}`);
      setPending((prev) => prev.filter((p) => p.id !== person.id));
      setResult({
        valid: true,
        message: 'Attendance marked manually',
        data: { participant: { participantId: person.id, fullName: person.name, industryName: person.industry, attendanceStatus: 'Present' } },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance');
    }
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  const filteredPending = pending.filter((p) =>
    !pendingSearch.trim() ||
    p.name.toLowerCase().includes(pendingSearch.toLowerCase()) ||
    p.id.toLowerCase().includes(pendingSearch.toLowerCase()) ||
    (p.industry || '').toLowerCase().includes(pendingSearch.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-navy dark:text-gold">QR Verification</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left — Scanner + manual paste */}
        <div className="card-panel space-y-4">
          <div className="flex gap-2">
            {!scanning ? (
              <button type="button" onClick={startCamera} disabled={loading} className="btn-primary">
                {loading ? 'Verifying...' : 'Scan QR'}
              </button>
            ) : (
              <button type="button" onClick={stopCamera} className="btn-outline">Stop Camera</button>
            )}
            {(result || manualQr) && (
              <button type="button" onClick={() => { setResult(null); setManualQr(''); }} className="btn-outline">Reset</button>
            )}
          </div>

          <div className={`relative rounded-lg overflow-hidden bg-black aspect-video max-h-72 ${scanning ? 'block' : 'hidden'}`}>
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-4 border-gold rounded-lg opacity-80" />
            </div>
            <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/80">Point camera at QR code</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Or paste QR data manually</label>
            <textarea
              className="input-field font-mono text-xs h-20 resize-none"
              value={manualQr}
              onChange={(e) => setManualQr(e.target.value)}
              placeholder='{"participantId":"IIA2026-000001",...}'
            />
            <button
              type="button"
              className="btn-gold mt-2"
              disabled={loading || !manualQr.trim()}
              onClick={() => processQr(manualQr.trim())}
            >
              Verify Manually
            </button>
          </div>

          {result && (
            <div className={`border-l-4 rounded-lg p-4 ${result.valid ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
              <h2 className={`font-bold ${result.valid ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {result.valid ? '✓ Verified' : '✗ Invalid QR'}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{result.message}</p>
              {result.data?.participant && (
                <dl className="mt-3 text-sm grid grid-cols-2 gap-1">
                  <dt className="text-slate-500">ID</dt><dd className="font-mono text-xs">{result.data.participant.participantId}</dd>
                  <dt className="text-slate-500">Name</dt><dd>{result.data.participant.fullName}</dd>
                  <dt className="text-slate-500">Industry</dt><dd>{result.data.participant.industryName}</dd>
                  <dt className="text-slate-500">Status</dt><dd>{result.data.participant.attendanceStatus}</dd>
                </dl>
              )}
            </div>
          )}
        </div>

        {/* Right — Pending list */}
        <div className="card-panel space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-navy dark:text-gold">
              Pending Attendance
              {pending.length > 0 && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  {pending.length}
                </span>
              )}
            </h2>
            <button type="button" onClick={fetchPending} className="text-xs text-slate-400 hover:text-navy dark:hover:text-gold">
              ↻ Refresh
            </button>
          </div>

          <input
            className="input-field text-sm"
            placeholder="Search by name, ID or industry..."
            value={pendingSearch}
            onChange={(e) => setPendingSearch(e.target.value)}
          />

          {pendingLoading ? (
            <p className="text-sm text-slate-400 text-center py-4">Loading...</p>
          ) : filteredPending.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              {pending.length === 0 ? 'All attendance marked ✓' : 'No results'}
            </p>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
              {filteredPending.map((person) => (
                <li key={person.id}>
                  <button
                    type="button"
                    onClick={() => handleManualMark(person)}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors rounded-lg group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{person.name}</p>
                        <p className="text-xs text-slate-400 truncate">{person.id}{person.industry ? ` · ${person.industry}` : ''}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        person.type === 'guest'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                          : 'bg-navy/10 text-navy dark:bg-navy/30 dark:text-gold'
                      }`}>
                        {person.type === 'guest' ? 'Guest' : 'Member'}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;
