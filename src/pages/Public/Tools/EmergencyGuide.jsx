import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Phone, 
  MapPin, 
  Share2, 
  Copy, 
  Check, 
  Navigation, 
  Building2, 
  Search, 
  MessageSquare,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Siren,
  ArrowRight,
  Globe,
  RefreshCw,
  Flame,
  HeartPulse,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  Mail
} from 'lucide-react';
import CountryFlag from '../../../components/CountryFlag';
import { useSettingsStore } from '../../../store/settingsStore';

// Snazzy Maps: WY (https://snazzymaps.com/style/8097/wy) - Dashboard Gri Tonlamalı Harita Tasarımı
const WY_MAP_STYLE = [
  { "featureType": "all", "elementType": "geometry.fill", "stylers": [{ "weight": "2.00" }] },
  { "featureType": "all", "elementType": "geometry.stroke", "stylers": [{ "color": "#9c9c9c" }] },
  { "featureType": "all", "elementType": "labels.text", "stylers": [{ "visibility": "on" }] },
  { "featureType": "landscape", "elementType": "all", "stylers": [{ "color": "#f2f2f2" }] },
  { "featureType": "landscape", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "landscape.man_made", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "all", "stylers": [{ "saturation": -100 }, { "lightness": 45 }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#eeeeee" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#7b7b7b" }] },
  { "featureType": "road", "elementType": "labels.text.stroke", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "road.highway", "elementType": "all", "stylers": [{ "visibility": "simplified" }] },
  { "featureType": "road.arterial", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "featureType": "transit", "elementType": "all", "stylers": [{ "visibility": "off" }] },
  { "featureType": "water", "elementType": "all", "stylers": [{ "color": "#46bcec" }, { "visibility": "on" }] },
  { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#c8d7d4" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#070707" }] },
  { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#ffffff" }] }
];

const COUNTRY_EMBASSY_COORDS = {
  TR: { lat: 39.8978, lon: 32.8123 }, // Ankara
  IT: { lat: 41.9056, lon: 12.5005 }, // Roma
  DE: { lat: 52.5098, lon: 13.3547 }, // Berlin
  FR: { lat: 48.8546, lon: 2.2789 },  // Paris
  GB: { lat: 51.4988, lon: -0.1534 }, // Londra
  US: { lat: 38.9167, lon: -77.0543 },// Washington
  ES: { lat: 40.4326, lon: -3.6931 }, // Madrid
  GR: { lat: 37.9734, lon: 23.7423 }, // Atina
  AE: { lat: 24.4442, lon: 54.4021 }, // Abu Dabi
  NL: { lat: 52.0834, lon: 4.3051 },  // Lahey
  CH: { lat: 46.9421, lon: 7.4641 },  // Bern
  AT: { lat: 48.1963, lon: 16.3764 }, // Viyana
  JP: { lat: 35.6712, lon: 139.7093 },// Tokyo
  GE: { lat: 41.7151, lon: 44.8271 }, // Tiflis
  TH: { lat: 13.7563, lon: 100.5018 },// Bangkok
  AZ: { lat: 40.3842, lon: 49.8415 }, // Bakü
  HU: { lat: 47.4979, lon: 19.0402 }, // Budapeşte
  CZ: { lat: 50.0755, lon: 14.4378 }, // Prag
  PT: { lat: 38.7223, lon: -9.1393 }, // Lizbon
  BE: { lat: 50.8415, lon: 4.3697 },  // Brüksel
  PL: { lat: 52.2297, lon: 21.0122 }, // Varşova
  RU: { lat: 55.7428, lon: 37.5765 }, // Moskova
  EG: { lat: 30.0444, lon: 31.2357 }, // Kahire
  QA: { lat: 25.3341, lon: 51.5284 }, // Doha
  SA: { lat: 24.7136, lon: 46.6753 }, // Riyad
  KR: { lat: 37.5665, lon: 126.9780 },// Seul
  ME: { lat: 42.4304, lon: 19.2594 }, // Podgorica
  RS: { lat: 44.7866, lon: 20.4489 }, // Belgrad
  BA: { lat: 43.8563, lon: 18.4131 }, // Saraybosna
  MK: { lat: 41.9981, lon: 21.4254 }, // Üsküp
  CY: { lat: 35.1856, lon: 33.3617 }  // Lefkoşa
};

const loadGoogleMapsScript = (apiKey) => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }
    const existing = document.getElementById('google-maps-sdk');
    if (existing) {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        existing.addEventListener('load', () => resolve(window.google.maps));
        existing.addEventListener('error', (e) => reject(e));
      }
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
};

// Comprehensive Country Emergency & Turkish Consulate Directory
export const EMERGENCY_COUNTRIES = [
  {
    id: 'TR',
    country: 'Türkiye',
    code: 'tr',
    flag: '🇹🇷',
    keywords: 'turkiye turkey turk istanbul ankara izmir antalya bursa 112 afad',
    generalEmergency: '112',
    police: '112 (Eski: 155)',
    ambulance: '112',
    fire: '112 (Eski: 110)',
    notes: 'Türkiye genelinde tüm acil numaralar (Polis, Ambulans, İtfaiye, Jandarma, Sahil Güvenlik) tek numara olan 112 Acil Çağrı Merkezinde birleştirilmiştir.',
    embassy: {
      name: 'T.C. Dışişleri & İçişleri Bakanlığı Resmi İletişim Hatları',
      city: 'Ankara / Türkiye Geneli',
      address: 'Dr. Sadık Ahmet Cad. No: 8 Balgat / Ankara - Türkiye',
      phone: '+90 312 292 29 29',
      emergencyDutyPhone: '+90 312 292 29 29',
      email: 'info@mfa.gov.tr',
      isDomestic: true,
      extraServices: [
        { name: '112 Tek Acil Çağrı', phone: '112', desc: 'Polis, Sağlık, Yangın, Jandarma' },
        { name: 'AFAD Afet & Acil Durum', phone: '122', desc: 'Deprem ve Doğal Afet Destek' },
        { name: 'Alo 199 Nüfus & Pasaport', phone: '199', desc: 'Acil Pasaport ve Kimlik Destek' },
        { name: 'Dışişleri Konsolosluk Çağrı', phone: '+90 312 292 29 29', desc: '7/24 Kesintisiz Türkçe Çağrı Hattı' }
      ]
    }
  },
  {
    id: 'IT',
    country: 'İtalya',
    code: 'it',
    flag: '🇮🇹',
    keywords: 'italya italy roma rome milano milan venice venedik floransa napoli',
    generalEmergency: '112',
    police: '112 / 113',
    ambulance: '118',
    fire: '115',
    notes: 'İtalya genelinde 112 Avrupa Acil Hattı aktiftir. Ambulans için 118, İtfaiye için 115 aranabilir.',
    embassy: {
      name: 'T.C. Roma Büyükelçiliği',
      city: 'Roma',
      address: 'Via Palestro, 47, 00185 Roma, İtalya',
      phone: '+39 06 446 9933',
      emergencyDutyPhone: '+39 342 818 1073',
      email: 'ambasciata.roma@mfa.gov.tr',
      consulates: [
        {
          name: 'T.C. Milano Başkonsolosluğu',
          city: 'Milano',
          address: 'Via Antonio Canova, 36, 20145 Milano, İtalya',
          phone: '+39 02 582 1201',
          emergencyDutyPhone: '+39 333 464 6934',
          email: 'consolato.milano@mfa.gov.tr'
        }
      ]
    }
  },
  {
    id: 'DE',
    country: 'Almanya',
    code: 'de',
    flag: '🇩🇪',
    keywords: 'almanya germany berlin munih munich frankfurt koln cologne hamburg dusseldorf stuttgart',
    generalEmergency: '112',
    police: '110',
    ambulance: '112',
    fire: '112',
    notes: 'Almanya genelinde polis için 110, sağlık ve yangın için 112 aranır.',
    embassy: {
      name: 'T.C. Berlin Büyükelçiliği',
      city: 'Berlin',
      address: 'Tiergartenstraße 19-21, 10785 Berlin, Almanya',
      phone: '+49 30 275 850',
      emergencyDutyPhone: '+49 177 568 3730',
      email: 'botschaft.berlin@mfa.gov.tr',
      consulates: [
        {
          name: 'T.C. Frankfurt Başkonsolosluğu',
          city: 'Frankfurt',
          address: 'Kennedyallee 115-117, 60596 Frankfurt am Main',
          phone: '+49 69 920 880',
          emergencyDutyPhone: '+49 160 9668 7654',
          email: 'konsulat.frankfurt@mfa.gov.tr'
        },
        {
          name: 'T.C. Münih Başkonsolosluğu',
          city: 'Münih',
          address: 'Menzinger Str. 3, 80638 München',
          phone: '+49 89 178 0310',
          emergencyDutyPhone: '+49 152 236 69 494',
          email: 'konsulat.muenchen@mfa.gov.tr'
        },
        {
          name: 'T.C. Köln Başkonsolosluğu',
          city: 'Köln',
          address: 'Luxemburger Str. 285, 50354 Hürth / Köln',
          phone: '+49 2232 505 40',
          emergencyDutyPhone: '+49 174 763 33 84',
          email: 'konsulat.koeln@mfa.gov.tr'
        }
      ]
    }
  },
  {
    id: 'FR',
    country: 'Fransa',
    code: 'fr',
    flag: '🇫🇷',
    keywords: 'fransa france paris lyon marsilya marseille nice bordeaux cannes lille strasbourg',
    generalEmergency: '112',
    police: '17',
    ambulance: '15 (SAMU)',
    fire: '18 (Pompiers)',
    notes: 'Fransa genelinde 112 tüm acil durumlar için çalışır. Ambulans için SAMU (15), itfaiye için 18 aranabilir.',
    embassy: {
      name: 'T.C. Paris Büyükelçiliği',
      city: 'Paris',
      address: '16 Avenue de Lamballe, 75016 Paris, Fransa',
      phone: '+33 1 53 92 71 11',
      emergencyDutyPhone: '+33 6 42 27 60 76',
      email: 'ambassade.paris@mfa.gov.tr',
      consulates: [
        {
          name: 'T.C. Paris Başkonsolosluğu',
          city: 'Paris',
          address: '44 Rue de Sèvres, 92100 Boulogne-Billancourt, Paris',
          phone: '+33 1 47 12 30 30',
          emergencyDutyPhone: '+33 6 78 86 52 14',
          email: 'consulat.paris@mfa.gov.tr'
        },
        {
          name: 'T.C. Marsilya Başkonsolosluğu',
          city: 'Marsilya',
          address: '363 Avenue du Prado, 13008 Marseille',
          phone: '+33 4 91 29 00 20',
          emergencyDutyPhone: '+33 6 12 37 84 94',
          email: 'consulat.marseille@mfa.gov.tr'
        },
        {
          name: 'T.C. Lyon Başkonsolosluğu',
          city: 'Lyon',
          address: '87 Rue de Sèze, 69006 Lyon',
          phone: '+33 4 72 83 98 40',
          emergencyDutyPhone: '+33 6 43 45 42 55',
          email: 'consulat.lyon@mfa.gov.tr'
        }
      ]
    }
  },
  {
    id: 'GB',
    country: 'Birleşik Krallık',
    code: 'gb',
    flag: '🇬🇧',
    keywords: 'ingiltere uk united kingdom london londra ingiltere edinburgh manchester liverpool birmingham glasgow',
    generalEmergency: '999 / 112',
    police: '999 (Acil Olmayan: 101)',
    ambulance: '999',
    fire: '999',
    notes: 'Birleşik Krallık genelinde 999 ve 112 ücretsizdir. Hayati tehlike olmayan polis bildirimleri için 101 aranabilir.',
    embassy: {
      name: 'T.C. Londra Büyükelçiliği',
      city: 'Londra',
      address: '43 Belgrave Square, London SW1X 8HE, İngiltere',
      phone: '+44 20 7393 0202',
      emergencyDutyPhone: '+44 788 777 5606',
      email: 'embassy.london@mfa.gov.tr',
      consulates: [
        {
          name: 'T.C. Londra Başkonsolosluğu',
          city: 'Londra',
          address: 'Rutland Lodge, Rutland Gardens, Knightsbridge, London SW7 1BW',
          phone: '+44 20 7584 9965',
          emergencyDutyPhone: '+44 792 110 1897',
          email: 'consulate.london@mfa.gov.tr'
        },
        {
          name: 'T.C. Edinburgh Başkonsolosluğu',
          city: 'Edinburgh / İskoçya',
          address: '39 Drumsheugh Gardens, Edinburgh EH3 7SW',
          phone: '+44 131 332 5623',
          emergencyDutyPhone: '+44 746 448 3981',
          email: 'consulate.edinburgh@mfa.gov.tr'
        }
      ]
    }
  },
  {
    id: 'US',
    country: 'Amerika Birleşik Devletleri (ABD)',
    code: 'us',
    flag: '🇺🇸',
    keywords: 'amerika usa abd united states washington new york ny miami los angeles la chicago boston san francisco',
    generalEmergency: '911',
    police: '911',
    ambulance: '911',
    fire: '911',
    notes: 'ABD genelinde 911 tüm acil durumlar için geçerlidir. T.C. Dışişleri ABD ücretsiz çağrı merkezi: +1 888 566 76 56.',
    embassy: {
      name: 'T.C. Vaşington Büyükelçiliği',
      city: 'Washington D.C.',
      address: '2525 Massachusetts Ave NW, Washington, DC 20008, ABD',
      phone: '+1 202 612 6700',
      emergencyDutyPhone: '+1 202 374 8645',
      email: 'embassy.washingtondc@mfa.gov.tr',
      consulates: [
        {
          name: 'T.C. New York Başkonsolosluğu (Türkevi)',
          city: 'New York',
          address: '821 United Nations Plaza, New York, NY 10017',
          phone: '+1 646 205 1600',
          emergencyDutyPhone: '+1 646 204 4965',
          email: 'consulate.newyork@mfa.gov.tr'
        },
        {
          name: 'T.C. Los Angeles Başkonsolosluğu',
          city: 'Los Angeles / Kaliforniya',
          address: '8564 Wilshire Blvd, Beverly Hills, CA 90211',
          phone: '+1 310 414 0003',
          emergencyDutyPhone: '+1 310 779 3280',
          email: 'consulate.losangeles@mfa.gov.tr'
        },
        {
          name: 'T.C. Miami Başkonsolosluğu',
          city: 'Miami / Florida',
          address: '80 SW 8th St, Suite 2700, Miami, FL 33130',
          phone: '+1 786 655 0515',
          emergencyDutyPhone: '+1 305 607 8998',
          email: 'consulate.miami@mfa.gov.tr'
        },
        {
          name: 'T.C. Chicago Başkonsolosluğu',
          city: 'Chicago / Illinois',
          address: '455 N Cityfront Plaza Dr, Suite 2900, Chicago, IL 60611',
          phone: '+1 312 263 0644',
          emergencyDutyPhone: '+1 312 405 5040',
          email: 'consulate.chicago@mfa.gov.tr'
        }
      ]
    }
  },
  {
    id: 'ES',
    country: 'İspanya',
    code: 'es',
    flag: '🇪🇸',
    keywords: 'ispanya spain madrid barselona barcelona sevilla valencia mallorca ibiza malaga',
    generalEmergency: '112',
    police: '091 (Ulusal) / 092 (Yerel)',
    ambulance: '061',
    fire: '080',
    notes: 'İspanya genelinde 112 ortak acil durum numarasıdır. İngilizce, Fransızca ve Almanca destek mevcuttur.',
    embassy: {
      name: 'T.C. Madrid Büyükelçiliği',
      city: 'Madrid',
      address: 'C. de Rafael Calvo, 18, 28010 Madrid, İspanya',
      phone: '+34 91 310 3640',
      emergencyDutyPhone: '+34 616 836 290',
      email: 'embajada.madrid@mfa.gov.tr',
      consulates: [
        {
          name: 'T.C. Barselona Başkonsolosluğu',
          city: 'Barselona',
          address: 'Passeig de Gràcia, 7, 1ª Planta, 08007 Barcelona',
          phone: '+34 93 317 9231',
          emergencyDutyPhone: '+34 620 906 580',
          email: 'consulado.barcelona@mfa.gov.tr'
        }
      ]
    }
  },
  {
    id: 'GR',
    country: 'Yunanistan',
    code: 'gr',
    flag: '🇬🇷',
    keywords: 'yunanistan greece atina athens selanik thessaloniki rodos rhodes mykonos santorini kos girit crete',
    generalEmergency: '112',
    police: '100 (Turist Polisi: 171)',
    ambulance: '166',
    fire: '199',
    notes: 'Yunanistan genelinde 112 ücretsizdir. Turistlerle ilgili kayıp veya adli konularda Turist Polisi (171) çok dillidir.',
    embassy: {
      name: 'T.C. Atina Büyükelçiliği',
      city: 'Atina',
      address: 'Vasileos Georgiou B 8, Athina 106 74, Yunanistan',
      phone: '+30 210 726 3000',
      emergencyDutyPhone: '+30 690 980 9820',
      email: 'embassy.athens@mfa.gov.tr',
      consulates: [
        {
          name: 'T.C. Selanik Başkonsolosluğu (Atatürk Evi Yanı)',
          city: 'Selanik',
          address: 'Odos Agiou Dimitriou 151, 546 34 Thessaloniki',
          phone: '+30 2310 248 650',
          emergencyDutyPhone: '+30 697 026 0577',
          email: 'consulate.thessaloniki@mfa.gov.tr'
        },
        {
          name: 'T.C. Rodos Başkonsolosluğu',
          city: 'Rodos',
          address: 'Iroon Polytechniou 10-12, 85100 Rodos',
          phone: '+30 22410 23362',
          emergencyDutyPhone: '+30 694 813 0680',
          email: 'consulate.rhodes@mfa.gov.tr'
        }
      ]
    }
  },
  {
    id: 'AE',
    country: 'Birleşik Arap Emirlikleri (Dubai / Abu Dabi)',
    code: 'ae',
    flag: '🇦🇪',
    keywords: 'dubai abu dhabi uae bae emirlikler united arab emirates sharjah',
    generalEmergency: '999',
    police: '999 (Turist Hattı: 901)',
    ambulance: '998',
    fire: '997',
    notes: 'BAE genelinde polis için 999, ambulans için 998, itfaiye için 997 aranır.',
    embassy: {
      name: 'T.C. Abu Dabi Büyükelçiliği',
      city: 'Abu Dabi',
      address: 'W69-02, Sector E-25, 26th Street, Al Rowdah, Abu Dabi, BAE',
      phone: '+971 2 410 9999',
      emergencyDutyPhone: '+971 50 811 7604',
      email: 'embassy.abudhabi@mfa.gov.tr',
      consulates: [
        {
          name: 'T.C. Dubai Başkonsolosluğu',
          city: 'Dubai',
          address: 'Dubai World Trade Center Building, 29th Floor, Dubai',
          phone: '+971 4 376 0600',
          emergencyDutyPhone: '+971 50 421 2167',
          email: 'consulate.dubai@mfa.gov.tr'
        }
      ]
    }
  },
  {
    id: 'NL',
    country: 'Hollanda',
    code: 'nl',
    flag: '🇳🇱',
    keywords: 'hollanda netherlands amsterdam lahey the hague rotterdam utrecht eindhoven',
    generalEmergency: '112',
    police: '112 (Acil Olmayan: 0900-8844)',
    ambulance: '112',
    fire: '112',
    notes: 'Hollanda genelinde 112 ortak acil yardım hattıdır. Acil olmayan polis durumlarında 0900-8844 aranır.',
    embassy: {
      name: 'T.C. Lahey Büyükelçiliği',
      city: 'Lahey (The Hague)',
      address: 'Jan Evertstraat 15, 2514 BS Den Haag, Hollanda',
      phone: '+31 70 302 3100',
      emergencyDutyPhone: '+31 6 15 15 97 74',
      email: 'embassy.thehague@mfa.gov.tr',
      consulates: [
        {
          name: 'T.C. Rotterdam Başkonsolosluğu',
          city: 'Rotterdam',
          address: 'Westblaak 34, 3012 KM Rotterdam',
          phone: '+31 10 201 4900',
          emergencyDutyPhone: '+31 641 026 385',
          email: 'consulate.rotterdam@mfa.gov.tr'
        },
        {
          name: 'T.C. Deventer Başkonsolosluğu',
          city: 'Deventer',
          address: 'Keizerstraat 8, 7411 HG Deventer',
          phone: '+31 570 619 720',
          emergencyDutyPhone: '+31 617 842 595',
          email: 'consulate.deventer@mfa.gov.tr'
        }
      ]
    }
  },
  {
    id: 'CH',
    country: 'İsviçre',
    code: 'ch',
    flag: '🇨🇭',
    keywords: 'isvicre switzerland zurih bern geneve cenevre basel luzern lausanne',
    generalEmergency: '112',
    police: '117',
    ambulance: '144',
    fire: '118',
    notes: 'İsviçre genelinde 112 çalışır. Özel numaralar: Polis 117, Ambulans 144, İtfaiye 118, REGA Hava Kurtarma 1414.',
    embassy: {
      name: 'T.C. Bern Büyükelçiliği',
      city: 'Bern',
      address: 'Lombachweg 33, 3006 Bern, İsviçre',
      phone: '+41 31 359 7070',
      emergencyDutyPhone: '+41 78 775 8743',
      email: 'botschaft.bern@mfa.gov.tr',
      consulates: [
        {
          name: 'T.C. Zürih Başkonsolosluğu',
          city: 'Zürih',
          address: 'Weinbergstrasse 65, 8006 Zürich',
          phone: '+41 44 368 2900',
          emergencyDutyPhone: '+41 79 103 3813',
          email: 'konsulat.zuerich@mfa.gov.tr'
        },
        {
          name: 'T.C. Cenevre Başkonsolosluğu',
          city: 'Cenevre',
          address: 'ICC 20, Route de Pré-Bois, Bat. H, 1215 Genève',
          phone: '+41 22 710 9360',
          emergencyDutyPhone: '+41 78 867 0210',
          email: 'consulat.geneve@mfa.gov.tr'
        }
      ]
    }
  },
  {
    id: 'AT',
    country: 'Avusturya',
    code: 'at',
    flag: '🇦🇹',
    keywords: 'avusturya austria viyana vienna salzburg graz linz innsbruck',
    generalEmergency: '112',
    police: '133',
    ambulance: '144',
    fire: '122',
    notes: 'Avusturya genelinde 112 ücretsizdir. Polis 133, Ambulans 144, İtfaiye 122 olarak da aranabilir.',
    embassy: {
      name: 'T.C. Viyana Büyükelçiliği',
      city: 'Viyana',
      address: 'Prinz-Eugen-Straße 40, 1040 Wien, Avusturya',
      phone: '+43 1 505 7338',
      emergencyDutyPhone: '+43 676 544 3388',
      email: 'botschaft.wien@mfa.gov.tr',
      consulates: [
        {
          name: 'T.C. Salzburg Başkonsolosluğu',
          city: 'Salzburg',
          address: 'Strubergasse 9, 5020 Salzburg',
          phone: '+43 662 442 120',
          emergencyDutyPhone: '+43 676 608 0725',
          email: 'konsulat.salzburg@mfa.gov.tr'
        }
      ]
    }
  },
  {
    id: 'JP',
    country: 'Japonya',
    code: 'jp',
    flag: '🇯🇵',
    keywords: 'japonya japan tokyo osaka kyoto nagoya sapporo fukuoka',
    generalEmergency: '110 / 119',
    police: '110',
    ambulance: '119',
    fire: '119',
    notes: 'Japonya genelinde polis için 110, ambulans ve yangın için 119 aranır. İngilizce tercüman talep edilebilir.',
    embassy: {
      name: 'T.C. Tokyo Büyükelçiliği',
      city: 'Tokyo',
      address: '2-33-6 Jingumae, Shibuya-ku, Tokyo 150-0001, Japonya',
      phone: '+81 3 6439 5700',
      emergencyDutyPhone: '+81 90 2486 4485',
      email: 'embassy.tokyo@mfa.gov.tr',
      consulates: [
        {
          name: 'T.C. Nagoya Başkonsolosluğu',
          city: 'Nagoya',
          address: 'Sakae 3-21-23, KS Sakae Bldg. 4F, Naka-ku, Nagoya',
          phone: '+81 52 263 7111',
          emergencyDutyPhone: '+81 80 4363 7111',
          email: 'consulate.nagoya@mfa.gov.tr'
        }
      ]
    }
  },
  {
    id: 'GE',
    country: 'Gürcistan',
    code: 'ge',
    flag: '🇬🇪',
    keywords: 'gurcistan georgia tiflis tbilisi batum batumi kutaisi',
    generalEmergency: '112',
    police: '112',
    ambulance: '112',
    fire: '112',
    notes: 'Gürcistan genelinde tek numara 112’dir. Operatörler Gürcüce, Rusça ve İngilizce yanıt verir.',
    embassy: {
      name: 'T.C. Tiflis Büyükelçiliği',
      city: 'Tiflis',
      address: 'Chavchavadze Ave. 35, 0179 Tiflis, Gürcistan',
      phone: '+995 32 225 2072',
      emergencyDutyPhone: '+995 599 57 14 00',
      email: 'embassy.tbilisi@mfa.gov.tr',
      consulates: [
        {
          name: 'T.C. Batum Başkonsolosluğu',
          city: 'Batum',
          address: 'Ninoshvili Cad. No:9, Batum, Gürcistan',
          phone: '+995 422 25 58 00',
          emergencyDutyPhone: '+995 599 87 23 23',
          email: 'consulate.batumi@mfa.gov.tr'
        }
      ]
    }
  },
  {
    id: 'TH',
    country: 'Tayland',
    code: 'th',
    flag: '🇹🇭',
    keywords: 'tayland thailand bangkok phuket pattaya chiang mai koh samui',
    generalEmergency: '191 / 1155',
    police: '191 (Turist Polisi: 1155)',
    ambulance: '1669',
    fire: '199',
    notes: 'Tayland’da turistlerin karşılaştığı tüm acil durumlar için Turist Polisi (1155) 7/24 İngilizce hizmet verir.',
    embassy: {
      name: 'T.C. Bangkok Büyükelçiliği',
      city: 'Bangkok',
      address: '61/1 Soi Chatsan, Suthisarn Vinitchai Rd, Huaykwang, Bangkok 10310',
      phone: '+66 2 355 5486',
      emergencyDutyPhone: '+66 84 009 5448',
      email: 'embassy.bangkok@mfa.gov.tr'
    }
  },
  {
    id: 'AZ',
    country: 'Azerbaycan',
    code: 'az',
    flag: '🇦🇿',
    keywords: 'azerbaycan azerbaijan baku baki gence nahcivan',
    generalEmergency: '112',
    police: '102',
    ambulance: '103',
    fire: '101',
    notes: 'Azerbaycan genelinde 112 Fövqəladə Hallar Nazirliği (Acil Durumlar) tek numarasıdır. Polis için 102, Ambulans 103.',
    embassy: {
      name: 'T.C. Bakü Büyükelçiliği',
      city: 'Bakü',
      address: 'Samed Vurgun Küç. 134, AZ1022 Bakü, Azerbaycan',
      phone: '+994 12 444 73 20',
      emergencyDutyPhone: '+994 50 310 09 84',
      email: 'embassy.baku@mfa.gov.tr',
      consulates: [
        {
          name: 'T.C. Gence Başkonsolosluğu',
          city: 'Gence',
          address: 'M.A. Abbaszade Küç. 8, AZ2000 Gence',
          phone: '+994 22 266 29 11',
          emergencyDutyPhone: '+994 50 254 54 84',
          email: 'consulate.ganja@mfa.gov.tr'
        },
        {
          name: 'T.C. Nahçıvan Başkonsolosluğu',
          city: 'Nahçıvan',
          address: 'Heyder Eliyev Prospekti 17, Nahçıvan',
          phone: '+994 36 545 26 63',
          emergencyDutyPhone: '+994 50 235 60 76',
          email: 'consulate.nakhchivan@mfa.gov.tr'
        }
      ]
    }
  },
  {
    id: 'HU',
    country: 'Macaristan',
    code: 'hu',
    flag: '🇭🇺',
    keywords: 'macaristan hungary budapeste budapest debrecen szeged',
    generalEmergency: '112',
    police: '107 / 112',
    ambulance: '104 / 112',
    fire: '105 / 112',
    notes: 'Macaristan genelinde 112 ortak acil durum numarasıdır. İngilizce destek mevcuttur.',
    embassy: {
      name: 'T.C. Budapeşte Büyükelçiliği',
      city: 'Budapeşte',
      address: 'Andrássy út 123, 1062 Budapeşte, Macaristan',
      phone: '+36 1 478 9130',
      emergencyDutyPhone: '+36 70 355 7233',
      email: 'embassy.budapest@mfa.gov.tr'
    }
  },
  {
    id: 'CZ',
    country: 'Çekya (Çek Cumhuriyeti)',
    code: 'cz',
    flag: '🇨🇿',
    keywords: 'cekya czech czechia prag prague brno ostrava',
    generalEmergency: '112',
    police: '158 / 112',
    ambulance: '155',
    fire: '150',
    notes: 'Çekya genelinde 112 ücretsizdir. Polis için 158, ambulans için 155 aranabilir.',
    embassy: {
      name: 'T.C. Prag Büyükelçiliği',
      city: 'Prag',
      address: 'Na Ořechovce 569/69, 162 00 Prag 6, Çekya',
      phone: '+420 224 311 402',
      emergencyDutyPhone: '+420 773 268 021',
      email: 'embassy.prague@mfa.gov.tr'
    }
  },
  {
    id: 'PT',
    country: 'Portekiz',
    code: 'pt',
    flag: '🇵🇹',
    keywords: 'portekiz portugal lizbon lisbon porto faro madeira azor',
    generalEmergency: '112',
    police: '112 (Ulusal Polis PSP)',
    ambulance: '112 (INEM)',
    fire: '112',
    notes: 'Portekiz genelinde tüm acil servisler (Polis, Sağlık, İtfaiye) tek numara olan 112 üzerinden yönlendirilir.',
    embassy: {
      name: 'T.C. Lizbon Büyükelçiliği',
      city: 'Lizbon',
      address: 'Avenida das Descobertas, 22, 1400-092 Lizbon, Portekiz',
      phone: '+351 21 300 9010',
      emergencyDutyPhone: '+351 91 224 4400',
      email: 'embaixada.lisboa@mfa.gov.tr'
    }
  },
  {
    id: 'BE',
    country: 'Belçika',
    code: 'be',
    flag: '🇧🇪',
    keywords: 'belcika belgium bruksel brussels brugge bruges gent anvers antwerp',
    generalEmergency: '112',
    police: '101',
    ambulance: '112',
    fire: '112',
    notes: 'Belçika’da 112 acil yardım ve yangın içindir. Federal polis doğrudan 101 üzerinden de aranabilir.',
    embassy: {
      name: 'T.C. Brüksel Büyükelçiliği',
      city: 'Brüksel',
      address: 'Rue Montoyer 4, 1000 Brüksel, Belçika',
      phone: '+32 2 513 40 91',
      emergencyDutyPhone: '+32 479 09 88 01',
      email: 'ambassade.bruxelles@mfa.gov.tr',
      consulates: [
        {
          name: 'T.C. Brüksel Başkonsolosluğu',
          city: 'Brüksel',
          address: 'Boulevard du Régent 40, 1000 Bruxelles',
          phone: '+32 2 548 93 40',
          emergencyDutyPhone: '+32 470 91 09 23',
          email: 'consulat.bruxelles@mfa.gov.tr'
        },
        {
          name: 'T.C. Anvers Başkonsolosluğu',
          city: 'Anvers (Antwerp)',
          address: 'Sorbenlaan 8, 2610 Wilrijk / Antwerpen',
          phone: '+32 3 247 16 00',
          emergencyDutyPhone: '+32 473 34 50 82',
          email: 'consulat.anvers@mfa.gov.tr'
        }
      ]
    }
  },
  {
    id: 'PL',
    country: 'Polonya',
    code: 'pl',
    flag: '🇵🇱',
    keywords: 'polonya poland varsova warsaw krakow gdansk wroclaw poznan',
    generalEmergency: '112',
    police: '997 / 112',
    ambulance: '999 / 112',
    fire: '998 / 112',
    notes: 'Polonya genelinde 112 geçerlidir. Doğrudan hatlar: Ambulans 999, İtfaiye 998, Polis 997.',
    embassy: {
      name: 'T.C. Varşova Büyükelçiliği',
      city: 'Varşova',
      address: 'ul. Malczewskiego 32, 02-622 Varşova, Polonya',
      phone: '+48 22 854 61 10',
      emergencyDutyPhone: '+48 508 012 360',
      email: 'embassy.warsaw@mfa.gov.tr'
    }
  },
  {
    id: 'RU',
    country: 'Rusya',
    code: 'ru',
    flag: '🇷🇺',
    keywords: 'rusya russia moskova moscow st petersburg kazan sochi',
    generalEmergency: '112',
    police: '102 / 112',
    ambulance: '103 / 112',
    fire: '101 / 112',
    notes: 'Rusya genelinde cep telefonlarından 112 aranabilir. Polis 102, Ambulans 103, Yangın 101.',
    embassy: {
      name: 'T.C. Moskova Büyükelçiliği',
      city: 'Moskova',
      address: '7. Rostovskiy Pereulok, 12, 115127 Moskova, Rusya',
      phone: '+7 495 994 4808',
      emergencyDutyPhone: '+7 925 504 6101',
      email: 'embassy.moscow@mfa.gov.tr',
      consulates: [
        {
          name: 'T.C. St. Petersburg Başkonsolosluğu',
          city: 'St. Petersburg',
          address: '7-ya Sovetskaya Ulitsa, 24, St. Petersburg 191036',
          phone: '+7 812 577 1042',
          emergencyDutyPhone: '+7 921 590 5373',
          email: 'consulate.stpetersburg@mfa.gov.tr'
        },
        {
          name: 'T.C. Kazan Başkonsolosluğu',
          city: 'Kazan / Tataristan',
          address: 'Ulitsa Gorkogo 23/27, Kazan 420015',
          phone: '+7 843 299 5310',
          emergencyDutyPhone: '+7 905 318 0998',
          email: 'consulate.kazan@mfa.gov.tr'
        }
      ]
    }
  },
  {
    id: 'EG',
    country: 'Mısır',
    code: 'eg',
    flag: '🇪🇬',
    keywords: 'misir egypt kahire cairo iskenderiye alexandria sharm el sheikh hurghada giza luxor',
    generalEmergency: '112 / 122',
    police: '122 (Turist Polisi: 126)',
    ambulance: '123',
    fire: '180',
    notes: 'Mısır’da turistler için Turist Polisi (126) hızlı müdahale sağlar. Polis 122, Ambulans 123.',
    embassy: {
      name: 'T.C. Kahire Büyükelçiliği',
      city: 'Kahire',
      address: '25 El-Falaki Str. Bab El-Louk, Kahire, Mısır',
      phone: '+20 2 2792 6740',
      emergencyDutyPhone: '+20 120 777 9797',
      email: 'embassy.cairo@mfa.gov.tr',
      consulates: [
        {
          name: 'T.C. İskenderiye Başkonsolosluğu',
          city: 'İskenderiye',
          address: '11 Kamel El Kilani St. Bab Sharki, Alexandria',
          phone: '+20 3 399 0700',
          emergencyDutyPhone: '+20 102 333 4467',
          email: 'consulate.alexandria@mfa.gov.tr'
        }
      ]
    }
  },
  {
    id: 'QA',
    country: 'Katar',
    code: 'qa',
    flag: '🇶🇦',
    keywords: 'katar qatar doha lusail al wakrah',
    generalEmergency: '999',
    police: '999',
    ambulance: '999',
    fire: '999',
    notes: 'Katar genelinde tek acil durum hattı 999’dur (Polis, Ambulans, İtfaiye tek merkezden koordine edilir).',
    embassy: {
      name: 'T.C. Doha Büyükelçiliği',
      city: 'Doha',
      address: 'Al Dafna, Zone 66, Saha 94, No: 20, Doha, Katar',
      phone: '+974 4495 1300',
      emergencyDutyPhone: '+974 5584 7564',
      email: 'embassy.doha@mfa.gov.tr'
    }
  },
  {
    id: 'SA',
    country: 'Suudi Arabistan',
    code: 'sa',
    flag: '🇸🇦',
    keywords: 'suudi arabistan saudi arabia riyad riyadh cidde jeddah mekke mecca medine medina umre hac',
    generalEmergency: '911 (Mekke/Riyad) / 999',
    police: '999',
    ambulance: '997',
    fire: '998',
    notes: 'Mekke ve Riyad bölgelerinde 911 aktiftir. Diğer bölgelerde Polis 999, Kızılay Ambulans 997, Yangın 998.',
    embassy: {
      name: 'T.C. Riyad Büyükelçiliği',
      city: 'Riyad',
      address: 'Diplomatic Quarter, Abdullah Al Sahmi St, Riyad, Suudi Arabistan',
      phone: '+966 11 482 0101',
      emergencyDutyPhone: '+966 50 148 5786',
      email: 'embassy.riyadh@mfa.gov.tr',
      consulates: [
        {
          name: 'T.C. Cidde Başkonsolosluğu (Hac & Umre İrtibat)',
          city: 'Cidde',
          address: 'Al Madinah Al Munawwarah Rd, Al Andalus, Cidde',
          phone: '+966 12 660 1607',
          emergencyDutyPhone: '+966 53 437 2074',
          email: 'consulate.jeddah@mfa.gov.tr'
        }
      ]
    }
  },
  {
    id: 'KR',
    country: 'Güney Kore',
    code: 'kr',
    flag: '🇰🇷',
    keywords: 'guney kore korea seoul seul busan incheon jeju',
    generalEmergency: '112 / 119',
    police: '112',
    ambulance: '119',
    fire: '119',
    notes: 'Güney Kore genelinde Polis 112, Ambulans ve İtfaiye 119’dur. Yabancı turistler için 1330 Turizm Danışma mevcuttur.',
    embassy: {
      name: 'T.C. Seul Büyükelçiliği',
      city: 'Seul',
      address: '40 Dongho-ro 20-gil, Jung-gu, Seul 04617, Güney Kore',
      phone: '+82 2 3780 1600',
      emergencyDutyPhone: '+82 10 3765 8945',
      email: 'embassy.seoul@mfa.gov.tr'
    }
  },
  {
    id: 'ME',
    country: 'Karadağ (Montenegro)',
    code: 'me',
    flag: '🇲🇪',
    keywords: 'karadag montenegro podgorica budva kotor tivat bar',
    generalEmergency: '112',
    police: '122',
    ambulance: '124',
    fire: '123',
    notes: 'Karadağ genelinde 112 tek acil hattır. Doğrudan hatlar: Polis 122, Ambulans 124, İtfaiye 123.',
    embassy: {
      name: 'T.C. Podgorica Büyükelçiliği',
      city: 'Podgorica',
      address: 'Radosava Burica bb, 81000 Podgorica, Karadağ',
      phone: '+382 20 445 700',
      emergencyDutyPhone: '+382 69 330 330',
      email: 'embassy.podgorica@mfa.gov.tr'
    }
  },
  {
    id: 'RS',
    country: 'Sırbistan',
    code: 'rs',
    flag: '🇷🇸',
    keywords: 'sirbistan serbia belgrad belgrade nis novi sad novi pazar',
    generalEmergency: '112',
    police: '192',
    ambulance: '194',
    fire: '193',
    notes: 'Sırbistan genelinde 112 aktiftir. Doğrudan Polis 192, Ambulans 194, Yangın 193.',
    embassy: {
      name: 'T.C. Belgrad Büyükelçiliği',
      city: 'Belgrad',
      address: 'Krunska 1, 11000 Belgrad, Sırbistan',
      phone: '+381 11 333 2400',
      emergencyDutyPhone: '+381 69 669 981',
      email: 'embassy.belgrade@mfa.gov.tr',
      consulates: [
        {
          name: 'T.C. Yeni Pazar (Novi Pazar) Başkonsolosluğu',
          city: 'Novi Pazar',
          address: 'Sutjeska 2, 36300 Novi Pazar, Sırbistan',
          phone: '+381 20 601 020',
          emergencyDutyPhone: '+381 69 669 982',
          email: 'consulate.novipazar@mfa.gov.tr'
        }
      ]
    }
  },
  {
    id: 'BA',
    country: 'Bosna-Hersek',
    code: 'ba',
    flag: '🇧🇦',
    keywords: 'bosna hersek bosnia saraybosna sarajevo mostar banja luka zenica',
    generalEmergency: '112',
    police: '122',
    ambulance: '124',
    fire: '123',
    notes: 'Bosna-Hersek genelinde 112 aktiftir. Polis 122, Ambulans 124, İtfaiye 123.',
    embassy: {
      name: 'T.C. Saraybosna Büyükelçiliği',
      city: 'Saraybosna',
      address: 'Andricev Venac 12, 71000 Saraybosna, Bosna-Hersek',
      phone: '+387 33 568 750',
      emergencyDutyPhone: '+387 61 780 200',
      email: 'embassy.sarajevo@mfa.gov.tr',
      consulates: [
        {
          name: 'T.C. Mostar Başkonsolosluğu',
          city: 'Mostar',
          address: 'Mala Tepa 24, 88000 Mostar, Bosna-Hersek',
          phone: '+387 36 551 209',
          emergencyDutyPhone: '+387 61 780 202',
          email: 'consulate.mostar@mfa.gov.tr'
        }
      ]
    }
  },
  {
    id: 'MK',
    country: 'Kuzey Makedonya',
    code: 'mk',
    flag: '🇲🇰',
    keywords: 'makedonya macedonia uskup skopje ohrid tetovo bitola manastir',
    generalEmergency: '112',
    police: '192',
    ambulance: '194',
    fire: '193',
    notes: 'Kuzey Makedonya genelinde tek numara 112 devrededir. Polis 192, Ambulans 194.',
    embassy: {
      name: 'T.C. Üsküp Büyükelçiliği',
      city: 'Üsküp',
      address: 'Slavej Planina BB, 1000 Üsküp, Kuzey Makedonya',
      phone: '+389 2 310 4710',
      emergencyDutyPhone: '+389 70 252 572',
      email: 'embassy.skopje@mfa.gov.tr'
    }
  },
  {
    id: 'CY',
    country: 'Kuzey Kıbrıs (KKTC)',
    code: 'cy',
    flag: '🇨🇾',
    keywords: 'kibris cyprus kktc lefkosa girne magusa famagusta',
    generalEmergency: '112',
    police: '155',
    ambulance: '112',
    fire: '199',
    notes: 'KKTC genelinde Ambulans için 112, Polis için 155, İtfaiye ve Yangın için 199 aranır.',
    embassy: {
      name: 'T.C. Lefkoşa Büyükelçiliği',
      city: 'Lefkoşa',
      address: 'Bedrettin Demirel Caddesi, Lefkoşa, KKTC',
      phone: '+90 392 600 3100',
      emergencyDutyPhone: '+90 548 830 02 02',
      email: 'buyukelcilik.lefkosa@mfa.gov.tr'
    }
  }
];

// Timezone to Country Code Mapping for Instant 0ms Synchronous Detection
const TIMEZONE_TO_COUNTRY_CODE = {
  'Europe/Istanbul': 'TR',
  'Asia/Istanbul': 'TR',
  'Europe/Rome': 'IT',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'Europe/London': 'GB',
  'Europe/Belfast': 'GB',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'America/Detroit': 'US',
  'America/Indiana/Indianapolis': 'US',
  'Europe/Madrid': 'ES',
  'Europe/Athens': 'GR',
  'Asia/Dubai': 'AE',
  'Asia/Tokyo': 'JP',
  'Europe/Zurich': 'CH',
  'Europe/Amsterdam': 'NL',
  'Europe/Vienna': 'AT',
  'Asia/Tbilisi': 'GE',
  'Asia/Bangkok': 'TH',
  'Asia/Baku': 'AZ',
  'Europe/Budapest': 'HU',
  'Europe/Prague': 'CZ',
  'Europe/Lisbon': 'PT',
  'Europe/Brussels': 'BE',
  'Europe/Warsaw': 'PL',
  'Europe/Moscow': 'RU',
  'Africa/Cairo': 'EG',
  'Asia/Qatar': 'QA',
  'Asia/Riyadh': 'SA',
  'Asia/Seoul': 'KR',
  'Europe/Podgorica': 'ME',
  'Europe/Belgrade': 'RS',
  'Europe/Sarajevo': 'BA',
  'Europe/Skopje': 'MK',
  'Asia/Nicosia': 'CY'
};

export default function EmergencyGuide({ isEmbedded = false, onNavigateTab }) {
  // Country Selection State (Default Italy or Turkey)
  const [selectedCountry, setSelectedCountry] = useState(EMERGENCY_COUNTRIES[0]);
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [detectedCity, setDetectedCity] = useState('');
  const [detectionSource, setDetectionSource] = useState(''); // 'gps' | 'ip' | 'timezone'
  const [isDetecting, setIsDetecting] = useState(true);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState('');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef(null);

  // Address & Text Copy State
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedDutyPhone, setCopiedDutyPhone] = useState(false);

  // "Güvendeyim" Geolocation Live Share State
  const [isLocating, setIsLocating] = useState(false);
  const [locationResult, setLocationResult] = useState(null);
  const [copiedLocation, setCopiedLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Google Maps JS API & Snazzy Maps WY (8097) Stili Referansları (Dashboard Tasarımı)
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  const [mapError, setMapError] = useState(false);

  // Snazzy Maps WY (8097) Stili ile Canlı Haritayı Yükle ve Güncelle
  useEffect(() => {
    if (!selectedCountry) return;

    let isMounted = true;
    const coords = COUNTRY_EMBASSY_COORDS[selectedCountry.id] || { lat: 39.8978, lon: 32.8123 };
    const apiKey = useSettingsStore.getState().googlePlacesApiKey || 'AIzaSyDLKVedSDIIzh5fbRpUta9oShiW2omr7O4';

    loadGoogleMapsScript(apiKey)
      .then((maps) => {
        if (!isMounted || !mapContainerRef.current) return;

        const center = { lat: Number(coords.lat), lng: Number(coords.lon) };

        if (!mapInstanceRef.current) {
          const map = new maps.Map(mapContainerRef.current, {
            center,
            zoom: 15,
            styles: WY_MAP_STYLE,
            disableDefaultUI: true,
            gestureHandling: 'none',
            scrollwheel: false,
            disableDoubleClickZoom: true,
            draggable: false,
            keyboardShortcuts: false,
            backgroundColor: '#ffffff'
          });

          // Move Travel özel konum pini (Dashboard ile birebir aynı turuncu lüks SVG pin)
          const markerSvg = {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40" fill="none">
                <defs>
                  <filter id="shadow" x="-20%" y="-10%" width="140%" height="130%">
                    <feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.35"/>
                  </filter>
                </defs>
                <path d="M16 0C7.16 0 0 7.16 0 16C0 26.8 14.5 37.6 15.1 38.1C15.4 38.3 15.7 38.4 16 38.4C16.3 38.4 16.6 38.3 16.9 38.1C17.5 37.6 32 26.8 32 16C32 7.16 24.84 0 16 0Z" fill="#D7147A" filter="url(#shadow)"/>
                <circle cx="16" cy="15" r="6.8" fill="#ffffff"/>
                <circle cx="16" cy="15" r="4.2" fill="#B01064"/>
              </svg>
            `),
            scaledSize: new maps.Size(32, 40),
            anchor: new maps.Point(16, 40)
          };

          const marker = new maps.Marker({
            position: center,
            map,
            title: selectedCountry.embassy.name,
            icon: markerSvg
          });

          mapInstanceRef.current = map;
          markerInstanceRef.current = marker;
        } else {
          mapInstanceRef.current.setCenter(center);
          mapInstanceRef.current.setZoom(15);
          if (markerInstanceRef.current) {
            markerInstanceRef.current.setPosition(center);
            markerInstanceRef.current.setTitle(selectedCountry.embassy.name);
          }
        }
      })
      .catch((err) => {
        console.warn('Google Maps JS API load error, falling back to iframe', err);
        if (isMounted) setMapError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCountry]);

  // 1. AUTOMATIC COUNTRY DETECTION (Timezone + IP on mount)
  useEffect(() => {
    let isCancelled = false;

    const runAutoDetection = async () => {
      setIsDetecting(true);

      // Method A: Fast instant synchronous timezone inspection (0ms)
      try {
        const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const matchedCode = TIMEZONE_TO_COUNTRY_CODE[localTz];
        if (matchedCode) {
          const match = EMERGENCY_COUNTRIES.find(c => c.id === matchedCode);
          if (match && !isCancelled) {
            setSelectedCountry(match);
            setDetectedCountry(match);
            setDetectionSource('timezone');
            setDetectionMessage(`Zaman diliminiz (${localTz.split('/')[1] || localTz}) üzerinden algılandı`);
          }
        }
      } catch (tzErr) {
        // Continue to IP detection
      }

      // Method B: High-reliability IP Geolocation fetch (~300ms)
      try {
        const ipRes = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(3500) });
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData && ipData.success && ipData.country_code) {
            const codeUpper = ipData.country_code.toUpperCase();
            const match = EMERGENCY_COUNTRIES.find(c => c.id === codeUpper);
            if (match && !isCancelled) {
              setSelectedCountry(match);
              setDetectedCountry(match);
              setDetectedCity(ipData.city || '');
              setDetectionSource('ip');
              setDetectionMessage(ipData.city ? `${ipData.city}, ${match.country} (IP Bağlantısı)` : `${match.country} (IP Bağlantısı)`);
              setIsDetecting(false);
              return;
            }
          }
        }
      } catch (ipErr) {
        // Fallback to secondary IP service
        try {
          const res2 = await fetch('https://api.country.is/', { signal: AbortSignal.timeout(2500) });
          if (res2.ok) {
            const data2 = await res2.json();
            if (data2 && data2.country) {
              const code2 = data2.country.toUpperCase();
              const match2 = EMERGENCY_COUNTRIES.find(c => c.id === code2);
              if (match2 && !isCancelled) {
                setSelectedCountry(match2);
                setDetectedCountry(match2);
                setDetectionSource('ip');
                setDetectionMessage(`${match2.country} (Ağ Bağlantısı)`);
                setIsDetecting(false);
                return;
              }
            }
          }
        } catch (e2) {}
      }

      if (!isCancelled) {
        setIsDetecting(false);
      }
    };

    runAutoDetection();

    return () => {
      isCancelled = true;
    };
  }, []);

  // 2. MANUAL GPS REVERSE GEOCODING (Precise Device Geolocation)
  const handleVerifyWithGps = () => {
    if (!navigator.geolocation) {
      alert('Cihazınızda konum servisi bulunamadı.');
      return;
    }

    setIsGpsActive(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=tr`,
            { signal: AbortSignal.timeout(6000) }
          );
          if (res.ok) {
            const data = await res.json();
            const countryCode = data.countryCode ? data.countryCode.toUpperCase() : '';
            const match = EMERGENCY_COUNTRIES.find(c => c.id === countryCode) ||
              EMERGENCY_COUNTRIES.find(c => c.country.toLowerCase().includes((data.countryName || '').toLowerCase()));

            if (match) {
              setSelectedCountry(match);
              setDetectedCountry(match);
              setDetectedCity(data.city || data.locality || '');
              setDetectionSource('gps');
              setDetectionMessage(`Doğrulandı: ${data.city || data.locality || match.country} (GPS Canlı)`);
            } else {
              setDetectionMessage(`Konumunuz: ${data.countryName || 'Bilinmeyen'} (Rehberde en yakın acil hat seçilebilir)`);
            }
          }
        } catch (err) {
          console.error('GPS Geocoding error:', err);
        } finally {
          setIsGpsActive(false);
        }
      },
      (err) => {
        setIsGpsActive(false);
        alert('Konum izni verilemedi. Lütfen tarayıcı ayarlarından konum iznini kontrol edin.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // 3. SEARCH FILTERING
  const searchNormalized = searchQuery.trim().toLowerCase();
  const searchResults = searchNormalized
    ? EMERGENCY_COUNTRIES.filter(c => {
        return (
          c.country.toLowerCase().includes(searchNormalized) ||
          c.embassy.city.toLowerCase().includes(searchNormalized) ||
          (c.keywords && c.keywords.toLowerCase().includes(searchNormalized)) ||
          (c.embassy.consulates && c.embassy.consulates.some(con => con.city.toLowerCase().includes(searchNormalized) || con.name.toLowerCase().includes(searchNormalized)))
        );
      })
    : [];

  const handleSelectCountry = (country) => {
    setSelectedCountry(country);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  // 4. "GÜVENDİYİM" (I AM SAFE) ACTION
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Tarayıcınız konum servisini desteklemiyor.');
      return;
    }

    setIsLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        const messageText = `Güvendeyim! Şu anda ${selectedCountry.country} seyahatindeyim. Canlı Konumum: ${mapsUrl} (Move Yanımda Seyahat Asistanı)`;
        setLocationResult({ latitude, longitude, mapsUrl, messageText });
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setLocationError('Konum alınamadı: Lütfen cihazınızda GPS ve konum iznini açın.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCopyLocation = () => {
    if (!locationResult) return;
    navigator.clipboard.writeText(locationResult.messageText);
    setCopiedLocation(true);
    setTimeout(() => setCopiedLocation(false), 2000);
  };

  const handleCopyAddress = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCopyDutyPhone = (phone) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedDutyPhone(true);
    setTimeout(() => setCopiedDutyPhone(false), 2000);
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', color: '#0f172a' }}>
      
      {/* 1. TOP HEADER */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        padding: '12px 16px',
        marginBottom: '14px',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
      }}>
        {/* Title Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: '#fef2f2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(220, 38, 38, 0.1)'
          }}>
            <ShieldAlert size={17} strokeWidth={2.4} />
          </div>
          <div>
            <h1 style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.2px' }}>
              Acil Durum & Konsolosluk Rehberi
            </h1>
            <p style={{ fontSize: '9.5px', color: '#64748b', margin: '2px 0 0 0' }}>
              Bulunduğunuz ülkedeki yerel acil numaralar ve 7/24 T.C. Büyükelçilik hatları
            </p>
          </div>
        </div>
      </div>

      {/* 2. SEARCH BAR */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        padding: '14px 16px',
        marginBottom: '14px',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
        position: 'relative'
      }}>
        {/* Search Input Box */}
        <div style={{ position: 'relative' }}>
          <Search 
            size={14} 
            color="#94a3b8" 
            style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }} 
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Hangi ülkedesiniz veya nereye gidiyorsunuz?"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            style={{
              width: '100%',
              padding: '8.5px 32px 8.5px 32px',
              borderRadius: '11px',
              border: isSearchFocused ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
              background: '#f8fafc',
              fontSize: '11px',
              fontWeight: '550',
              color: '#0f172a',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s ease'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#e2e8f0',
                border: 'none',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#475569'
              }}
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown when typing */}
        {searchQuery.trim().length > 0 && (
          <div style={{
            position: 'absolute',
            top: '58px',
            left: '16px',
            right: '16px',
            background: '#ffffff',
            borderRadius: '14px',
            border: '1.5px solid #fecaca',
            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.15)',
            zIndex: 30,
            maxHeight: '260px',
            overflowY: 'auto'
          }}>
            {searchResults.length > 0 ? (
              searchResults.map(c => (
                <div
                  key={c.id}
                  onClick={() => handleSelectCountry(c)}
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'background 0.1s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                  onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CountryFlag country={c.country} size="sm" />
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>
                        {c.country}
                      </div>
                      <div style={{ fontSize: '9px', color: '#64748b', marginTop: '1px' }}>
                        {c.embassy.city} • {c.embassy.name}
                      </div>
                    </div>
                  </div>

                  <ArrowRight size={12} color="#cbd5e1" />
                </div>
              ))
            ) : (
              <div style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b', fontSize: '11px' }}>
                "{searchQuery}" için sonuç bulunamadı. Lütfen ülke veya şehir adını kontrol edin.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. HERO EMERGENCY ACTION GRID: SOS SIREN & 7/24 CONSULATE CALL CENTER */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '12px',
        marginBottom: '14px'
      }}>
        {/* CARD A: SOS SIREN TRIGGER */}
        <div
          onClick={() => {
            if (onNavigateTab) {
              onNavigateTab('siren');
            } else {
              window.location.href = '/travel-tools?tab=siren';
            }
          }}
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #991b1b 100%)',
            color: '#ffffff',
            borderRadius: '18px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.25)',
            transition: 'transform 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              backdropFilter: 'blur(4px)'
            }}>
              <Siren size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '-0.2px' }}>
                Acil Durum & SOS Sireni
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.9)', marginTop: '2px' }}>
                Yüksek sesli panik alarmı & ekran flaşörünü açın
              </div>
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            color: '#dc2626',
            padding: '6px 12px',
            borderRadius: '16px',
            fontSize: '11px',
            fontWeight: '800',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}>
            <span>Sireni Aç</span>
            <ArrowRight size={13} strokeWidth={2.5} />
          </div>
        </div>

        {/* CARD B: T.C. MFA GLOBAL CALL CENTER (24/7 ÇAĞRI MERKEZİ) */}
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1.5px solid #fecaca',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
        }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '800', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '3px' }}>
              T.C. Dışişleri Bakanlığı 7/24 Çağrı Merkezi
            </div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', marginBottom: '3px', lineHeight: 1.2 }}>
              +90 312 292 29 29
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.3 }}>
              Tüm dünyadan 7/24 Türkçe kesintisiz yardım hattı
            </div>
          </div>

          <a
            href="tel:+903122922929"
            title="+90 312 292 29 29 Ara"
            style={{
              background: '#dc2626',
              color: '#ffffff',
              borderRadius: '13px',
              width: '40px',
              height: '40px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
              transition: 'transform 0.1s ease'
            }}
          >
            <Phone size={18} />
          </a>
        </div>
      </div>

      {/* 4. SELECTED COUNTRY DETAILS & LOCAL EMERGENCY NUMBERS */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        padding: '18px',
        marginBottom: '14px',
        boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)'
      }}>
        {/* Country Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <CountryFlag country={selectedCountry.country} size="md" style={{ width: '22px', height: '15px' }} />
          <div>
            <h2 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              {selectedCountry.country} Yerel Acil Numaraları
            </h2>
            <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '3px' }}>
              Tek dokunuşla hemen arayabilirsiniz (SIM kartsız da çalışır)
            </div>
          </div>
        </div>

        {/* 4-TACTILE QUICK DIAL EMERGENCY NUMBERS GRID */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '8px',
          marginBottom: '10px'
        }}>
          {/* 1. GENEL ACİL (GENERAL EMERGENCY) */}
          <a
            href={`tel:${selectedCountry.generalEmergency.split(' ')[0].replace(/[^0-9+]/g, '')}`}
            style={{
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              border: '1.5px solid #fca5a5',
              borderRadius: '12px',
              padding: '9px 11px',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 1px 4px rgba(220, 38, 38, 0.06)',
              transition: 'transform 0.1s ease'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '8.5px', fontWeight: '800', color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  GENEL ACİL
                </span>
                <Phone size={11} color="#dc2626" />
              </div>
              <div style={{ fontSize: '17px', fontWeight: '900', color: '#dc2626', margin: '2px 0 1px' }}>
                {selectedCountry.generalEmergency}
              </div>
            </div>
            <div style={{ fontSize: '8.5px', fontWeight: '800', color: '#b91c1c' }}>
              Hemen Ara ↗
            </div>
          </a>

          {/* 2. POLİS (POLICE) */}
          <a
            href={`tel:${selectedCountry.police.split(' ')[0].replace(/[^0-9+]/g, '')}`}
            style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              border: '1.5px solid #93c5fd',
              borderRadius: '12px',
              padding: '9px 11px',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 1px 4px rgba(2, 132, 199, 0.06)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '8.5px', fontWeight: '800', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  POLİS İMDAT
                </span>
                <ShieldAlert size={11} color="#2563eb" />
              </div>
              <div style={{ fontSize: '17px', fontWeight: '900', color: '#1d4ed8', margin: '2px 0 1px' }}>
                {selectedCountry.police.split(' ')[0]}
              </div>
            </div>
            <div style={{ fontSize: '8.5px', fontWeight: '700', color: '#1e40af' }}>
              {selectedCountry.police.includes('(') ? selectedCountry.police.split('(')[1].replace(')', '') : 'Polis Hattı ↗'}
            </div>
          </a>

          {/* 3. AMBULANS (AMBULANCE) */}
          <a
            href={`tel:${selectedCountry.ambulance.split(' ')[0].replace(/[^0-9+]/g, '')}`}
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1.5px solid #86efac',
              borderRadius: '12px',
              padding: '9px 11px',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 1px 4px rgba(22, 163, 74, 0.06)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '8.5px', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  AMBULANS & SAĞLIK
                </span>
                <HeartPulse size={11} color="#16a34a" />
              </div>
              <div style={{ fontSize: '17px', fontWeight: '900', color: '#15803d', margin: '2px 0 1px' }}>
                {selectedCountry.ambulance.split(' ')[0]}
              </div>
            </div>
            <div style={{ fontSize: '8.5px', fontWeight: '700', color: '#166534' }}>
              Acil Sağlık ↗
            </div>
          </a>

          {/* 4. İTFAİYE (FIRE BRIGADE) */}
          <a
            href={`tel:${selectedCountry.fire.split(' ')[0].replace(/[^0-9+]/g, '')}`}
            style={{
              background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
              border: '1.5px solid #F9BED8',
              borderRadius: '12px',
              padding: '9px 11px',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 1px 4px rgba(215, 20, 122, 0.06)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '8.5px', fontWeight: '800', color: '#8E0C51', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  İTFAİYE & YANGIN
                </span>
                <Flame size={11} color="#D7147A" />
              </div>
              <div style={{ fontSize: '17px', fontWeight: '900', color: '#B01064', margin: '2px 0 1px' }}>
                {selectedCountry.fire.split(' ')[0]}
              </div>
            </div>
            <div style={{ fontSize: '8.5px', fontWeight: '700', color: '#8E0C51' }}>
              Yangın İhbar ↗
            </div>
          </a>
        </div>

        {/* Country Travel Note */}
        {selectedCountry.notes && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '7px 10px',
            fontSize: '9.5px',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            lineHeight: 1.4
          }}>
            <Info size={13} color="#0284c7" style={{ flexShrink: 0 }} />
            <span>{selectedCountry.notes}</span>
          </div>
        )}
      </div>

      {/* 5. T.C. BÜYÜKELÇİLİĞİ & KONSOLOSLUK RESMİ BİLGİ KARTI */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1.5px solid #e2e8f0',
        padding: '18px',
        marginBottom: '14px',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)'
      }}>
        {/* Embassy Card Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '10px',
          marginBottom: '12px'
        }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '9px',
            background: '#fef2f2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Building2 size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: '9px', fontWeight: '800', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
              Resmi T.C. Dış Temsilciliği
            </div>
            <h3 
              title={selectedCountry.embassy.name}
              style={{ 
                fontSize: 'clamp(9px, 2.5vw, 12.5px)', 
                fontWeight: '800', 
                color: '#0f172a', 
                margin: '1px 0 0 0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.3
              }}
            >
              {selectedCountry.embassy.name}
            </h3>
          </div>
        </div>

        {/* Harita ve Adres Kartı (Ana Sayfa Tasarımı ile Canlı Google Maps) */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1.2px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          marginBottom: '14px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Canlı Google Maps / Snazzy Maps WY (Dashboard Tasarımı) */}
          <div style={{
            position: 'relative',
            height: '165px',
            width: '100%',
            backgroundColor: '#f1f5f9',
            overflow: 'hidden'
          }}>
            <style>{`
              .wy-guide-map .gm-style-pbc { display: none !important; }
              .wy-guide-map .gm-style-cc { display: none !important; }
              .wy-guide-map .gmnoprint { display: none !important; }
              .wy-guide-map a[href^="https://maps.google.com/maps"] { opacity: 0.25 !important; }
            `}</style>

            {mapError ? (
              <iframe
                title={`${selectedCountry.embassy.name} Canlı Haritası`}
                src={`https://maps.google.com/maps?q=${encodeURIComponent((selectedCountry.embassy.name || '') + ' ' + (selectedCountry.embassy.address || ''))}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                style={{
                  border: 0,
                  display: 'block',
                  filter: 'grayscale(100%) invert(5%) contrast(1.15) brightness(0.96)'
                }}
                loading="lazy"
                allowFullScreen
              />
            ) : (
              <div
                ref={mapContainerRef}
                className="wy-guide-map"
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((selectedCountry.embassy.name || '') + ' ' + (selectedCountry.embassy.address || ''))}`, '_blank')}
                title="Google Maps ile Haritada Gör"
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer'
                }}
              />
            )}

            {/* Sol Üst Harita İçi Rozet */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'rgba(15, 23, 42, 0.78)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              color: '#ffffff',
              padding: '3px 8.5px',
              borderRadius: '9px',
              fontSize: '10px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
              zIndex: 10
            }}>
              <MapPin size={11} color="#38bdf8" strokeWidth={2.4} />
              <span>{selectedCountry.country}</span>
            </div>

            {/* Sağ Üst Haritayı Büyüt / Yeni Sekmede Aç */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((selectedCountry.embassy.name || '') + ' ' + (selectedCountry.embassy.address || ''))}`}
              target="_blank"
              rel="noreferrer"
              title="Büyük Haritada Aç"
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(15, 23, 42, 0.78)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                color: '#ffffff',
                padding: '4px 9px',
                borderRadius: '9px',
                fontSize: '9.5px',
                fontWeight: '700',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
                zIndex: 10
              }}
            >
              <span>Haritada Aç</span>
              <ExternalLink size={10} />
            </a>

            {/* Harita Alt Gradient Gölgesi (Dashboard İle Birebir) */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '64px',
              background: 'linear-gradient(to top, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.55) 60%, transparent 100%)',
              pointerEvents: 'none',
              zIndex: 5
            }} />

            {/* Sol Alt Görsel / Harita İçi: Temsilcilik Tam Adı (Ekrana Göre Tek Satır Ölçekleme) */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '12px',
              right: '12px',
              zIndex: 10,
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              minWidth: 0,
              overflow: 'hidden'
            }}>
              <div 
                title={selectedCountry.embassy.name}
                style={{
                  fontSize: 'clamp(9px, 2.5vw, 12px)',
                  fontWeight: '800',
                  color: '#ffffff',
                  letterSpacing: '-0.2px',
                  textShadow: '0 2px 8px rgba(0,0,0,0.85)',
                  lineHeight: 1.25,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {selectedCountry.embassy.name}
              </div>
              <div style={{
                fontSize: 'clamp(8.5px, 2vw, 9.5px)',
                color: '#cbd5e1',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                <span>{selectedCountry.embassy.city}</span>
                <span>•</span>
                <span style={{ color: '#E54B98' }}>{selectedCountry.country}</span>
              </div>
            </div>
          </div>

          {/* Harita Altındaki Açık Adres ve Hızlı İşlem Butonları */}
          <div style={{
            padding: '12px 14px',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ fontSize: '9px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.3px' }}>
                Açık Adres:
              </div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#1e293b', lineHeight: 1.45 }}>
                {selectedCountry.embassy.address}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Copy Address */}
              <button
                type="button"
                onClick={() => handleCopyAddress(selectedCountry.embassy.address)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '9px',
                  padding: '6px 10px',
                  fontSize: '10.5px',
                  fontWeight: '700',
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}
              >
                {copiedAddress ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                <span>{copiedAddress ? 'Kopyalandı' : 'Kopyala'}</span>
              </button>

              {/* Google Maps Directions */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((selectedCountry.embassy.name || '') + ' ' + (selectedCountry.embassy.address || ''))}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#0284c7',
                  border: 'none',
                  borderRadius: '9px',
                  padding: '6px 11px',
                  fontSize: '10.5px',
                  fontWeight: '800',
                  color: '#ffffff',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.2)'
                }}
              >
                <Navigation size={12} />
                <span>Yol Tarifi Al ↗</span>
              </a>
            </div>
          </div>
        </div>

        {/* EMBASSY CALL BUTTONS (24/7 Nöbetçi Cep vs Santral) */}
        {!selectedCountry.embassy.isDomestic ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '10px',
            marginBottom: '14px'
          }}>
            {/* 1. 24/7 ACİL NÖBETÇİ TELEFONU (HIGH PRIORITY) */}
            <div style={{
              background: '#fef2f2',
              border: '1.5px solid #fca5a5',
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#dc2626',
                    animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
                  }} />
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#991b1b', textTransform: 'uppercase' }}>
                    7/24 Acil Nöbetçi Hattı
                  </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '900', color: '#b91c1c', marginTop: '2px' }}>
                  {selectedCountry.embassy.emergencyDutyPhone}
                </div>
                <div style={{ fontSize: '9.5px', color: '#dc2626' }}>
                  (Mesai dışı ve acil durumlar içindir)
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleCopyDutyPhone(selectedCountry.embassy.emergencyDutyPhone)}
                  title="Numarayı kopyala"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #fca5a5',
                    borderRadius: '10px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#991b1b'
                  }}
                >
                  {copiedDutyPhone ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                </button>
                <a
                  href={`tel:${selectedCountry.embassy.emergencyDutyPhone.replace(/\s+/g, '')}`}
                  style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    textDecoration: 'none',
                    fontSize: '11px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)'
                  }}
                >
                  <Phone size={13} />
                  <span>Ara</span>
                </a>
              </div>
            </div>

            {/* 2. BÜYÜKELÇİLİK SANTRALİ & E-POSTA */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                  Büyükelçilik Santrali
                </div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                  {selectedCountry.embassy.phone}
                </div>
                {selectedCountry.embassy.email && (
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                    {selectedCountry.embassy.email}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {selectedCountry.embassy.email && (
                  <a
                    href={`mailto:${selectedCountry.embassy.email}`}
                    title="E-posta Gönder"
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#475569'
                    }}
                  >
                    <Mail size={13} />
                  </a>
                )}
                <a
                  href={`tel:${selectedCountry.embassy.phone.replace(/\s+/g, '')}`}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    color: '#0f172a',
                    borderRadius: '10px',
                    padding: '7px 11px',
                    textDecoration: 'none',
                    fontSize: '11px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Phone size={13} />
                  <span>Santral</span>
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* Domestic Türkiye Services list */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '8px',
            marginBottom: '14px'
          }}>
            {selectedCountry.embassy.extraServices?.map(serv => (
              <div
                key={serv.name}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>{serv.name}</div>
                  <div style={{ fontSize: '9.5px', color: '#64748b' }}>{serv.desc}</div>
                </div>
                <a
                  href={`tel:${serv.phone.replace(/[^0-9+]/g, '')}`}
                  style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    padding: '5px 9px',
                    borderRadius: '8px',
                    fontSize: '10.5px',
                    fontWeight: '800',
                    textDecoration: 'none'
                  }}
                >
                  {serv.phone}
                </a>
              </div>
            ))}
          </div>
        )}

        {/* DİĞER ŞEHİRLERDEKİ T.C. BAŞKONSOLOSLUKLARI (EXPANDABLE / ACCORDION) */}
        {selectedCountry.embassy.consulates && selectedCountry.embassy.consulates.length > 0 && (
          <div style={{
            borderTop: '1px solid #f1f5f9',
            paddingTop: '12px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Building2 size={13} color="#D7147A" />
              <span>Diğer Şehirlerdeki T.C. Başkonsoloslukları ({selectedCountry.embassy.consulates.length}):</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
              {selectedCountry.embassy.consulates.map(con => (
                <div
                  key={con.name}
                  style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '10px 12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#0f172a' }}>
                      {con.name}
                    </span>
                    <span style={{ fontSize: '10px', color: '#64748b', background: '#e2e8f0', padding: '1px 6px', borderRadius: '6px' }}>
                      {con.city}
                    </span>
                  </div>

                  <div style={{ fontSize: '10.5px', color: '#64748b', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <MapPin size={11} style={{ display: 'inline', marginRight: '3px', verticalAlign: '-1px' }} />
                    {con.address}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <a
                      href={`tel:${con.phone.replace(/\s+/g, '')}`}
                      style={{
                        flex: 1,
                        fontSize: '10.5px',
                        color: '#334155',
                        textDecoration: 'none',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '5px 8px',
                        fontWeight: '700',
                        textAlign: 'center',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {con.phone}
                    </a>

                    <a
                      href={`tel:${con.emergencyDutyPhone.replace(/\s+/g, '')}`}
                      style={{
                        flex: 1,
                        fontSize: '10.5px',
                        color: '#991b1b',
                        textDecoration: 'none',
                        background: '#fee2e2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        padding: '5px 8px',
                        fontWeight: '800',
                        textAlign: 'center',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {con.emergencyDutyPhone}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. "GÜVENDİYİM" (I AM SAFE) ACTION CARD */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1.2px solid #e2e8f0',
        padding: '16px 18px',
        marginBottom: '14px',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
        position: 'relative'
      }}>
        {/* Header row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#ecfdf5',
              border: '1px solid #d1fae5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Navigation size={14} strokeWidth={2.4} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '800',
                color: '#0f172a',
                lineHeight: 1.25,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                "Güvendeyim" & GPS Konum Paylaşımı
              </div>
              <div style={{
                fontSize: '9px',
                color: '#64748b',
                marginTop: '1px',
                lineHeight: 1.25,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Ailenize ve yakınlarınıza canlı durum bildirimi gönderin
              </div>
            </div>
          </div>

          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#047857',
            padding: '2px 6px',
            borderRadius: '6px',
            fontSize: '8px',
            fontWeight: '800',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}>
            <span style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: '#10b981',
              display: 'inline-block'
            }} />
            <span>Canlı GPS</span>
          </div>
        </div>

        {/* Content body */}
        {!locationResult ? (
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isLocating}
            style={{
              width: '100%',
              padding: '8.5px 12px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              fontSize: '10.5px',
              fontWeight: '800',
              cursor: isLocating ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.2)',
              transition: 'transform 0.15s ease',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {isLocating ? (
              <>
                <Loader2 size={13} style={{ animation: 'spin 1s infinite linear' }} />
                <span>GPS Konumu Alınıyor...</span>
              </>
            ) : (
              <>
                <Navigation size={13} />
                <span>Konumumu Al ve "Güvendeyim" Bildirimi Oluştur</span>
              </>
            )}
          </button>
        ) : (
          <div style={{
            background: '#f8fafc',
            borderRadius: '14px',
            border: '1.2px solid #e2e8f0',
            padding: '12px 14px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Check size={12} strokeWidth={3} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#15803d' }}>
                  Canlı Konumunuz Başarıyla Alındı
                </span>
              </div>

              <button
                type="button"
                onClick={handleGetLocation}
                title="Konumu Yenile"
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '7px',
                  padding: '3px 8px',
                  color: '#475569',
                  fontSize: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RefreshCw size={10} />
                <span>Yenile</span>
              </button>
            </div>

            <div style={{
              fontSize: '11px',
              color: '#334155',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              padding: '9px 11px',
              borderRadius: '9px',
              marginBottom: '10px',
              lineHeight: 1.45,
              wordBreak: 'break-all'
            }}>
              {locationResult.messageText}
            </div>

            {/* Quick Share Buttons (Yazısız Yan Yana Kare Butonlar) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginTop: '4px'
            }}>
              {/* WhatsApp Button */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(locationResult.messageText)}`}
                target="_blank"
                rel="noreferrer"
                title="WhatsApp ile Paylaş"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#25D366',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(37, 211, 102, 0.28)',
                  transition: 'transform 0.15s ease',
                  flexShrink: 0
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <MessageSquare size={18} />
              </a>

              {/* SMS Button */}
              <a
                href={`sms:?body=${encodeURIComponent(locationResult.messageText)}`}
                title="SMS ile Gönder"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#0284c7',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.28)',
                  transition: 'transform 0.15s ease',
                  flexShrink: 0
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Share2 size={17} />
              </a>

              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopyLocation}
                title={copiedLocation ? "Kopyalandı!" : "Metni Kopyala"}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: copiedLocation ? '#dcfce7' : '#ffffff',
                  border: copiedLocation ? '1.5px solid #86efac' : '1.2px solid #cbd5e1',
                  color: copiedLocation ? '#16a34a' : '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  transition: 'transform 0.15s ease',
                  flexShrink: 0
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {copiedLocation ? <Check size={18} strokeWidth={2.6} color="#16a34a" /> : <Copy size={17} />}
              </button>
            </div>
          </div>
        )}

        {locationError && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '8px 11px',
            borderRadius: '9px',
            fontSize: '10.5px',
            marginTop: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertTriangle size={13} color="#dc2626" />
            <span>{locationError}</span>
          </div>
        )}
      </div>

      {/* 7. PRACTICAL TRAVEL SAFETY TIPS */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1.2px solid #e2e8f0',
        padding: '16px 18px',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
        marginBottom: '20px'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          marginBottom: '18px'
        }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '9px',
            background: '#FDF2F8',
            border: '1px solid #FCE7F3',
            color: '#D7147A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldAlert size={15} strokeWidth={2.4} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: '11.5px',
              fontWeight: '800',
              color: '#0f172a',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Yurt Dışı Seyahatinde Acil Durum Rehberi
            </h3>
            <p style={{
              fontSize: '9.5px',
              color: '#64748b',
              margin: '1px 0 0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Yurt dışında güvenliğiniz için unutmamanız gereken temel bilgiler
            </p>
          </div>
        </div>

        {/* 3 Structured Items Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '10px'
        }}>
          {/* Tip 1: 112 Ortak Acil Hattı */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{
                  fontSize: '9px',
                  fontWeight: '800',
                  color: '#0369a1',
                  background: '#e0f2fe',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  textTransform: 'uppercase'
                }}>
                  SIM Kartsız & Ücretsiz
                </span>
                <Phone size={13} color="#0284c7" />
              </div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                112 Ortak Acil Çağrı
              </div>
              <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                Avrupa Birliği genelinde kilitli ekrandan ve SIM kart takılı olmadan dahi her telefondan ücretsiz aranabilir.
              </p>
            </div>
          </div>

          {/* Tip 2: Pasaport Kaybı Prosedürü */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{
                  fontSize: '9px',
                  fontWeight: '800',
                  color: '#b45309',
                  background: '#fef3c7',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  textTransform: 'uppercase'
                }}>
                  Polis Raporu Şartı
                </span>
                <Building2 size={13} color="#d97706" />
              </div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                Pasaport Kaybı Durumu
              </div>
              <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                Derhal yerel polis merkezinden "Kayıp Tutanağı" (Police Report) alın ve geçici pasaport için en yakın T.C. Başkonsolosluğuna gidin.
              </p>
            </div>
          </div>

          {/* Tip 3: 7/24 Dışişleri Çağrı Merkezi */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{
                  fontSize: '9px',
                  fontWeight: '800',
                  color: '#15803d',
                  background: '#dcfce7',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  textTransform: 'uppercase'
                }}>
                  7/24 Türkçe Destek
                </span>
                <Globe size={13} color="#16a34a" />
              </div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                +90 312 292 29 29
              </div>
              <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                Tüm dünyadan kesintisiz Türkçe konsolosluk desteği sağlar. Seyahate çıkmadan önce rehberinize kaydetmeniz önerilir.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
