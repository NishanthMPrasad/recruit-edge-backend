'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CandidateDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    } else if (user?.role !== 'candidate') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'candidate') {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="glass rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome, {user.name} 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Manage your job applications and profile
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Applications</h3>
              <p className="text-3xl font-bold">12</p>
              <p className="text-blue-100 text-sm">Active applications</p>
            </div>
            <div className="glass bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Interviews</h3>
              <p className="text-3xl font-bold">3</p>
              <p className="text-green-100 text-sm">Scheduled interviews</p>
            </div>
            <div className="glass bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Saved Jobs</h3>
              <p className="text-3xl font-bold">8</p>
              <p className="text-orange-100 text-sm">Bookmarked positions</p>
            </div>
          </div>
          <div className="glass bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
                Browse Jobs
              </button>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors">
                Update Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 