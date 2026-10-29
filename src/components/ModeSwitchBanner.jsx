import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, isUserAdmin } from '../store/authStore';
import { useTourStore, isTourActive } from '../store/tourStore';
import { useIndividualStore } from '../store/individualStore';
import { 
  Luggage, 
  Building2, 
  ChevronRight,
  Compass
} from 'lucide-react';

export default function ModeSwitchBanner({ currentMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const activeMode = useAuthStore(state => state.activeMode);
  const setActiveMode = useAuthStore(state => state.setActiveMode);
  const activeStaffRole = useAuthStore(state => state.activeStaffRole);
  const setActiveStaffRole = useAuthStore(state => state.setActiveStaffRole);
  const tours = useTourStore(state => state.tours);
  const individualTravels = useIndividualStore(state => state.travels);

  const userIsAdmin = isUserAdmin(user) || user?.role === 'admin' || user?.secondaryRole === 'admin';

  // Aktif kurumsal seyahat sayısı
  const activeCorporateCount = useMemo(() => {
    if (!user || !tours || tours.length === 0) return 0;

    const isAdmin = isUserAdmin(user) || user.role === 'admin' || user.secondaryRole === 'admin';
    const isTicketing = user.role === 'ticketing' || user.secondaryRole === 'ticketing';

    if (isAdmin || isTicketing) {
      return tours.filter(isTourActive).length;
    }

    const isExpert = user.role === 'expert' || user.secondaryRole === 'expert';

    return tours.filter(t => {
      if (!isTourActive(t)) return false;

      if (isExpert) {
        const matchesExpert = (
          t.guideName === user.name ||
          t.expert?.name === user.name ||
          t.expert?.email === user.email ||
          t.expert2?.name === user.name ||
          t.expert2?.email === user.email ||
          t.guideId === user.id ||
          t.expertId === user.id ||
          (Array.isArray(t.coExperts) && t.coExperts.some(ce => ce?.id === user.id || ce?.email === user.email))
        );
        if (matchesExpert) return true;
      }

      // Katılımcı kontrolü
      if (Array.isArray(t.participants)) {
        const uEmail = user.email ? user.email.trim().toLowerCase() : '';
        const uPhone = (user.phone || '').replace(/\D/g, '');
        const uName = user.name ? user.name.trim().toLowerCase() : '';

        return t.participants.some(p => {
          if (user.id && p.id === user.id) return true;
          if (uEmail && p.email && p.email.trim().toLowerCase() === uEmail) return true;
          const pPhone = (p.phone || '').replace(/\D/g, '');
          if (pPhone.length >= 7 && uPhone.length >= 7 && (pPhone.endsWith(uPhone.slice(-10)) || uPhone.endsWith(pPhone.slice(-10)))) return true;
          if (uName && p.name && p.name.trim().toLowerCase() === uName) return true;
          return false;
        });
      }

      return false;
    }).length;
  }, [user, tours]);

  // Aktif bireysel seyahat sayısı
  const activeIndividualCount = useMemo(() => {
    if (!individualTravels || individualTravels.length === 0) return 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return individualTravels.filter(t => {
      if (t.isArchived) return false;
      if (t.status === 'completed' || t.status === 'past') return false;
      if (t.endDate) {
        const end = new Date(t.endDate);
        if (!isNaN(end.getTime()) && end < now) return false;
      }
      return true;
    }).length;
  }, [individualTravels]);

  // If currentMode prop is provided use it, otherwise detect via route or activeMode
  const isIndividual = currentMode 
    ? currentMode === 'individual' 
    : (activeMode === 'individual' || location.pathname.startsWith('/individual'));

  const handleSwitchToIndividual = (e) => {
    e.stopPropagation();
    setActiveMode('individual');
    navigate('/individual/dashboard');
  };

  const handleSwitchToCorporate = (e) => {
    e.stopPropagation();
    setActiveMode('corporate');
    navigate('/dashboard');
  };

  const handleSwitchToExpert = (e) => {
    e.stopPropagation();
    setActiveStaffRole('expert');
    setActiveMode('corporate');
    navigate('/dashboard/expert');
  };

  // 1. ADMIN PANELI ANA SAYFASINDA İKEN (Sadece Admin Rolü):
  // Hem "Bireysel Seyahat Asistanına Geç" hem de "Seyahat Uzmanı Paneline Geç" kartı
  if (!isIndividual && (currentMode === 'admin' || location.pathname.includes('/admin')) && userIsAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
        {/* Kart 1: Bireysel Seyahat Asistanına Geç */}
        <div 
          onClick={handleSwitchToIndividual}
          className="mode-switch-banner"
          role="button"
          tabIndex={0}
          title="Bireysel Seyahat Asistanına Geçiş Yap"
          style={{
            background: 'linear-gradient(135deg, #FFF1F7 0%, #FFFFFF 55%, #FDF2F8 100%)',
            border: '1.2px solid #F9BED8',
            borderRadius: '16px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 3px 12px rgba(215, 20, 122, 0.08)',
            cursor: 'pointer',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-1.5px)';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(215, 20, 122, 0.14)';
            e.currentTarget.style.borderColor = '#F472B6';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 3px 12px rgba(215, 20, 122, 0.08)';
            e.currentTarget.style.borderColor = '#F9BED8';
          }}
        >
          {/* Sol İkon ve Başlıklar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0, flex: 1 }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
              border: '1px solid #F9BED8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(215, 20, 122, 0.1)',
              position: 'relative'
            }}>
              <Luggage size={19} color="#D7147A" strokeWidth={2.2} />
              {activeIndividualCount > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '9999px',
                  background: '#D7147A',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  border: '2px solid #ffffff',
                  boxShadow: '0 2px 6px rgba(215, 20, 122, 0.35)',
                  lineHeight: 1,
                  pointerEvents: 'none',
                  zIndex: 3
                }}>
                  {activeIndividualCount}
                </div>
              )}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '800',
                color: '#0f172a',
                letterSpacing: '-0.2px',
                lineHeight: 1.25
              }}>
                Bireysel Seyahat Asistanına Geç
              </div>

              <div style={{
                fontSize: '10.5px',
                color: '#64748b',
                fontWeight: '500',
                marginTop: '3px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Kişisel gezileriniz, bavul listesi ve bütçeniz
              </div>
            </div>
          </div>

          {/* Sağ Sadece İkon */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flexShrink: 0, 
            paddingRight: '2px',
            color: '#D7147A'
          }}>
            <ChevronRight size={20} strokeWidth={2.4} />
          </div>
        </div>

        {/* Kart 2: Seyahat Uzmanı Paneline Geç */}
        <div 
          onClick={handleSwitchToExpert}
          className="mode-switch-banner"
          role="button"
          tabIndex={0}
          title="Seyahat Uzmanı Paneline Geçiş Yap"
          style={{
            background: 'linear-gradient(135deg, #F0F9FF 0%, #FFFFFF 55%, #E0F2FE 100%)',
            border: '1.2px solid #BAE6FD',
            borderRadius: '16px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 3px 12px rgba(2, 132, 199, 0.08)',
            cursor: 'pointer',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-1.5px)';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(2, 132, 199, 0.14)';
            e.currentTarget.style.borderColor = '#7DD3FC';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 3px 12px rgba(2, 132, 199, 0.08)';
            e.currentTarget.style.borderColor = '#BAE6FD';
          }}
        >
          {/* Sol İkon ve Başlıklar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0, flex: 1 }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
              border: '1px solid #BAE6FD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.1)',
              position: 'relative'
            }}>
              <Compass size={19} color="#0284c7" strokeWidth={2.2} />
              {activeCorporateCount > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '9999px',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  border: '2px solid #ffffff',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.35)',
                  lineHeight: 1,
                  pointerEvents: 'none',
                  zIndex: 3
                }}>
                  {activeCorporateCount}
                </div>
              )}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '800',
                color: '#0f172a',
                letterSpacing: '-0.2px',
                lineHeight: 1.25
              }}>
                Seyahat Uzmanı Paneline Geç
              </div>

              <div style={{
                fontSize: '10.5px',
                color: '#64748b',
                fontWeight: '500',
                marginTop: '3px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Tur operasyonları, rehber akışı ve yoklama
              </div>
            </div>
          </div>

          {/* Sağ Sadece İkon */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flexShrink: 0, 
            paddingRight: '2px',
            color: '#0284c7'
          }}>
            <ChevronRight size={20} strokeWidth={2.4} />
          </div>
        </div>
      </div>
    );
  }

  // 2. STANDART KURUMSAL (Müşteri & Normal Rehber) ANA SAYFADA İKEN:
  // Sadece Bireysel Seyahat Asistanına Geç
  if (!isIndividual) {
    return (
      <div 
        onClick={handleSwitchToIndividual}
        className="mode-switch-banner"
        role="button"
        tabIndex={0}
        title="Bireysel Seyahat Asistanına Geçiş Yap"
        style={{
          background: 'linear-gradient(135deg, #FFF1F7 0%, #FFFFFF 55%, #FDF2F8 100%)',
          border: '1.2px solid #F9BED8',
          borderRadius: '16px',
          padding: '12px 14px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 3px 12px rgba(215, 20, 122, 0.08)',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-1.5px)';
          e.currentTarget.style.boxShadow = '0 6px 18px rgba(215, 20, 122, 0.14)';
          e.currentTarget.style.borderColor = '#F472B6';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 3px 12px rgba(215, 20, 122, 0.08)';
          e.currentTarget.style.borderColor = '#F9BED8';
        }}
      >
        {/* Sol İkon ve Başlıklar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0, flex: 1 }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
            border: '1px solid #F9BED8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(215, 20, 122, 0.1)',
            position: 'relative'
          }}>
            <Luggage size={19} color="#D7147A" strokeWidth={2.2} />
            {activeIndividualCount > 0 && (
              <div style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                minWidth: '18px',
                height: '18px',
                borderRadius: '9999px',
                background: '#D7147A',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                border: '2px solid #ffffff',
                boxShadow: '0 2px 6px rgba(215, 20, 122, 0.35)',
                lineHeight: 1,
                pointerEvents: 'none',
                zIndex: 3
              }}>
                {activeIndividualCount}
              </div>
            )}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '800',
              color: '#0f172a',
              letterSpacing: '-0.2px',
              lineHeight: 1.25
            }}>
              Bireysel Seyahat Asistanına Geç
            </div>

            <div style={{
              fontSize: '10.5px',
              color: '#64748b',
              fontWeight: '500',
              marginTop: '3px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Kişisel gezileriniz, bavul listesi ve bütçeniz
            </div>
          </div>
        </div>

        {/* Sağ Sadece İkon (Kutusuz) */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          flexShrink: 0, 
          paddingRight: '2px',
          color: '#D7147A'
        }}>
          <ChevronRight size={20} strokeWidth={2.4} />
        </div>
      </div>
    );
  }

  // 4. BİREYSEL ANA SAYFADA İKEN: KURUMSALA YÖNLENDİREN BANNER
  return (
    <div 
      onClick={handleSwitchToCorporate}
      className="mode-switch-banner"
      role="button"
      tabIndex={0}
      title="Kurumsal Tur ve Seyahat Alanına Geçiş Yap"
      style={{
        background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 55%, #F0FDF4 100%)',
        border: '1.2px solid #BFDBFE',
        borderRadius: '16px',
        padding: '12px 14px',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        boxShadow: '0 3px 12px rgba(37, 99, 235, 0.08)',
        cursor: 'pointer',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-1.5px)';
        e.currentTarget.style.boxShadow = '0 6px 18px rgba(37, 99, 235, 0.14)';
        e.currentTarget.style.borderColor = '#60A5FA';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 3px 12px rgba(37, 99, 235, 0.08)';
        e.currentTarget.style.borderColor = '#BFDBFE';
      }}
    >
      {/* Sol İkon ve Başlıklar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0, flex: 1 }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          border: '1px solid #BFDBFE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(37, 99, 235, 0.1)',
          position: 'relative'
        }}>
          <Building2 size={19} color="#2563EB" strokeWidth={2.2} />
          {activeCorporateCount > 0 && (
            <div style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              minWidth: '18px',
              height: '18px',
              borderRadius: '9999px',
              background: '#2563EB',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #ffffff',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.35)',
              lineHeight: 1,
              pointerEvents: 'none',
              zIndex: 3
            }}>
              {activeCorporateCount}
            </div>
          )}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: '13px',
            fontWeight: '800',
            color: '#0f172a',
            letterSpacing: '-0.2px',
            lineHeight: 1.25
          }}>
            Kurumsal Tur & Seyahat Alanına Geç
          </div>

          <div style={{
            fontSize: '10.5px',
            color: '#64748b',
            fontWeight: '500',
            marginTop: '3px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            Şirket turlarınız, uçuş ve transfer detayları
          </div>
        </div>
      </div>

      {/* Sağ Sadece İkon (Kutusuz) */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        flexShrink: 0, 
        paddingRight: '2px',
        color: '#2563EB'
      }}>
        <ChevronRight size={20} strokeWidth={2.4} />
      </div>
    </div>
  );
}
