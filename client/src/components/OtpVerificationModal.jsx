import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const OtpVerificationModal = ({ open, onClose, onVerified, memberData, isVerifying }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(3);

  useEffect(() => {
    if (!memberData?.otpExpiry) return;

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(memberData.otpExpiry);
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(diff);

      if (diff === 0) {
        setError('OTP has expired. Please request a new one.');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [memberData?.otpExpiry, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    onVerified(otp);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          Verify OTP
        </h2>

        {/* Member Info */}
        <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-5">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold">Member:</span> {memberData?.fullName}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold">Mobile:</span> {memberData?.mobile}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold">Industry:</span> {memberData?.industryName}
          </p>
        </div>

        {/* Time Remaining */}
        <div className="text-center mb-5">
          {timeLeft > 0 ? (
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              OTP expires in: {formatTime(timeLeft)}
            </p>
          ) : (
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              OTP has expired
            </p>
          )}
        </div>

        {/* OTP Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Enter 6-digit OTP *
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength="6"
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(val);
                setError('');
              }}
              placeholder="000000"
              className="input-field text-center text-2xl tracking-widest font-mono"
              disabled={isVerifying || timeLeft === 0}
              required
            />
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>

          {/* Attempts Info */}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Attempts remaining: {attemptsLeft}
          </p>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isVerifying || timeLeft === 0 || otp.length !== 6}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? 'Verifying OTP...' : 'Verify & Add Member'}
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isVerifying}
            className="btn-secondary w-full disabled:opacity-50"
          >
            Cancel
          </button>
        </form>

        {/* Info Message */}
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
          OTP has been sent to the coordinator's WhatsApp number
        </p>
      </div>
    </div>
  );
};

export default OtpVerificationModal;
