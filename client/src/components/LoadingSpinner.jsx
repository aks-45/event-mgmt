const LoadingSpinner = ({ fullScreen = false, size = 'md', label = 'Loading...' }) => {
  const sizes = { sm: 'h-8 w-8', md: 'h-12 w-12', lg: 'h-16 w-16' };

  const spinner = (
    <div className="flex flex-col items-center gap-4 animate-fade-in">
      <div className={`relative ${sizes[size]}`}>
        <div className={`absolute inset-0 rounded-full border-4 border-gold/20 ${sizes[size]}`} />
        <div
          className={`absolute inset-0 rounded-full border-4 border-transparent border-t-gold border-r-navy animate-spin ${sizes[size]}`}
          role="status"
          aria-label={label}
        />
      </div>
      {size !== 'sm' && (
        <p className="text-sm font-medium text-slate-500 animate-pulse-soft dark:text-slate-400">
          {label}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center mesh-bg">{spinner}</div>
    );
  }
  return <div className="flex justify-center py-16">{spinner}</div>;
};

export default LoadingSpinner;
