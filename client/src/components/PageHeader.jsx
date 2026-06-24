const PageHeader = ({ title, subtitle, children }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-in-down">
    <div>
      <div className="gold-divider mb-3" />
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
    {children && <div className="flex flex-wrap gap-2 shrink-0">{children}</div>}
  </div>
);

export default PageHeader;
