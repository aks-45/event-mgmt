import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-shell">
      {children}
    </div>
  );
};

export default PageTransition;
