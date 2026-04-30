import React, { useState, useEffect } from 'react';
import { Timer, UserCheck, UserX } from 'lucide-react';

export default function ExpertRollCallPanel({ tour, onAllPresent, onTimeUpMissing }) {
    const [timeLeft, setTimeLeft] = useState(0);

    const attendees = tour.rollCall?.attendees || [];
    const attendeesIds = attendees.map(a => a.id);
    const participants = tour.participants || [];

    // Trigger completion if all present
    useEffect(() => {
        if (!tour.rollCall?.active) return;
        if (participants.length > 0 && attendees.length === participants.length) {
            onAllPresent(tour.id);
        }
    }, [attendees.length, participants.length, tour.rollCall?.active, tour.id, onAllPresent]);

    // Timer effect
    useEffect(() => {
        const updateTimer = () => {
            if (!tour.rollCall) return;
            const remaining = Math.max(0, Math.floor((tour.rollCall.endTime - Date.now()) / 1000));
            setTimeLeft(remaining);
            
            if (remaining === 0 && tour.rollCall.active) {
                // Determine who is missing when time is exactly 0 and it was active
                // Wait for the next render to let attendees sync, but basically:
                if (attendees.length < participants.length) {
                    const missing = participants.filter(p => !attendeesIds.includes(p.id));
                    onTimeUpMissing(tour.id, missing);
                }
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [tour.rollCall, participants, attendeesIds, attendees.length, onTimeUpMissing, tour.id]);

    if (!tour.rollCall || timeLeft <= 0) return null;

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div style={{ marginTop: '16px', marginBottom: '16px', padding: '16px', background: '#fff0f6', border: '1px solid #fbcfe8', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 'bold' }}>
                    <Timer size={18} />
                    Yoklama Sürüyor
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)', fontFamily: 'monospace' }}>
                    {formatTime(timeLeft)}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '12px', color: 'var(--text-muted)' }}>
                <span>Toplam: <strong>{participants.length}</strong></span>
                <span>Burada: <strong style={{color: '#10b981'}}>{attendees.length}</strong></span>
                <span>Beklenen: <strong style={{color: '#ef4444'}}>{participants.length - attendees.length}</strong></span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                {participants.map(p => {
                    const isHere = attendeesIds.includes(p.id);
                    return (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'white', borderRadius: '8px', border: `1px solid ${isHere ? '#a7f3d0' : '#fecaca'}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <img src={p.avatar || `https://ui-avatars.com/api/?name=${p.name}`} alt={p.name} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                                <span style={{ fontSize: '13px', fontWeight: '600' }}>{p.name}</span>
                            </div>
                            <div>
                                {isHere ? <UserCheck size={16} color="#10b981" /> : <UserX size={16} color="#ef4444" />}
                            </div>
                        </div>
                    );
                })}
                {participants.length === 0 && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '8px' }}>
                        Tura henüz katılımcı eklenmemiş.
                    </div>
                )}
            </div>
        </div>
    );
}
