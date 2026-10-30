import React from 'react';
import { X, Phone, MessageCircle, Compass } from 'lucide-react';

export default function ExpertModal({ data, onClose }) {
  if (!data) return null;

  const rawExperts = [data.expert1, data.expert2].filter(Boolean);
  const experts = rawExperts.filter((exp, idx, arr) => {
    if (idx === 0) return true;
    const first = arr[0];
    const isSame = 
      (exp.id && first.id && exp.id === first.id) ||
      (exp.email && first.email && exp.email.toLowerCase() === first.email.toLowerCase()) ||
      (exp.name && first.name && exp.name.trim().toLowerCase() === first.name.trim().toLowerCase());
    return !isSame;
  });
  const isMultiple = experts.length > 1;

  return (
    <div 
      onClick={onClose}
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: 'rgba(15, 23, 42, 0.58)', 
        zIndex: 9999, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '16px', 
        backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          width: '100%', 
          maxWidth: '380px', 
          background: '#ffffff',
          borderRadius: '24px', 
          border: '1.5px solid #F9BED8',
          boxShadow: '0 24px 48px -12px rgba(215, 20, 122, 0.16), 0 12px 32px -8px rgba(15, 23, 42, 0.18)',
          padding: '20px 18px', 
          animation: 'dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)', 
          position: 'relative',
          boxSizing: 'border-box'
        }}
      >
        {/* Close Button */}
        <button 
          type="button"
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '14px', 
            right: '14px', 
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer', 
            color: '#64748b',
            transition: 'all 0.15s ease',
            padding: 0
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#fee2e2';
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.borderColor = '#fecaca';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#f8fafc';
            e.currentTarget.style.color = '#64748b';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}
          title="Kapat"
        >
          <X size={16} strokeWidth={2.4} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingRight: '36px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: '#FDF2F8',
            color: '#D7147A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Compass size={18} strokeWidth={2.3} />
          </div>
          <div style={{ width: '1.2px', height: '22px', background: '#F9BED8', borderRadius: '1px', flexShrink: 0 }} />
          <div>
            <h2 style={{ fontSize: '14.5px', fontWeight: '800', margin: 0, color: '#0f172a', letterSpacing: '-0.2px' }}>
              {isMultiple ? 'Seyahat Uzmanlarımız' : 'Seyahat Uzmanı'}
            </h2>
            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '1px' }}>
              Tur operasyonunuzdan sorumlu rehber kadrosu
            </div>
          </div>
        </div>
        
        {/* Expert Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {experts.map((exp, idx) => (
            <div 
              key={idx} 
              style={{ 
                background: 'linear-gradient(135deg, #ffffff 0%, #fff8fb 100%)', 
                borderRadius: '16px', 
                padding: '14px', 
                border: '1.2px solid #F9BED8', 
                boxShadow: '0 2px 8px rgba(215, 20, 122, 0.04)',
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '52px', 
                  height: '52px', 
                  borderRadius: '50%', 
                  overflow: 'hidden', 
                  border: '2.5px solid #ffffff', 
                  boxShadow: '0 3px 10px rgba(215, 20, 122, 0.16)', 
                  flexShrink: 0,
                  background: '#f1f5f9'
                }}>
                  <img 
                    loading="lazy" 
                    src={exp.avatar} 
                    alt={exp.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>

                <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '14.5px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                      {exp.name}
                    </h3>
                  </div>
                  
                  <div style={{ marginTop: '3px' }}>
                    <span style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '9.5px', 
                      fontWeight: '800', 
                      background: idx === 0 ? '#FDF2F8' : '#eff6ff', 
                      color: idx === 0 ? '#D7147A' : '#2563eb', 
                      padding: '2px 8px', 
                      borderRadius: '6px', 
                      border: idx === 0 ? '1px solid #F9BED8' : '1px solid #bfdbfe' 
                    }}>
                      {idx === 0 ? '★ Ana Seyahat Uzmanı' : '2. Seyahat Uzmanı'}
                    </span>
                  </div>

                  {exp.phone && (
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', fontWeight: '500' }}>
                      {exp.phone}
                    </div>
                  )}

                  {exp.email && (
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      ✉️ {exp.email}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <a 
                  href={`tel:${exp.phone}`} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '6px', 
                    padding: '9px 12px', 
                    background: '#ffffff', 
                    border: '1.2px solid #F9BED8', 
                    borderRadius: '11px', 
                    textDecoration: 'none', 
                    color: '#D7147A', 
                    fontSize: '12px', 
                    fontWeight: '700', 
                    boxShadow: '0 2px 6px rgba(215, 20, 122, 0.08)',
                    transition: 'all 0.15s ease' 
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#FDF2F8';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Phone size={14} strokeWidth={2.4} /> 
                  <span>Ara</span>
                </a>

                <a 
                  href={`https://wa.me/${exp.phone ? exp.phone.replace(/[^0-9]/g, '') : ''}?text=Merhaba%20${encodeURIComponent(exp.name.split(' ')[0])},%20turum%20hakk%C4%B1nda%20deste%C4%9Finize%20ihtiyac%C4%B1m%20var.`} 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '6px', 
                    padding: '9px 12px', 
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', 
                    color: '#ffffff', 
                    borderRadius: '11px', 
                    textDecoration: 'none', 
                    fontSize: '12px', 
                    fontWeight: '700', 
                    boxShadow: '0 2px 8px rgba(37, 211, 102, 0.28)',
                    transition: 'all 0.15s ease' 
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.filter = 'brightness(1.06)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.filter = 'brightness(1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <MessageCircle size={15} strokeWidth={2.4} color="#ffffff" /> 
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
