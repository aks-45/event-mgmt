const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
    {Icon && (
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy/5 text-navy dark:bg-gold/10 dark:text-gold">
        <Icon />
      </div>
    )}
    <p className="font-semibold text-slate-700 dark:text-slate-200">{title}</p>
    {description && (
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
    )}
  </div>
);

export default EmptyState;
