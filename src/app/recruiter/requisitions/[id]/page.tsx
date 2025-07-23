// src/app/recruiter/requisitions/[id]/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import RecruiterLayout from '@/components/layout/RecruiterLayout';
import { useParams } from 'next/navigation';
import { mockJobApi, Job } from '@/lib/mockJobApi'; // Import mockJobApi and Job type
import Link from 'next/link';

export default function RequisitionDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      if (id) {
        // Ensure id is a string, then fetch
        const fetchedJob = await mockJobApi.getJobById(id as string);
        setJob(fetchedJob);
      }
    };
    fetchJob();
  }, [id]);

  if (!job) {
    return (
      <RecruiterLayout>
        <div className="min-h-screen p-6 text-white flex items-center justify-center">
          Loading requisition details...
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout>
      <div className="max-w-4xl mx-auto glass p-6 rounded-xl text-white space-y-6">
        <div>
          <h1 className="text-3xl font-bold">✨ {job.title}</h1>
          <p className="text-muted text-sm">Company: {job.company} • Location: {job.location}</p>
          <p className="text-xs text-purple-400 mt-2">Status: Open</p> {/* Assuming status is always Open from mock */}
        </div>

        <div>
          <h2 className="font-semibold mb-2">📝 Job Description</h2>
          <p className="text-sm text-muted">
            {job.description}
          </p>
        </div>

        <div>
          <h2 className="font-semibold mb-2">📋 Requirements</h2>
          <ul className="list-disc list-inside text-sm text-muted">
            {job.requirements.map((req, index) => (
              <li key={index}>{req}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-semibold mb-2">🌟 Benefits</h2>
          <ul className="list-disc list-inside text-sm text-muted">
            {job.benefits.map((benefit, index) => (
              <li key={index}>{benefit}</li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass p-4 rounded-md">
            <p className="text-muted text-sm">Applicants</p>
            <p className="text-2xl font-bold">23</p> {/* Mock data */}
          </div>
          <div className="glass p-4 rounded-md">
            <p className="text-muted text-sm">Interviews</p>
            <p className="text-2xl font-bold">8</p> {/* Mock data */}
          </div>
          <div className="glass p-4 rounded-md">
            <p className="text-muted text-sm">Offers Made</p>
            <p className="text-2xl font-bold">2</p> {/* Mock data */}
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white">
            ✏️ Edit
          </button>
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white">
            🗑️ Archive
          </button>
        </div>
      </div>
    </RecruiterLayout>
  );
}
