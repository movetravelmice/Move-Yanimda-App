import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, ChevronDown } from 'lucide-react';

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const WEEKDAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

/**
 * Format YYYY-MM-DD to DD.MM.YYYY
 */
export const formatDisplayDate = (dStr) => {
  if (!dStr) return '';
  const parts = dStr.split('-');
  if (parts.length === 3) {
    const day = parts[2].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[0];
    return `${day}.${month}.${year}`;
  }
  return dStr;
};

/**
 * Format Date object to YYYY-MM-DD
 */
const toDateString = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CustomDatePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Tarih seçin',
  required = false,
  align = 'left', // 'left' | 'right'
  companionDate = null, // e.g. Start date when this is End date, or vice versa
  isEndDate = false,
  triggerStyle = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse initial view year and month from value, minDate, or today
  const getInitialView = () => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m)) return { year: y, month: m - 1 };
    }
    if (minDate) {
      const [y, m] = minDate.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m)) return { year: y, month: m - 1 };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  };

  const [viewDate, setViewDate] = useState(getInitialView);

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        setViewDate({ year: y, month: m - 1 });
      }
    }
  }, [value]);

  // Click outside to close (supporting mouse and touch)
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Navigate months
  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(prev => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(prev => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  };

  // Build calendar matrix (Monday-first)
  const { year, month } = viewDate;
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Monday as 0, Sunday as 6
  const startDayCol = (firstDayOfMonth + 6) % 7;
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const daysList = [];

  // Previous month trailing days
  for (let i = startDayCol - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevMonthIdx = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysList.push({ dayNumber: d, isCurrentMonth: false, dateStr });
  }

  // Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysList.push({ dayNumber: d, isCurrentMonth: true, dateStr });
  }

  // Next month leading days (fill up to 35 or 42 grid cells)
  const remainingCells = (7 - (daysList.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonthIdx = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateStr = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysList.push({ dayNumber: d, isCurrentMonth: false, dateStr });
  }

  const todayStr = toDateString(new Date());

  const handleSelectDate = (dateStr) => {
    if (minDate && dateStr < minDate) return;
    if (maxDate && dateStr > maxDate) return;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  const handleSetToday = (e) => {
    e.stopPropagation();
    if (minDate && todayStr < minDate) return;
    if (maxDate && todayStr > maxDate) return;
    const now = new Date();
    setViewDate({ year: now.getFullYear(), month: now.getMonth() });
    onChange(todayStr);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', zIndex: isOpen ? 70 : 1 }}>
      {label && (
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '11px',
          fontWeight: '700',
          color: '#334155',
          marginBottom: '4px'
        }}>
          <span>{label} {required && <span style={{ color: '#ef4444' }}>*</span>}</span>
        </label>
      )}

      {/* Trigger Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff',
          border: isOpen ? '1.5px solid #D7147A' : '1.5px solid #e2e8f0',
          borderRadius: '10px',
          padding: '0 10px',
          height: '38px',
          cursor: 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(215, 20, 122, 0.08)' : 'none',
          transition: 'all 0.15s ease',
          userSelect: 'none',
          boxSizing: 'border-box',
          ...triggerStyle
        }}
        onMouseEnter={e => {
          if (!isOpen) e.currentTarget.style.borderColor = '#F9BED8';
        }}
        onMouseLeave={e => {
          if (!isOpen) e.currentTarget.style.borderColor = '#e2e8f0';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0, flex: 1 }}>
          <Calendar size={14} color="#D7147A" strokeWidth={2.2} style={{ flexShrink: 0 }} />
          <span style={{
            fontSize: '12px',
            fontWeight: value ? '700' : '500',
            color: value ? '#0f172a' : '#94a3b8',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {value ? formatDisplayDate(value) : placeholder}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                padding: 0,
                transition: 'background 0.15s ease, color 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#fee2e2';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.color = '#64748b';
              }}
              title="Tarihi Temizle"
            >
              <X size={11} strokeWidth={2.5} />
            </button>
          )}
          <ChevronDown 
            size={14} 
            color={isOpen ? '#D7147A' : '#94a3b8'} 
            strokeWidth={2.3} 
            style={{ 
              transition: 'transform 0.2s ease, color 0.15s ease', 
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' 
            }} 
          />
        </div>
      </div>

      {/* Styled Calendar Popup */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          [align === 'right' ? 'right' : 'left']: 0,
          width: '272px',
          maxWidth: 'calc(100vw - 36px)',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1.2px solid #F9BED8',
          boxShadow: '0 16px 36px -6px rgba(15, 23, 42, 0.2), 0 2px 10px rgba(215, 20, 122, 0.08)',
          zIndex: 1050,
          padding: '12px',
          animation: 'dropdownFadeIn 0.16s ease-out'
        }}>
          {/* Header Month / Year & Arrows */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px'
          }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                background: '#FDF2F8',
                border: '1px solid #F9BED8',
                borderRadius: '8px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#D7147A',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#FCE7F3';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#FDF2F8';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <ChevronLeft size={16} strokeWidth={2.4} />
            </button>

            <span style={{
              fontSize: '13px',
              fontWeight: '800',
              color: '#0f172a',
              letterSpacing: '-0.2px'
            }}>
              {MONTH_NAMES[month]} {year}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                background: '#FDF2F8',
                border: '1px solid #F9BED8',
                borderRadius: '8px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#D7147A',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#FCE7F3';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#FDF2F8';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <ChevronRight size={16} strokeWidth={2.4} />
            </button>
          </div>

          {/* Weekday Names */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '2px',
            marginBottom: '5px',
            textAlign: 'center'
          }}>
            {WEEKDAY_NAMES.map((name, idx) => (
              <div
                key={idx}
                style={{
                  fontSize: '9.5px',
                  fontWeight: '800',
                  color: idx >= 5 ? '#D7147A' : '#94a3b8',
                  padding: '3px 0',
                  textTransform: 'uppercase'
                }}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '3px',
            textAlign: 'center'
          }}>
            {daysList.map(({ dayNumber, isCurrentMonth, dateStr }, idx) => {
              const isSelected = value === dateStr;
              const isToday = todayStr === dateStr;
              const isDisabled = (minDate && dateStr < minDate) || (maxDate && dateStr > maxDate);

              // Range preview highlighting
              const isInRange = (() => {
                if (!companionDate || !value) return false;
                const [start, end] = isEndDate
                  ? [companionDate, value]
                  : [value, companionDate];
                return dateStr > start && dateStr < end;
              })();

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDate(dateStr)}
                  style={{
                    height: '30px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isToday && !isSelected ? '1px solid #F9BED8' : 'none',
                    borderRadius: isSelected ? '9px' : '8px',
                    fontSize: '11px',
                    fontWeight: isSelected ? '800' : (isCurrentMonth ? '600' : '400'),
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    background: isSelected
                      ? 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)'
                      : isInRange
                        ? '#FDF2F8'
                        : isToday
                          ? '#fff5f9'
                          : 'transparent',
                    color: isSelected
                      ? '#ffffff'
                      : isDisabled
                        ? '#cbd5e1'
                        : isCurrentMonth
                          ? '#1e293b'
                          : '#94a3b8',
                    boxShadow: isSelected ? '0 2px 8px rgba(215, 20, 122, 0.32)' : 'none',
                    transition: 'all 0.12s ease',
                    position: 'relative',
                    padding: 0
                  }}
                  onMouseEnter={e => {
                    if (!isSelected && !isDisabled) {
                      e.currentTarget.style.background = '#FDF2F8';
                      e.currentTarget.style.color = '#D7147A';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected && !isDisabled) {
                      e.currentTarget.style.background = isInRange ? '#FDF2F8' : (isToday ? '#fff5f9' : 'transparent');
                      e.currentTarget.style.color = isCurrentMonth ? '#1e293b' : '#94a3b8';
                    }
                  }}
                >
                  <span>{dayNumber}</span>
                  {isToday && !isSelected && (
                    <span style={{
                      position: 'absolute',
                      bottom: '2px',
                      width: '3.5px',
                      height: '3.5px',
                      borderRadius: '50%',
                      background: '#D7147A'
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Footer: Temizle & Bugün */}
          <div style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '3px 8px',
                fontSize: '10.5px',
                fontWeight: '700',
                color: '#94a3b8',
                cursor: 'pointer',
                borderRadius: '6px',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
            >
              Temizle
            </button>

            <button
              type="button"
              onClick={handleSetToday}
              style={{
                background: '#FDF2F8',
                border: '1px solid #F9BED8',
                padding: '4px 10px',
                fontSize: '10.5px',
                fontWeight: '800',
                color: '#D7147A',
                cursor: 'pointer',
                borderRadius: '7px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#FCE7F3';
                e.currentTarget.style.transform = 'scale(1.03)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#FDF2F8';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Bugün
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
