import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 dark:bg-surface-950 p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion size={40} />
        </div>
        <h1 className="text-6xl font-black text-surface-900 dark:text-white tracking-tight mb-4">
          404
        </h1>
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
          Page not found
        </h2>
        <p className="text-surface-500 dark:text-surface-400 mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <Button as={Link} to="/" leftIcon={<Home size={18} />}>
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
