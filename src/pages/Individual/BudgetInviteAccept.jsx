import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { useIndividualStore } from '../../store/individualStore';
import { Wallet, Users, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function BudgetInviteAccept() {
  const { token } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const acceptInvitation = useIndividualStore(state => state.acceptInvitation);

  const [invitation, setInvitation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchInvite = async () => {
      if (!token) {
        setErrorMsg('Geçersiz davet bağlantısı.');
        setIsLoading(false);
        return;
      }

      try {
        const invRef = doc(db, 'budget_invitations', token);
        const invSnap = await getDoc(invRef);

        if (!invSnap.exists()) {
          setErrorMsg('Bu davet bağlantısı bulunamadı veya süresi dolmuş.');
          setIsLoading(false);
          return;
        }

        const data = invSnap.data();
        if (new Date() > new Date(data.expiresAt)) {
          setErrorMsg('Bu davet bağlantısının geçerlilik süresi (7 gün) sona ermiştir.');
          setIsLoading(false);
          return;
        }

        setInvitation(data);
      } catch (err) {
        console.error("Fetch invitation error:", err);
        setErrorMsg('Davet bilgisi yüklenemedi: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(`/invite/${token}`));
      return;
    }

    setIsAccepting(true);
    setErrorMsg('');

    try {
      const res = await acceptInvitation(token, user);
      if (res && res.budgetId) {
        navigate(`/individual/budget/shared?budgetId=${res.budgetId}`);
      } else {
        navigate('/individual/budget');
      }
    } catch (e) {
      setErrorMsg(e.message || 'Davet kabul edilemedi.');
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', flexDirection: 'column', gap: '12px' }}>
        <Loader2 size={32} color="#D7147A" style={{ animation: 'spin 1s infinite linear' }} />
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Davet bilgisi doğrulanıyor...</span>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        border: '1px solid #e2e8f0',
        padding: '32px 24px',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 12px 36px rgba(15, 23, 42, 0.05)'
      }}>
        {errorMsg ? (
          <div>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <AlertCircle size={24} />
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: '0 0 6px' }}>
              Davet Geçersiz
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
              {errorMsg}
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '10px 20px', borderRadius: '20px', border: 'none',
                background: '#D7147A', color: 'white', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer'
              }}
            >
              Ana Sayfaya Dön
            </button>
          </div>
        ) : (
          <div>
            <div style={{
              width: '54px', height: '54px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', boxShadow: '0 6px 18px rgba(215, 20, 122, 0.3)'
            }}>
              <Users size={26} />
            </div>

            <div style={{ fontSize: '11px', fontWeight: '800', color: '#D7147A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Ortak Bütçe Daveti
            </div>

            <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '0 0 10px' }}>
              {invitation.travelTitle || 'Seyahat Bütçesi'}
            </h1>

            <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 20px', lineHeight: 1.5 }}>
              <strong>{invitation.inviterName}</strong> ({invitation.inviterEmail}), sizi seyahat masraflarını birlikte takip etmek ve paylaşmak için ortak bütçeye davet etti.
            </p>

            {user ? (
              <div>
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#334155', marginBottom: '16px' }}>
                  Giriş yapılan hesap: <strong>{user.name}</strong> ({user.email})
                </div>

                <button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '50px', border: 'none',
                    background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)', color: 'white',
                    fontSize: '13.5px', fontWeight: '700', cursor: isAccepting ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 6px 18px rgba(215, 20, 122, 0.32)'
                  }}
                >
                  {isAccepting ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s infinite linear' }} />
                      Katılınıyor...
                    </>
                  ) : (
                    <>
                      Daveti Kabul Et & Katıl <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => navigate('/login?redirect=' + encodeURIComponent(`/invite/${token}`))}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '50px', border: 'none',
                    background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)', color: 'white',
                    fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 4px 12px rgba(215, 20, 122, 0.25)'
                  }}
                >
                  Giriş Yaparak Katıl
                </button>

                <button
                  onClick={() => navigate('/register')}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '50px', border: '1.5px solid #e2e8f0',
                    background: 'white', color: '#334155', fontSize: '13px', fontWeight: '700', cursor: 'pointer'
                  }}
                >
                  Hesabım Yok, Ücretsiz Kayıt Ol
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
