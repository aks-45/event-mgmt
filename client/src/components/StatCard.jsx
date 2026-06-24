const configs = {
  navy: {
    border: 'border-l-navy',
    iconBg: 'bg-navy/10 text-navy dark:bg-navy/30 dark:text-gold',
    value: 'text-navy dark:text-gold',
    glow: 'from-navy/5',
  },
  gold: {
    border: 'border-l-gold',
    iconBg: 'bg-gold/20 text-navy-dark',
    value: 'text-navy dark:text-gold',
    glow: 'from-gold/10',
  },
  green: {
    border: 'border-l-emerald-500',
    iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    value: 'text-emerald-700 dark:text-emerald-300',
    glow: 'from-emerald-500/10',
  },
  amber: {
    border: 'border-l-amber-500',
    iconBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    value: 'text-amber-800 dark:text-amber-300',
    glow: 'from-amber-500/10',
  },
};

const icons = {
  navy: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  gold: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  green: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  amber: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const StatCard = ({ title, value, subtitle, accent = 'navy', delay = 0 }) => {
  const c = configs[accent] || configs.navy;

  return (
    <div
      className={`card-panel-hover group relative overflow-hidden border-l-4 ${c.border} opacity-0-start animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${c.glow} to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className={`mt-2 text-3xl font-bold tracking-tight transition-transform duration-300 group-hover:scale-105 ${c.value}`}>
            {value?.toLocaleString?.() ?? value}
          </p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${c.iconBg}`}>
          {icons[accent]}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
