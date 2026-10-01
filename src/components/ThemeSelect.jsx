import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function ThemeSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Seçiniz...',
  icon = null,
  disabled = false,
  style = {},
  triggerStyle = {},
  menuStyle = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);

  // Normalize options
  const normalizedOptions = options.map((opt, idx) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt, key: `${opt}-${idx}` };
    }
    return { ...opt, key: `${opt.value}-${idx}` };
  });

  const selectedOption = normalizedOptions.find(opt => opt.value === value) || null;

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'relative', 
        width: '100%', 
        userSelect: 'none',
        ...style 
      }}
    >
      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => !disabled && setIsHovered(false)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        style={{
          width: '100%',
          padding: '11px 18px 11px 14px',
          borderRadius: '14px',
          border: isOpen 
            ? '1.8px solid #D7147A' 
            : (isHovered ? '1.5px solid #E54B98' : '1.3px solid #F9BED8'),
          background: disabled 
            ? '#f1f5f9' 
            : (isOpen ? '#ffffff' : (isHovered ? '#fff5f9' : '#ffffff')),
          boxShadow: isOpen 
            ? '0 0 0 3px rgba(215, 20, 122, 0.15), 0 4px 12px rgba(215, 20, 122, 0.08)' 
            : (isHovered ? '0 2px 8px rgba(215, 20, 122, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          ...triggerStyle
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          {icon && (
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: '#D7147A' }}>
              {icon}
            </div>
          )}
          {selectedOption ? (
            <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {selectedOption.icon && (
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '7px',
                  background: '#FDF2F8',
                  border: '1px solid #F9BED8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  flexShrink: 0
                }}>
                  {selectedOption.icon}
                </div>
              )}
              <span style={{ 
                fontSize: '12.5px', 
                fontWeight: '700', 
                color: '#0f172a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {selectedOption.label}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: '500' }}>
              {placeholder}
            </span>
          )}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '26px',
          height: '26px',
          borderRadius: '8px',
          background: isOpen ? '#FCE7F3' : (isHovered ? '#FDF2F8' : 'transparent'),
          transition: 'all 0.18s ease',
          flexShrink: 0
        }}>
          <ChevronDown 
            size={16} 
            color="#D7147A" 
            strokeWidth={2.4}
            style={{ 
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
            }} 
          />
        </div>
      </div>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          className="theme-select-scrollbar"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 99999,
            background: '#ffffff',
            border: '1.5px solid #F9BED8',
            borderRadius: '14px',
            boxShadow: '0 14px 34px rgba(215, 20, 122, 0.16), 0 4px 14px rgba(15, 23, 42, 0.08)',
            padding: '6px',
            maxHeight: '260px',
            overflowY: 'auto',
            animation: 'dropdownFadeIn 0.16s ease-out',
            ...menuStyle
          }}
        >
          {normalizedOptions.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
              Seçenek bulunamadı
            </div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.key}
                  onClick={() => handleSelect(opt.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    marginBottom: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    cursor: 'pointer',
                    background: isSelected 
                      ? 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)' 
                      : 'transparent',
                    border: isSelected ? '1px solid #F9BED8' : '1px solid transparent',
                    color: isSelected ? '#B01064' : '#1e293b',
                    fontSize: '12.5px',
                    fontWeight: isSelected ? '700' : '600',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = '#FDF2F8';
                      e.currentTarget.style.color = '#D7147A';
                      e.currentTarget.style.transform = 'translateX(2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#1e293b';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                    {opt.icon && (
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: isSelected ? '#ffffff' : '#FDF2F8',
                        border: isSelected ? '1px solid #F9BED8' : '1px solid #FCE7F3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        flexShrink: 0
                      }}>
                        {opt.icon}
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ 
                        lineHeight: 1.3, 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis' 
                      }}>
                        {opt.label}
                      </div>
                      {opt.subtitle && (
                        <div style={{ fontSize: '10.5px', color: isSelected ? '#D7147A' : '#64748b', marginTop: '1px' }}>
                          {opt.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{
                      width: '19px',
                      height: '19px',
                      borderRadius: '50%',
                      background: '#D7147A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 5px rgba(215, 20, 122, 0.3)'
                    }}>
                      <Check size={11} color="#ffffff" strokeWidth={3} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
