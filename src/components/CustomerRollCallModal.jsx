import React, { useState, useEffect } from 'react';
import { useTourStore } from '../store/tourStore';
import { useAuthStore } from '../store/authStore';
import { Timer, CheckCircle, Hand } from 'lucide-react';

export default function CustomerRollCallModal() {
    const user = useAuthStore(state => state.user);
    const tours = useTourStore(state => state.tours);
    const markRollCallPresent = useTourStore(state => state.markRollCallPresent);
    const [timeLeft, setTimeLeft] = useState(0);

    // Derive active tour during render
    const activeRollCallTour = (() => {
        if (!user || user.role !== 'customer') return null;
        const now = Date.now();
        return tours.find(t => {
            // Is user a participant?
            const isParticipant = t.participants?.some(p => p.id === user.id || (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase()));
            if (!isParticipant) return false;

            // Is roll call active? (Rely strictly on the active flag to prevent client clock desync issues)
            if (t.rollCall?.active) {
                // Has current user NOT marked present yet?
                const attendees = t.rollCall.attendees || [];
                const hasMarkedPresent = attendees.some(p => p.id === user.id || (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase()));
                return !hasMarkedPresent;
            }
            return false;
        });
    })();

    useEffect(() => {
        if (!activeRollCallTour) {
            setTimeLeft(0);
            return;
        }

        const updateTimer = () => {
            const remaining = Math.max(0, Math.floor((activeRollCallTour.rollCall.endTime - Date.now()) / 1000));
            setTimeLeft(remaining);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [activeRollCallTour?.rollCall?.endTime, activeRollCallTour?.id]);

    if (!activeRollCallTour) return null;

    const handleMarkHere = () => {
        markRollCallPresent(activeRollCallTour.id, user);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}>
            <div className="card" style={{ width: '100%', maxWidth: '340px', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '4px solid #fecaca' }}>
                    <Timer size={32} color="#ef4444" />
                </div>
                
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-main)', textAlign: 'center' }}>Yoklama Başladı!</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', margin: 0, marginBottom: '24px', lineHeight: 1.5 }}>
                    <strong>{activeRollCallTour.name}</strong> için seyahat uzmanınız yoklama başlattı. Lütfen buradayım ikonuna tıklayın.
                </p>

                <div style={{ fontSize: '32px', fontWeight: '800', color: '#ef4444', marginBottom: '24px', fontFamily: 'monospace' }}>
                    {timeLeft > 0 ? formatTime(timeLeft) : 'Son Saniyeler...'}
                </div>
                
                <button 
                    onClick={handleMarkHere} 
                    style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--primary)', color: 'white', border: 'none', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(215, 20, 122, 0.3)', transition: 'transform 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} 
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <Hand size={20} /> Buradayım
                </button>
            </div>
        </div>
    );
}
