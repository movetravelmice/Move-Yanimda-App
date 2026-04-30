import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MapPin, Calendar, Star, Users, MessageSquareQuote } from 'lucide-react';
import { useTourStore } from '../../store/tourStore';

// Fractional Star Component to render e.g. 4.8 stars with perfect SVG masking
const FractionalStar = ({ fillPercentage }) => {
    // fillPercentage is between 0 and 100
    const uid = Math.random().toString(36).substring(7); // unique mask ID to prevent collisions
    
    return (
        <div style={{ position: 'relative', width: '24px', height: '24px', display: 'inline-block' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" style={{ position: 'absolute', top: 0, left: 0 }}>
                <defs>
                    <linearGöradient id={`grad-${uid}`}>
                        <stop offset={`${fillPercentage}%`} stopColor="#fbbf24" />
                        <stop offset={`${fillPercentage}%`} stopColor="#e5e7eb" />
                    </linearGöradient>
                </defs>
                <path 
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
                    fill={`url(#grad-${uid})`} 
                    stroke="#fbbf24"
                    strokeWidth="1"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
            </svg>
        </div>
    );
};

const RatingBar = ({ averageRating }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        let fill = 0;
        if (averageRating >= i) {
            fill = 100;
        } else if (averageRating > i - 1) {
            fill = (averageRating % 1) * 100;
        }
        stars.push(<FractionalStar key={i} fillPercentage={fill} />);
    }
    
    return (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {stars}
            <span style={{ marginLeft: '12px', fontSize: '22px', fontWeight: 'bold', color: 'var(--text-main)', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                {averageRating.toFixed(1)} <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'normal' }}>/ 5</span>
            </span>
        </div>
    );
};

export default function PastTourDetails() {
    const navigate = useNavigate();
    const { tourId } = useParams();
    const { tours } = useTourStore();
    
    const tour = tours.find(t => t.id === tourId);

    if (!tour) return <div style={{ padding: '20px' }}>Tur bulunamadı!</div>;

    const participants = tour.participants || [];
    const totalParticipants = participants.length;
    
    // Analytics calculations
    const feedbacks = participants.filter(p => p.feedback);
    const totalFeedbackCount = feedbacks.length;
    const avgRating = totalFeedbackCount > 0 ? (feedbacks.reduce((sum, p) => sum + p.feedback.rating, 0) / totalFeedbackCount) : 0;

    return (
        <div style={{ paddingBottom: '90px', minHeight: '100vh', background: 'var(--bg-color)', position: 'relative' }}>
            {/* Header section with Cover Image as Background */}
            <div style={{ position: 'relative', height: '240px' }}>
                <img loading="lazy" src={tour.avatar} alt="Tour Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.8))' }}></div>
                
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '20px 16px', display: 'flex', alignItems: 'center', gap: '16px', color: 'white' }}>
                    <div 
                        style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer', transition: 'background 0.2s', backdropFilter: 'blur(4px)' }} 
                        onClick={() => navigate(-1)}
                    >
                        <ChevronLeft size={24} color="#fff" />
                    </div>
                </div>

                <div style={{ position: 'absolute', bottom: '24px', left: '20px', right: '20px', zIndex: 10, color: 'white' }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block', marginBottom: '8px', letterSpacing: '1px' }}>TAMAMLANAN TUR</div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{tour.name}</h2>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', opacity: 0.9 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {tour.destinations}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {tour.dates}</div>
                    </div>
                </div>
            </div>

            <div style={{ padding: '0 16px', marginTop: '-20px', position: 'relative', zIndex: 20 }}>
                {/* Live Scores Card */}
                <div className="card" style={{ padding: '24px', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Star size={18} className="text-primary" /> Tur Geribildirim Analizi
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Ortalama Memnuniyet</div>
                            {totalFeedbackCount > 0 ? (
                                <RatingBar averageRating={avgRating} />
                            ) : (
                                <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#9ca3af' }}>Henüz değerlendirme yapılmamış.</div>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} /> Katılımcılar</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{totalParticipants} <span style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 'normal' }}>kişi</span></div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}><MessageSquareQuote size={14} /> Yapılan Yorum</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{totalFeedbackCount}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Patient Reviews Segment */}
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-main)' }}>Müşteri Deneyimleri</h3>
                
                {participants.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Bu tura kayıtlı katılımcı bulunmuyor.</div>
                )}

                {participants.map(p => (
                    <div key={p.id} className="card" style={{ padding: '20px', borderRadius: '16px', marginBottom: '16px', display: 'flex', gap: '16px', position: 'relative' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                            <img loading="lazy" src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>{p.name}</h4>
                                {p.feedback && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fef3c7', padding: '4px 8px', borderRadius: '8px', color: '#b45309', fontSize: '12px', fontWeight: 'bold' }}>
                                        <Star size={12} fill="#d97706" color="#d97706" /> {p.feedback.rating.toFixed(1)}
                                    </div>
                                )}
                            </div>
                            
                            {p.feedback ? (
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginTop: '8px', fontStyle: 'italic', background: '#f8fafc', padding: '12px', borderRadius: '12px', position: 'relative' }}>
                                    <MessageSquareQuote size={16} style={{ position: 'absolute', top: '-8px', left: '-6px', fill: '#e2e8f0', color: 'white' }} />
                                    "{p.feedback.comment}"
                                </p>
                            ) : (
                                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '6px', height: '6px', background: '#d1d5db', borderRadius: '50%' }}></div>
                                    Değerlendirme bırakmadı
                                </div>
                            )}
                        </div>
                    </div>
                ))}

            </div>
        </div>
    );
}
