import { useState } from 'react';
import toast from 'react-hot-toast';
import IdCardGenerator from '../components/IdCardGenerator';
import { useIdCardLayout } from '../context/IdCardLayoutContext';
import { getCardLayout } from '../config/idCardLayout';

const SAMPLE = {
  participantId: 'IIA2026-000001',
  fullName: 'Rahul Sharma',
  industryName: 'Rahul Industries Pvt Ltd',
  qrImage:
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#fff"/><path d="M10 10h30v30H10zM60 10h30v30H60zM10 60h30v30H10zM45 45h10v10H45zM60 60h15v15H60zM80 60h10v10H80zM60 80h10v10H60zM80 80h10v10H80z" fill="#000"/></svg>'
    ),
};

const CARD_TYPES = [
  {
    id: 'member',
    label: 'Member',
    templateSrc: '/id-card-template.jpeg',
    sampleIds: { participantId: 'IIA2026-000001' },
  },
  {
    id: 'guest',
    label: 'Guest',
    templateSrc: '/guest.jpeg',
    sampleIds: { guestId: 'GUEST-000001' },
  },
  {
    id: 'honorary',
    label: 'Honorary Guest',
    templateSrc: '/honorary.jpeg',
    sampleIds: { guestId: 'HON-000001', isHonorary: true },
  },
];

const Slider = ({ label, value, min, max, step, unit, onChange }) => (
  <label className="block text-sm">
    <span className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
      <span>{label}</span>
      <span className="font-mono text-xs">
        {value}
        {unit}
      </span>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-gold"
    />
  </label>
);

const NumberInput = ({ label, value, onChange, min, max, step = 1 }) => (
  <label className="block text-sm">
    <span className="text-slate-600 dark:text-slate-300">{label}</span>
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="input-field mt-1"
    />
  </label>
);

const CardLayoutPage = () => {
  const { layout, updateCardLayout, updateCardSection, saveLayout, resetLayout, importLayout, saved } =
    useIdCardLayout();
  const [preview, setPreview] = useState(SAMPLE);
  const [activeCardType, setActiveCardType] = useState(CARD_TYPES[0]);
  const activeLayout = getCardLayout(layout, activeCardType.id);
  const previewCard = {
    ...preview,
    participantId: undefined,
    guestId: undefined,
    isHonorary: false,
    ...activeCardType.sampleIds,
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'id-card-layout.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Layout exported');
  };

  const handleSave = async () => {
    try {
      await saveLayout();
      toast.success('Layout saved for all browsers');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save layout');
    }
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importLayout(JSON.parse(reader.result));
        toast.success('Layout imported — click Save to apply');
      } catch {
        toast.error('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-gold">ID Card Layout</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Adjust sliders until name, industry, and QR align with your template. Click{' '}
            <strong>Save layout</strong> — all cards on this browser will use these positions.
            You can also edit <code className="text-xs bg-slate-100 px-1 rounded">client/src/config/idCardLayout.js</code> for permanent defaults.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleSave} className="btn-gold">
            Save layout
          </button>
          <button type="button" onClick={resetLayout} className="btn-outline">
            Reset defaults
          </button>
          <button type="button" onClick={handleExport} className="btn-outline">
            Export JSON
          </button>
          <label className="btn-outline cursor-pointer">
            Import JSON
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </div>

      {saved && (
        <p className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg">
          Layout saved for all browsers.
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card-panel space-y-6 max-h-[80vh] overflow-y-auto">
          <section>
            <h2 className="font-semibold text-navy dark:text-gold mb-3">Card type</h2>
            <div className="flex flex-wrap gap-2">
              {CARD_TYPES.map((cardType) => (
                <button
                  key={cardType.id}
                  type="button"
                  onClick={() => setActiveCardType(cardType)}
                  className={
                    activeCardType.id === cardType.id
                      ? 'btn-primary'
                      : 'btn-outline'
                  }
                >
                  {cardType.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-semibold text-navy dark:text-gold mb-3">Preview text</h2>
            <div className="grid grid-cols-1 gap-3">
              <label className="text-sm">
                Sample name
                <input
                  className="input-field mt-1"
                  value={preview.fullName}
                  onChange={(e) => setPreview({ ...preview, fullName: e.target.value })}
                />
              </label>
              <label className="text-sm">
                Sample industry
                <input
                  className="input-field mt-1"
                  value={preview.industryName}
                  onChange={(e) => setPreview({ ...preview, industryName: e.target.value })}
                />
              </label>
            </div>
          </section>

          <section>
            <h2 className="font-semibold text-navy dark:text-gold mb-3">Card type label</h2>
            <div className="space-y-3">
              <Slider
                label="Top position"
                value={activeLayout.typeLabel.topPercent}
                min={0}
                max={100}
                step={0.5}
                unit="%"
                onChange={(v) =>
                  updateCardSection(activeCardType.id, 'typeLabel', 'topPercent', v)
                }
              />
              <Slider
                label="Font size"
                value={activeLayout.typeLabel.fontSizePx}
                min={8}
                max={32}
                step={0.5}
                unit="px"
                onChange={(v) =>
                  updateCardSection(activeCardType.id, 'typeLabel', 'fontSizePx', v)
                }
              />
            </div>
          </section>

          <section>
            <h2 className="font-semibold text-navy dark:text-gold mb-3">Name</h2>
            <div className="space-y-3">
              <Slider
                label="Top position"
                value={activeLayout.name.topPercent}
                min={0}
                max={80}
                step={0.5}
                unit="%"
                onChange={(v) => updateCardSection(activeCardType.id, 'name', 'topPercent', v)}
              />
              <Slider
                label="Font size"
                value={activeLayout.name.fontSizePx}
                min={10}
                max={40}
                step={0.5}
                unit="px"
                onChange={(v) => updateCardSection(activeCardType.id, 'name', 'fontSizePx', v)}
              />
              <NumberInput
                label="Max width (px)"
                value={activeLayout.name.maxWidthPx}
                min={100}
                max={400}
                onChange={(v) => updateCardSection(activeCardType.id, 'name', 'maxWidthPx', v)}
              />
              <NumberInput
                label="Padding left (px)"
                value={activeLayout.name.paddingLeft}
                min={0}
                max={120}
                onChange={(v) => updateCardSection(activeCardType.id, 'name', 'paddingLeft', v)}
              />
              <NumberInput
                label="Padding right (px)"
                value={activeLayout.name.paddingRight}
                min={0}
                max={120}
                onChange={(v) => updateCardSection(activeCardType.id, 'name', 'paddingRight', v)}
              />
            </div>
          </section>

          <section>
            <h2 className="font-semibold text-navy dark:text-gold mb-3">Industry</h2>
            <div className="space-y-3">
              <Slider
                label="Top position"
                value={activeLayout.industry.topPercent}
                min={0}
                max={90}
                step={0.5}
                unit="%"
                onChange={(v) =>
                  updateCardSection(activeCardType.id, 'industry', 'topPercent', v)
                }
              />
              <Slider
                label="Font size"
                value={activeLayout.industry.fontSizePx}
                min={8}
                max={28}
                step={0.5}
                unit="px"
                onChange={(v) =>
                  updateCardSection(activeCardType.id, 'industry', 'fontSizePx', v)
                }
              />
              <NumberInput
                label="Max width (px)"
                value={activeLayout.industry.maxWidthPx}
                min={100}
                max={400}
                onChange={(v) =>
                  updateCardSection(activeCardType.id, 'industry', 'maxWidthPx', v)
                }
              />
              <NumberInput
                label="Padding left (px)"
                value={activeLayout.industry.paddingLeft}
                min={0}
                max={120}
                onChange={(v) =>
                  updateCardSection(activeCardType.id, 'industry', 'paddingLeft', v)
                }
              />
              <NumberInput
                label="Padding right (px)"
                value={activeLayout.industry.paddingRight}
                min={0}
                max={120}
                onChange={(v) =>
                  updateCardSection(activeCardType.id, 'industry', 'paddingRight', v)
                }
              />
            </div>
          </section>

          <section>
            <h2 className="font-semibold text-navy dark:text-gold mb-3">QR code</h2>
            <div className="space-y-3">
              <Slider
                label="From right"
                value={activeLayout.qr.rightPercent}
                min={0}
                max={40}
                step={0.5}
                unit="%"
                onChange={(v) => updateCardSection(activeCardType.id, 'qr', 'rightPercent', v)}
              />
              <Slider
                label="From bottom"
                value={activeLayout.qr.bottomPercent}
                min={0}
                max={40}
                step={0.5}
                unit="%"
                onChange={(v) => updateCardSection(activeCardType.id, 'qr', 'bottomPercent', v)}
              />
              <Slider
                label="Size (width)"
                value={activeLayout.qr.widthPercent}
                min={15}
                max={45}
                step={0.5}
                unit="%"
                onChange={(v) => updateCardSection(activeCardType.id, 'qr', 'widthPercent', v)}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={activeLayout.qr.whiteBackground}
                  onChange={(e) =>
                    updateCardSection(activeCardType.id, 'qr', 'whiteBackground', e.target.checked)
                  }
                />
                White background behind QR
              </label>
            </div>
          </section>

          <section>
            <h2 className="font-semibold text-navy dark:text-gold mb-3">Card size</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <NumberInput
                  label="Print width (cm)"
                  value={activeLayout.cardWidthCm}
                  min={3}
                  max={15}
                  step={0.1}
                  onChange={(v) => updateCardLayout(activeCardType.id, { cardWidthCm: v })}
                />
                <NumberInput
                  label="Print height (cm)"
                  value={activeLayout.cardHeightCm}
                  min={3}
                  max={20}
                  step={0.1}
                  onChange={(v) => updateCardLayout(activeCardType.id, { cardHeightCm: v })}
                />
              </div>
              <Slider
                label="Preview width"
                value={activeLayout.cardWidth}
                min={280}
                max={500}
                step={10}
                unit="px"
                onChange={(v) => updateCardLayout(activeCardType.id, { cardWidth: v })}
              />
            </div>
          </section>
        </div>

        <div className="card-panel flex flex-col items-center sticky top-4 self-start">
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {CARD_TYPES.map((cardType) => (
              <button
                key={cardType.id}
                type="button"
                onClick={() => setActiveCardType(cardType)}
                className={
                  activeCardType.id === cardType.id
                    ? 'rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white dark:bg-gold dark:text-navy'
                    : 'rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-navy hover:text-navy dark:border-slate-600 dark:text-slate-300 dark:hover:border-gold dark:hover:text-gold'
                }
              >
                {cardType.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500 mb-4">{activeCardType.label} preview</p>
          <IdCardGenerator
            participant={previewCard}
            showActions={false}
            layout={activeLayout}
            templateSrc={activeCardType.templateSrc}
          />
        </div>
      </div>
    </div>
  );
};

export default CardLayoutPage;
