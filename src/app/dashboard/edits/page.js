"use client";

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/http';

export default function EditRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [newRequest, setNewRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await api.get('/customer/edit-requests');
        setRequests(res.data);
      } catch (error) {
        setRequests([]);
      } finally {
        setInitializing(false);
      }
    };

    fetchRequests();
  }, []);

  const handleSubmit = async () => {
    if (!newRequest.trim()) {
      toast.error('Please enter your request');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/customer/edit-request', { request_text: newRequest });
      toast.success('Edit request submitted!');
      setNewRequest('');
      setRequests((prev) => [res.data, ...prev]);
    } catch (error) {
      toast.error(error?.response?.data?.detail ?? 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-600" data-testid="edit-requests-loading">
        Loading requests...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto" data-testid="edit-requests-page">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Edit Requests</h1>
        <p className="text-gray-600 text-sm sm:text-base">Request changes to your website</p>
      </div>

      <Card className="p-4 sm:p-6 mb-6">
        <Label className="mb-2 block font-semibold">Request Changes</Label>
        <Textarea
          data-testid="textarea-edit-request"
          value={newRequest}
          onChange={(e) => setNewRequest(e.target.value)}
          placeholder="Describe the changes you'd like to make..."
          rows={4}
          className="mb-4"
        />
        <Button onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700" data-testid="btn-submit-request">
          {loading ? 'Submitting...' : 'Submit Request'}
        </Button>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold">Your Requests</h2>
        {requests.length === 0 ? (
          <Card className="p-6 text-center text-gray-600">No edit requests yet</Card>
        ) : (
          requests.map((req) => (
            <Card key={req.id} className="p-4" data-testid="edit-request-item">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                <span
                  className={`text-xs px-2 py-1 rounded w-fit ${
                    req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}
                >
                  {req.status}
                </span>
                <span className="text-sm text-gray-500">{new Date(req.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-700 text-sm sm:text-base">{req.request_text}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

