'use client';

import { useEffect, useState } from 'react';
import SlotMachine from '@/components/SlotMachine';

export default function SlotPage() {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/balance')
      .then(res => res.json())
      .then(data => {
        if (data.balance !== undefined) {
          setBalance(data.balance);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleBalanceUpdate = (newBalance: number) => {
    setBalance(newBalance);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">🎰 Lucky Slots</h1>
          <div className="text-2xl text-white">
            Balance: <span className="font-mono text-green-400">{balance.toLocaleString()}</span>
          </div>
        </div>

        <SlotMachine 
          balance={balance} 
          onBalanceUpdate={handleBalanceUpdate}
        />

        <div className="mt-6 text-center">
          <a 
            href="/api/leaderboard"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            View Leaderboard
          </a>
        </div>
      </div>
    </main>
  );
}