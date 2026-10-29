import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'var(--bg-color, #F8F9FA)',
          fontFamily: 'Quicksand, sans-serif'
        }}>
          <div style={{
            maxWidth: '380px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '20px',
            padding: '32px 24px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#EF4444'
            }}>
              <AlertCircle size={32} />
            </div>

            <h2 style={{
              fontSize: '18px',
              fontWeight: '800',
              color: '#0F172A',
              marginBottom: '8px'
            }}>
              Bir Şeyler Ters Gitti
            </h2>

            <p style={{
              fontSize: '13px',
              color: '#64748B',
              lineHeight: 1.5,
              marginBottom: '24px'
            }}>
              Sayfa yüklenirken beklenmeyen bir durum oluştu. Yenileyerek veya ana sayfaya dönerek devam edebilirsiniz.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={this.handleReload}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'var(--primary, #D7147A)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <RefreshCw size={16} /> Sayfayı Yenile
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Home size={16} /> Ana Sayfaya Dön
              </button>
            </div>

            {this.state.error?.message && (
              <div style={{
                marginTop: '16px',
                padding: '10px',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                color: '#dc2626',
                fontSize: '11px',
                fontFamily: 'monospace',
                textAlign: 'left',
                wordBreak: 'break-word',
                maxHeight: '80px',
                overflowY: 'auto'
              }}>
                Hata Detayı: {this.state.error.message}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
