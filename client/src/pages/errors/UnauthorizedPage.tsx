import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, LogIn } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 dark:bg-surface-950 p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-6xl font-black text-surface-900 dark:text-white tracking-tight mb-4">
          401
        </h1>
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
          Unauthorized Access
        </h2>
        <p className="text-surface-500 dark:text-surface-400 mb-8">
          You don't have permission to access this page. Please sign in with an account that has access.
        </p>
        <Button as={Link} to="/login" leftIcon={<LogIn size={18} />}>
          Sign In
        </Button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
