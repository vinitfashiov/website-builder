"use client";

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/http';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.get('/customer/payments');
        setPayments(res.data);
      } catch (error) {
        setPayments([]);
      } finally {
        setInitializing(false);
      }
    };

    fetchPayments();
  }, []);

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-600" data-testid="payments-loading">
        Loading payments...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto" data-testid="payments-page">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Payment History</h1>
        <p className="text-gray-600 text-sm sm:text-base">View all your transactions</p>
      </div>

      <Card className="p-4 sm:p-6">
        {payments.length === 0 ? (
          <p className="text-center text-gray-600">No payments yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left text-xs sm:text-sm">Type</th>
                  <th className="p-3 text-left text-xs sm:text-sm">Amount</th>
                  <th className="p-3 text-left text-xs sm:text-sm">Date</th>
                  <th className="p-3 text-left text-xs sm:text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t" data-testid="payment-row">
                    <td className="p-3 text-sm">{payment.type}</td>
                    <td className="p-3 font-semibold text-green-600 text-sm">₹{payment.amount}</td>
                    <td className="p-3 text-sm">{new Date(payment.date).toLocaleDateString()}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{payment.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

