import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

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
  isEndDate = false
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

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
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
    <div ref={containerRef} style={{ position: 'relative', width: '100%', zIndex: isOpen ? 60 : 1 }}>
      {label && (
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '11px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '5px'
        }}>
          <Calendar size={13} color="#D7147A" />
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
          border: isOpen ? '1.5px solid #D7147A' : '1.2px solid #cbd5e1',
          borderRadius: '11px',
          padding: '0 10px',
          height: '38px',
          cursor: 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(215, 20, 122, 0.12)' : '0 1px 3px rgba(0,0,0,0.02)',
          transition: 'all 0.15s ease',
          userSelect: 'none'
        }}
      >
        <span style={{
          fontSize: '11.5px',
          fontWeight: value ? '700' : '500',
          color: value ? '#0f172a' : '#94a3b8'
        }}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                padding: 0
              }}
              title="Tarihi Temizle"
            >
              <X size={11} />
            </button>
          )}
          <Calendar size={14} color={isOpen ? '#D7147A' : '#D7147A'} />
        </div>
      </div>

      {/* Styled Calendar Popup */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          [align === 'right' ? 'right' : 'left']: 0,
          width: '265px',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1.2px solid #F9BED8',
          boxShadow: '0 16px 36px -6px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(215, 20, 122, 0.08)',
          zIndex: 1050,
          padding: '12px',
          animation: 'scaleIn 0.15s ease-out'
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
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#475569',
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
            >
              <ChevronLeft size={15} />
            </button>

            <span style={{
              fontSize: '12.5px',
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
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#475569',
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
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Weekday Names */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '2px',
            marginBottom: '4px',
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
            gap: '2px',
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
                    height: '29px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    borderRadius: isSelected ? '9px' : '7px',
                    fontSize: '11px',
                    fontWeight: isSelected ? '800' : (isCurrentMonth ? '600' : '400'),
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    background: isSelected
                      ? 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)'
                      : isInRange
                        ? '#FDF2F8'
                        : 'transparent',
                    color: isSelected
                      ? '#ffffff'
                      : isDisabled
                        ? '#cbd5e1'
                        : isCurrentMonth
                          ? '#1e293b'
                          : '#94a3b8',
                    boxShadow: isSelected ? '0 2px 8px rgba(215, 20, 122, 0.35)' : 'none',
                    transition: 'all 0.1s ease',
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
                      e.currentTarget.style.background = isInRange ? '#FDF2F8' : 'transparent';
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
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: '700',
                color: '#94a3b8',
                cursor: 'pointer',
                borderRadius: '5px'
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
                padding: '3px 8px',
                fontSize: '10px',
                fontWeight: '800',
                color: '#D7147A',
                cursor: 'pointer',
                borderRadius: '6px'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#FCE7F3'}
              onMouseLeave={e => e.currentTarget.style.background = '#FDF2F8'}
            >
              Bugün
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
