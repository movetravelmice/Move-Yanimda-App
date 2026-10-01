import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, AlertCircle, X, Loader2 } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Emin misiniz?',
  message = 'Bu işlemi gerçekleştirmek istediğinizden emin misiniz?',
  confirmText = 'Evet, Sil',
  cancelText = 'Vazgeç',
  type = 'danger', // 'danger' | 'warning' | 'info'
  icon: CustomIcon = null,
  isLoading = false,
  onConfirm,
  onClose,
  onCancel
}) {
  const handleClose = onClose || onCancel;

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading && handleClose) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, handleClose]);

  if (!isOpen) return null;

  const isDanger = type === 'danger';

  const iconBg = isDanger ? '#fef2f2' : '#FDF2F8';
  const iconBorder = isDanger ? '#fecaca' : '#F9BED8';
  const iconColor = isDanger ? '#ef4444' : '#D7147A';
  const IconComponent = CustomIcon || (isDanger ? Trash2 : AlertTriangle);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        touchAction: 'none'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading && handleClose) {
          handleClose();
        }
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1.2px solid #F9BED8',
          boxShadow: '0 20px 48px -8px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(215, 20, 122, 0.08)',
          width: '100%',
          maxWidth: '380px',
          padding: '24px 20px 20px 20px',
          position: 'relative',
          animation: 'scaleIn 0.16s ease-out'
        }}
      >
        {/* Close Button */}
        {!isLoading && handleClose && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: '#f8fafc',
              border: 'none',
              borderRadius: '50%',
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.color = '#64748b';
            }}
            title="Kapat"
          >
            <X size={14} />
          </button>
        )}

        {/* Icon Header */}
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '16px',
          background: iconBg,
          border: `1px solid ${iconBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px auto',
          boxShadow: isDanger ? '0 4px 14px rgba(239, 68, 68, 0.16)' : '0 4px 14px rgba(215, 20, 122, 0.16)'
        }}>
          <IconComponent size={24} color={iconColor} strokeWidth={2.2} />
        </div>

        {/* Text */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{
            fontSize: '15px',
            fontWeight: '800',
            color: '#0f172a',
            margin: '0 0 6px 0',
            letterSpacing: '-0.2px'
          }}>
            {title}
          </h3>
          <p style={{
            fontSize: '12px',
            color: '#64748b',
            margin: 0,
            lineHeight: 1.45
          }}>
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            type="button"
            disabled={isLoading}
            onClick={(e) => {
              e.stopPropagation();
              if (handleClose) handleClose();
            }}
            style={{
              height: '38px',
              borderRadius: '11px',
              border: '1.2px solid #e2e8f0',
              background: '#f8fafc',
              color: '#475569',
              fontSize: '12px',
              fontWeight: '700',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={e => {
              if (!isLoading) {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }
            }}
            onMouseLeave={e => {
              if (!isLoading) {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={(e) => {
              e.stopPropagation();
              if (onConfirm) onConfirm();
            }}
            style={{
              height: '38px',
              borderRadius: '11px',
              border: 'none',
              background: isDanger
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '800',
              cursor: isLoading ? 'wait' : 'pointer',
              boxShadow: isDanger
                ? '0 3px 12px rgba(239, 68, 68, 0.28)'
                : '0 3px 12px rgba(215, 20, 122, 0.28)',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseEnter={e => {
              if (!isLoading) e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              if (!isLoading) e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Siliniyor...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
