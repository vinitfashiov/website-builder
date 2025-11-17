"use client";

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/http';

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await api.get('/customer/support');
        setTickets(res.data);
      } catch (error) {
        setTickets([]);
      } finally {
        setInitializing(false);
      }
    };

    fetchTickets();
  }, []);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please enter your message');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/customer/support', { message });
      toast.success('Support ticket created!');
      setMessage('');
      setTickets((prev) => [res.data, ...prev]);
    } catch (error) {
      toast.error(error?.response?.data?.detail ?? 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-600" data-testid="support-loading">
        Loading tickets...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto" data-testid="support-page">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Support</h1>
        <p className="text-gray-600 text-sm sm:text-base">Get help from our team</p>
      </div>

      <Card className="p-4 sm:p-6 mb-6">
        <Label className="mb-2 block font-semibold">Need Help?</Label>
        <Textarea
          data-testid="textarea-support-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your issue..."
          rows={4}
          className="mb-4"
        />
        <Button onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700" data-testid="btn-submit-support">
          {loading ? 'Submitting...' : 'Submit Ticket'}
        </Button>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold">Your Tickets</h2>
        {tickets.length === 0 ? (
          <Card className="p-6 text-center text-gray-600">No support tickets yet</Card>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id} className="p-4" data-testid="support-ticket-item">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                <span
                  className={`text-xs px-2 py-1 rounded w-fit ${
                    ticket.status === 'open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {ticket.status}
                </span>
                <span className="text-sm text-gray-500">{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-700 text-sm sm:text-base">{ticket.message}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

