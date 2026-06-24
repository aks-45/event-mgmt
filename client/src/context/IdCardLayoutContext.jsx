import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import {
  DEFAULT_ID_CARD_LAYOUT,
  STORAGE_KEY,
  loadLayoutFromStorage,
  mergeCardLayout,
  normalizeLayout,
} from '../config/idCardLayout';
import { getSettings, updateSettings } from '../services/settingsService';

const IdCardLayoutContext = createContext(null);

export const IdCardLayoutProvider = ({ children }) => {
  const [layout, setLayoutState] = useState(
    () => loadLayoutFromStorage() || DEFAULT_ID_CARD_LAYOUT
  );
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('iia_token');
    if (!token) return;

    setLoading(true);
    getSettings()
      .then((res) => {
        const nextSettings = res.data.data;
        setSettings(nextSettings);
        if (nextSettings.branding?.idCardLayout) {
          setLayoutState(normalizeLayout(nextSettings.branding.idCardLayout));
        }
      })
      .catch(() => {
        // Keep local/default layout available if server settings are unavailable.
      })
      .finally(() => setLoading(false));
  }, []);

  const setLayout = useCallback((updater) => {
    setLayoutState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return normalizeLayout(next);
    });
    setSaved(false);
  }, []);

  const updateCardLayout = useCallback((cardType, patch) => {
    setLayoutState((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [cardType]: mergeCardLayout({ ...prev.cards[cardType], ...patch }),
      },
    }));
    setSaved(false);
  }, []);

  const updateCardSection = useCallback((cardType, section, field, value) => {
    setLayoutState((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [cardType]: mergeCardLayout({
          ...prev.cards[cardType],
          [section]: { ...prev.cards[cardType][section], [field]: value },
        }),
      },
    }));
    setSaved(false);
  }, []);

  const saveLayout = useCallback(async () => {
    const nextSettings = {
      ...(settings || {}),
      branding: {
        ...(settings?.branding || {}),
        idCardLayout: layout,
      },
    };

    const res = await updateSettings(nextSettings);
    setSettings(res.data.data);
    localStorage.removeItem(STORAGE_KEY);
    setSaved(true);
    return res.data.data;
  }, [layout, settings]);

  const resetLayout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setLayoutState(DEFAULT_ID_CARD_LAYOUT);
    setSaved(true);
  }, []);

  const importLayout = useCallback((json) => {
    setLayoutState(normalizeLayout(json));
    setSaved(false);
  }, []);

  const value = useMemo(
    () => ({
      layout,
      setLayout,
      updateCardLayout,
      updateCardSection,
      saveLayout,
      resetLayout,
      importLayout,
      loading,
      saved,
    }),
    [
      layout,
      setLayout,
      updateCardLayout,
      updateCardSection,
      saveLayout,
      resetLayout,
      importLayout,
      loading,
      saved,
    ]
  );

  return (
    <IdCardLayoutContext.Provider value={value}>{children}</IdCardLayoutContext.Provider>
  );
};

export const useIdCardLayout = () => {
  const ctx = useContext(IdCardLayoutContext);
  if (!ctx) throw new Error('useIdCardLayout must be used within IdCardLayoutProvider');
  return ctx;
};
