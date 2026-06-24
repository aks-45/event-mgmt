import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => setSettings(res.data.data))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/settings', settings);
      setSettings(res.data.data);
      toast.success('Settings saved');
    } catch {
      toast.error('Save failed');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!settings) return null;

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-2xl font-bold text-navy dark:text-gold">Event Settings</h1>
      <form onSubmit={handleSave} className="card-panel space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Event Name</label>
          <input
            className="input-field"
            value={settings.eventName}
            onChange={(e) => setSettings({ ...settings, eventName: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ID Prefix</label>
          <input
            className="input-field"
            value={settings.eventPrefix}
            onChange={(e) => setSettings({ ...settings, eventPrefix: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Primary Color</label>
          <input
            type="color"
            value={settings.branding?.primaryColor || '#002147'}
            onChange={(e) =>
              setSettings({
                ...settings,
                branding: { ...settings.branding, primaryColor: e.target.value },
              })
            }
          />
        </div>
        <button type="submit" className="btn-primary">
          Save Settings
        </button>
      </form>
    </div>
  );
};

export default SettingsPage;
