import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  Luggage, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Loader2,
  Copy,
  Search,
  Globe,
  Sun,
  Briefcase,
  Compass,
  Users,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCheck,
  Bot,
  ArrowRight,
  Filter,
  CheckCircle2,
  Calendar,
  Sparkle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useIndividualStore, DEFAULT_CHECKLIST_TEMPLATES } from '../../store/individualStore';
import GuestNoticeBanner from '../../components/GuestNoticeBanner';
import ThemeSelect from '../../components/ThemeSelect';

// Category theme definitions
const CATEGORY_THEMES = {
  'Genel': {
    label: 'Yurt Dışı & Genel',
    color: '#B01064',
    bg: '#FDF2F8',
    border: '#F9BED8',
    badge: '✈️ Yurt Dışı',
    icon: Globe
  },
  'Tatil': {
    label: 'Plaj & Deniz Tatili',
    color: '#B01064',
    bg: '#FDF2F8',
    border: '#F9BED8',
    badge: '🏖️ Tatil',
    icon: Sun
  },
  'İş': {
    label: 'İş Seyahati',
    color: '#B01064',
    bg: '#FDF2F8',
    border: '#F9BED8',
    badge: '💼 İş',
    icon: Briefcase
  },
  'Hafta Sonu': {
    label: 'Hafta Sonu Kaçamağı',
    color: '#B01064',
    bg: '#FDF2F8',
    border: '#F9BED8',
    badge: '🎒 Hafta Sonu',
    icon: Compass
  },
  'Aile': {
    label: 'Çocuklu Seyahat',
    color: '#B01064',
    bg: '#FDF2F8',
    border: '#F9BED8',
    badge: '👶 Aile',
    icon: Users
  },
  'Özel': {
    label: 'Özel Liste',
    color: '#B01064',
    bg: '#FDF2F8',
    border: '#F9BED8',
    badge: '📋 Özel',
    icon: CheckSquare
  }
};

// Preset AI smart packing templates
const AI_PRESET_PACKING_LISTS = [
  {
    id: 'ai_winter_ski',
    icon: '⛷️',
    title: 'Kış & Kayak Tatili',
    category: 'Tatil',
    description: 'Soğuk hava, kayak merkezi ve kış seyahatleri için temel ekipmanlar',
    items: [
      'Termal içlik (Üst & Alt 2 takım)',
      'Su geçirmez kayak montu & pantolonu',
      'Kayak gözlüğü (UV korumalı & buğu yapmayan)',
      'Su geçirmez kayak eldiveni & polar bere',
      'Yün veya termal kayak çorapları (3 çift)',
      'Dudak koruyucu balm (SPF korumalı)',
      'Soğuk hava yüz koruyucu krem',
      'Boyunluk / Balaklava',
      'Hızlı kuruyan polar hırka',
      'Kar botu / Su geçirmez kışlık ayakkabı'
    ]
  },
  {
    id: 'ai_euro_city',
    icon: '🏛️',
    title: 'Avrupa Şehir & Kültür Keşfi',
    category: 'Genel',
    description: 'Yoğun yürüyüşlü ve müzeli şehir turları için hafif & pratik liste',
    items: [
      'Ergonomik ortopedik yürüyüş ayakkabısı',
      'Hırsızlık önleyici çapraz omuz çantası',
      'Yüksek kapasiteli hızlı powerbank (20.000 mAh)',
      'Priz dönüştürücü adaptör (İngiltere/Avrupa tipi)',
      'Müze kartı veya dijital bilet karekodları',
      'Katlanabilir hafif yağmurluk',
      'Gürültü engelleyici kulaklık (Uçak ve tren için)',
      'Yeniden doldurulabilir hafif su matarası',
      'Küçük sırt çantası (Günlük geziler için)',
      'Acil durum nakit döviz'
    ]
  },
  {
    id: 'ai_camping_nature',
    icon: '🏕️',
    title: 'Kamp & Doğa Yürüyüşü',
    category: 'Hafta Sonu',
    description: 'Doğada çadır veya karavan ile konaklamada hayat kurtaran maddeler',
    items: [
      'Kafa feneri ve yedek piller',
      'Çok amaçlı çakı / İsviçre çakısı',
      'Böcek ve sivrisinek kovucu sprey',
      'İlk yardım & yara bandı çantası',
      'Termos & metal kupa',
      'Hızlı kuruyan mikrofiber havlu',
      'Su geçirmez trekking botu',
      'Rüzgar geçirmez yağmurluk',
      'Çakmak / Magnezyum çubuğu',
      'Biyolojik olarak parçalanabilir ıslak mendil'
    ]
  },
  {
    id: 'ai_cruise_ship',
    icon: '🚢',
    title: 'Gemi & Cruise Seyahati',
    category: 'Tatil',
    description: 'Açık deniz yolculuğu, akşam yemekleri ve liman durakları hazırlığı',
    items: [
      'Kaptan yemeği için şık akşam kıyafeti',
      'Deniz tutmasına karşı bileklik veya ilaç',
      'Liman inişleri için hafif yürüyüş ayakkabısı',
      'Güneş gözlüğü ve şapka',
      'Kart tutucu askılı kılıf (Oda kartı için)',
      'Güneş kremi ve güneş sonrası losyon',
      'Mayo / Pareo ve havuz terliği',
      'Küçük el buharlı ütü veya kırışık giderici sprey',
      'Çoklu USB şarj aleti (Kamara prizleri için)'
    ]
  }
];

// Quick suggestion chips for fast item addition
const QUICK_ITEM_SUGGESTIONS = [
  'Şarj Aleti',
  'Kulaklık',
  'Powerbank',
  'Diş Fırçası',
  'Parfüm',
  'Güneş Gözlüğü',
  'Pasaport',
  'Priz Dönüştürücü',
  'Yedek Çorap',
  'Şemsiye',
  'Ağrı Kesici'
];

export default function Checklists() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const [searchParams] = useSearchParams();
  const preselectedTravelId = searchParams.get('travelId');

  const travels = useIndividualStore(state => state.travels);
  const checklists = useIndividualStore(state => state.checklists);
  const createChecklist = useIndividualStore(state => state.createChecklist);
  const createFromTemplate = useIndividualStore(state => state.createFromTemplate);
  const toggleChecklistItem = useIndividualStore(state => state.toggleChecklistItem);
  const addChecklistItem = useIndividualStore(state => state.addChecklistItem);
  const deleteChecklistItem = useIndividualStore(state => state.deleteChecklistItem);
  const deleteChecklist = useIndividualStore(state => state.deleteChecklist);
  const toggleAllChecklistItems = useIndividualStore(state => state.toggleAllChecklistItems);
  const duplicateChecklist = useIndividualStore(state => state.duplicateChecklist);

  // View & Filter states
  const [activeTab, setActiveTab] = useState('my_lists'); // 'my_lists' or 'templates'
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState('Tümü');
  const [myListsFilter, setMyListsFilter] = useState('all'); // 'all', 'in_progress', 'completed'
  const [searchQuery, setSearchQuery] = useState('');

  // Expand states
  const [expandedListIds, setExpandedListIds] = useState({});
  const [expandedTemplateIds, setExpandedTemplateIds] = useState({});
  const [hideCompletedMap, setHideCompletedMap] = useState({});

  // Inputs & Modals
  const [newItemText, setNewItemText] = useState({});
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(null); // template obj with customizable items
  const [templateSelectedItems, setTemplateSelectedItems] = useState({});
  const [showAiModal, setShowAiModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form states
  const [selectedTravelId, setSelectedTravelId] = useState(preselectedTravelId || '');

  const travelOptions = useMemo(() => [
    { value: '', label: 'Genel / Seyahatsiz Liste', icon: '🌐' },
    ...travels.map(t => ({
      value: t.id,
      label: t.title,
      subtitle: t.destination ? t.destination : (t.startDate ? `${t.startDate} - ${t.endDate}` : undefined),
      icon: '✈️'
    }))
  ], [travels]);
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState('Genel');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Overall Statistics
  const stats = useMemo(() => {
    let totalItems = 0;
    let totalCompleted = 0;
    checklists.forEach(list => {
      const items = list.items || [];
      totalItems += items.length;
      totalCompleted += items.filter(i => i.completed).length;
    });
    const totalPending = totalItems - totalCompleted;
    const overallPct = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
    return { totalItems, totalCompleted, totalPending, overallPct };
  }, [checklists]);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return DEFAULT_CHECKLIST_TEMPLATES.filter(tmpl => {
      const matchesCategory = templateCategoryFilter === 'Tümü' || tmpl.category === templateCategoryFilter;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;
      const matchesSearch = tmpl.title.toLowerCase().includes(q) ||
        (tmpl.description && tmpl.description.toLowerCase().includes(q)) ||
        (tmpl.items && tmpl.items.some(item => item.toLowerCase().includes(q)));
      return matchesCategory && matchesSearch;
    });
  }, [templateCategoryFilter, searchQuery]);

  // Filtered User Lists
  const filteredMyLists = useMemo(() => {
    return checklists.filter(list => {
      const items = list.items || [];
      const completedCount = items.filter(i => i.completed).length;
      const isComplete = items.length > 0 && completedCount === items.length;

      let statusMatch = true;
      if (myListsFilter === 'in_progress') statusMatch = !isComplete;
      if (myListsFilter === 'completed') statusMatch = isComplete;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return statusMatch;

      const matchesSearch = list.title.toLowerCase().includes(q) ||
        (list.category && list.category.toLowerCase().includes(q)) ||
        items.some(i => i.text.toLowerCase().includes(q));

      return statusMatch && matchesSearch;
    });
  }, [checklists, myListsFilter, searchQuery]);

  // Open Template Modal with prefilled checkboxes
  const handleOpenTemplateModal = (tmpl) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    const itemMap = {};
    tmpl.items.forEach((item, idx) => {
      itemMap[idx] = true; // default all checked
    });
    setTemplateSelectedItems(itemMap);
    setShowTemplateModal(tmpl);
    setSelectedTravelId(preselectedTravelId || '');
  };

  // Apply Template with selected items
  const handleApplyTemplate = async () => {
    if (!showTemplateModal) return;
    if (!user) {
      setShowTemplateModal(null);
      setShowLoginModal(true);
      return;
    }

    const selectedItemTexts = showTemplateModal.items.filter((_, idx) => templateSelectedItems[idx]);
    if (selectedItemTexts.length === 0) {
      alert("Lütfen en az bir madde seçin.");
      return;
    }

    setIsSaving(true);
    try {
      const customTmpl = {
        ...showTemplateModal,
        items: selectedItemTexts
      };
      await createFromTemplate(customTmpl, user.id, selectedTravelId || null);
      setShowTemplateModal(null);
      setActiveTab('my_lists');
      showToast(`"${showTemplateModal.title}" listenize başarıyla eklendi! ✨`);
    } catch (e) {
      alert("Hata: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Apply AI Smart Packing Preset
  const handleApplyAiPreset = async (preset) => {
    if (!user) {
      setShowAiModal(false);
      setShowLoginModal(true);
      return;
    }
    setIsSaving(true);
    try {
      await createFromTemplate(preset, user.id, selectedTravelId || null);
      setShowAiModal(false);
      setActiveTab('my_lists');
      showToast(`"${preset.title}" akıllı valiz listeniz oluşturuldu! 🎒`);
    } catch (e) {
      alert("Hata: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Create Custom Checklist
  const handleCreateCustom = async (e) => {
    e.preventDefault();
    if (!customTitle.trim()) return;
    if (!user) {
      setShowAddCustomModal(false);
      setShowLoginModal(true);
      return;
    }
    setIsSaving(true);
    try {
      await createChecklist({
        title: customTitle.trim(),
        userId: user.id,
        travelId: selectedTravelId || null,
        category: customCategory || 'Özel',
        items: []
      });
      setCustomTitle('');
      setShowAddCustomModal(false);
      setActiveTab('my_lists');
      showToast("Özel checklist oluşturuldu! Şimdi maddelerinizi ekleyebilirsiniz.");
    } catch (e) {
      alert("Hata: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Add Item
  const handleAddItem = (checklistId, textToAdd) => {
    const text = (textToAdd || newItemText[checklistId] || '').trim();
    if (!text) return;
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    addChecklistItem(checklistId, text);
    setNewItemText(prev => ({ ...prev, [checklistId]: '' }));
  };

  // Duplicate Checklist
  const handleDuplicate = async (listId) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    try {
      if (duplicateChecklist) {
        await duplicateChecklist(listId, user.id);
        showToast("Liste kopyalandı ve listenize eklendi! 📋");
      }
    } catch (e) {
      alert("Kopyalama hatası: " + e.message);
    }
  };

  return (
    <div style={{ padding: '16px 14px 40px', maxWidth: '640px', margin: '0 auto' }}>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          padding: '10px 18px',
          borderRadius: '24px',
          fontSize: '12.5px',
          fontWeight: '700',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <Sparkle size={14} color="#D7147A" fill="#D7147A" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Guest Notice Banner */}
      <GuestNoticeBanner 
        customTitle="Checklistlerin Kaydedilmesi İçin Giriş Gerekli" 
        customMessage="Oluşturduğunuz veya düzenlediğiniz checklistlerin cihazlarınızda saklanması için lütfen giriş yapın." 
      />

      {/* ========================================================
          1. HERO HEADER CARD (Premium Redesign)
      ======================================================== */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fff5f9 50%, #FDF2F8 100%)',
        borderRadius: '20px',
        border: '1.5px solid #F9BED8',
        padding: '16px 18px',
        marginBottom: '16px',
        boxShadow: '0 8px 24px -4px rgba(215, 20, 122, 0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative glow */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-20px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251, 146, 60, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Top Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
            border: '1.5px solid #F9BED8',
            color: '#D7147A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(215, 20, 122, 0.12)',
            flexShrink: 0
          }}>
            <Luggage size={22} strokeWidth={2.3} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h1 style={{ fontSize: '16.5px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
                Seyahat Checklist
              </h1>
              <span style={{ fontSize: '10px', fontWeight: '800', background: '#FCE7F3', color: '#B01064', padding: '1px 7px', borderRadius: '12px' }}>
                Hazırlık
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', lineHeight: '1.3' }}>
              Valiz ve seyahat evraklarınızı eksiksiz tamamlayın
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          background: '#ffffff',
          borderRadius: '14px',
          padding: '10px 12px',
          border: '1px solid #F9BED8'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Listelerim</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginTop: '1px' }}>
              {checklists.length}
            </div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Hazır Eşyalar</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#16a34a', marginTop: '1px' }}>
              {stats.totalCompleted} <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>/ {stats.totalItems}</span>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Kalan Eşyalar</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: stats.totalPending > 0 ? '#D7147A' : '#16a34a', marginTop: '1px' }}>
              {stats.totalPending}
            </div>
          </div>
        </div>

        {/* Global Progress Bar (if items exist) */}
        {stats.totalItems > 0 && (
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '3px' }}>
              <span>Valiz Hazırlık Durumu</span>
              <span style={{ color: stats.overallPct === 100 ? '#16a34a' : '#D7147A' }}>
                %{stats.overallPct} {stats.overallPct === 100 && '🎉 Hazır!'}
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#FCE7F3', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${stats.overallPct}%`,
                height: '100%',
                background: stats.overallPct === 100 
                  ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' 
                  : 'linear-gradient(90deg, #D7147A 0%, #B01064 100%)',
                borderRadius: '4px',
                transition: 'width 0.35s ease-out'
              }} />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          1.1 HIZLI İŞLEM BUTONLARI KARTI (AI Asistan & Yeni Liste)
      ======================================================== */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #F9BED8',
        boxShadow: '0 2px 6px rgba(215, 20, 122, 0.04)',
        padding: '7px 9px',
        marginBottom: '12px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px'
      }}>
        {/* AI Assistant button */}
        <button
          type="button"
          onClick={() => navigate('/individual/checklists/ai' + (selectedTravelId ? `?travelId=${selectedTravelId}` : ''))}
          title="Akıllı Valiz Asistanı"
          style={{
            height: '35px',
            padding: '0 10px',
            borderRadius: '10px',
            border: '1px solid #F9BED8',
            background: 'linear-gradient(135deg, #ffffff 0%, #FDF2F8 100%)',
            color: '#B01064',
            fontSize: '11.5px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(215, 20, 122, 0.05)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#FCE7F3';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #FDF2F8 100%)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <img 
            src="/tintin-avatar.png" 
            alt="Tintin" 
            style={{ 
              width: '18px', 
              height: '18px', 
              borderRadius: '50%', 
              objectFit: 'cover',
              border: '1px solid #F9BED8'
            }} 
          />
          <span>Tintin Asistan</span>
        </button>

        {/* + Yeni Liste Button */}
        <button
          type="button"
          onClick={() => {
            navigate('/individual/checklists/new' + (selectedTravelId ? `?travelId=${selectedTravelId}` : ''));
          }}
          title="Yeni Liste Ekle"
          style={{
            height: '35px',
            padding: '0 10px',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
            color: '#ffffff',
            fontSize: '11.5px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(215, 20, 122, 0.22)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(215, 20, 122, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(215, 20, 122, 0.22)';
          }}
        >
          <Plus size={15} strokeWidth={2.6} />
          <span>Yeni Liste</span>
        </button>
      </div>

      {/* ========================================================
          2. SEGMENTED TAB SWITCHER
      ======================================================== */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #F9BED8',
        boxShadow: '0 2px 6px rgba(215, 20, 122, 0.04)',
        padding: '7px 9px',
        marginBottom: '14px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px'
      }}>
        {/* Checklistlerim Tab */}
        <button
          onClick={() => setActiveTab('my_lists')}
          style={{
            height: '35px',
            padding: '0 10px',
            borderRadius: '10px',
            border: activeTab === 'my_lists' ? 'none' : '1px solid #F9BED8',
            background: activeTab === 'my_lists' 
              ? 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)' 
              : 'linear-gradient(135deg, #ffffff 0%, #FDF2F8 100%)',
            color: activeTab === 'my_lists' ? '#ffffff' : '#B01064',
            fontSize: '11.5px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: activeTab === 'my_lists' 
              ? '0 2px 8px rgba(215, 20, 122, 0.22)' 
              : '0 1px 3px rgba(215, 20, 122, 0.05)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'my_lists') e.currentTarget.style.background = '#FCE7F3';
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'my_lists') e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #FDF2F8 100%)';
          }}
        >
          <CheckSquare size={14} color={activeTab === 'my_lists' ? '#ffffff' : '#D7147A'} />
          <span>Checklistlerim</span>
          <span style={{
            fontSize: '10px',
            padding: '1px 6px',
            borderRadius: '10px',
            background: activeTab === 'my_lists' ? 'rgba(255, 255, 255, 0.28)' : '#F9BED8',
            color: activeTab === 'my_lists' ? '#ffffff' : '#B01064',
            fontWeight: '800'
          }}>
            {checklists.length}
          </span>
        </button>

        {/* Hazır Şablonlar Tab */}
        <button
          onClick={() => setActiveTab('templates')}
          style={{
            height: '35px',
            padding: '0 10px',
            borderRadius: '10px',
            border: activeTab === 'templates' ? 'none' : '1px solid #F9BED8',
            background: activeTab === 'templates' 
              ? 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)' 
              : 'linear-gradient(135deg, #ffffff 0%, #FDF2F8 100%)',
            color: activeTab === 'templates' ? '#ffffff' : '#B01064',
            fontSize: '11.5px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: activeTab === 'templates' 
              ? '0 2px 8px rgba(215, 20, 122, 0.22)' 
              : '0 1px 3px rgba(215, 20, 122, 0.05)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'templates') e.currentTarget.style.background = '#FCE7F3';
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'templates') e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #FDF2F8 100%)';
          }}
        >
          <Sparkles size={13} color={activeTab === 'templates' ? '#ffffff' : '#D7147A'} />
          <span>Hazır Şablonlar</span>
          <span style={{
            fontSize: '10px',
            padding: '1px 6px',
            borderRadius: '10px',
            background: activeTab === 'templates' ? 'rgba(255, 255, 255, 0.28)' : '#F9BED8',
            color: activeTab === 'templates' ? '#ffffff' : '#B01064',
            fontWeight: '800'
          }}>
            {DEFAULT_CHECKLIST_TEMPLATES.length}
          </span>
        </button>
      </div>

      {/* ========================================================
          3. SEARCH & CATEGORY FILTERS BAR
      ======================================================== */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1.2px solid #F9BED8',
        padding: '10px 12px',
        boxShadow: '0 2px 8px rgba(215, 20, 122, 0.04)',
        marginBottom: '14px'
      }}>
        {/* Search input */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          marginBottom: (activeTab === 'templates' || (activeTab === 'my_lists' && checklists.length > 0)) ? '8px' : '0'
        }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder={activeTab === 'templates' ? "Şablon veya eşya ara (Örn: Pasaport, şarj, vize)..." : "Listelerinizde madde veya başlık arayın..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 34px 9px 34px',
              borderRadius: '10px',
              border: '1.2px solid #F9BED8',
              background: '#fff5f9',
              fontSize: '12px',
              outline: 'none',
              boxSizing: 'border-box',
              color: '#0f172a'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills for Templates */}
        {activeTab === 'templates' && (
          <div style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '2px',
            scrollbarWidth: 'none'
          }}>
            {['Tümü', 'Genel', 'Tatil', 'İş', 'Hafta Sonu', 'Aile'].map((cat) => {
              const isSelected = templateCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setTemplateCategoryFilter(cat)}
                  style={{
                    padding: '5px 11px',
                    borderRadius: '20px',
                    border: isSelected ? '1px solid #D7147A' : '1px solid #F9BED8',
                    background: isSelected ? '#FDF2F8' : '#ffffff',
                    color: isSelected ? '#D7147A' : '#64748b',
                    fontSize: '11px',
                    fontWeight: isSelected ? '800' : '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat === 'Tümü' && '🌟 Tümü'}
                  {cat === 'Genel' && '✈️ Yurt Dışı'}
                  {cat === 'Tatil' && '🏖️ Plaj & Tatil'}
                  {cat === 'İş' && '💼 İş'}
                  {cat === 'Hafta Sonu' && '🎒 Hafta Sonu'}
                  {cat === 'Aile' && '👶 Çocuk & Aile'}
                </button>
              );
            })}
          </div>
        )}

        {/* Filter Pills for My Lists */}
        {activeTab === 'my_lists' && checklists.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setMyListsFilter('all')}
              style={{
                padding: '4px 10px',
                borderRadius: '16px',
                border: myListsFilter === 'all' ? '1px solid #D7147A' : '1px solid #F9BED8',
                background: myListsFilter === 'all' ? '#FDF2F8' : '#ffffff',
                color: myListsFilter === 'all' ? '#D7147A' : '#64748b',
                fontSize: '11px',
                fontWeight: myListsFilter === 'all' ? '800' : '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Tümü ({checklists.length})
            </button>
            <button
              onClick={() => setMyListsFilter('in_progress')}
              style={{
                padding: '4px 10px',
                borderRadius: '16px',
                border: myListsFilter === 'in_progress' ? '1px solid #D7147A' : '1px solid #F9BED8',
                background: myListsFilter === 'in_progress' ? '#FDF2F8' : '#ffffff',
                color: myListsFilter === 'in_progress' ? '#D7147A' : '#64748b',
                fontSize: '11px',
                fontWeight: myListsFilter === 'in_progress' ? '800' : '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Devam Edenler
            </button>
            <button
              onClick={() => setMyListsFilter('completed')}
              style={{
                padding: '4px 10px',
                borderRadius: '16px',
                border: myListsFilter === 'completed' ? '1px solid #16a34a' : '1px solid #F9BED8',
                background: myListsFilter === 'completed' ? '#f0fdf4' : '#ffffff',
                color: myListsFilter === 'completed' ? '#16a34a' : '#64748b',
                fontSize: '11px',
                fontWeight: myListsFilter === 'completed' ? '800' : '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Tamamlananlar
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          TAB 1: CHECKLISTLERİM (User Lists)
      ======================================================== */}
      {activeTab === 'my_lists' && (
        <div>
          {checklists.length === 0 ? (
            /* Empty State */
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1.5px dashed #cbd5e1',
              padding: '40px 20px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
                border: '1.5px solid #F9BED8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
                color: '#D7147A'
              }}>
                <Luggage size={30} />
              </div>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
                Henüz bir seyahat checklist'iniz yok
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 auto 20px', maxWidth: '340px', lineHeight: '1.5' }}>
                Hazır seyahat şablonlarımızdan tek tıkla başlayabilir veya seyahatiniz için tamamen özel bir liste hazırlayabilirsiniz.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActiveTab('templates')}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '12px',
                    border: '1.2px solid #F9BED8',
                    background: '#FDF2F8',
                    color: '#D7147A',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={14} /> Şablonları Keşfet
                </button>
                <button
                  onClick={() => {
                    navigate('/individual/checklists/new' + (selectedTravelId ? `?travelId=${selectedTravelId}` : ''));
                  }}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 3px 10px rgba(215, 20, 122, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={15} strokeWidth={2.4} /> Özel Liste Oluştur
                </button>
              </div>
            </div>
          ) : filteredMyLists.length === 0 ? (
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '30px 16px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '12.5px'
            }}>
              Arama veya filtre kriterlerinize uygun checklist bulunamadı.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredMyLists.map((list) => {
                const isExpanded = expandedListIds[list.id] !== undefined 
                  ? expandedListIds[list.id] 
                  : (checklists.length === 1);
                const isHidingCompleted = Boolean(hideCompletedMap[list.id]);
                const items = list.items || [];
                const completedCount = items.filter(i => i.completed).length;
                const totalCount = items.length;
                const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                const isAllDone = totalCount > 0 && completedCount === totalCount;
                const attachedTravel = travels.find(t => t.id === list.travelId);
                const theme = CATEGORY_THEMES[list.category] || CATEGORY_THEMES['Özel'];
                const CategoryIcon = theme.icon || CheckSquare;

                // Visible items considering hideCompleted
                const displayedItems = isHidingCompleted 
                  ? items.filter(i => !i.completed) 
                  : items;

                return (
                  <div
                    key={list.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '18px',
                      border: isAllDone ? '1.5px solid #86efac' : '1.2px solid #F9BED8',
                      padding: '16px',
                      boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* List Header */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        {/* Title & Status */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                          <h3 style={{
                            fontSize: '15px',
                            fontWeight: '800',
                            color: '#0f172a',
                            margin: 0,
                            letterSpacing: '-0.3px',
                            lineHeight: 1.2
                          }}>
                            {list.title}
                          </h3>

                          {isAllDone && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '800',
                              background: '#dcfce7',
                              color: '#15803d',
                              padding: '2.5px 7px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              flexShrink: 0
                            }}>
                              <CheckCircle2 size={11} strokeWidth={2.5} /> Hazır!
                            </span>
                          )}
                        </div>

                        {/* Header Action Toolbar */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '2px 4px',
                          flexShrink: 0
                        }}>
                          {/* Duplicate Button */}
                          <button
                            type="button"
                            onClick={() => handleDuplicate(list.id)}
                            style={{
                              width: '28px',
                              height: '28px',
                              background: 'transparent',
                              border: 'none',
                              color: '#64748b',
                              cursor: 'pointer',
                              borderRadius: '7px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#FDF2F8';
                              e.currentTarget.style.color = '#D7147A';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#64748b';
                            }}
                            title="Listeyi Kopyala"
                          >
                            <Copy size={13.5} />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(list.id)}
                            style={{
                              width: '28px',
                              height: '28px',
                              background: 'transparent',
                              border: 'none',
                              color: '#64748b',
                              cursor: 'pointer',
                              borderRadius: '7px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#fef2f2';
                              e.currentTarget.style.color = '#ef4444';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#64748b';
                            }}
                            title="Listeyi Sil"
                          >
                            <Trash2 size={13.5} />
                          </button>

                          <div style={{ width: '1px', height: '14px', background: '#cbd5e1', margin: '0 2px' }} />

                          {/* Accordion Toggle */}
                          <button
                            type="button"
                            onClick={() => setExpandedListIds(prev => ({
                              ...prev,
                              [list.id]: isExpanded ? false : true
                            }))}
                            style={{
                              width: '28px',
                              height: '28px',
                              background: isExpanded ? '#FDF2F8' : 'transparent',
                              border: isExpanded ? '1px solid #F9BED8' : '1px solid transparent',
                              color: isExpanded ? '#D7147A' : '#475569',
                              cursor: 'pointer',
                              borderRadius: '7px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                            title={isExpanded ? "Daralt" : "Genişlet"}
                          >
                            {isExpanded ? <ChevronUp size={15} strokeWidth={2.4} /> : <ChevronDown size={15} strokeWidth={2.4} />}
                          </button>
                        </div>
                      </div>

                      {/* Meta: Attached Travel */}
                      {attachedTravel && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: '700',
                            color: '#475569',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            padding: '1.5px 7px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3.5px'
                          }}>
                            <Luggage size={11} color="#D7147A" /> {attachedTravel.title}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar & Sub-toolbar */}
                    <div style={{ marginBottom: isExpanded ? '12px' : '0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b', marginBottom: '5px' }}>
                        <span>
                          <strong>{completedCount}</strong> / {totalCount} eşya hazır
                        </span>
                        <span style={{ fontWeight: '800', color: isAllDone ? '#16a34a' : '#D7147A' }}>
                          %{progressPct}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '7px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${progressPct}%`,
                          height: '100%',
                          background: isAllDone
                            ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                            : 'linear-gradient(90deg, #D7147A 0%, #B01064 100%)',
                          transition: 'width 0.25s ease-out'
                        }} />
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                        {/* List Quick Control Tools */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          marginBottom: '10px',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {/* Toggle All items */}
                            <button
                              type="button"
                              onClick={() => toggleAllChecklistItems(list.id, !isAllDone)}
                              style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                color: '#475569',
                                fontSize: '10.5px',
                                fontWeight: '700',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <CheckCheck size={13} color={isAllDone ? '#16a34a' : '#64748b'} />
                              {isAllDone ? 'Tümünü Sıfırla' : 'Tümünü Hazır Yap'}
                            </button>

                            {/* Hide Completed toggle */}
                            {completedCount > 0 && (
                              <button
                                type="button"
                                onClick={() => setHideCompletedMap(prev => ({
                                  ...prev,
                                  [list.id]: !isHidingCompleted
                                }))}
                                style={{
                                  background: isHidingCompleted ? '#FDF2F8' : '#f8fafc',
                                  border: isHidingCompleted ? '1px solid #F9BED8' : '1px solid #e2e8f0',
                                  color: isHidingCompleted ? '#D7147A' : '#64748b',
                                  fontSize: '10.5px',
                                  fontWeight: '700',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                {isHidingCompleted ? <Eye size={12} /> : <EyeOff size={12} />}
                                {isHidingCompleted ? 'Tamamlananları Göster' : 'Tamamlananları Gizle'}
                              </button>
                            )}
                          </div>

                          <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                            {isHidingCompleted && `${completedCount} hazır eşya gizlendi`}
                          </span>
                        </div>

                        {/* Items list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                          {items.length === 0 ? (
                            <div style={{
                              fontSize: '11.5px',
                              color: '#94a3b8',
                              textAlign: 'center',
                              padding: '16px 0',
                              background: '#f8fafc',
                              borderRadius: '10px',
                              border: '1px dashed #e2e8f0'
                            }}>
                              Bu listede henüz madde yok. Aşağıdaki alandan hızlıca ekleyebilirsiniz.
                            </div>
                          ) : displayedItems.length === 0 && isHidingCompleted ? (
                            <div style={{
                              fontSize: '11.5px',
                              color: '#16a34a',
                              textAlign: 'center',
                              padding: '14px 0',
                              background: '#f0fdf4',
                              borderRadius: '10px',
                              fontWeight: '600'
                            }}>
                              Tüm eşyalar hazırlandı! 🎉
                            </div>
                          ) : (
                            displayedItems.map(item => (
                              <div
                                key={item.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '8px 10px',
                                  borderRadius: '10px',
                                  background: item.completed ? '#f8fafc' : '#ffffff',
                                  border: `1.2px solid ${item.completed ? '#e2e8f0' : '#f1f5f9'}`,
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <div
                                  onClick={() => toggleChecklistItem(list.id, item.id)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    flex: 1,
                                    cursor: 'pointer',
                                    minWidth: 0
                                  }}
                                >
                                  {/* Custom Checkbox */}
                                  <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '6px',
                                    border: `1.8px solid ${item.completed ? '#16a34a' : '#cbd5e1'}`,
                                    background: item.completed ? '#16a34a' : '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ffffff',
                                    flexShrink: 0,
                                    transition: 'all 0.15s ease'
                                  }}>
                                    {item.completed && <Check size={13} strokeWidth={3.2} />}
                                  </div>

                                  <span style={{
                                    fontSize: '12.5px',
                                    fontWeight: item.completed ? '500' : '600',
                                    color: item.completed ? '#94a3b8' : '#1e293b',
                                    textDecoration: item.completed ? 'line-through' : 'none',
                                    lineHeight: '1.35',
                                    wordBreak: 'break-word'
                                  }}>
                                    {item.text}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => deleteChecklistItem(list.id, item.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#cbd5e1',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px'
                                  }}
                                  title="Maddeyi Sil"
                                  onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                  onMouseLeave={(e) => e.currentTarget.style.color = '#cbd5e1'}
                                >
                                  <X size={15} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Quick Suggestion Chips */}
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
                            Hızlı Eşya Ekle:
                          </div>
                          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
                            {QUICK_ITEM_SUGGESTIONS.map((sug, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleAddItem(list.id, sug)}
                                style={{
                                  background: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  color: '#475569',
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  padding: '2px 7px',
                                  borderRadius: '12px',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#FDF2F8';
                                  e.currentTarget.style.borderColor = '#F9BED8';
                                  e.currentTarget.style.color = '#D7147A';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#f8fafc';
                                  e.currentTarget.style.borderColor = '#e2e8f0';
                                  e.currentTarget.style.color = '#475569';
                                }}
                              >
                                + {sug}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Add new item input bar */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            placeholder="Yeni madde yazın (Örn: Şarj aleti)..."
                            value={newItemText[list.id] || ''}
                            onChange={e => setNewItemText({ ...newItemText, [list.id]: e.target.value })}
                            onKeyDown={e => { if (e.key === 'Enter') handleAddItem(list.id); }}
                            style={{
                              flex: 1,
                              height: '34px',
                              padding: '0 12px',
                              borderRadius: '10px',
                              border: '1.2px solid #e2e8f0',
                              background: '#f8fafc',
                              fontSize: '11.5px',
                              fontWeight: '500',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleAddItem(list.id)}
                            title="Madde Ekle"
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '10px',
                              border: 'none',
                              background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                              color: '#ffffff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              boxShadow: '0 2px 6px rgba(215, 20, 122, 0.22)',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            <Plus size={16} strokeWidth={2.6} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: HAZIR ŞABLONLAR (Ready Templates - Redesigned)
      ======================================================== */}
      {activeTab === 'templates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredTemplates.length === 0 ? (
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '30px 16px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '12.5px'
            }}>
              Aramanıza uygun şablon bulunamadı.
            </div>
          ) : (
            filteredTemplates.map((tmpl) => {
              const theme = CATEGORY_THEMES[tmpl.category] || CATEGORY_THEMES['Genel'];
              const CategoryIcon = theme.icon || CheckSquare;
              const isExpanded = Boolean(expandedTemplateIds[tmpl.id]);
              const itemCount = tmpl.items.length;

              return (
                <div
                  key={tmpl.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '18px',
                    border: '1.2px solid #F9BED8',
                    padding: '16px',
                    boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Top Row: Item Count & Quick Add Button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '700', 
                      color: '#D7147A',
                      background: '#FDF2F8',
                      padding: '3px 9px',
                      borderRadius: '8px',
                      border: '1px solid #F9BED8',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <CheckCircle2 size={12} color="#D7147A" />
                      <span>{itemCount} Kontrol Maddesi</span>
                    </span>

                    {/* Quick Add Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenTemplateModal(tmpl)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                        color: '#ffffff',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 8px rgba(215, 20, 122, 0.22)',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Plus size={13} strokeWidth={2.6} /> Bu Şablonu Kullan
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div style={{ marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 3px' }}>
                      {tmpl.title}
                    </h3>
                    <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: '1.4' }}>
                      {tmpl.description}
                    </div>
                  </div>

                  {/* Items Preview / Accordion */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '10px 12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>
                        İçerik ({itemCount} Madde):
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedTemplateIds(prev => ({
                          ...prev,
                          [tmpl.id]: !isExpanded
                        }))}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#D7147A',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          padding: 0
                        }}
                      >
                        {isExpanded ? (
                          <>Önizlemeyi Daralt <ChevronUp size={13} /></>
                        ) : (
                          <>Tüm Maddeleri Gör ({itemCount}) <ChevronDown size={13} /></>
                        )}
                      </button>
                    </div>

                    {/* Non-expanded preview (Top 6 pills) */}
                    {!isExpanded ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {tmpl.items.slice(0, 5).map((item, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: '#ffffff',
                              padding: '3px 8px',
                              borderRadius: '7px',
                              border: '1px solid #e2e8f0',
                              fontSize: '10.5px',
                              color: '#334155',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Check size={11} color="#16a34a" strokeWidth={2.5} /> {item}
                          </span>
                        ))}
                        {tmpl.items.length > 5 && (
                          <span
                            onClick={() => setExpandedTemplateIds(prev => ({ ...prev, [tmpl.id]: true }))}
                            style={{
                              color: '#D7147A',
                              fontSize: '10.5px',
                              fontWeight: '700',
                              alignSelf: 'center',
                              cursor: 'pointer',
                              padding: '2px 4px'
                            }}
                          >
                            +{tmpl.items.length - 5} madde daha...
                          </span>
                        )}
                      </div>
                    ) : (
                      /* Full expanded item checklist list */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '260px', overflowY: 'auto' }}>
                        {tmpl.items.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: '#ffffff',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              fontSize: '11.5px',
                              color: '#1e293b'
                            }}
                          >
                            <Check size={12} color="#16a34a" strokeWidth={3} style={{ flexShrink: 0 }} />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}



      {/* ========================================================
          5. CUSTOMIZE & APPLY TEMPLATE MODAL
      ======================================================== */}
      {showTemplateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '420px',
            padding: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Şablonu Özelleştir ve Ekle
                </h3>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                  {showTemplateModal.title}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Travel Selector */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                Bağlanacak Seyahat (İsteğe Bağlı)
              </label>
              <ThemeSelect
                value={selectedTravelId}
                onChange={setSelectedTravelId}
                options={travelOptions}
                placeholder="Genel / Seyahatsiz Liste"
                triggerStyle={{ padding: '8px 12px', fontSize: '12px' }}
              />
            </div>

            {/* Item selector toolbar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>
                Eklenecek Maddeleri Seçin:
              </span>
              <button
                type="button"
                onClick={() => {
                  const allSelected = showTemplateModal.items.every((_, idx) => templateSelectedItems[idx]);
                  const updated = {};
                  showTemplateModal.items.forEach((_, idx) => {
                    updated[idx] = !allSelected;
                  });
                  setTemplateSelectedItems(updated);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#D7147A',
                  fontSize: '10.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showTemplateModal.items.every((_, idx) => templateSelectedItems[idx]) ? 'Tümünü Kaldır' : 'Tümünü Seç'}
              </button>
            </div>

            {/* Selectable item list */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              marginBottom: '16px',
              paddingRight: '4px'
            }}>
              {showTemplateModal.items.map((item, idx) => {
                const isChecked = Boolean(templateSelectedItems[idx]);
                return (
                  <div
                    key={idx}
                    onClick={() => setTemplateSelectedItems(prev => ({ ...prev, [idx]: !prev[idx] }))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: `1.2px solid ${isChecked ? '#F9BED8' : '#e2e8f0'}`,
                      background: isChecked ? '#fff5f9' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.1s'
                    }}
                  >
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '5px',
                      border: `1.5px solid ${isChecked ? '#D7147A' : '#cbd5e1'}`,
                      background: isChecked ? '#D7147A' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      flexShrink: 0
                    }}>
                      {isChecked && <Check size={12} strokeWidth={3.5} />}
                    </div>
                    <span style={{ fontSize: '12px', color: isChecked ? '#0f172a' : '#64748b' }}>
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowTemplateModal(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
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
                type="button"
                onClick={handleApplyTemplate}
                disabled={isSaving}
                style={{
                  flex: 2,
                  padding: '10px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: isSaving ? 'wait' : 'pointer',
                  boxShadow: '0 4px 12px rgba(215, 20, 122, 0.22)'
                }}
              >
                {isSaving ? 'Ekleniyor...' : 'Seçili Maddelerle Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ========================================================
          7. DELETE CONFIRMATION MODAL
      ======================================================== */}
      {deleteConfirmId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '340px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <Trash2 size={22} />
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
              Listeyi Silmek İstiyor musunuz?
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px', lineHeight: '1.4' }}>
              Bu liste ve içindeki tüm maddeler kalıcı olarak silinecektir.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  flex: 1,
                  padding: '9px',
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
                type="button"
                onClick={async () => {
                  try {
                    await deleteChecklist(deleteConfirmId);
                    setDeleteConfirmId(null);
                    showToast("Liste silindi.");
                  } catch (e) {
                    alert("Hata: " + e.message);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)'
                }}
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          8. GUEST LOGIN REQUIRED MODAL
      ======================================================== */}
      {showLoginModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '380px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '18px',
              background: '#FDF2F8',
              color: '#D7147A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <CheckSquare size={28} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
              Kayıt İçin Giriş Gerekli
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.5, margin: '0 0 20px' }}>
              Checklist listenizi kaydetmek, şablonları kendi seyahatlerinize bağlamak ve tüm cihazlarınızdan yönetmek için lütfen giriş yapın veya ücretsiz hesap oluşturun.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(215, 20, 122, 0.25)'
                }}
              >
                Giriş Yap / Üye Ol
              </button>
              <button
                onClick={() => setShowLoginModal(false)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#64748b',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
