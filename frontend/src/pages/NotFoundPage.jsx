import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 rounded-3xl bg-indigo-950/40 border border-indigo-800/40 text-indigo-400 mb-6 shadow-2xl">
        <Compass className="w-12 h-12 animate-spin-slow" />
      </div>

      <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">404</h1>
      <h2 className="text-lg font-semibold text-slate-200 mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
        The workspace board or page you are trying to access does not exist or has been relocated.
      </p>

      <Link to="/dashboard">
        <Button variant="primary" icon={ArrowLeft}>
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
