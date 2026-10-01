import React, { useState, useEffect } from 'react';
import { ChevronLeft, Timer, CheckCircle2, Clock, UserCheck, Search, StopCircle, Users, Check, AlertCircle } from 'lucide-react';
import { useTourStore } from '../store/tourStore';
import ConfirmModal from './ConfirmModal';

export default function ExpertRollCallPanel({ tour, onClose, onAllPresent, onTimeUpMissing }) {
    const { markRollCallPresent } = useTourStore();
    const [timeLeft, setTimeLeft] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTab, setFilterTab] = useState('all'); // 'all', 'pending', 'present'
    const [showEarlyFinishConfirm, setShowEarlyFinishConfirm] = useState(false);

    const attendees = tour?.rollCall?.attendees || [];
    const participants = tour?.participants || [];

    const isParticipantPresent = (p) => {
        return attendees.some(a => 
            (a.id && p.id && a.id === p.id) || 
            (a.email && p.email && a.email.toLowerCase() === p.email.toLowerCase()) ||
            (a.name && p.name && a.name.trim().toLowerCase() === p.name.trim().toLowerCase())
        );
    };

    const presentCount = participants.filter(isParticipantPresent).length;
    const pendingCount = Math.max(0, participants.length - presentCount);

    // Trigger completion if all present
    useEffect(() => {
        if (!tour?.rollCall?.active) return;
        if (participants.length > 0 && presentCount === participants.length) {
            onAllPresent(tour.id);
            if (onClose) onClose();
        }
    }, [presentCount, participants.length, tour?.rollCall?.active, tour?.id, onAllPresent, onClose]);

    // Timer effect
    useEffect(() => {
        const updateTimer = () => {
            if (!tour?.rollCall) return;
            const remaining = Math.max(0, Math.floor((tour.rollCall.endTime - Date.now()) / 1000));
            setTimeLeft(remaining);
            
            if (remaining === 0 && tour.rollCall.active) {
                const missing = participants.filter(p => !isParticipantPresent(p));
                if (missing.length > 0) {
                    onTimeUpMissing(tour.id, missing);
                } else {
                    onAllPresent(tour.id);
                }
                if (onClose) onClose();
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [tour?.rollCall, participants, attendees, onTimeUpMissing, onAllPresent, tour?.id, onClose]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleEarlyFinish = () => {
        setShowEarlyFinishConfirm(true);
    };

    const confirmEarlyFinish = () => {
        setShowEarlyFinishConfirm(false);
        const missing = participants.filter(p => !isParticipantPresent(p));
        if (missing.length === 0) {
            onAllPresent(tour.id);
        } else {
            onTimeUpMissing(tour.id, missing);
        }
        if (onClose) onClose();
    };

    const handleManualMark = (participant) => {
        markRollCallPresent(tour.id, participant);
    };

    const progressPercent = participants.length > 0 
        ? Math.round((presentCount / participants.length) * 100) 
        : 0;

    const filteredParticipants = participants.filter(p => {
        const isHere = isParticipantPresent(p);
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;
        if (filterTab === 'pending') return !isHere;
        if (filterTab === 'present') return isHere;
        return true;
    });

    return (
        <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            width: '100%', 
            maxWidth: '480px', 
            height: '100dvh', 
            maxHeight: '100vh', 
            zIndex: 1200, 
            background: '#f8fafc', 
            display: 'flex', 
            flexDirection: 'column', 
            animation: 'slideUp 0.2s', 
            boxShadow: '0 0 30px rgba(0,0,0,0.15)' 
        }}>
            {/* Header */}
            <div style={{ 
                background: 'var(--primary)', 
                color: 'white', 
                padding: 'calc(20px + env(safe-area-inset-top, 0px)) 16px 18px 16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                position: 'sticky', 
                top: 0, 
                zIndex: 10, 
                flexShrink: 0,
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, marginRight: '10px' }}>
                    <div onClick={onClose} style={{ cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }} title="Geri">
                        <ChevronLeft size={24} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 2px', lineHeight: 1.2 }}>Canlı Yoklama & Sayım</h2>
                        <div style={{ fontSize: '11px', opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {tour?.name}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '8px', fontSize: '10.5px', fontWeight: '700', flexShrink: 0 }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                    Canlı
                </div>
            </div>

            {/* Scrollable Content Body */}
            <div style={{ 
                padding: '16px 16px calc(24px + env(safe-area-inset-bottom, 0px)) 16px', 
                flex: 1, 
                overflowY: 'auto', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px', 
                WebkitOverflowScrolling: 'touch' 
            }}>
                
                {/* 1. Timer & Stats Hero Card */}
                <div style={{ 
                    background: 'white', 
                    borderRadius: '18px', 
                    padding: '16px 14px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#FDF2F8', color: '#D7147A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Timer size={18} />
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Kalan Süre</div>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: '#D7147A', fontFamily: 'monospace', lineHeight: 1.1 }}>
                                    {formatTime(timeLeft)}
                                </div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Tamamlanma</div>
                            <div style={{ fontSize: '15px', fontWeight: '800', color: progressPercent === 100 ? '#10b981' : 'var(--text-main)', lineHeight: 1.1 }}>
                                %{progressPercent}
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '7px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                            width: `${progressPercent}%`, 
                            height: '100%', 
                            background: progressPercent === 100 ? '#10b981' : 'linear-gradient(90deg, #D7147A, #D7147A)', 
                            borderRadius: '4px', 
                            transition: 'width 0.4s ease' 
                        }} />
                    </div>

                    {/* 3 Compact Stat Strip */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', paddingTop: '2px' }}>
                        <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '10px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>{participants.length}</div>
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Toplam</div>
                        </div>
                        <div style={{ background: '#f0fdf4', padding: '8px 10px', borderRadius: '10px', border: '1px solid #dcfce7', textAlign: 'center' }}>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#16a34a' }}>{presentCount}</div>
                            <div style={{ fontSize: '10px', color: '#15803d', fontWeight: '600' }}>Burada</div>
                        </div>
                        <div style={{ background: '#fef2f2', padding: '8px 10px', borderRadius: '10px', border: '1px solid #fee2e2', textAlign: 'center' }}>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#dc2626' }}>{pendingCount}</div>
                            <div style={{ fontSize: '10px', color: '#b91c1c', fontWeight: '600' }}>Beklenen</div>
                        </div>
                    </div>
                </div>

                {/* 2. Participants Section Card */}
                <div style={{ 
                    background: 'white', 
                    borderRadius: '18px', 
                    padding: '16px 14px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontSize: '13.5px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                            Katılımcı Durumları
                        </h3>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {filteredParticipants.length} kişi listeleniyor
                        </span>
                    </div>

                    {/* Search Input */}
                    <div style={{ position: 'relative' }}>
                        <input 
                            type="text" 
                            placeholder="Katılımcı ara..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11.5px', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
                        />
                        <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>

                    {/* Filter Tabs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                        <button 
                            onClick={() => setFilterTab('all')} 
                            style={{ 
                                padding: '6px 4px', 
                                borderRadius: '8px', 
                                border: 'none', 
                                fontSize: '11px', 
                                fontWeight: '700', 
                                cursor: 'pointer',
                                background: filterTab === 'all' ? '#1e293b' : '#f1f5f9',
                                color: filterTab === 'all' ? 'white' : '#64748b',
                                transition: 'all 0.15s'
                            }}
                        >
                            Tümü ({participants.length})
                        </button>
                        <button 
                            onClick={() => setFilterTab('pending')} 
                            style={{ 
                                padding: '6px 4px', 
                                borderRadius: '8px', 
                                border: 'none', 
                                fontSize: '11px', 
                                fontWeight: '700', 
                                cursor: 'pointer',
                                background: filterTab === 'pending' ? '#dc2626' : '#fef2f2',
                                color: filterTab === 'pending' ? 'white' : '#dc2626',
                                transition: 'all 0.15s'
                            }}
                        >
                            Beklenen ({pendingCount})
                        </button>
                        <button 
                            onClick={() => setFilterTab('present')} 
                            style={{ 
                                padding: '6px 4px', 
                                borderRadius: '8px', 
                                border: 'none', 
                                fontSize: '11px', 
                                fontWeight: '700', 
                                cursor: 'pointer',
                                background: filterTab === 'present' ? '#16a34a' : '#f0fdf4',
                                color: filterTab === 'present' ? 'white' : '#16a34a',
                                transition: 'all 0.15s'
                            }}
                        >
                            Burada ({presentCount})
                        </button>
                    </div>

                    {/* Participants List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '280px', paddingRight: '2px' }}>
                        {filteredParticipants.map(p => {
                            const isHere = isParticipantPresent(p);
                            return (
                                <div 
                                    key={p.id} 
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between', 
                                        padding: '7px 10px', 
                                        background: isHere ? '#f0fdf4' : '#ffffff', 
                                        borderRadius: '10px', 
                                        border: `1px solid ${isHere ? '#bbf7d0' : '#e2e8f0'}`,
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, marginRight: '8px' }}>
                                        <img 
                                            src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}`} 
                                            alt={p.name} 
                                            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid #f1f5f9' }} 
                                        />
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {p.name}
                                            </div>
                                            {p.company && p.company !== 'Bireysel Müşteri' && p.company !== 'Move Travel & Mice' && (
                                                <div style={{ fontSize: '9.5px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {p.company}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        {isHere ? (
                                            <div style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                                <CheckCircle2 size={12} /> Burada
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleManualMark(p)} 
                                                style={{ 
                                                    background: '#FDF2F8', 
                                                    color: '#B01064', 
                                                    border: '1px solid #F9BED8', 
                                                    padding: '3px 8px', 
                                                    borderRadius: '6px', 
                                                    fontSize: '10.5px', 
                                                    fontWeight: '700', 
                                                    cursor: 'pointer', 
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    gap: '3px',
                                                    transition: 'all 0.15s'
                                                }}
                                                title="Müşteri onay vermediyse el ile işaretleyin"
                                            >
                                                <UserCheck size={12} /> Onayla
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {filteredParticipants.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '24px 10px', color: '#94a3b8', fontSize: '11.5px' }}>
                                Arama kriterine uygun katılımcı bulunamadı.
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Bottom Action Card */}
                <div style={{ 
                    background: 'white', 
                    borderRadius: '16px', 
                    padding: '12px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)' 
                }}>
                    <button 
                        onClick={handleEarlyFinish} 
                        style={{ 
                            width: '100%', 
                            padding: '11px', 
                            borderRadius: '10px', 
                            background: '#dc2626', 
                            color: 'white', 
                            border: 'none', 
                            fontSize: '12.5px', 
                            fontWeight: '700', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '6px',
                            boxShadow: '0 3px 10px rgba(220, 38, 38, 0.25)',
                            transition: 'all 0.15s'
                        }}
                    >
                        <StopCircle size={15} /> Sayımı Erken Bitir & Sonlandır
                    </button>
                </div>

            </div>

            <ConfirmModal
                isOpen={showEarlyFinishConfirm}
                title="Yoklamayı Erken Sonlandır"
                message="Yoklamayı erken sonlandırmak istediğinize emin misiniz? Katılım bildirmeyen yolcular eksik olarak kaydedilecektir."
                confirmText="Sonlandır"
                cancelText="Vazgeç"
                type="warning"
                icon={StopCircle}
                onConfirm={confirmEarlyFinish}
                onClose={() => setShowEarlyFinishConfirm(false)}
            />
        </div>
    );
}

