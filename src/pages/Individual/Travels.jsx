import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Luggage, 
  Plus, 
  Calendar, 
  MapPin, 
  PlaneTakeoff,
  Trash2, 
  Pencil, 
  CheckSquare, 
  Wallet, 
  FileText,
  Clock
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useIndividualStore } from '../../store/individualStore';
import GuestNoticeBanner from '../../components/GuestNoticeBanner';
import CountryFlag from '../../components/CountryFlag';
import ConfirmModal from '../../components/ConfirmModal';
import {
  formatTravelDates,
  formatTravelDuration,
  getTravelStatus,
  DEFAULT_TRAVEL_COVER
} from '../../services/destinationImageService';

export default function Travels() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  const travels = useIndividualStore(state => state.travels);
  const deleteTravel = useIndividualStore(state => state.deleteTravel);

  const [deletingTravel, setDeletingTravel] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenAdd = () => {
    navigate('/individual/travels/new');
  };

  const handleOpenEdit = (travelId) => {
    navigate(`/individual/travels/edit/${travelId}`);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTravel) return;
    setIsDeleting(true);
    try {
      await deleteTravel(deletingTravel.id);
      setDeletingTravel(null);
    } catch (err) {
      console.error("Delete failed:", err);
      setDeletingTravel(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ padding: '16px 14px', maxWidth: '640px', margin: '0 auto' }}>

      {/* Misafir Kullanıcı Bildirimi */}
      <GuestNoticeBanner 
        customTitle="İşlemlerin Kaydedilmesi İçin Giriş Gerekli" 
        customMessage="Oluşturduğunuz seyahat planlarının kaydedilmesi ve tüm cihazlarınızda saklanması için lütfen giriş yapın." 
      />

      {/* Seyahatlerim Başlık Kartı */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fff5f9 100%)',
        borderRadius: '18px',
        border: '1.2px solid #F9BED8',
        padding: '13px 16px',
        marginBottom: '14px',
        boxShadow: '0 4px 16px -2px rgba(215, 20, 122, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.2px' }}>
            Seyahatlerim
          </h1>
          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', lineHeight: '1.35' }}>
            Tüm seyahat ve rota planlarınızı buradan yönetin
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          title="Yeni Seyahat Ekle"
          aria-label="Yeni Seyahat Ekle"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(215, 20, 122, 0.22)',
            transition: 'all 0.15s ease',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(215, 20, 122, 0.32)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(215, 20, 122, 0.22)';
          }}
        >
          <Plus size={18} strokeWidth={2.4} />
        </button>
      </div>

      {/* Seyahat Listesi veya Boş Durum Kartı */}
      {travels.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1.2px solid #e2e8f0',
          padding: '28px 18px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)'
        }}>
          {/* İkon Rozeti */}
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '15px',
            background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
            border: '1px solid #F9BED8',
            color: '#D7147A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            boxShadow: '0 3px 10px rgba(215, 20, 122, 0.12)'
          }}>
            <Luggage size={24} strokeWidth={2.2} />
          </div>

          <h2 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', margin: '0 0 5px' }}>
            Henüz bir seyahat oluşturmadınız
          </h2>
          <p style={{
            fontSize: '11px',
            color: '#64748b',
            margin: '0 auto',
            maxWidth: '320px',
            lineHeight: 1.5
          }}>
            Roma, Paris, Londra veya bir hafta sonu tatili... Yeni seyahatinizi oluşturup bütçe ve hazırlık listenizi bağlayın.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {travels.map((travel) => {
            const status = getTravelStatus(travel.startDate, travel.endDate);
            const duration = formatTravelDuration(travel.startDate, travel.endDate);
            const dateStr = formatTravelDates(travel.startDate, travel.endDate);
            const coverPhoto = travel.coverImage || travel.avatar || travel.image || DEFAULT_TRAVEL_COVER;
            const originCity = travel.origin ? travel.origin.split(',')[0].trim() : 'İstanbul';
            const destCity = travel.city || (travel.destination ? travel.destination.split(',')[0].trim() : 'Varış');

            return (
              <div
                key={travel.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  border: '1.2px solid #e2e8f0',
                  boxShadow: '0 4px 18px rgba(15, 23, 42, 0.04)',
                  overflow: 'hidden',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                {/* 1. Kurumsal Tarz Tam Genişlik Kapak Görseli */}
                <div style={{
                  position: 'relative',
                  height: '145px',
                  width: '100%',
                  background: 'linear-gradient(135deg, #F9BED8 0%, #D7147A 100%)',
                  overflow: 'hidden'
                }}>
                  <img
                    src={coverPhoto}
                    alt={travel.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />

                  {/* Gradient Overlay for Text Readability */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.25) 55%, transparent 100%)'
                  }} />

                  {/* Sol Üst: Cam Efektli Ülke ve Şehir Rozeti */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: 'rgba(255, 255, 255, 0.94)',
                    backdropFilter: 'blur(8px)',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
                  }}>
                    <CountryFlag country={travel.country || 'TR'} size="sm" />
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#0f172a' }}>
                      {travel.country || 'Türkiye'} {travel.city ? `• ${travel.city}` : ''}
                    </span>
                  </div>

                  {/* Sağ Üst: Seyahat Durum Rozeti */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: status.bg,
                    border: `1px solid ${status.border}`,
                    color: status.color,
                    padding: '3px 8px',
                    borderRadius: '8px',
                    fontSize: '9.5px',
                    fontWeight: '800',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                  }}>
                    {status.label}
                  </div>

                  {/* Alt Üstünde Rota Şeridi */}
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '12px',
                    right: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#ffffff'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      fontWeight: '700',
                      textShadow: '0 1px 3px rgba(0,0,0,0.6)'
                    }}>
                      <PlaneTakeoff size={13} color="#E54B98" />
                      <span>{originCity} → {destCity}</span>
                    </div>

                    {travel.countryCode && (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: '800',
                        background: 'rgba(255,255,255,0.2)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {travel.countryCode}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Kart Gövdesi */}
                <div style={{ padding: '12px 14px' }}>
                  
                  {/* Başlık ve Düzenle/Sil */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    gap: '8px'
                  }}>
                    <h3 style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#0f172a',
                      margin: 0,
                      letterSpacing: '-0.2px',
                      lineHeight: '1.35'
                    }}>
                      {travel.title}
                    </h3>

                    {/* Hızlı İşlem İkonları */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleOpenEdit(travel.id)}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          color: '#475569',
                          cursor: 'pointer',
                          width: '28px',
                          height: '28px',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#FDF2F8';
                          e.currentTarget.style.borderColor = '#F9BED8';
                          e.currentTarget.style.color = '#D7147A';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = '#f8fafc';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.color = '#475569';
                        }}
                        title="Seyahati Düzenle"
                      >
                        <Pencil size={13} strokeWidth={2.2} />
                      </button>

                      <button
                        onClick={() => setDeletingTravel(travel)}
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fee2e2',
                          borderRadius: '8px',
                          color: '#ef4444',
                          cursor: 'pointer',
                          width: '28px',
                          height: '28px',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#fee2e2';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = '#fef2f2';
                        }}
                        title="Sil"
                      >
                        <Trash2 size={13} strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>

                  {/* Tarih ve Süre Şeridi (Kurumsal Format) */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#f8fafc',
                    padding: '7px 10px',
                    borderRadius: '10px',
                    border: '1px solid #f1f5f9',
                    marginBottom: travel.notes ? '9px' : '11px',
                    gap: '8px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      color: '#475569',
                      fontWeight: '600'
                    }}>
                      <Calendar size={13} color="#D7147A" />
                      <span>{dateStr}</span>
                    </div>

                    {duration && (
                      <span style={{
                        background: '#FDF2F8',
                        color: '#D7147A',
                        border: '1px solid #F9BED8',
                        fontSize: '9.5px',
                        fontWeight: '800',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        whiteSpace: 'nowrap'
                      }}>
                        {duration}
                      </span>
                    )}
                  </div>

                  {/* Varsa Seyahat Notları */}
                  {travel.notes && (
                    <div style={{
                      background: '#fff5f9',
                      padding: '7px 10px',
                      borderRadius: '9px',
                      fontSize: '10.5px',
                      color: '#475569',
                      marginBottom: '11px',
                      lineHeight: 1.4,
                      border: '1px solid #F9BED8',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '5px'
                    }}>
                      <FileText size={12} color="#D7147A" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{travel.notes}</span>
                    </div>
                  )}

                  {/* Checklist ve Bütçe Hızlı Eylemleri */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '4px' }}>
                    <button
                      onClick={() => navigate(`/individual/checklists?travelId=${travel.id}`)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '9px',
                        border: '1px solid #dbeafe',
                        background: '#eff6ff',
                        color: '#2563eb',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        transition: 'all 0.12s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#eff6ff'}
                    >
                      <CheckSquare size={13} strokeWidth={2.2} />
                      <span>Hazırlık Listesi</span>
                    </button>

                    <button
                      onClick={() => navigate(`/individual/budget?travelId=${travel.id}`)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '9px',
                        border: '1px solid #dcfce7',
                        background: '#f0fdf4',
                        color: '#16a34a',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        transition: 'all 0.12s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#dcfce7'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f0fdf4'}
                    >
                      <Wallet size={13} strokeWidth={2.2} />
                      <span>Bütçe Yönetimi</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Uygulama İçi Silme Onay Modalı */}
      <ConfirmModal
        isOpen={Boolean(deletingTravel)}
        title="Seyahati Sil"
        message={deletingTravel ? `"${deletingTravel.title || 'Bu seyahati'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.` : ''}
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        type="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => !isDeleting && setDeletingTravel(null)}
      />

    </div>
  );
}
