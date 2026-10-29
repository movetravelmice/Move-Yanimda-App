import React, { useState } from 'react';
import { 
  Settings, 
  Users, 
  ArchiveRestore, 
  Mail, 
  MessageSquare,
  Compass,
  PlusCircle,
  Bell,
  UserCheck,
  CheckCircle2,
  Calendar,
  Play,
  Megaphone,
  ChevronRight,
  PlaneTakeoff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import ModeSwitchBanner from '../../components/ModeSwitchBanner';
import { useTourStore, isTourActive, isTourPast } from '../../store/tourStore';
import { useUserStore } from '../../store/userStore';
import { useAuthStore, getUserSecondaryRole } from '../../store/authStore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { tours } = useTourStore();
  const allUsers = useUserStore(state => state.users) || [];
  const currentUser = useAuthStore(state => state.user);
  const setActiveStaffRole = useAuthStore(state => state.setActiveStaffRole);
  const secRole = getUserSecondaryRole(currentUser);
  const hasSecRole = Boolean(secRole);

  const activeTours = tours.filter(isTourActive);
  const pastTours = tours.filter(isTourPast);
  
  // 1. Aktif Müşteri Sayısı (Turlardaki aktif katılımcılar veya kayıtlı müşteri kullanıcıları)
  const totalActiveParticipants = activeTours.reduce((sum, t) => sum + (t.participants?.length || 0), 0);
  const registeredCustomers = allUsers.filter(u => u.role === 'customer').length;
  const activeCustomersCount = totalActiveParticipants > 0 ? totalActiveParticipants : registeredCustomers;

  // 2. Aktif Personel Sayısı (Yönetici, Seyahat Uzmanı, Biletçi)
  const activePersonnelCount = allUsers.filter(u => 
    ['admin', 'expert', 'ticketing'].includes(u.role) && u.status !== 'Pasif'
  ).length || 1;

  // Kare İkon Butonları Konfigürasyonu
  const actionTiles = [
    {
      id: 'active-ops',
      title: 'Aktif Seyahatler',
      icon: Compass,
      color: '#2563eb',
      bg: '#eff6ff',
      border: '#dbeafe',
      badge: `${activeTours.length}`,
      badgeColor: '#2563eb',
      badgeBg: '#eff6ff',
      path: '/dashboard/admin-active-operations'
    },
    {
      id: 'past-ops',
      title: 'Geçmiş Seyahatler',
      icon: ArchiveRestore,
      color: '#d97706',
      bg: '#fef3c7',
      border: '#fde68a',
      badge: `${pastTours.length}`,
      badgeColor: '#d97706',
      badgeBg: '#fef3c7',
      path: '/dashboard/admin-past-operations'
    },
    {
      id: 'create-tour',
      title: 'Yeni Seyahat',
      icon: PlusCircle,
      color: '#D7147A',
      bg: '#fdf2f8',
      border: '#fbcfe8',
      path: '/dashboard/create-tour'
    },
    {
      id: 'users',
      title: 'Kullanıcı Yönetimi',
      icon: Users,
      color: '#0284c7',
      bg: '#f0f9ff',
      border: '#bae6fd',
      badge: `${allUsers.length}`,
      badgeColor: '#0284c7',
      badgeBg: '#f0f9ff',
      path: '/dashboard/admin-users'
    },
    {
      id: 'settings',
      title: 'Sistem Ayarları',
      icon: Settings,
      color: '#475569',
      bg: '#f1f5f9',
      border: '#e2e8f0',
      path: '/dashboard/admin-settings'
    },
    {
      id: 'popular-routes',
      title: 'Popüler Rotalar',
      icon: Compass,
      color: '#D7147A',
      bg: '#FDF2F8',
      border: '#F9BED8',
      badge: '6 Vitrin',
      badgeColor: '#D7147A',
      badgeBg: '#FDF2F8',
      path: '/dashboard/admin-popular-routes'
    },
    {
      id: 'email-templates',
      title: 'E-Posta Şablonları',
      icon: Mail,
      color: '#7c3aed',
      bg: '#ede9fe',
      border: '#ddd6fe',
      path: '/dashboard/admin-email-templates'
    },
    {
      id: 'whatsapp-templates',
      title: 'WhatsApp Şablonları',
      icon: MessageSquare,
      color: '#16a34a',
      bg: '#dcfce7',
      border: '#bbf7d0',
      path: '/dashboard/admin-whatsapp-templates'
    },
    {
      id: 'notifications',
      title: 'Bildirim Merkezi',
      icon: Bell,
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fee2e2',
      path: '/dashboard/notifications'
    }
  ];

  return (
    <div style={{ paddingBottom: '90px', background: '#f8fafc', minHeight: '100vh' }}>
      <Header title="Sistem Komuta Merkezi" marginBottom={0} />

      <div style={{ padding: '16px', paddingTop: '14px' }}>
        <ModeSwitchBanner currentMode="admin" />


        {/* 1. ÜST YÖNETİCİ METRİK KARTLARI (Tek Kart İçinde) */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '10px 12px',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          marginBottom: '16px'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '8px'
          }}>
            {/* Aktif Müşteri */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '10px 10px',
              border: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: '#fdf2f8',
                color: '#db2777',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Users size={17} />
              </div>
              <div style={{ width: '1px', height: '24px', background: '#e2e8f0', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b', lineHeight: 1.1 }}>
                  {activeCustomersCount}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Aktif Müşteri
                </div>
              </div>
            </div>

            {/* Aktif Personel */}
            <div 
              onClick={() => navigate('/dashboard/admin-users')}
              style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '10px 10px',
                border: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.borderColor = '#bae6fd'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: '#f0f9ff',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <UserCheck size={17} />
              </div>
              <div style={{ width: '1px', height: '24px', background: '#e2e8f0', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b', lineHeight: 1.1 }}>
                  {activePersonnelCount}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Aktif Personel
                </div>
              </div>
            </div>

            {/* Aktif Seyahat */}
            <div 
              onClick={() => navigate('/dashboard/admin-active-operations')}
              style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '10px 10px',
                border: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Compass size={17} />
              </div>
              <div style={{ width: '1px', height: '24px', background: '#e2e8f0', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b', lineHeight: 1.1 }}>
                  {activeTours.length}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Aktif Seyahat
                </div>
              </div>
            </div>

            {/* Tamamlanan Seyahat */}
            <div 
              onClick={() => navigate('/dashboard/admin-past-operations')}
              style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '10px 10px',
                border: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ecfdf5'; e.currentTarget.style.borderColor = '#a7f3d0'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: '#f0fdf4',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CheckCircle2 size={17} />
              </div>
              <div style={{ width: '1px', height: '24px', background: '#e2e8f0', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b', lineHeight: 1.1 }}>
                  {pastTours.length}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Tamamlanan
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. ONESIGNAL TOPLU PUSH BİLDİRİMİ KISAYOLU */}
        <div 
          onClick={() => navigate('/dashboard/broadcast')}
          style={{
            background: 'linear-gradient(135deg, #FDF2F8 0%, #ffffff 100%)',
            border: '1.5px solid #F9BED8',
            borderRadius: '16px',
            padding: '10px 12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(215, 20, 122, 0.06)',
            transition: 'transform 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(215, 20, 122, 0.22)'
            }}>
              <Megaphone size={16} />
            </div>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.1px' }}>
                Toplu Push & Web Bildirimi Gönder
              </div>
              <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '1px', lineHeight: '1.3' }}>
                Tüm kullanıcılara masaüstü ve mobil ekran bildirimi yayınlayın
              </div>
            </div>
          </div>
          <ChevronRight size={15} color="#D7147A" />
        </div>

        {/* 3. KARE İKON BUTONLARI KONTROL PANELİ (Kart İçinde) */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '12px',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px'
          }}>
            {actionTiles.map((tile) => {
              const IconComponent = tile.icon;
              return (
                <div
                  key={tile.id}
                  onClick={() => navigate(tile.path)}
                  style={{
                    aspectRatio: '1',
                    background: '#f8fafc',
                    borderRadius: '14px',
                    border: '1px solid #f1f5f9',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 4px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                    userSelect: 'none',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#f1f5f9';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onMouseDown={e => {
                    e.currentTarget.style.transform = 'scale(0.96)';
                  }}
                  onMouseUp={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                >
                  {/* Rozet / Sayaç (Varsa) */}
                  {tile.badge && (
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: tile.badgeBg,
                      color: tile.badgeColor,
                      fontSize: '9.5px',
                      fontWeight: '800',
                      padding: '1.5px 5px',
                      borderRadius: '8px',
                      border: `1px solid ${tile.border}`,
                      lineHeight: 1
                    }}>
                      {tile.badge}
                    </div>
                  )}

                  {/* İkon Rozeti */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: tile.bg,
                    color: tile.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px',
                    border: `1px solid ${tile.border}`,
                    transition: 'transform 0.15s',
                    flexShrink: 0
                  }}>
                    <IconComponent size={20} strokeWidth={2.2} />
                  </div>

                  {/* Buton Başlığı (Tek Satır & Ekrana Göre Uyumlu) */}
                  <span style={{
                    fontSize: 'clamp(8.5px, 2.35vw, 10.5px)',
                    fontWeight: '700',
                    color: '#1e293b',
                    textAlign: 'center',
                    lineHeight: 1.15,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                    padding: '0 4px',
                    letterSpacing: '-0.3px',
                    display: 'block'
                  }}>
                    {tile.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Nav & Tintin Clearance Spacer */}
        <div style={{ height: '140px', minHeight: '140px', width: '100%', flexShrink: 0, pointerEvents: 'none' }} aria-hidden="true" />

      </div>
    </div>
  );
}
