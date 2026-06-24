import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-navy-dark via-navy to-navy-light">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl animate-float" />
        <div
          className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-gold/10 blur-3xl animate-float"
          style={{ animationDelay: '1s' }}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23D4AF37\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-2 lg:items-center">
          <div className="hidden animate-fade-in-up text-white lg:block">
            <div className="gold-divider mb-6 bg-gradient-to-r from-gold to-transparent" />
            <h1 className="font-display text-4xl font-bold leading-tight xl:text-5xl">
              IIA Event
              <span className="block text-gold">Management System</span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-slate-300">
              Register participants, generate QR codes, and print official ID cards for the
              Annual Industrial Meet 2026.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-slate-400">
              {['Secure role-based access', 'Instant QR verification', 'Print-ready ID cards'].map(
                (text) => (
                  <li key={text} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                    {text}
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="animate-scale-in rounded-2xl border border-white/10 bg-white/95 p-8 shadow-card backdrop-blur-xl dark:bg-slate-900/95">
            <div className="mb-8 text-center lg:text-left">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-navy-light font-display text-2xl font-bold text-gold shadow-glow lg:mx-0">
                IIA
              </div>
              <h2 className="font-display text-2xl font-bold text-navy dark:text-gold">
                Welcome back
              </h2>
              <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="admin@iia.org"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
