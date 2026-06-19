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
    const feedbacks = participants.filter(p => p && p.feedback);
    const totalFeedbackCount = feedbacks.length;
    const avgRating = totalFeedbackCount > 0 ? (feedbacks.reduce((sum, p) => sum + p.feedback.rating, 0) / totalFeedbackCount) : 0;

    const ratingLabels = {
        program: 'Genel Olarak Program',
        acentaHizmeti: 'Acenta Yetkililerinin Hizmeti',
        ucakHizmeti: 'Uçak Yolculuğu Ve Hizmeti',
        turlar: 'Katılım Sağladığınız Turlar',
        konaklamaTemizlik: 'Konaklama Temizlik & Konforu',
        konaklamaKonum: 'Konaklama Yer & Konumu',
        restoranYemek: 'Restoran & Yemek'
    };

    const detailedAverages = {
        program: 0,
        acentaHizmeti: 0,
        ucakHizmeti: 0,
        turlar: 0,
        konaklamaTemizlik: 0,
        konaklamaKonum: 0,
        restoranYemek: 0
    };

    if (totalFeedbackCount > 0) {
        const counts = { program: 0, acentaHizmeti: 0, ucakHizmeti: 0, turlar: 0, konaklamaTemizlik: 0, konaklamaKonum: 0, restoranYemek: 0 };
        feedbacks.forEach(p => {
            const det = p.feedback.detailedRatings || {};
            Object.keys(detailedAverages).forEach(key => {
                if (det[key] !== undefined && Number(det[key]) > 0) {
                    detailedAverages[key] += Number(det[key]);
                    counts[key]++;
                }
            });
        });
        Object.keys(detailedAverages).forEach(key => {
            if (counts[key] > 0) {
                detailedAverages[key] = (detailedAverages[key] / counts[key]).toFixed(1);
            } else {
                detailedAverages[key] = null;
            }
        });
    }

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

                        {totalFeedbackCount > 0 && (
                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '4px' }}>
                                <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '12px' }}>Kategori Bazlı Değerlendirme Ortalamaları</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                                    {Object.keys(detailedAverages).map(key => {
                                        const score = detailedAverages[key];
                                        if (score === null) return null;
                                        return (
                                            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ratingLabels[key]}</span>
                                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px', background: '#fef3c7', padding: '2px 6px', borderRadius: '6px' }}>
                                                    <Star size={12} fill="#d97706" color="#d97706" /> {score}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
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
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                                    {/* Detailed Ratings */}
                                    {p.feedback.detailedRatings && (
                                        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Soru Bazlı Değerlendirme</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {Object.keys(ratingLabels).map(key => {
                                                    const val = p.feedback.detailedRatings[key] || 0;
                                                    return (
                                                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontSize: '12px', color: 'var(--text-main)' }}>{ratingLabels[key]}</span>
                                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                                {[1, 2, 3, 4, 5].map(star => (
                                                                    <Star 
                                                                        key={star} 
                                                                        size={12} 
                                                                        fill={star <= val ? '#f59e0b' : 'none'} 
                                                                        color={star <= val ? '#f59e0b' : '#cbd5e1'} 
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Contact preferences & Next year places */}
                                    {(p.feedback.contactPref || p.feedback.nextYearPlaces) && (
                                        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {p.feedback.contactPref && (
                                                <div style={{ fontSize: '12px' }}>
                                                    <strong style={{ color: 'var(--text-main)' }}>İletişim Tercihi: </strong>
                                                    <span style={{ color: 'var(--text-muted)' }}>
                                                        {p.feedback.contactPref === 'telefon' && 'Telefon İle Bilgi Almak İstiyorum'}
                                                        {p.feedback.contactPref === 'brosur' && 'Broşür Gönderimi İle Bilgi Almak İstiyorum'}
                                                        {p.feedback.contactPref === 'istemiyorum' && 'Bilgi Almak İstemiyorum'}
                                                        {p.feedback.contactPref !== 'telefon' && p.feedback.contactPref !== 'brosur' && p.feedback.contactPref !== 'istemiyorum' && p.feedback.contactPref}
                                                    </span>
                                                </div>
                                            )}
                                            {p.feedback.nextYearPlaces && (
                                                <div style={{ fontSize: '12px' }}>
                                                    <strong style={{ color: 'var(--text-main)' }}>Önümüzdeki Yıl Seyahat Etmek İstediği Yerler: </strong>
                                                    <span style={{ color: 'var(--text-muted)' }}>{p.feedback.nextYearPlaces}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Written Comment */}
                                    <div style={{ fontSize: '13px', color: 'var(--text-main)', background: '#f8fafc', padding: '12px', borderRadius: '12px', borderLeft: '3px solid var(--primary)', fontStyle: 'italic', position: 'relative' }}>
                                        <MessageSquareQuote size={16} style={{ position: 'absolute', top: '-8px', left: '-6px', fill: '#e2e8f0', color: 'white' }} />
                                        "{p.feedback.comment || 'Detaylı puanlama yaptı, yazılı görüş belirtmedi.'}"
                                    </div>
                                </div>
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
