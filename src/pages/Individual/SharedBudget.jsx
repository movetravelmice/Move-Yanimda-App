import React, { useState, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  User,
  ArrowLeft, 
  Copy, 
  Check, 
  Share2, 
  Mail, 
  DollarSign, 
  Scale, 
  ArrowRight, 
  Trash2, 
  AlertCircle, 
  Plus, 
  X, 
  Loader2,
  Receipt,
  Wallet,
  Camera,
  FileUp,
  Send,
  PieChart,
  FileCheck,
  Pencil
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useIndividualStore } from '../../store/individualStore';
import { 
  EXPENSE_CATEGORIES, 
  getCurrencySymbol, 
  formatAmount, 
  formatCurrency, 
  formatExpenseDate, 
  parseTurkishNumber 
} from './Budget';
import GuestNoticeBanner from '../../components/GuestNoticeBanner';
import CountryFlag from '../../components/CountryFlag';
import ConfirmModal from '../../components/ConfirmModal';
import ThemeSelect from '../../components/ThemeSelect';
import { formatTravelDates } from '../../services/destinationImageService';

// Sağa/Sola kaydırarak Düzenleme ve Silme özellikli harcama kartı bileşeni
function SwipeableExpenseItem({ exp, activeBudget, setViewingReceiptImage, onDelete, onEdit }) {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentDeltaXRef = useRef(0);
  const isHorizontalScrollRef = useRef(null);

  const catMeta = EXPENSE_CATEGORIES.find(c => c.key === exp.category) || { label: exp.category, icon: '🏷️' };

  // Dokunmatik (Touch) Olayları
  const handleTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    currentDeltaXRef.current = 0;
    isHorizontalScrollRef.current = null;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startXRef.current;
    const deltaY = currentY - startYRef.current;
    currentDeltaXRef.current = deltaX;

    // Yön tespiti: Dikey sayfa kaydırması baskınsa yatay müdahale etme
    if (isHorizontalScrollRef.current === null) {
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        isHorizontalScrollRef.current = false;
        return;
      } else if (Math.abs(deltaX) > 6) {
        isHorizontalScrollRef.current = true;
      }
    }

    if (!isHorizontalScrollRef.current) return;

    // deltaX < 0: sola kaydır (Sil), deltaX > 0: sağa kaydır (Düzenle)
    if (deltaX < 0) {
      setOffsetX(Math.max(-100, deltaX));
    } else if (deltaX > 0) {
      setOffsetX(Math.min(100, deltaX));
    } else {
      setOffsetX(0);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    const deltaX = currentDeltaXRef.current;

    if (isHorizontalScrollRef.current && deltaX <= -40) {
      // Sola yeterli kaydırma yapıldı: Sil onay modalını aç
      setOffsetX(0);
      onDelete(exp.id);
    } else if (isHorizontalScrollRef.current && deltaX >= 40) {
      // Sağa yeterli kaydırma yapıldı: Düzenle modalını aç
      setOffsetX(0);
      if (onEdit) onEdit(exp);
    } else {
      setOffsetX(0);
    }
    currentDeltaXRef.current = 0;
    isHorizontalScrollRef.current = null;
  };

  // Fare (Mouse Drag) Olayları - Masaüstü Test Kolaylığı İçin
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    startXRef.current = e.clientX;
    currentDeltaXRef.current = 0;
    setIsMouseDown(true);
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown) return;
    const deltaX = e.clientX - startXRef.current;
    currentDeltaXRef.current = deltaX;
    if (deltaX < 0) {
      setOffsetX(Math.max(-100, deltaX));
    } else if (deltaX > 0) {
      setOffsetX(Math.min(100, deltaX));
    } else {
      setOffsetX(0);
    }
  };

  const handleMouseUp = () => {
    if (!isMouseDown) return;
    setIsMouseDown(false);
    const deltaX = currentDeltaXRef.current;
    if (deltaX <= -40) {
      setOffsetX(0);
      onDelete(exp.id);
    } else if (deltaX >= 40) {
      setOffsetX(0);
      if (onEdit) onEdit(exp);
    } else {
      setOffsetX(0);
    }
    currentDeltaXRef.current = 0;
  };

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '14px',
        overflow: 'hidden',
        background: offsetX < 0 
          ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
          : (offsetX > 0 
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
              : 'transparent')
      }}
      onMouseLeave={() => {
        if (isMouseDown) {
          handleMouseUp();
        }
      }}
    >
      {/* Arka Plan: Kırmızı Sil Göstergesi (Sola kaydırılırken görünür) */}
      {offsetX < 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '22px',
            gap: '6px',
            color: '#ffffff',
            zIndex: 1,
            userSelect: 'none'
          }}
        >
          <Trash2 size={18} strokeWidth={2.4} />
          <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.2px' }}>Sil</span>
        </div>
      )}

      {/* Arka Plan: Mavi Düzenle Göstergesi (Sağa kaydırılırken görünür) */}
      {offsetX > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingLeft: '22px',
            gap: '6px',
            color: '#ffffff',
            zIndex: 1,
            userSelect: 'none'
          }}
        >
          <Pencil size={18} strokeWidth={2.4} />
          <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.2px' }}>Düzenle</span>
        </div>
      )}

      {/* Ön Plan: Masraf Kartı */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          position: 'relative',
          zIndex: 2,
          background: '#ffffff',
          borderRadius: offsetX < 0 ? '14px 0 0 14px' : (offsetX > 0 ? '0 14px 14px 0' : '14px'),
          border: '1.2px solid #f1f5f9',
          borderRight: offsetX < 0 ? 'none' : '1.2px solid #f1f5f9',
          borderLeft: offsetX > 0 ? 'none' : '1.2px solid #f1f5f9',
          padding: '11px 13px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0px',
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping || isMouseDown ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.15s ease',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          cursor: 'grab',
          userSelect: 'none',
          touchAction: 'pan-y'
        }}
        onMouseEnter={(e) => {
          if (offsetX === 0 && !isMouseDown) {
            e.currentTarget.style.borderColor = '#F9BED8';
            e.currentTarget.style.boxShadow = '0 3px 10px rgba(215, 20, 122, 0.06)';
          }
        }}
        onMouseLeave={(e) => {
          if (offsetX === 0 && !isMouseDown) {
            e.currentTarget.style.borderColor = '#f1f5f9';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(15, 23, 42, 0.03)';
          }
        }}
      >
        {/* Üst Kısım: İkon + Başlık/Kategori ve Tarih/Tutar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          width: '100%'
        }}>
          {/* Sol Bölüm: Kategori İkonu + Başlık + Kategori */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0, flex: 1 }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: '#FDF2F8',
              border: '1.2px solid #F9BED8',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {catMeta.icon}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              {/* Açıklama Başlığı */}
              <div style={{
                fontSize: '12px',
                fontWeight: '800',
                color: '#0f172a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.25
              }}>
                {exp.description}
              </div>

              {/* Kategori Adı */}
              <div style={{
                fontSize: '10px',
                color: '#64748b',
                fontWeight: '600',
                marginTop: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {catMeta.label}
              </div>
            </div>
          </div>

          {/* Sağ Bölüm: Tarih (Tutarın Üzerinde) ve Tutar */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {exp.date && (
              <div style={{
                fontSize: '9px',
                color: '#94a3b8',
                fontWeight: '700',
                marginBottom: '1.5px',
                whiteSpace: 'nowrap'
              }}>
                {formatExpenseDate(exp.date)}
              </div>
            )}
            <div style={{
              fontSize: '12.5px',
              fontWeight: '900',
              color: '#dc2626',
              letterSpacing: '-0.3px',
              whiteSpace: 'nowrap'
            }}>
              -{formatCurrency(exp.amount, exp.currency || activeBudget.currency)}
            </div>
          </div>
        </div>

        {/* Alt Kısım: Üstünde Çizgi + Dikey Çizgilerle Ayrılmış İsim Soyisim, Özel Pay / Eşit, Fiş Yüklendi */}
        <div style={{
          borderTop: '1px solid #f1f5f9',
          marginTop: '8px',
          paddingTop: '7px',
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          width: '100%',
          flexWrap: 'wrap'
        }}>
          {/* 1. İsim Soyisim (Nötr / Slate) */}
          {exp.paidByName && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: '#334155',
              fontWeight: '700',
              fontSize: '9.5px'
            }}>
              <User size={11} strokeWidth={2.4} color="#64748b" />
              <span>{exp.paidByName}</span>
            </div>
          )}

          {/* Dikey Çizgi (İsim ile Özel Pay arası) */}
          {exp.paidByName && (
            <div style={{ width: '1px', height: '10px', background: '#e2e8f0', flexShrink: 0 }} />
          )}

          {/* 2. Özel Pay / Dağılım Türü (Mor / Violet) */}
          <span style={{
            background: '#f5f3ff',
            color: '#7c3aed',
            border: '1px solid #ddd6fe',
            borderRadius: '5px',
            padding: '1.5px 6px',
            fontSize: '8.5px',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3.5px'
          }}>
            <PieChart size={10} strokeWidth={2.4} color="#7c3aed" />
            <span>{exp.splitType === 'equal' ? `Eşit (${exp.participants?.length || 1} Kişi)` : 'Özel Pay'}</span>
          </span>

          {/* Dikey Çizgi (Özel Pay ile Fiş arası) */}
          {exp.receiptImage && (
            <div style={{ width: '1px', height: '10px', background: '#e2e8f0', flexShrink: 0 }} />
          )}

          {/* 3. Fiş Yüklendi Butonu (Yeşil / Emerald) */}
          {exp.receiptImage && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setViewingReceiptImage(exp.receiptImage);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3.5px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '5px',
                padding: '1.5px 6px',
                color: '#16a34a',
                fontSize: '8.5px',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Fiş Görselini İncele"
            >
              <FileCheck size={10.5} strokeWidth={2.4} color="#16a34a" />
              <span>Fiş yüklendi</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SharedBudget() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const allUsers = useUserStore(state => state.users) || [];
  const [searchParams] = useSearchParams();
  const budgetIdParam = searchParams.get('budgetId');

  const travels = useIndividualStore(state => state.travels);
  const budgets = useIndividualStore(state => state.budgets);
  const expenses = useIndividualStore(state => state.expenses);
  const invitations = useIndividualStore(state => state.invitations);
  const addExpense = useIndividualStore(state => state.addExpense);
  const updateExpense = useIndividualStore(state => state.updateExpense);
  const deleteExpense = useIndividualStore(state => state.deleteExpense);
  const createBudgetInvitation = useIndividualStore(state => state.createBudgetInvitation);
  const calculateSettlement = useIndividualStore(state => state.calculateSettlement);

  const [selectedBudgetId, setSelectedBudgetId] = useState(budgetIdParam || budgets[0]?.id || '');
  const activeBudget = budgets.find(b => b.id === selectedBudgetId) || budgets[0];
  const activeTravel = travels.find(t => t.id === activeBudget?.travelId);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddSharedExpenseModal, setShowAddSharedExpenseModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);
  const [viewingReceiptImage, setViewingReceiptImage] = useState(null);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [copiedToken, setCopiedToken] = useState(null);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const receiptCameraInputRef = useRef(null);
  const receiptFileInputRef = useRef(null);

  // Shared Expense Form
  const [sharedExpenseForm, setSharedExpenseForm] = useState({
    description: '',
    category: 'food',
    amount: '',
    currency: 'TRY',
    date: new Date().toISOString().slice(0, 10),
    paidByName: user?.name || 'Ben',
    splitType: 'equal', // 'equal' or 'custom'
    participants: [], // array of member names
    customSplits: {}, // { [name]: amount }
    receiptImage: null
  });

  // If unauthenticated guest accesses Shared Budget directly
  if (!user) {
    return (
      <div style={{ padding: '16px 14px', maxWidth: '640px', margin: '0 auto', paddingBottom: '90px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fff5f9 100%)',
          borderRadius: '18px',
          border: '1.2px solid #F9BED8',
          padding: '13px 16px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 4px 16px -2px rgba(215, 20, 122, 0.05)'
        }}>
          <button
            onClick={() => navigate('/individual/budget')}
            style={{
              background: '#ffffff',
              border: '1.2px solid #F9BED8',
              borderRadius: '10px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#D7147A'
            }}
          >
            <ArrowLeft size={16} strokeWidth={2.4} />
          </button>
          <div>
            <h1 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Ortak Bütçe & Masraf Paylaşımı
            </h1>
            <div style={{ fontSize: '10.5px', color: '#64748b' }}>
              Arkadaşlarınızla eşit veya özel gider bölüşümü
            </div>
          </div>
        </div>

        <GuestNoticeBanner feature="shared_budget" />

        <div style={{
          background: 'white',
          borderRadius: '24px',
          border: '1.2px solid #F9BED8',
          padding: '36px 20px',
          textAlign: 'center',
          boxShadow: '0 4px 20px -2px rgba(215, 20, 122, 0.06)',
          marginTop: '12px'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: '#FDF2F8',
            color: '#D7147A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Users size={28} />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
            Ortak Bütçe Özelliği İçin Giriş Yapmalısınız
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, maxWidth: '380px', margin: '0 auto 20px' }}>
            Ortak bütçe ve masraf bölüşümü özelliğiyle seyahat arkadaşlarınızı davet edebilir, harcamaları paylaştırabilir ve kimin kime borçlu olduğunu anlık takip edebilirsiniz.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '280px', margin: '0 auto' }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '11px 20px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                color: 'white',
                fontSize: '12.5px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(215, 20, 122, 0.25)'
              }}
            >
              Giriş Yap / Ücretsiz Kayıt Ol
            </button>
            <button
              onClick={() => navigate('/individual/budget')}
              style={{
                padding: '9.5px 20px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                background: 'white',
                color: '#64748b',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Bireysel Bütçeye Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  const members = activeBudget?.members || [
    { userId: user?.id, name: user?.name, email: user?.email, role: 'owner', status: 'accepted' }
  ];

  // Calculate settlement
  const settlementResult = activeBudget ? calculateSettlement(activeBudget.id) : { netBalances: {}, settlements: [] };
  const budgetExpenses = expenses.filter(e => e.budgetId === activeBudget?.id);
  const budgetInvitations = invitations.filter(i => i.budgetId === activeBudget?.id);
  const totalSpent = budgetExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const memberCount = Math.max(members.length, 1);
  const averagePerMember = totalSpent / memberCount;

  // Helper: Render user avatar
  const renderAvatar = (person, size = 26) => {
    const name = typeof person === 'object' ? (person?.name || 'Üye') : String(person || 'Üye');
    const isSelf = (typeof person === 'object' && person?.userId === user?.id) || name === user?.name;
    const personUserId = typeof person === 'object' ? person?.userId : null;
    const personEmail = typeof person === 'object' ? person?.email : null;
    const matchedUser = allUsers.find(u => 
      (personUserId && u.id === personUserId) || 
      (personEmail && u.email && u.email.toLowerCase() === personEmail.toLowerCase()) ||
      (name && u.name && u.name.toLowerCase() === name.toLowerCase())
    );
    const avatar = (typeof person === 'object' && (person?.avatar || person?.photoURL)) 
      ? (person.avatar || person.photoURL) 
      : (matchedUser?.avatar || matchedUser?.photoURL || (isSelf ? (user?.avatar || user?.photoURL) : null));

    if (avatar) {
      return (
        <img
          src={avatar}
          alt={name}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '1.2px solid #F9BED8',
            flexShrink: 0
          }}
        />
      );
    }

    const initials = name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
        color: '#ffffff',
        fontSize: size <= 22 ? '9.5px' : '10.5px',
        fontWeight: '800',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(215, 20, 122, 0.2)'
      }}>
        {initials || 'U'}
      </div>
    );
  };

  const handleOpenInvite = () => {
    setInviteEmail('');
    setInviteSuccessMsg('');
    setErrorMsg('');
    setShowInviteModal(true);
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeBudget) return;
    setIsInviting(true);
    setErrorMsg('');
    setInviteSuccessMsg('');

    try {
      const inv = await createBudgetInvitation({
        budgetId: activeBudget.id,
        travelTitle: activeBudget.title,
        inviterUser: user,
        inviteeEmail: inviteEmail.trim()
      });
      setInviteSuccessMsg(`Davetiye hazırlandı! Aşağıdaki davet linkini kopyalayarak arkadaşınızla paylaşabilirsiniz.`);
    } catch (err) {
      setErrorMsg(err.message || 'Davet oluşturulamadı.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyLink = (token) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleOpenAddExpense = () => {
    setEditingExpenseId(null);
    const allMemberNames = members.map(m => m.name);
    setSharedExpenseForm({
      description: '',
      category: 'food',
      amount: '',
      currency: activeBudget?.currency || 'TRY',
      date: new Date().toISOString().slice(0, 10),
      paidByName: user?.name || allMemberNames[0] || 'Ben',
      splitType: 'equal',
      participants: allMemberNames,
      customSplits: {},
      receiptImage: null
    });
    setErrorMsg('');
    setShowAddSharedExpenseModal(true);
  };

  const handleOpenEditExpense = (exp) => {
    setEditingExpenseId(exp.id);
    const allMemberNames = members.map(m => m.name);
    const customSplitsObj = {};
    if (exp.splits && Array.isArray(exp.splits)) {
      exp.splits.forEach(s => {
        customSplitsObj[s.name] = formatAmount(s.amount);
      });
    }

    setSharedExpenseForm({
      description: exp.description || '',
      category: exp.category || 'food',
      amount: formatAmount(exp.amount),
      currency: exp.currency || activeBudget?.currency || 'TRY',
      date: exp.date || new Date().toISOString().slice(0, 10),
      paidByName: exp.paidByName || user?.name || 'Ben',
      splitType: exp.splitType || 'equal',
      participants: exp.participants || allMemberNames,
      customSplits: customSplitsObj,
      receiptImage: exp.receiptImage || null
    });
    setErrorMsg('');
    setShowAddSharedExpenseModal(true);
  };

  const handleReceiptFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Lütfen geçerli bir görsel dosyası seçin (JPG, PNG vb.).');
      return;
    }

    setIsProcessingReceipt(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        try {
          const maxDim = 1200;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);

          setSharedExpenseForm(prev => ({
            ...prev,
            receiptImage: dataUrl
          }));
        } catch (err) {
          console.error("Receipt compression error:", err);
          setSharedExpenseForm(prev => ({
            ...prev,
            receiptImage: event.target.result
          }));
        } finally {
          setIsProcessingReceipt(false);
        }
      };
      img.onerror = () => {
        setIsProcessingReceipt(false);
        alert('Görsel yüklenemedi. Lütfen başka bir dosya deneyin.');
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      setIsProcessingReceipt(false);
      alert('Dosya okunamadı.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveSharedExpense = async (e) => {
    e.preventDefault();
    const amountNum = parseTurkishNumber(sharedExpenseForm.amount);
    if (!sharedExpenseForm.description.trim() || !amountNum || amountNum <= 0) {
      setErrorMsg('Lütfen geçerli bir açıklama ve harcama tutarı girin.');
      return;
    }

    if (sharedExpenseForm.participants.length === 0) {
      setErrorMsg('Masrafa katılan en az 1 kişi seçilmelidir.');
      return;
    }

    let finalSplits = [];
    if (sharedExpenseForm.splitType === 'custom') {
      let customSum = 0;
      sharedExpenseForm.participants.forEach(pName => {
        const pAmt = parseTurkishNumber(sharedExpenseForm.customSplits[pName]) || 0;
        customSum += pAmt;
        finalSplits.push({ name: pName, amount: pAmt });
      });

      if (Math.abs(customSum - amountNum) > 0.05) {
        setErrorMsg(`Özel payların toplamı (${formatAmount(customSum)} ${getCurrencySymbol(activeBudget.currency)}) harcama tutarı (${formatAmount(amountNum)} ${getCurrencySymbol(activeBudget.currency)}) ile eşleşmelidir.`);
        return;
      }
    } else {
      const share = Math.round((amountNum / sharedExpenseForm.participants.length) * 100) / 100;
      finalSplits = sharedExpenseForm.participants.map(pName => ({ name: pName, amount: share }));
    }

    setIsSaving(true);
    try {
      const expensePayload = {
        budgetId: activeBudget.id,
        description: sharedExpenseForm.description.trim(),
        category: sharedExpenseForm.category,
        amount: amountNum,
        currency: sharedExpenseForm.currency,
        date: sharedExpenseForm.date,
        paidByName: sharedExpenseForm.paidByName,
        splitType: sharedExpenseForm.splitType,
        participants: sharedExpenseForm.participants,
        splits: finalSplits,
        receiptImage: sharedExpenseForm.receiptImage || null
      };

      if (editingExpenseId) {
        await updateExpense(editingExpenseId, expensePayload);
      } else {
        await addExpense(expensePayload);
      }
      setShowAddSharedExpenseModal(false);
      setEditingExpenseId(null);
    } catch (err) {
      setErrorMsg("Masraf kaydedilemedi: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDeleteExpense = async () => {
    if (!deletingExpenseId) return;
    const idToDelete = deletingExpenseId;
    setDeletingExpenseId(null);
    try {
      await deleteExpense(idToDelete);
    } catch (e) {
      console.error("Expense delete error:", e);
    }
  };

  // ORTAK MASRAF EKLEME / DÜZENLEME SAYFASI (Pop-up yerine tam sayfa)
  if (showAddSharedExpenseModal) {
    return (
      <div style={{
        padding: '16px 14px',
        maxWidth: '640px',
        margin: '0 auto',
        paddingBottom: '90px'
      }}>
        {/* 1. Üst Başlık Kartı (Geri Oku - Dikey Çizgi - Başlık & Seyahat Adı) */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fff5f9 100%)',
          borderRadius: '18px',
          border: '1.2px solid #F9BED8',
          padding: '13px 16px',
          marginBottom: '14px',
          boxShadow: '0 4px 16px -2px rgba(215, 20, 122, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button
            type="button"
            onClick={() => {
              setShowAddSharedExpenseModal(false);
              setEditingExpenseId(null);
            }}
            style={{
              background: '#ffffff',
              border: '1.2px solid #F9BED8',
              borderRadius: '10px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#D7147A',
              flexShrink: 0,
              boxShadow: '0 1px 3px rgba(215, 20, 122, 0.05)',
              transition: 'transform 0.12s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
            title="Geri Dön"
          >
            <ArrowLeft size={17} strokeWidth={2.4} />
          </button>

          {/* Dikey Çizgi */}
          <div style={{
            width: '1.5px',
            height: '22px',
            background: '#F9BED8',
            flexShrink: 0
          }} />

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wallet size={15} color="#D7147A" />
              <h1 style={{
                fontSize: '13.5px',
                fontWeight: '800',
                color: '#0f172a',
                margin: 0,
                letterSpacing: '-0.2px'
              }}>
                {editingExpenseId ? 'Ortak Masrafı Düzenle' : 'Yeni Ortak Masraf Ekle'}
              </h1>
            </div>
            {activeBudget?.title && (
              <div style={{
                fontSize: '10.5px',
                color: '#64748b',
                marginTop: '1.5px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {activeBudget.title}
              </div>
            )}
          </div>
        </div>

        {/* Ana Kart: Form Gövdesi */}
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1.2px solid #F9BED8',
          padding: '16px',
          boxShadow: '0 4px 16px -2px rgba(215, 20, 122, 0.06)'
        }}>
          {errorMsg && (
            <div style={{
              background: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '11.5px',
              marginBottom: '12px',
              fontWeight: '600'
            }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSaveSharedExpense} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Tutar Hero Giriş Alanı */}
            <div style={{
              background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
              border: '1.2px solid #F9BED8',
              borderRadius: '14px',
              padding: '14px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '10px', fontWeight: '800', color: '#D7147A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                Harcama Tutarı *
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={sharedExpenseForm.amount}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9.,]/g, '');
                    setSharedExpenseForm({ ...sharedExpenseForm, amount: val });
                  }}
                  onBlur={() => {
                    const num = parseTurkishNumber(sharedExpenseForm.amount);
                    if (num > 0) {
                      setSharedExpenseForm(prev => ({ ...prev, amount: formatAmount(num) }));
                    }
                  }}
                  required
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '28px',
                    fontWeight: '900',
                    color: '#D7147A',
                    textAlign: 'center',
                    width: `${Math.max((sharedExpenseForm.amount || '').length + 1, 5)}ch`,
                    maxWidth: '240px',
                    letterSpacing: '-0.4px',
                    caretColor: '#D7147A',
                    padding: 0
                  }}
                />
                <span style={{ fontSize: '22px', fontWeight: '900', color: '#D7147A' }}>
                  {getCurrencySymbol(activeBudget?.currency)}
                </span>
              </div>
            </div>

            {/* Açıklama */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                Açıklama *
              </label>
              <input
                type="text"
                placeholder="Örn: Akşam Yemeği, Taksi, Müze Girişi"
                value={sharedExpenseForm.description}
                onChange={e => setSharedExpenseForm({ ...sharedExpenseForm, description: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '9.5px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '12.5px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = '#D7147A'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Kategori Seçici */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                Kategori
              </label>
              <ThemeSelect
                value={sharedExpenseForm.category}
                onChange={val => setSharedExpenseForm({ ...sharedExpenseForm, category: val })}
                options={EXPENSE_CATEGORIES.map(cat => ({
                  value: cat.key,
                  label: cat.label,
                  icon: cat.icon
                }))}
                triggerStyle={{ padding: '8px 11px', fontSize: '12px' }}
              />
            </div>

            {/* Tarih ve Ödeyen Kişi */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Tarih
                </label>
                <input
                  type="date"
                  value={sharedExpenseForm.date}
                  onChange={e => setSharedExpenseForm({ ...sharedExpenseForm, date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8.5px 10px',
                    borderRadius: '10px',
                    border: '1.2px solid #F9BED8',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Ödeyen Kişi
                </label>
                <ThemeSelect
                  value={sharedExpenseForm.paidByName}
                  onChange={val => setSharedExpenseForm({ ...sharedExpenseForm, paidByName: val })}
                  options={members.map((m) => ({
                    value: m.name,
                    label: `${m.name} ${m.userId === user?.id ? '(Ben)' : ''}`,
                    icon: '👤'
                  }))}
                  triggerStyle={{ padding: '8px 10px', fontSize: '12px' }}
                />
              </div>
            </div>

            {/* Bölüşüm Şekli Sekmeleri */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                Bölüşüm Şekli
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSharedExpenseForm({ ...sharedExpenseForm, splitType: 'equal' })}
                  style={{
                    flex: 1,
                    padding: '9px',
                    borderRadius: '10px',
                    border: sharedExpenseForm.splitType === 'equal' ? '1.5px solid #D7147A' : '1px solid #e2e8f0',
                    background: sharedExpenseForm.splitType === 'equal' ? '#FDF2F8' : '#ffffff',
                    color: sharedExpenseForm.splitType === 'equal' ? '#D7147A' : '#64748b',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  ⚖️ Eşit Bölüşüm
                </button>
                <button
                  type="button"
                  onClick={() => setSharedExpenseForm({ ...sharedExpenseForm, splitType: 'custom' })}
                  style={{
                    flex: 1,
                    padding: '9px',
                    borderRadius: '10px',
                    border: sharedExpenseForm.splitType === 'custom' ? '1.5px solid #D7147A' : '1px solid #e2e8f0',
                    background: sharedExpenseForm.splitType === 'custom' ? '#FDF2F8' : '#ffffff',
                    color: sharedExpenseForm.splitType === 'custom' ? '#D7147A' : '#64748b',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  ✏️ Özel / Manuel Paylar
                </button>
              </div>
            </div>

            {/* Katılımcı Seçimi & Özel Paylar */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                Masrafa Dahil Olan Katılımcılar ({sharedExpenseForm.participants.length} Seçildi)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {members.map(m => {
                  const isChecked = sharedExpenseForm.participants.includes(m.name);
                  return (
                    <div
                      key={m.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: isChecked ? '#fffbf7' : '#f8fafc',
                        border: `1.2px solid ${isChecked ? '#F9BED8' : '#e2e8f0'}`
                      }}
                    >
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', minWidth: 0, flex: 1 }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSharedExpenseForm({
                                ...sharedExpenseForm,
                                participants: [...sharedExpenseForm.participants, m.name]
                              });
                            } else {
                              setSharedExpenseForm({
                                ...sharedExpenseForm,
                                participants: sharedExpenseForm.participants.filter(p => p !== m.name)
                              });
                            }
                          }}
                          style={{ accentColor: '#D7147A' }}
                        />
                        {renderAvatar(m, 22)}
                        <span style={{ color: '#0f172a' }}>{m.name}</span>
                      </label>

                      {sharedExpenseForm.splitType === 'custom' && isChecked && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0,00"
                            value={sharedExpenseForm.customSplits[m.name] || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.,]/g, '');
                              setSharedExpenseForm({
                                ...sharedExpenseForm,
                                customSplits: {
                                  ...sharedExpenseForm.customSplits,
                                  [m.name]: val
                                }
                              });
                            }}
                            style={{
                              width: '75px',
                              padding: '5px 8px',
                              borderRadius: '7px',
                              border: '1.2px solid #F9BED8',
                              fontSize: '11.5px',
                              fontWeight: '700',
                              outline: 'none',
                              textAlign: 'right'
                            }}
                          />
                          <span style={{ fontSize: '11px', color: '#D7147A', fontWeight: '800' }}>
                            {getCurrencySymbol(activeBudget.currency)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fiş / Fatura Görseli */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Fiş / Fatura Görseli</span>
                {sharedExpenseForm.receiptImage ? (
                  <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: '800' }}>✓ Fiş Eklendi</span>
                ) : (
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '500' }}>Opsiyonel</span>
                )}
              </label>

              <input
                ref={receiptCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleReceiptFileSelect}
              />
              <input
                ref={receiptFileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleReceiptFileSelect}
              />

              {sharedExpenseForm.receiptImage ? (
                <div style={{
                  border: '1.2px solid #F9BED8',
                  borderRadius: '12px',
                  padding: '9px 12px',
                  background: '#fffbf7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div
                    onClick={() => setViewingReceiptImage(sharedExpenseForm.receiptImage)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  >
                    <img
                      src={sharedExpenseForm.receiptImage}
                      alt="Fiş"
                      style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                    />
                    <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#D7147A' }}>
                      Fişi Büyüt
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSharedExpenseForm(prev => ({ ...prev, receiptImage: null }))}
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      borderRadius: '8px',
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Kaldır
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => receiptCameraInputRef.current?.click()}
                    disabled={isProcessingReceipt}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '10px',
                      border: '1.2px solid #F9BED8',
                      background: '#ffffff',
                      color: '#D7147A',
                      fontSize: '11.5px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <Camera size={14} strokeWidth={2.4} /> <span>Fotoğraf Çek</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => receiptFileInputRef.current?.click()}
                    disabled={isProcessingReceipt}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '10px',
                      border: '1.2px solid #e2e8f0',
                      background: '#ffffff',
                      color: '#475569',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <FileUp size={14} strokeWidth={2.2} /> <span>Dosya Seç</span>
                  </button>
                </div>
              )}
            </div>

            {/* Butonlar */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowAddSharedExpenseModal(false);
                  setEditingExpenseId(null);
                }}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: '#64748b',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  flex: 2,
                  padding: '11px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                  color: 'white',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  cursor: isSaving ? 'wait' : 'pointer',
                  boxShadow: '0 3px 12px rgba(215, 20, 122, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <span>{editingExpenseId ? 'Değişiklikleri Kaydet' : 'Masrafı Kaydet'}</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Fiş Görseli İnceleme Modalı */}
        {viewingReceiptImage && (
          <div 
            onClick={() => setViewingReceiptImage(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.85)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              backdropFilter: 'blur(5px)'
            }}
          >
            <div 
              onClick={e => e.stopPropagation()}
              style={{
                position: 'relative',
                background: '#ffffff',
                borderRadius: '18px',
                maxWidth: '460px',
                width: '100%',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '90vh'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid #f1f5f9',
                background: '#f8fafc'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={16} style={{ color: '#D7147A' }} />
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                    Fiş / Fatura Görseli
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingReceiptImage(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={18} />
                </button>
              </div>
              <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', overflowY: 'auto' }}>
                <img 
                  src={viewingReceiptImage} 
                  alt="Fiş Tam Ekran" 
                  style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '10px', objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 14px', maxWidth: '640px', margin: '0 auto', paddingBottom: '90px' }}>

      {/* 1. ÜST BAŞLIK KARTI */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <button
            onClick={() => navigate('/individual/budget')}
            style={{
              background: '#ffffff',
              border: '1.2px solid #F9BED8',
              borderRadius: '10px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#D7147A',
              boxShadow: '0 1px 3px rgba(215, 20, 122, 0.08)',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
            title="Bireysel Bütçeye Dön"
            onMouseEnter={e => {
              e.currentTarget.style.background = '#FDF2F8';
              e.currentTarget.style.transform = 'scale(1.04)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <ArrowLeft size={16} strokeWidth={2.4} />
          </button>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.2px' }}>
              Ortak Masraf Paylaşımı
            </h1>
            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Grup seyahat harcamaları & borç-alacak takibi
            </div>
          </div>
        </div>
      </div>

      {!activeBudget ? (
        <div style={{
          background: 'white',
          borderRadius: '18px',
          border: '1.2px solid #F9BED8',
          padding: '32px 18px',
          textAlign: 'center',
          boxShadow: '0 4px 18px -2px rgba(215, 20, 122, 0.06)'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: '#FDF2F8',
            color: '#D7147A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px'
          }}>
            <Wallet size={22} />
          </div>
          <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>
            Henüz Seyahat Bütçesi Bulunmuyor
          </h2>
          <p style={{ fontSize: '11.5px', color: '#64748b', margin: '0 0 16px' }}>
            Ortak bütçe ve masraf paylaşımı için önce bir seyahat planı oluşturmalısınız.
          </p>
          <button
            type="button"
            onClick={() => navigate('/individual/travels/new')}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
              color: 'white',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            Seyahat Oluştur
          </button>
        </div>
      ) : (
        <div>

          {/* 2. AKTİF ORTAK BÜTÇE HERO KARTI */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1.2px solid #F9BED8',
            boxShadow: '0 4px 20px -2px rgba(215, 20, 122, 0.08)',
            marginBottom: '16px',
            overflow: 'hidden'
          }}>
            {/* Şık Seyahat Başlık Şeridi */}
            <div style={{
              position: 'relative',
              height: '62px',
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              justifyContent: 'space-between'
            }}>
              {activeTravel?.coverImage && (
                <img
                  src={activeTravel.coverImage}
                  alt={activeTravel.title}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.35
                  }}
                />
              )}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.45) 100%)'
              }} />

              {/* Sol: Bayrak & Şehir & Tarih */}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.94)',
                  padding: '3px 8px',
                  borderRadius: '7px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }}>
                  <CountryFlag country={activeTravel?.country || 'TR'} size="sm" />
                  <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#0f172a' }}>
                    {activeTravel?.city || activeTravel?.country || 'Seyahat'}
                  </span>
                </div>

                {activeTravel?.startDate && (
                  <span style={{ fontSize: '10px', color: '#f1f5f9', fontWeight: '600' }}>
                    {formatTravelDates(activeTravel.startDate, activeTravel.endDate)}
                  </span>
                )}
              </div>

              {/* Sağ: Katılımcıların Profil Resimleri (İç içe geçmiş yuvarlaklar) */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px 0'
                }}
              >
                {members.map((m, idx) => {
                  const isSelf = (m.userId === user?.id) || (m.name === user?.name);
                  const personUserId = m.userId;
                  const personEmail = m.email;
                  const matchedUser = allUsers.find(u => 
                    (personUserId && u.id === personUserId) || 
                    (personEmail && u.email && u.email.toLowerCase() === personEmail.toLowerCase()) ||
                    (m.name && u.name && u.name.toLowerCase() === m.name.toLowerCase())
                  );
                  const avatarUrl = m.avatar || m.photoURL || matchedUser?.avatar || matchedUser?.photoURL || (isSelf ? (user?.avatar || user?.photoURL) : null);
                  const displayName = m.name || matchedUser?.name || (isSelf ? (user?.name || 'Ben') : 'Üye');
                  const initials = displayName
                    .split(' ')
                    .filter(Boolean)
                    .map(n => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase() || 'U';

                  return (
                    <div
                      key={m.userId || idx}
                      title={`${displayName}${isSelf ? ' (Ben)' : ''}`}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        marginLeft: idx === 0 ? 0 : '-8px',
                        border: '2px solid #ffffff',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
                        overflow: 'hidden',
                        flexShrink: 0,
                        background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: members.length - idx,
                        position: 'relative',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <span style={{
                          color: '#ffffff',
                          fontSize: '10px',
                          fontWeight: '800',
                          letterSpacing: '0.2px'
                        }}>
                          {initials}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Kart İçerik Gövdesi */}
            <div style={{ padding: '16px' }}>
              <h2 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px', letterSpacing: '-0.2px' }}>
                {activeBudget.title}
              </h2>

              {/* İstatistik Metrikleri (3 Sütun) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                background: '#fffbf7',
                border: '1px solid #F9BED8',
                borderRadius: '14px',
                padding: '10px 11px',
                marginBottom: '14px'
              }}>
                <div>
                  <div style={{ fontSize: '8.5px', fontWeight: '700', color: '#D7147A', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '2px' }}>
                    Ortak Harcama
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {formatCurrency(totalSpent, activeBudget.currency)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '8.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '2px' }}>
                    Katılımcı
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
                    {members.length} Kişi
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '8.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '2px' }}>
                    Kişi Başı
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {formatCurrency(averagePerMember, activeBudget.currency)}
                  </div>
                </div>
              </div>

              {/* Katılımcı Üyeler Listesi (Fotoğraflı & Şık) */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#334155' }}>
                    Bütçe Üyeleri ({members.length} Kişi)
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenInvite}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#D7147A',
                      fontSize: '10.5px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={12} strokeWidth={2.4} /> <span>Arkadaş Ekle</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {members.map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#ffffff',
                        border: '1.2px solid #F9BED8',
                        borderRadius: '24px',
                        padding: '2.5px 9px 2.5px 3.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 1px 3px rgba(215, 20, 122, 0.06)'
                      }}
                    >
                      {renderAvatar(m, 20)}
                      <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#1e293b' }}>
                        {m.name} {m.userId === user?.id ? '(Ben)' : ''}
                      </span>
                      {m.role === 'owner' && (
                        <span style={{ fontSize: '8.5px', background: '#FDF2F8', color: '#D7147A', fontWeight: '800', padding: '1px 5px', borderRadius: '6px' }}>
                          Kurucu
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ana Aksiyon: + Ortak Masraf Ekle Butonu */}
              <button
                type="button"
                onClick={handleOpenAddExpense}
                style={{
                  width: '100%',
                  padding: '9.5px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 3px 12px rgba(215, 20, 122, 0.25)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Plus size={15} strokeWidth={2.4} /> <span>Ortak Masraf Ekle</span>
              </button>
            </div>
          </div>



          {/* 4. GÖNDERİLEN DAVETİYELER (Varsa) */}
          {budgetInvitations.length > 0 && (
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1.2px solid #F9BED8',
              padding: '16px',
              marginBottom: '16px',
              boxShadow: '0 4px 18px -2px rgba(215, 20, 122, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={16} color="#D7147A" />
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                    Gönderilen Davetiyeler ({budgetInvitations.length})
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {budgetInvitations.map(inv => (
                  <div
                    key={inv.id}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: '#fffbf7',
                      border: '1px solid #F9BED8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {inv.inviteeEmail}
                      </div>
                      <div style={{ fontSize: '9.5px', color: inv.status === 'accepted' ? '#16a34a' : '#D7147A', fontWeight: '800', marginTop: '1px' }}>
                        {inv.status === 'accepted' ? '✓ Kabul Edildi' : '○ Katılım Bekliyor'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(inv.token)}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #F9BED8',
                        borderRadius: '7px',
                        padding: '4px 9px',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#D7147A',
                        flexShrink: 0
                      }}
                    >
                      {copiedToken === inv.token ? <Check size={12} color="#16a34a" strokeWidth={2.8} /> : <Copy size={12} />}
                      <span>{copiedToken === inv.token ? 'Kopyalandı!' : 'Linki Kopyala'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODAL 1: ARKADAŞ DAVET ET */}
      {showInviteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '400px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: '#FDF2F8',
                  color: '#D7147A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserPlus size={16} strokeWidth={2.4} />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Arkadaşını Davet Et
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px', lineHeight: 1.45 }}>
              Arkadaşınızın e-posta adresini girerek seyahat bütçenize davet edin. Davet linkini kopyalayarak WhatsApp üzerinden de gönderebilirsiniz.
            </p>

            {errorMsg && (
              <div style={{
                background: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '11.5px',
                marginBottom: '12px',
                fontWeight: '600'
              }}>
                {errorMsg}
              </div>
            )}

            {inviteSuccessMsg && (
              <div style={{
                background: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #bbf7d0',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '11.5px',
                marginBottom: '12px',
                fontWeight: '600'
              }}>
                {inviteSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSendInvite}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Arkadaşınızın E-Posta Adresi *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px' }} />
                  <input
                    type="email"
                    placeholder="ornek@email.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '9.5px 12px 9.5px 36px',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      fontSize: '12.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = '#D7147A'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    background: 'white',
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  style={{
                    flex: 2,
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: isInviting ? 'wait' : 'pointer',
                    boxShadow: '0 3px 10px rgba(215, 20, 122, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {isInviting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Hazırlanıyor...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Davet Linki Oluştur</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2 (Ortak Masraf Ekle/Düzenle) artık tam sayfa olarak render edilmektedir */}

      {/* Fiş Görseli İnceleme Modalı */}
      {viewingReceiptImage && (
        <div 
          onClick={() => setViewingReceiptImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backdropFilter: 'blur(5px)'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              background: '#ffffff',
              borderRadius: '18px',
              maxWidth: '460px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid #f1f5f9',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={16} style={{ color: '#D7147A' }} />
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                  Fiş / Fatura Görseli
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingReceiptImage(null)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                <X size={15} />
              </button>
            </div>
            <div style={{
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0f172a',
              overflow: 'auto',
              flex: 1
            }}>
              <img
                src={viewingReceiptImage}
                alt="Fiş Detayı"
                style={{
                  maxWidth: '100%',
                  maxHeight: '65vh',
                  objectFit: 'contain',
                  borderRadius: '6px'
                }}
              />
            </div>
            <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => setViewingReceiptImage(null)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '9px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Masraf Silme Onay Modalı */}
      <ConfirmModal
        isOpen={Boolean(deletingExpenseId)}
        title="Ortak Masrafı Sil"
        message="Bu ortak harcama kaydını silmek istediğinizden emin misiniz? Bütün katılımcıların borç-alacak dengesi yeniden hesaplanacaktır."
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        type="danger"
        onConfirm={handleConfirmDeleteExpense}
        onClose={() => setDeletingExpenseId(null)}
        onCancel={() => setDeletingExpenseId(null)}
      />

    </div>
  );
}
