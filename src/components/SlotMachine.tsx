'use client';

import { useState, useCallback } from 'react';

interface SlotMachineProps {
  balance: number;
  onBalanceUpdate: (balance: number) => void;
}

export default function SlotMachine({ balance, onBalanceUpdate }: SlotMachineProps) {
  const [bet, setBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState<string[]>(['🍒', '🍋', '🍇']);
  const [message, setMessage] = useState('');

  const spin = useCallback(async () => {
    if (spinning) return;
    
    setSpinning(true);
    setMessage('');

    try {
      const clientSeed = Math.random().toString(36).substring(7);
      const nonce = Date.now();

      const res = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount: bet, clientSeed, nonce })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Spin failed');
        setSpinning(false);
        return;
      }

      // Animate reels
      const interval = setInterval(() => {
        setReels([
          ['🍒', '🍋', '🍇', '💎', '7️⃣'][Math.floor(Math.random() * 5)],
          ['🍒', '🍋', '🍇', '💎', '7️⃣'][Math.floor(Math.random() * 5)],
          ['🍒', '🍋', '🍇', '💎', '7️⃣'][Math.floor(Math.random() * 5)]
        ]);
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        setReels(data.reels);
        setSpinning(false);
        onBalanceUpdate(data.newBalance);

        if (data.isWin) {
          setMessage(`🎉 WIN! +${data.payout}`);
        } else {
          setMessage('Try again!');
        }
      }, 1500);
    } catch (error) {
      setMessage('Network error');
      setSpinning(false);
    }
  }, [bet, spinning, onBalanceUpdate]);

  const adjustBet = (amount: number) => {
    const newBet = bet + amount;
    if (newBet >= 10 && newBet <= 1000 && newBet <= balance) {
      setBet(newBet);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-2xl">
      <div className="bg-black rounded-lg p-8 mb-6">
        <div className="flex justify-center gap-4 text-6xl mb-4">
          {reels.map((reel, i) => (
            <div 
              key={i} 
              className={`w-24 h-24 flex items-center justify-center bg-gray-700 rounded ${
                spinning ? 'animate-pulse' : ''
              }`}
            >
              {reel}
            </div>
          ))}
        </div>
        {message && (
          <div className={`text-center text-xl font-bold ${message.includes('WIN') ? 'text-green-400' : 'text-yellow-400'}`}>
            {message}
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-gray-400 text-sm mb-2">Bet Amount</label>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => adjustBet(-10)}
            disabled={spinning}
            className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50"
          >
            -
          </button>
          <div className="flex-1 text-center text-2xl font-mono text-yellow-400">
            {bet}
          </div>
          <button 
            onClick={() => adjustBet(10)}
            disabled={spinning}
            className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>

      <button
        onClick={spin}
        disabled={spinning || balance < bet}
        className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold text-xl rounded-lg disabled:opacity-50 hover:from-yellow-400 hover:to-yellow-500 transition-all"
      >
        {spinning ? 'Spinning...' : 'SPIN'}
      </button>

      <div className="mt-4 text-center text-gray-400 text-sm">
        Balance: {balance.toLocaleString()}
      </div>
    </div>
  );
}