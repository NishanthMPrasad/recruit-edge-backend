// src/app/recruiter/requisitions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import RequisitionCard from '@/components/recruiter/RequisitionCard';
import RecruiterLayout from '@/components/layout/RecruiterLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

type RequisitionStatus = "Open" | "In Review" | "Closed";
type MockRequisition = {
  id: number;
  title: string;
  location: string;
  postedDate: string;
  status: RequisitionStatus;
  applicants: number;
};

const mockRequisitions: MockRequisition[] = [
  {
    id: 1,
    title: 'Frontend Developer',
    location: 'New York, NY',
    postedDate: '2025-07-05',
    status: 'Open',
    applicants: 34,
  },
  {
    id: 2,
    title: 'Backend Engineer',
    location: 'San Francisco, CA',
    postedDate: '2025-06-25',
    status: 'In Review',
    applicants: 12,
  },
  {
    id: 3,
    title: 'UX Designer',
    location: 'Remote',
    postedDate: '2025-06-18',
    status: 'Closed',
    applicants: 45,
  },
];

const statuses = ['All', 'Open', 'Closed', 'In Review'];

export default function RequisitionListPage() {
  const [filter, setFilter] = useState('All');
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    } else if (user?.role !== 'recruiter') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'recruiter') {
    return null;
  }

  const filtered =
    filter === 'All'
      ? mockRequisitions
      : mockRequisitions.filter((job) => job.status === filter);

  return (
    <RecruiterLayout>
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Requisitions</h1>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
          + New Requisition
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1 rounded-full text-sm border hover:bg-white hover:text-black transition ${
              filter === s ? 'bg-white text-black' : 'bg-transparent text-white border-white/40'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((req) => (
          <RequisitionCard key={req.id} {...req} />
        ))}
      </div>
    </div>
    </RecruiterLayout>
  );
}
