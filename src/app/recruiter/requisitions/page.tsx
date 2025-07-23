// src/app/recruiter/requisitions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import RequisitionCard from '@/components/recruiter/RequisitionCard';
import RecruiterLayout from '@/components/layout/RecruiterLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { mockJobApi, Job } from '@/lib/mockJobApi';  // Import mockJobApi and Job type
import Link from 'next/link'; // Import Link

type RequisitionStatus = "Open" | "Closed" | "In Review";

export default function RequisitionListPage() {
  const [filter, setFilter] = useState<RequisitionStatus | 'All'>('All');
  const [jobs, setJobs] = useState<Job[]>([]); // Use Job type from mockJobApi
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    } else if (user?.role !== 'recruiter') {
      router.push('/');
    } else {
      // Fetch jobs when component mounts or user/auth changes
      const fetchJobs = async () => {
        try {
          const fetchedJobs = await mockJobApi.getJobs(); // Fetch jobs using mockJobApi
          // Map mockJobApi's Job type to RequisitionCard's props
          const formattedJobs = fetchedJobs.map(job => ({
            id: job.id, // Use job.id directly which is a string now
            title: job.title,
            location: job.location,
            postedDate: job.postedDate,
            status: 'Open' as RequisitionStatus, // Default all fetched jobs to 'Open' for simplicity
            applicants: Math.floor(Math.random() * 50) + 1, // Mock applicants
          }));
          setJobs(formattedJobs as any); // Type assertion for now due to status mapping
        } catch (error) {
          console.error('Failed to fetch jobs:', error);
        }
      };
      fetchJobs();
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'recruiter') {
    return null;
  }

  // Filter based on the status, assuming all mock jobs are 'Open' for now.
  // In a real app, you'd store the status in the backend/mockJobApi.
  const filtered =
    filter === 'All'
      ? jobs
      : jobs.filter((job) => job.status === filter);


  return (
    <RecruiterLayout>
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Requisitions</h1>
        <Link href="/recruiter/requisitions/new" passHref>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
            + New Requisition
          </button>
        </Link>
      </div>

      <div className="flex gap-4 mb-6">
        {['All', 'Open', 'Closed', 'In Review'].map((s) => ( // Use string array for statuses
          <button
            key={s}
            onClick={() => setFilter(s as RequisitionStatus | 'All')}
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
          // Ensure RequisitionCard can handle string IDs if its prop type is number
          // For now, casting req.id to string if it's expected as number in RequisitionCard
          <RequisitionCard key={req.id} {...req} id={req.id as string} />
        ))}
        {filtered.length === 0 && <p className="text-gray-400">No requisitions found.</p>}
      </div>
    </div>
    </RecruiterLayout>
  );
}
