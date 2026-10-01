import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Users, 
  Calendar, 
  Tag, 
  PieChart, 
  ArrowUpRight, 
  X, 
  Loader2, 
  Luggage,
  AlertCircle,
  Pencil,
  PlaneTakeoff,
  Sparkles,
  Receipt,
  ArrowLeft,
  Check,
  ChevronDown,
  Camera,
  FileUp,
  User,
  FileCheck,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useIndividualStore } from '../../store/individualStore';
import GuestNoticeBanner from '../../components/GuestNoticeBanner';
import ConfirmModal from '../../components/ConfirmModal';
import CountryFlag from '../../components/CountryFlag';
import { formatTravelDates } from '../../services/destinationImageService';

export const getCurrencySymbol = (currency) => {
  if (!currency) return '₺';
  const c = String(currency).trim().toUpperCase();
  if (c === 'TRY' || c === 'TL') return '₺';
  if (c === 'USD') return '$';
  if (c === 'EUR') return '€';
  if (c === 'GBP') return '£';
  return currency;
};

export const formatAmount = (num) => {
  const val = Number(num) || 0;
  return val.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const formatCurrency = (num, currency = 'TRY') => {
  return `${formatAmount(num)} ${getCurrencySymbol(currency)}`;
};

export const parseTurkishNumber = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  const str = String(val).trim();
  if (!str) return 0;
  if (str.includes(',') && str.includes('.')) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
  }
  if (str.includes(',')) {
    return parseFloat(str.replace(',', '.')) || 0;
  }
  if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
    return parseFloat(str.replace(/\./g, '')) || 0;
  }
  return parseFloat(str) || 0;
};

export const formatExpenseDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      const monthIdx = parseInt(m, 10) - 1;
      const monthName = months[monthIdx] || m;
      return `${parseInt(d, 10)} ${monthName} ${y}`;
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
};

export const EXPENSE_CATEGORIES = [
  { key: 'flight', label: 'Uçak / Ulaşım', color: '#0284c7', icon: '✈️' },
  { key: 'hotel', label: 'Otel / Konaklama', color: '#8b5cf6', icon: '🏨' },
  { key: 'food', label: 'Yemek & Restoran', color: '#D7147A', icon: '🍽️' },
  { key: 'transport', label: 'Şehir İçi Ulaşım', color: '#059669', icon: '🚕' },
  { key: 'fuel', label: 'Yakıt', color: '#16a34a', icon: '⛽' },
  { key: 'activity', label: 'Müze & Aktivite', color: '#d97706', icon: '🎟️' },
  { key: 'shopping', label: 'Alışveriş', color: '#db2777', icon: '🛍️' },
  { key: 'insurance', label: 'Sigorta & Vize', color: '#475569', icon: '📄' },
  { key: 'other', label: 'Diğer Masraflar', color: '#64748b', icon: '📦' }
];

export const CURRENCY_OPTIONS = [
  { code: 'TRY', symbol: '₺', label: 'Türk Lirası' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'USD', symbol: '$', label: 'Dolar' },
  { code: 'GBP', symbol: '£', label: 'Sterlin' }
];

function CurrencyDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selected = CURRENCY_OPTIONS.find(c => c.code === value) || CURRENCY_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {/* Seçici Tetikleyici Buton */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: '10px',
          border: isOpen ? '1.5px solid #D7147A' : '1.5px solid #e2e8f0',
          background: isOpen ? '#fffdfa' : '#ffffff',
          boxShadow: isOpen ? '0 0 0 3px rgba(215, 20, 122, 0.08)' : 'none',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.15s ease',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '7px',
            background: '#FDF2F8',
            color: '#D7147A',
            border: '1px solid #F9BED8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: '900',
            flexShrink: 0
          }}>
            {selected.symbol}
          </div>
          <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#0f172a' }}>
            {selected.label}
          </span>
        </div>

        <ChevronDown 
          size={14} 
          style={{
            color: isOpen ? '#D7147A' : '#94a3b8',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0
          }} 
        />
      </button>

      {/* Aşağı Açılan Menü */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 5px)',
          left: 0,
          right: 0,
          background: '#ffffff',
          borderRadius: '12px',
          border: '1.2px solid #F9BED8',
          boxShadow: '0 10px 24px -4px rgba(215, 20, 122, 0.12), 0 4px 10px rgba(0, 0, 0, 0.04)',
          zIndex: 100,
          padding: '5px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          {CURRENCY_OPTIONS.map((c) => {
            const isSelected = c.code === value;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onChange(c.code);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: isSelected ? '1px solid #F9BED8' : '1px solid transparent',
                  background: isSelected ? '#FDF2F8' : '#ffffff',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#ffffff';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: isSelected ? '#F9BED8' : '#f8fafc',
                    color: isSelected ? '#D7147A' : '#475569',
                    border: isSelected ? '1px solid #F9BED8' : '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '900',
                    flexShrink: 0
                  }}>
                    {c.symbol}
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: isSelected ? '800' : '600',
                    color: isSelected ? '#D7147A' : '#1e293b'
                  }}>
                    {c.label}
                  </span>
                </div>

                {isSelected && (
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#D7147A',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Check size={11} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategoryDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selected = EXPENSE_CATEGORIES.find(c => c.key === value) || EXPENSE_CATEGORIES[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 11px',
          borderRadius: '10px',
          border: isOpen ? '1.5px solid #D7147A' : '1.5px solid #e2e8f0',
          background: isOpen ? '#fffdfa' : '#ffffff',
          boxShadow: isOpen ? '0 0 0 3px rgba(215, 20, 122, 0.08)' : 'none',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.15s ease',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ fontSize: '14px', lineHeight: 1 }}>{selected.icon}</span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>
            {selected.label}
          </span>
        </div>
        <ChevronDown 
          size={14} 
          style={{
            color: isOpen ? '#D7147A' : '#94a3b8',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0
          }} 
        />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 5px)',
          left: 0,
          right: 0,
          maxHeight: '240px',
          overflowY: 'auto',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1.2px solid #F9BED8',
          boxShadow: '0 10px 24px -4px rgba(215, 20, 122, 0.12), 0 4px 10px rgba(0, 0, 0, 0.04)',
          zIndex: 100,
          padding: '5px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          {EXPENSE_CATEGORIES.map((cat) => {
            const isSelected = cat.key === value;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  onChange(cat.key);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 9px',
                  borderRadius: '8px',
                  border: isSelected ? '1px solid #F9BED8' : '1px solid transparent',
                  background: isSelected ? '#FDF2F8' : '#ffffff',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = '#ffffff';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ fontSize: '13.5px', lineHeight: 1 }}>{cat.icon}</span>
                  <span style={{ fontSize: '11.5px', fontWeight: isSelected ? '800' : '600', color: isSelected ? '#D7147A' : '#1e293b' }}>
                    {cat.label}
                  </span>
                </div>
                {isSelected && (
                  <Check size={12} color="#D7147A" strokeWidth={3} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PayerDropdown({ value, onChange, payers = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selected = payers.find(p => p.name === value || p.id === value) || payers[0] || {
    name: value || 'Ben',
    avatar: null
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const renderAvatar = (person, size = 22) => {
    if (person?.avatar) {
      return (
        <img
          src={person.avatar}
          alt={person.name}
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
    const initials = (person?.name || 'U')
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

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {/* Seçici Tetikleyici Buton */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '7px 11px',
          borderRadius: '10px',
          border: isOpen ? '1.5px solid #D7147A' : '1.5px solid #e2e8f0',
          background: isOpen ? '#fffdfa' : '#ffffff',
          boxShadow: isOpen ? '0 0 0 3px rgba(215, 20, 122, 0.08)' : 'none',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.15s ease',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {renderAvatar(selected, 22)}
          <span style={{
            fontSize: '12px',
            fontWeight: '700',
            color: '#0f172a',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {selected.name}
          </span>
        </div>

        <ChevronDown 
          size={14} 
          style={{
            color: isOpen ? '#D7147A' : '#94a3b8',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0
          }} 
        />
      </button>

      {/* Aşağı Açılan Menü */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 5px)',
          left: 0,
          right: 0,
          background: '#ffffff',
          borderRadius: '12px',
          border: '1.2px solid #F9BED8',
          boxShadow: '0 10px 24px -4px rgba(215, 20, 122, 0.12), 0 4px 10px rgba(0, 0, 0, 0.04)',
          zIndex: 100,
          padding: '5px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          maxHeight: '220px',
          overflowY: 'auto'
        }}>
          {payers.map((person) => {
            const isSelected = selected.name === person.name;
            return (
              <button
                key={person.id || person.name}
                type="button"
                onClick={() => {
                  onChange(person);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: isSelected ? '1px solid #F9BED8' : '1px solid transparent',
                  background: isSelected ? '#FDF2F8' : '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = '#fefaf6';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = '#ffffff';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  {renderAvatar(person, 24)}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: isSelected ? '800' : '600',
                      color: isSelected ? '#D7147A' : '#1e293b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {person.name}
                    </div>
                    {person.isOwner && (
                      <div style={{ fontSize: '9px', color: '#D7147A', fontWeight: '700' }}>
                        Profil Sahibi
                      </div>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check size={13} style={{ color: '#D7147A', strokeWidth: 2.8, flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

    if (isHorizontalScrollRef.current === null) {
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        isHorizontalScrollRef.current = false;
        return;
      } else if (Math.abs(deltaX) > 6) {
        isHorizontalScrollRef.current = true;
      }
    }

    if (!isHorizontalScrollRef.current) return;

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
      setOffsetX(0);
      onDelete(exp.id);
    } else if (isHorizontalScrollRef.current && deltaX >= 40) {
      setOffsetX(0);
      if (onEdit) onEdit(exp);
    } else {
      setOffsetX(0);
    }
    currentDeltaXRef.current = 0;
    isHorizontalScrollRef.current = null;
  };

  // Fare (Mouse Drag) Olayları
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
              -{formatCurrency(exp.amount, exp.currency || activeBudget?.currency)}
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
          {exp.paidByName && (exp.splitType || exp.receiptImage) && (
            <div style={{ width: '1px', height: '10px', background: '#e2e8f0', flexShrink: 0 }} />
          )}

          {/* 2. Özel Pay / Dağılım Türü (Mor / Violet) */}
          {exp.splitType && (
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
          )}

          {/* Dikey Çizgi (Özel Pay ile Fiş arası) */}
          {exp.splitType && exp.receiptImage && (
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

export default function Budget() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const [searchParams] = useSearchParams();
  const preselectedTravelId = searchParams.get('travelId');

  const travels = useIndividualStore(state => state.travels);
  const budgets = useIndividualStore(state => state.budgets);
  const expenses = useIndividualStore(state => state.expenses);
  const invitations = useIndividualStore(state => state.invitations);
  const updateBudget = useIndividualStore(state => state.updateBudget);
  const ensureTravelBudgets = useIndividualStore(state => state.ensureTravelBudgets);
  const deleteExpense = useIndividualStore(state => state.deleteExpense);
  const addExpense = useIndividualStore(state => state.addExpense);
  const updateExpense = useIndividualStore(state => state.updateExpense);
  const calculateSettlement = useIndividualStore(state => state.calculateSettlement);

  const [selectedBudgetId, setSelectedBudgetId] = useState('');
  const [viewMode, setViewMode] = useState('budget'); // 'budget' | 'set-limit' | 'add-expense'
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSharedBudgetModal, setShowSharedBudgetModal] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Seyahatler için otomatik bütçe senkronizasyonu
  useEffect(() => {
    if (travels.length > 0) {
      ensureTravelBudgets(user);
    }
  }, [travels, user, ensureTravelBudgets]);

  // Tekil seyahat bütçeleri (Her seyahat için tek bütçe - deduplication)
  const uniqueTravelBudgets = [];
  const seenKeys = new Set();
  budgets.forEach(b => {
    const key = b.travelId || b.id;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueTravelBudgets.push(b);
    }
  });

  // Seyahat seçimine veya ilk bütçeye göre aktif bütçeyi otomatik seç
  useEffect(() => {
    if (preselectedTravelId && uniqueTravelBudgets.length > 0) {
      const matched = uniqueTravelBudgets.find(b => b.travelId === preselectedTravelId);
      if (matched) {
        setSelectedBudgetId(matched.id);
        return;
      }
    }
    if (uniqueTravelBudgets.length > 0 && (!selectedBudgetId || !uniqueTravelBudgets.some(b => b.id === selectedBudgetId))) {
      setSelectedBudgetId(uniqueTravelBudgets[0].id);
    }
  }, [preselectedTravelId, uniqueTravelBudgets, selectedBudgetId]);

  const activeBudget = uniqueTravelBudgets.find(b => b.id === selectedBudgetId) || uniqueTravelBudgets[0];
  const activeTravel = travels.find(t => t.id === activeBudget?.travelId);

  // Ortak bütçe kontrolü (arkadaş eklenip eklenmediği)
  const isSharedBudget = Boolean(
    (activeBudget?.members && activeBudget.members.length > 1) ||
    activeBudget?.isShared ||
    (invitations && invitations.some(inv => inv.budgetId === activeBudget?.id))
  );

  // Ortak Hesaplaşma Matrisi (Sadece arkadaş eklendiyse hesaplanır)
  const settlementResult = useMemo(() => {
    if (activeBudget?.members && activeBudget.members.length > 1) {
      return calculateSettlement(activeBudget.id);
    }
    return { netBalances: {}, settlements: [] };
  }, [activeBudget, calculateSettlement]);

  const renderSettlementAvatar = (personOrName, size = 20) => {
    let name = typeof personOrName === 'string' ? personOrName : personOrName?.name || 'Üye';
    let avatarUrl = typeof personOrName === 'object' ? (personOrName?.avatar || null) : null;
    let isSelf = false;

    if (user) {
      if (typeof personOrName === 'object') {
        isSelf = personOrName.userId === user.id || personOrName.name === user.name;
      } else {
        isSelf = personOrName === user.name;
      }
    }

    if (!avatarUrl && isSelf && (user?.avatar || user?.photoURL)) {
      avatarUrl = user.avatar || user.photoURL;
    }

    if (!avatarUrl && activeBudget?.members) {
      const found = activeBudget.members.find(m => m.name === name);
      if (found && found.avatar) avatarUrl = found.avatar;
    }

    const initials = (name || 'U')
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
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

    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
          color: '#ffffff',
          fontSize: `${Math.max(size * 0.42, 9)}px`,
          fontWeight: '800',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: '1.2px solid #F9BED8',
          letterSpacing: '0.2px'
        }}
      >
        {initials}
      </div>
    );
  };

  // Ödeyen Kişiler Listesi (Profil Sahibi + Varsa Ortak Bütçeye Eklenen Kişiler)
  const payerOptions = useMemo(() => {
    const list = [];
    const ownerName = user?.name || 'Ben';
    const ownerAvatar = user?.avatar || user?.photoURL || null;

    list.push({
      id: user?.id || 'owner',
      name: ownerName,
      avatar: ownerAvatar,
      email: user?.email || '',
      isOwner: true
    });

    if (activeBudget?.members && Array.isArray(activeBudget.members)) {
      activeBudget.members.forEach((m, idx) => {
        const isSelf = (m.userId && user?.id && m.userId === user.id) ||
                       (m.email && user?.email && m.email.toLowerCase() === user.email.toLowerCase()) ||
                       (m.name === ownerName);
        if (!isSelf && m.name) {
          list.push({
            id: m.userId || `mem_${idx}`,
            name: m.name,
            avatar: m.avatar || null,
            email: m.email || '',
            isOwner: false
          });
        }
      });
    }

    return list;
  }, [user, activeBudget?.members]);

  // Masraf Formu
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    category: 'food',
    amount: '',
    currency: 'TRY',
    date: new Date().toISOString().slice(0, 10),
    paidByName: user?.name || 'Ben',
    notes: '',
    receiptImage: null,
    receiptName: ''
  });
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const expenseAmountInputRef = useRef(null);
  const receiptCameraInputRef = useRef(null);
  const receiptFileInputRef = useRef(null);
  const [viewingReceiptImage, setViewingReceiptImage] = useState(null);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);

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

          setExpenseForm(prev => ({
            ...prev,
            receiptImage: dataUrl,
            receiptName: file.name || 'fis.jpg'
          }));
        } catch (err) {
          console.error("Receipt compression error:", err);
          setExpenseForm(prev => ({
            ...prev,
            receiptImage: event.target.result,
            receiptName: file.name || 'fis.jpg'
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

  // Aktif bütçe istatistikleri
  const budgetExpenses = expenses.filter(e => e.budgetId === activeBudget?.id);
  const totalSpent = budgetExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const totalAllocated = Number(activeBudget?.totalBudget) || 0;
  const remaining = totalAllocated - totalSpent;
  const spentPct = totalAllocated > 0 ? Math.min(100, Math.round((totalSpent / totalAllocated) * 100)) : 0;

  // Kategori dökümü
  const categoryTotals = {};
  budgetExpenses.forEach(exp => {
    const cat = exp.category || 'other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(exp.amount);
  });

  // Hedef Bütçe Limiti Formu
  const [editLimitForm, setEditLimitForm] = useState({
    totalBudget: 0,
    currency: 'TRY'
  });

  const handleOpenEditLimit = () => {
    if (!activeBudget) return;
    const initialVal = activeBudget.totalBudget ? Number(activeBudget.totalBudget) : 0;
    setEditLimitForm({
      totalBudget: initialVal > 0 ? formatAmount(initialVal) : '',
      currency: activeBudget.currency || 'TRY'
    });
    setViewMode('set-limit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveEditLimit = async (e) => {
    e.preventDefault();
    if (!activeBudget) return;
    setIsSaving(true);
    try {
      const budgetValue = parseTurkishNumber(editLimitForm.totalBudget);
      await updateBudget(activeBudget.id, {
        totalBudget: budgetValue,
        currency: editLimitForm.currency || 'TRY'
      });
      setViewMode('budget');
    } catch (err) {
      console.error("Budget limit update error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenAddExpense = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setEditingExpenseId(null);
    setExpenseForm({
      description: '',
      category: 'food',
      amount: '',
      currency: activeBudget?.currency || 'TRY',
      date: new Date().toISOString().slice(0, 10),
      paidByName: user?.name || 'Ben',
      notes: '',
      receiptImage: null,
      receiptName: ''
    });
    setViewMode('add-expense');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      expenseAmountInputRef.current?.focus();
    }, 80);
  };

  const handleOpenEditExpense = (exp) => {
    setEditingExpenseId(exp.id);
    setExpenseForm({
      description: exp.description || '',
      category: exp.category || 'food',
      amount: formatAmount(exp.amount),
      currency: exp.currency || activeBudget?.currency || 'TRY',
      date: exp.date || new Date().toISOString().slice(0, 10),
      paidByName: exp.paidByName || user?.name || 'Ben',
      notes: exp.notes || '',
      receiptImage: exp.receiptImage || null,
      receiptName: exp.receiptName || ''
    });
    setViewMode('add-expense');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      expenseAmountInputRef.current?.focus();
    }, 80);
  };

  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseTurkishNumber(expenseForm.amount);
    if (!numAmount) {
      expenseAmountInputRef.current?.focus();
      return;
    }
    if (!expenseForm.description.trim()) return;
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setIsSaving(true);
    try {
      if (editingExpenseId) {
        await updateExpense(editingExpenseId, {
          description: expenseForm.description.trim(),
          category: expenseForm.category,
          amount: numAmount,
          currency: expenseForm.currency || activeBudget?.currency || 'TRY',
          date: expenseForm.date,
          paidByName: expenseForm.paidByName || user.name,
          notes: expenseForm.notes || '',
          receiptImage: expenseForm.receiptImage || null
        });
      } else {
        await addExpense({
          ...expenseForm,
          amount: numAmount,
          budgetId: activeBudget.id,
          paidBy: { userId: user.id, name: user.name },
          paidByName: expenseForm.paidByName || user.name,
          receiptImage: expenseForm.receiptImage || null
        });
      }
      setViewMode('budget');
      setEditingExpenseId(null);
      setExpenseForm({
        description: '',
        category: 'food',
        amount: '',
        currency: activeBudget?.currency || 'TRY',
        date: new Date().toISOString().slice(0, 10),
        paidByName: user?.name || 'Ben',
        notes: '',
        receiptImage: null,
        receiptName: ''
      });
    } catch (err) {
      alert("Hata: " + err.message);
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

  return (
    <div style={{ padding: '16px 14px', maxWidth: '640px', margin: '0 auto', paddingBottom: '90px' }}>

      {/* Guest Notice Banners */}
      <GuestNoticeBanner 
        customTitle="İşlemlerin Kaydedilmesi İçin Giriş Gerekli" 
        customMessage="Seyahat bütçenizi planlamak ve masraflarınızı kaydetmek için lütfen giriş yapın." 
      />
      <GuestNoticeBanner feature="shared_budget" />

      {/* 1. GÖRÜNÜM: Bütçe Limitini Belirle Sayfası */}
      {viewMode === 'set-limit' && activeBudget ? (
        <div>
          {/* Üst Başlık Kartı */}
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
              onClick={() => setViewMode('budget')}
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
              title="Bütçeye Geri Dön"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FDF2F8';
                e.currentTarget.style.transform = 'scale(1.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <ArrowLeft size={16} strokeWidth={2.4} />
            </button>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.2px' }}>
                Bütçe Limitini Belirle
              </h1>
              <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CountryFlag country={activeTravel?.country || 'TR'} size="sm" />
                <span style={{ fontWeight: '600' }}>{activeTravel?.title || activeBudget.title}</span>
              </div>
            </div>
          </div>

          {/* Form Kartı */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.2px solid #F9BED8',
            padding: '16px',
            boxShadow: '0 4px 18px -2px rgba(215, 20, 122, 0.07)'
          }}>
            {/* Canlı Formatlanmış Önizleme Kutusu (3.000,00 ₺) */}
            <div style={{
              background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
              border: '1.2px solid #F9BED8',
              borderRadius: '12px',
              padding: '12px 14px',
              textAlign: 'center',
              marginBottom: '14px'
            }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#D7147A', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '3px' }}>
                Planlanan Hedef Bütçe
              </div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#D7147A', letterSpacing: '-0.4px', lineHeight: 1.1 }}>
                {formatCurrency(parseTurkishNumber(editLimitForm.totalBudget) || 0, editLimitForm.currency)}
              </div>
              <div style={{ fontSize: '10.5px', color: '#8E0C51', marginTop: '4px' }}>
                {parseTurkishNumber(editLimitForm.totalBudget) > 0 
                  ? 'Seyahatiniz süresince harcamalarınız bu limit üzerinden takip edilecektir.' 
                  : 'Lütfen seyahatiniz için bir hedef toplam bütçe tutarı belirleyin.'}
              </div>
            </div>

            <form onSubmit={handleSaveEditLimit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Hedef Toplam Bütçe ({getCurrencySymbol(editLimitForm.currency)}) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Örn: 3.000,00 veya 5.500,00"
                    value={editLimitForm.totalBudget}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9.,]/g, '');
                      setEditLimitForm({ ...editLimitForm, totalBudget: val });
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      const num = parseTurkishNumber(editLimitForm.totalBudget);
                      if (num > 0) {
                        setEditLimitForm(prev => ({ ...prev, totalBudget: formatAmount(num) }));
                      }
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#D7147A';
                      e.target.select();
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '8.5px 12px',
                      paddingRight: '32px',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s ease'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    right: '11px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '13px',
                    fontWeight: '800',
                    color: '#D7147A'
                  }}>
                    {getCurrencySymbol(editLimitForm.currency)}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Para Birimi
                </label>
                <CurrencyDropdown
                  value={editLimitForm.currency}
                  onChange={(curr) => setEditLimitForm({ ...editLimitForm, currency: curr })}
                />
              </div>

              {/* Kaydet / Vazgeç Butonları */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('budget')}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#64748b',
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
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: isSaving ? 'wait' : 'pointer',
                    boxShadow: '0 3px 10px rgba(215, 20, 122, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <span>Kaydet</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : viewMode === 'add-expense' && activeBudget ? (
      /* 2. GÖRÜNÜM: Yeni Masraf Ekle Sayfası */
        <div>
          {/* Üst Başlık Kartı */}
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
                setEditingExpenseId(null);
                setViewMode('budget');
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
                boxShadow: '0 1px 3px rgba(215, 20, 122, 0.08)',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
              title="Bütçeye Geri Dön"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FDF2F8';
                e.currentTarget.style.transform = 'scale(1.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <ArrowLeft size={16} strokeWidth={2.4} />
            </button>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.2px' }}>
                {editingExpenseId ? 'Masrafı Düzenle' : 'Yeni Masraf Ekle'}
              </h1>
              <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CountryFlag country={activeTravel?.country || 'TR'} size="sm" />
                <span style={{ fontWeight: '600' }}>{activeTravel?.title || activeBudget.title}</span>
              </div>
            </div>
          </div>

          {/* Form Kartı */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.2px solid #F9BED8',
            padding: '16px',
            boxShadow: '0 4px 18px -2px rgba(215, 20, 122, 0.07)'
          }}>
            <form onSubmit={handleAddExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
              {/* Canlı Düzenlenebilir Harcama Tutarı Kutusu (Turuncu Hero Giriş) */}
              <div
                onClick={() => expenseAmountInputRef.current?.focus()}
                style={{
                  background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
                  border: isAmountFocused ? '1.5px solid #D7147A' : '1.2px solid #F9BED8',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  textAlign: 'center',
                  cursor: 'text',
                  boxShadow: isAmountFocused ? '0 0 0 3px rgba(215, 20, 122, 0.12)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#D7147A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                  Harcama Tutarı
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <input
                    ref={expenseAmountInputRef}
                    autoFocus
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={expenseForm.amount}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9.,]/g, '');
                      setExpenseForm({ ...expenseForm, amount: val });
                    }}
                    onFocus={(e) => {
                      setIsAmountFocused(true);
                      e.target.select();
                    }}
                    onBlur={() => {
                      setIsAmountFocused(false);
                      const num = parseTurkishNumber(expenseForm.amount);
                      if (num > 0) {
                        setExpenseForm(prev => ({ ...prev, amount: formatAmount(num) }));
                      }
                    }}
                    required
                    className="orange-hero-amount-input"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '24px',
                      fontWeight: '900',
                      color: '#D7147A',
                      textAlign: 'center',
                      width: `${Math.max((expenseForm.amount || '').length + 1, 5)}ch`,
                      maxWidth: '220px',
                      letterSpacing: '-0.4px',
                      caretColor: '#D7147A',
                      padding: 0
                    }}
                  />
                  <span style={{ fontSize: '20px', fontWeight: '900', color: '#D7147A' }}>
                    {getCurrencySymbol(activeBudget?.currency)}
                  </span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Açıklama *
                </label>
                <input
                  type="text"
                  placeholder="Örn: Akşam Yemeği, Müze Bileti, Taksi"
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8.5px 11px',
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

              {/* Kategori (Uzatılmış / Tam Genişlik) */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Kategori
                </label>
                <CategoryDropdown
                  value={expenseForm.category}
                  onChange={(cat) => setExpenseForm({ ...expenseForm, category: cat })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Tarih
                  </label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8.5px 10px',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
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
                  <PayerDropdown
                    value={expenseForm.paidByName}
                    onChange={(person) => setExpenseForm({ ...expenseForm, paidByName: person.name })}
                    payers={payerOptions}
                  />
                </div>
              </div>

              {/* Fiş / Fatura Görseli Ekleme Alanı */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Fiş / Fatura Görseli</span>
                  {expenseForm.receiptImage ? (
                    <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: '800' }}>✓ Fiş Eklendi</span>
                  ) : (
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '500' }}>Opsiyonel</span>
                  )}
                </label>

                {/* Gizli Dosya Girişleri (Kamera ve Dosya) */}
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

                {expenseForm.receiptImage ? (
                  /* Fiş Görseli Eklendiğinde Önizleme Kutusu */
                  <div style={{
                    border: '1.2px solid #F9BED8',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    background: 'linear-gradient(135deg, #FDF2F8 0%, #ffffff 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <div
                      onClick={() => setViewingReceiptImage(expenseForm.receiptImage)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', minWidth: 0, flex: 1 }}
                      title="Büyütmek için tıklayın"
                    >
                      <img
                        src={expenseForm.receiptImage}
                        alt="Fiş Önizleme"
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          border: '1.2px solid #F9BED8',
                          flexShrink: 0
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Fiş Görseli Eklendi
                        </div>
                        <div style={{ fontSize: '10px', color: '#D7147A', fontWeight: '700' }}>
                          Büyütmek için tıklayın
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpenseForm(prev => ({ ...prev, receiptImage: null, receiptName: '' }))}
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#dc2626',
                        borderRadius: '8px',
                        padding: '5px 8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        flexShrink: 0
                      }}
                      title="Fişi Kaldır"
                    >
                      <X size={12} strokeWidth={2.4} /> <span>Kaldır</span>
                    </button>
                  </div>
                ) : (
                  /* Henüz Fiş Eklenmediğinde Kamera ve Dosya Seçim Butonları */
                  <div style={{
                    border: '1.5px dashed #F9BED8',
                    borderRadius: '12px',
                    padding: '11px 12px',
                    background: '#fffbf7',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => receiptCameraInputRef.current?.click()}
                        disabled={isProcessingReceipt}
                        style={{
                          flex: 1,
                          maxWidth: '145px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '7.5px 10px',
                          borderRadius: '10px',
                          border: '1.2px solid #F9BED8',
                          background: '#ffffff',
                          color: '#D7147A',
                          fontSize: '11.5px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          boxShadow: '0 1px 4px rgba(215, 20, 122, 0.08)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Camera size={14} strokeWidth={2.4} />
                        <span>Kamera ile Çek</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => receiptFileInputRef.current?.click()}
                        disabled={isProcessingReceipt}
                        style={{
                          flex: 1,
                          maxWidth: '145px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '7.5px 10px',
                          borderRadius: '10px',
                          border: '1.2px solid #e2e8f0',
                          background: '#ffffff',
                          color: '#475569',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <FileUp size={14} strokeWidth={2.2} />
                        <span>Dosya / Galeri</span>
                      </button>
                    </div>

                    <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center' }}>
                      {isProcessingReceipt ? 'Görsel işleniyor...' : 'Kamera ile çekin veya galeriden dosya yükleyin'}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingExpenseId(null);
                    setViewMode('budget');
                  }}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#64748b',
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
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: isSaving ? 'wait' : 'pointer',
                    boxShadow: '0 3px 10px rgba(215, 20, 122, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <span>{editingExpenseId ? 'Değişiklikleri Kaydet' : 'Masrafı Kaydet'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* 3. GÖRÜNÜM: Normal Bütçe Sayfası */
        <div>
          {/* Üst Başlık Kartı */}
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
            Seyahat Bütçesi
          </h1>
          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', lineHeight: '1.35' }}>
            Bireysel ve ortak seyahat harcamalarınızı yönetin
          </div>
        </div>
      </div>

      {uniqueTravelBudgets.length === 0 ? (
        /* Boş Durum: Henüz Seyahat Yok */
        <div style={{
          background: 'white',
          borderRadius: '18px',
          border: '1.5px dashed #F9BED8',
          padding: '38px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: '#FDF2F8',
            color: '#D7147A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <Wallet size={24} />
          </div>
          <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
            Henüz Kayıtlı Seyahat Bütçeniz Yok
          </h2>
          <p style={{ fontSize: '11.5px', color: '#64748b', margin: '0 0 18px', maxWidth: '340px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.45 }}>
            Seyahat bütçeleri oluşturduğunuz seyahat planları ile otomatik olarak açılır. Bir seyahat oluşturarak başlayabilirsiniz.
          </p>
          <button
            type="button"
            onClick={() => navigate('/individual/travels/new')}
            style={{
              padding: '9px 18px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
              color: 'white',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(215, 20, 122, 0.22)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={15} strokeWidth={2.4} /> <span>Seyahat Oluştur</span>
          </button>
        </div>
      ) : (
        <div>
          {/* Birden Fazla Seyahat Varsa Şık Seyahat Seçici Sekmeleri */}
          {uniqueTravelBudgets.length > 1 && (
            <div style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '8px',
              marginBottom: '12px',
              scrollbarWidth: 'none'
            }}>
              {uniqueTravelBudgets.map(b => {
                const tr = travels.find(t => t.id === b.travelId);
                const isSelected = activeBudget?.id === b.id;
                const label = tr?.city || (tr?.destination ? tr.destination.split(',')[0].trim() : b.title);
                const countryCode = tr?.country || 'TR';

                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBudgetId(b.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '10px',
                      border: isSelected ? '1.5px solid #D7147A' : '1px solid #e2e8f0',
                      background: isSelected ? '#FDF2F8' : '#ffffff',
                      color: isSelected ? '#D7147A' : '#475569',
                      fontSize: '11px',
                      fontWeight: isSelected ? '800' : '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: isSelected ? '0 2px 8px rgba(215, 20, 122, 0.12)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <CountryFlag country={countryCode} size="sm" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Aktif Seyahat Bütçe Kartı (Hero Card) */}
          {activeBudget && (
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1.2px solid #F9BED8',
              boxShadow: '0 4px 20px -2px rgba(215, 20, 122, 0.08)',
              marginBottom: '16px',
              overflow: 'hidden'
            }}>
              {/* Seyahat Başlık Şeridi */}
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
                  background: 'linear-gradient(90deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.4) 100%)'
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
                      {activeTravel?.city || activeTravel?.country || 'Seyahat Bütçesi'}
                    </span>
                  </div>

                  {activeTravel?.startDate && (
                    <span style={{ fontSize: '10px', color: '#f1f5f9', fontWeight: '600' }}>
                      {formatTravelDates(activeTravel.startDate, activeTravel.endDate)}
                    </span>
                  )}
                </div>

                {/* Sağ: Bütçe Durum Rozeti (Bireysel Bütçe / Ortak Bütçe) */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  {isSharedBudget ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!user) {
                          setShowSharedBudgetModal(true);
                          return;
                        }
                        navigate(`/individual/budget/shared?budgetId=${activeBudget.id}`);
                      }}
                      style={{
                        background: 'linear-gradient(135deg, rgba(215, 20, 122, 0.95) 0%, rgba(215, 20, 122, 0.95) 100%)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.35)',
                        color: '#ffffff',
                        borderRadius: '8px',
                        padding: '4px 9px',
                        fontSize: '10px',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(215, 20, 122, 0.35)',
                        transition: 'all 0.15s ease'
                      }}
                      title="Ortak Bütçe ve Masraf Paylaşımını Görüntüle"
                    >
                      <Users size={11} strokeWidth={2.4} />
                      <span>Ortak Bütçe</span>
                    </button>
                  ) : (
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.22)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: '#ffffff',
                        borderRadius: '8px',
                        padding: '4px 9px',
                        fontSize: '10px',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <Wallet size={11} strokeWidth={2.4} />
                      <span>Bireysel Bütçe</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Kart İçerik Gövdesi */}
              <div style={{ padding: '16px' }}>
                {/* Ana Bakiye / Durum Göstergesi */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      {totalAllocated > 0 ? 'Kalan Bütçe' : 'Toplam Harcama'}
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '900',
                      color: totalAllocated > 0 ? (remaining >= 0 ? '#0f172a' : '#dc2626') : '#D7147A',
                      letterSpacing: '-0.4px',
                      marginTop: '2px',
                      lineHeight: 1.1
                    }}>
                      {totalAllocated > 0 ? formatAmount(remaining) : formatAmount(totalSpent)}
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#D7147A', marginLeft: '5px' }}>
                        {getCurrencySymbol(activeBudget?.currency)}
                      </span>
                    </div>
                    {totalAllocated > 0 && remaining < 0 && (
                      <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: '700', marginTop: '2px' }}>
                        ⚠️ Bütçe limiti aşıldı!
                      </div>
                    )}
                  </div>

                  {/* Limit Belirleme veya Harcama Yüzdesi Rozeti */}
                  <div style={{ textAlign: 'right' }}>
                    {totalAllocated > 0 ? (
                      <div style={{
                        background: spentPct > 90 ? '#fef2f2' : '#FDF2F8',
                        border: `1px solid ${spentPct > 90 ? '#fecaca' : '#F9BED8'}`,
                        color: spentPct > 90 ? '#dc2626' : '#D7147A',
                        padding: '4px 9px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '800'
                      }}>
                        %{spentPct} Harcandı
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleOpenEditLimit}
                        style={{
                          background: '#FDF2F8',
                          border: '1px solid #F9BED8',
                          color: '#D7147A',
                          padding: '5px 10px',
                          borderRadius: '8px',
                          fontSize: '10.5px',
                          fontWeight: '800',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <Pencil size={11} strokeWidth={2.4} /> Limit Belirle
                      </button>
                    )}
                  </div>
                </div>

                {/* İlerleme Çubuğu */}
                {totalAllocated > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{
                      width: '100%',
                      height: '7px',
                      background: '#f1f5f9',
                      borderRadius: '999px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${spentPct}%`,
                        height: '100%',
                        background: spentPct > 90 ? '#dc2626' : 'linear-gradient(90deg, #D7147A 0%, #B01064 100%)',
                        borderRadius: '999px',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                )}

                {/* 3'lü Özet İstatistik Kutuları */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  background: '#f8fafc',
                  padding: '10px',
                  borderRadius: '14px',
                  border: '1px solid #f1f5f9',
                  marginBottom: '14px'
                }}>
                  {/* Hedef Bütçe */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: '700' }}>Hedef</span>
                      <button
                        type="button"
                        onClick={handleOpenEditLimit}
                        title="Hedef Belirle / Güncelle"
                        style={{ background: 'none', border: 'none', color: '#D7147A', cursor: 'pointer', padding: 0, display: 'flex' }}
                      >
                        <Pencil size={9} strokeWidth={2.4} />
                      </button>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {totalAllocated > 0 ? formatCurrency(totalAllocated, activeBudget?.currency) : 'Belirlenmedi'}
                    </div>
                  </div>

                  {/* Harcanan */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '9.5px', color: '#dc2626', fontWeight: '700', marginBottom: '2px' }}>
                      Harcanan
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#dc2626', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {formatCurrency(totalSpent, activeBudget?.currency)}
                    </div>
                  </div>

                  {/* Kalan */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '9.5px', color: remaining >= 0 ? '#16a34a' : '#dc2626', fontWeight: '700', marginBottom: '2px' }}>
                      Kalan
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: remaining >= 0 ? '#16a34a' : '#dc2626', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {formatCurrency(remaining, activeBudget?.currency)}
                    </div>
                  </div>
                </div>

                {/* Ana Aksiyon: + Masraf Ekle Butonu */}
                <button
                  type="button"
                  onClick={handleOpenAddExpense}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                    color: '#ffffff',
                    fontSize: '12.5px',
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
                  <Plus size={16} strokeWidth={2.4} /> <span>Masraf Ekle</span>
                </button>

                {/* Masrafı Arkadaşlarınla Bölüş Butonu */}
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      setShowSharedBudgetModal(true);
                      return;
                    }
                    navigate(`/individual/budget/shared?budgetId=${activeBudget.id}`);
                  }}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '9.5px 12px',
                    borderRadius: '11px',
                    border: '1.2px solid #F9BED8',
                    background: 'linear-gradient(135deg, #FDF2F8 0%, #ffffff 100%)',
                    color: '#D7147A',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(215, 20, 122, 0.08)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#FCE7F3';
                    e.currentTarget.style.transform = 'scale(1.01)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #FDF2F8 0%, #ffffff 100%)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Users size={14} strokeWidth={2.4} /> <span>Masrafı Arkadaşlarınla Bölüş</span>
                </button>
              </div>
            </div>
          )}

          {/* HESAPLAŞMA & BORÇ-ALACAK MATRİSİ KARTI (Sadece arkadaş eklendiğinde gösterilir) */}
          {activeBudget?.members && activeBudget.members.length > 1 && (
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1.2px solid #F9BED8',
              boxShadow: '0 4px 20px -2px rgba(215, 20, 122, 0.06)',
              padding: '16px',
              marginTop: '16px'
            }}>
              {/* Kart Üst Başlık */}
              <div style={{
                marginBottom: '12px',
                paddingBottom: '10px',
                borderBottom: '1px solid #f8fafc'
              }}>
                <h3 style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.2px' }}>
                  Hesaplaşma & Borç-Alacak Matrisi
                </h3>
                <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px' }}>
                  Otomatik hesaplanan kişi bazlı bakiye ve ödemeler
                </div>
              </div>

              {/* Kişi Bazlı Net Bakiye Kartları */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '8px',
                marginBottom: '12px'
              }}>
                {Object.entries(settlementResult.netBalances || {}).map(([name, balance]) => {
                  const isCreditor = balance > 0.01;
                  const isDebtor = balance < -0.01;
                  const isSelf = name === user?.name;

                  return (
                    <div
                      key={name}
                      style={{
                        background: isCreditor ? '#f0fdf4' : (isDebtor ? '#fef2f2' : '#f8fafc'),
                        borderRadius: '12px',
                        padding: '9px 10px',
                        border: `1.2px solid ${isCreditor ? '#bbf7d0' : (isDebtor ? '#fecaca' : '#e2e8f0')}`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {renderSettlementAvatar(name, 20)}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {name} {isSelf ? '(Siz)' : ''}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '4px' }}>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '900',
                          color: isCreditor ? '#16a34a' : (isDebtor ? '#dc2626' : '#64748b'),
                          letterSpacing: '-0.3px'
                        }}>
                          {isCreditor ? `+${formatAmount(balance)}` : formatAmount(balance)}
                          <span style={{ fontSize: '10px', fontWeight: '800', marginLeft: '2px' }}>
                            {getCurrencySymbol(activeBudget?.currency)}
                          </span>
                        </div>

                        <div style={{
                          fontSize: '8.5px',
                          fontWeight: '800',
                          padding: '1px 5px',
                          borderRadius: '5px',
                          background: isCreditor ? '#dcfce7' : (isDebtor ? '#fee2e2' : '#e2e8f0'),
                          color: isCreditor ? '#15803d' : (isDebtor ? '#b91c1c' : '#475569')
                        }}>
                          {isCreditor ? 'Alacaklı' : (isDebtor ? 'Borçlu' : 'Dengede')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Akıllı Transfer / Hesap Kapatma Önerileri */}
              <div style={{
                background: '#fffbf7',
                borderRadius: '12px',
                border: '1.2px solid #F9BED8',
                padding: '9px 12px'
              }}>
                {settlementResult.settlements.length === 0 ? (
                  <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', lineHeight: '1.4' }}>
                    Tüm hesaplar tam dengede. Şu an ödenmesi gereken bir borç bulunmuyor.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {settlementResult.settlements.map((s, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#ffffff',
                          padding: '8px 10px',
                          borderRadius: '10px',
                          border: '1px solid #F9BED8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          boxShadow: '0 1px 3px rgba(215, 20, 122, 0.05)'
                        }}
                      >
                        {/* Borçlu */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                          {renderSettlementAvatar(s.from, 18)}
                          <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#dc2626', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {s.from}
                          </span>
                        </div>

                        {/* Ok & Tutar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                          <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '600' }}>ödemeli</span>
                          <div style={{
                            background: '#FDF2F8',
                            border: '1px solid #F9BED8',
                            color: '#D7147A',
                            padding: '1.5px 6px',
                            borderRadius: '6px',
                            fontSize: '10.5px',
                            fontWeight: '900'
                          }}>
                            {formatAmount(s.amount)} {getCurrencySymbol(s.currency)}
                          </div>
                          <ArrowRight size={12} color="#D7147A" strokeWidth={2.4} />
                        </div>

                        {/* Alacaklı */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#16a34a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {s.to}
                          </span>
                          {renderSettlementAvatar(s.to, 20)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Harcama Hareketleri Kartı */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1.2px solid #F9BED8',
            boxShadow: '0 4px 20px -2px rgba(215, 20, 122, 0.06)',
            padding: '16px',
            marginTop: '16px'
          }}>
            {/* Kart Üst Başlık Şeridi */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              paddingBottom: '12px',
              borderBottom: '1px solid #f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: '#FDF2F8',
                  color: '#D7147A',
                  border: '1px solid #F9BED8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Receipt size={17} strokeWidth={2.4} />
                </div>
                <div>
                  <h3 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.2px' }}>
                    Harcama Hareketleri
                  </h3>
                  <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '1px' }}>
                    Bu seyahat için kaydedilen harcamalar
                  </div>
                </div>
              </div>

              {/* Sağ: Sayaç Rozeti */}
              <div style={{
                background: '#FDF2F8',
                border: '1px solid #F9BED8',
                borderRadius: '8px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: '800',
                color: '#D7147A'
              }}>
                {budgetExpenses.length} Harcama
              </div>
            </div>

            {/* Harcama Kalemleri Listesi */}
            {budgetExpenses.length === 0 ? (
              <div style={{
                padding: '24px 16px',
                textAlign: 'center',
                borderRadius: '14px',
                background: '#fffbf7',
                border: '1.2px dashed #F9BED8'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: '#FDF2F8',
                  color: '#D7147A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px'
                }}>
                  <Receipt size={20} />
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f172a', marginBottom: '3px' }}>
                  Henüz Harcama Kaydı Yok
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '300px', margin: '0 auto 12px', lineHeight: 1.4 }}>
                  Yukarıdaki "+ Masraf Ekle" butonuna basarak bu seyahate ait ilk harcamanızı kaydedebilirsiniz.
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddExpense}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                    color: '#ffffff',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 8px rgba(215, 20, 122, 0.25)'
                  }}
                >
                  <Plus size={14} strokeWidth={2.4} /> <span>Hemen Masraf Ekle</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {budgetExpenses.map(exp => (
                  <SwipeableExpenseItem
                    key={exp.id}
                    exp={exp}
                    activeBudget={activeBudget}
                    setViewingReceiptImage={setViewingReceiptImage}
                    onDelete={(id) => setDeletingExpenseId(id)}
                    onEdit={handleOpenEditExpense}
                  />
                ))}
              </div>
            )}
          </div>
          </div>
        )}
      </div>
    )}

      {/* Guest Login Required Modal */}
      {showLoginModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white', borderRadius: '24px', width: '100%', maxWidth: '380px',
            padding: '24px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              width: '54px', height: '54px', borderRadius: '18px', background: '#FDF2F8',
              color: '#D7147A', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Wallet size={28} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
              Kayıt İçin Giriş Gerekli
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.5, margin: '0 0 20px' }}>
              Seyahat bütçenizi belirlemek, harcamalarınızı kaydetmek ve tüm cihazlarınızdan takip etmek için lütfen giriş yapın veya ücretsiz hesap oluşturun.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  width: '100%', padding: '12px', borderRadius: '14px', border: 'none',
                  background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                  color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(215, 20, 122, 0.25)'
                }}
              >
                Giriş Yap / Üye Ol
              </button>
              <button
                onClick={() => setShowLoginModal(false)}
                style={{
                  width: '100%', padding: '10px', borderRadius: '14px', border: '1px solid #e2e8f0',
                  background: 'white', color: '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Shared Budget Restricted Modal */}
      {showSharedBudgetModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white', borderRadius: '24px', width: '100%', maxWidth: '380px',
            padding: '24px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              width: '54px', height: '54px', borderRadius: '18px', background: '#FDF2F8',
              color: '#D7147A', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Users size={28} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
              Ortak Bütçe İçin Giriş Yapmalısınız
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.5, margin: '0 0 20px' }}>
              Seyahat masraflarınızı arkadaşlarınızla bölüşmek, ortak bütçe davetiyesi göndermek ve harcama takaslarını (kim kime borçlu) otomatik hesaplamak için lütfen giriş yapın veya ücretsiz kayıt olun.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  width: '100%', padding: '12px', borderRadius: '14px', border: 'none',
                  background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                  color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(215, 20, 122, 0.25)'
                }}
              >
                Giriş Yap / Üye Ol
              </button>
              <button
                onClick={() => setShowSharedBudgetModal(false)}
                style={{
                  width: '100%', padding: '10px', borderRadius: '14px', border: '1px solid #e2e8f0',
                  background: 'white', color: '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

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
        title="Masrafı Sil"
        message="Bu harcama kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
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
