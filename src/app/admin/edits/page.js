"use client";

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/http';

export default function AdminEditRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await api.get('/admin/edit-requests');
        setRequests(res.data);
      } catch (error) {
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-600" data-testid="admin-edit-requests-loading">
        Loading edit requests...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8" data-testid="admin-edit-requests-page">
      <h1 className="text-3xl font-bold mb-6">Edit Requests</h1>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Website</th>
                <th className="p-3 text-left">Request</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-t" data-testid="edit-request-admin-row">
                  <td className="p-3">{req.user_name}</td>
                  <td className="p-3">{req.website_name}</td>
                  <td className="p-3 max-w-md truncate">{req.request_text}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="p-3">{new Date(req.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

