'use client';

import React, { useState, useEffect } from 'react';

const SessionExpiryWarning = ({ isOpen, expiresAt, onDismiss }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!isOpen || !expiresAt) return;

        function updateCountdown() {
            const ms = expiresAt - Date.now();
            if (ms <= 0) {
                setTimeLeft('00:00');
                return;
            }
            const totalSeconds = Math.floor(ms / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        }

        updateCountdown();
        const tick = setInterval(updateCountdown, 1000);
        return () => clearInterval(tick);
    }, [isOpen, expiresAt]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                            <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-950">Session Expiring</h3>
                            <p className="mt-1 text-[11px] font-bold uppercase tracking-tight text-zinc-400">You will be logged out soon</p>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 mb-6 text-center">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700 mb-2">Time remaining</p>
                        <p className="text-3xl font-black tabular-nums tracking-tight text-amber-600">{timeLeft}</p>
                    </div>

                    <p className="text-[11px] text-zinc-400 font-medium text-center mb-6">
                        Your session expires 24 hours after login. Please save your work and log back in.
                    </p>

                    <button
                        onClick={onDismiss}
                        className="w-full h-11 flex items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 text-[11px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all cursor-pointer"
                    >
                        I understand
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionExpiryWarning;
