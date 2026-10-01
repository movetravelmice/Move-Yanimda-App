import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import { 
  ShieldAlert, 
  PhoneCall, 
  Building2, 
  Navigation, 
  LocateFixed, 
  Loader2, 
  ChevronRight, 
  Check, 
  Share2,
  MapPin
} from 'lucide-react';

// Snazzy Maps: WY (https://snazzymaps.com/style/8097/wy)
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

// Kapsamlı ve Canlı T.C. Dış Temsilcilikleri & Türkiye İçi Bölge Temsilcilikleri Veritabanı
const TURKISH_MISSIONS = [
  // TÜRKİYE İÇİ MERKEZ VE BÖLGE TEMSİLCİLİKLERİ
  {
    id: 'tr-istanbul',
    name: 'T.C. Dışişleri Bakanlığı İstanbul Temsilciliği',
    city: 'İstanbul',
    country: 'Türkiye',
    address: 'Birlik Sok. No: 16, 34330 Levent, Beşiktaş, İstanbul',
    phone: '+90 212 284 84 84',
    emergencyPhone: '+90 312 292 29 29',
    lat: 41.0825,
    lon: 29.0152,
    emergencyNum: '112'
  },
  {
    id: 'tr-ankara',
    name: 'T.C. Dışişleri Bakanlığı & 7/24 Çağrı Merkezi',
    city: 'Ankara',
    country: 'Türkiye',
    address: 'Dr. Sadık Ahmet Cad. No: 8 Balgat, Çankaya, Ankara',
    phone: '+90 312 292 10 00',
    emergencyPhone: '+90 312 292 29 29',
    lat: 39.8978,
    lon: 32.8123,
    emergencyNum: '112'
  },
  {
    id: 'tr-izmir',
    name: 'T.C. Dışişleri Bakanlığı İzmir Temsilciliği',
    city: 'İzmir',
    country: 'Türkiye',
    address: 'Akdeniz Mah. Cumhuriyet Bulvarı No: 12 Konak, İzmir',
    phone: '+90 232 489 82 82',
    emergencyPhone: '+90 312 292 29 29',
    lat: 38.4192,
    lon: 27.1287,
    emergencyNum: '112'
  },
  {
    id: 'tr-antalya',
    name: 'T.C. Dışişleri Bakanlığı Antalya Temsilciliği',
    city: 'Antalya',
    country: 'Türkiye',
    address: 'Şirinyalı Mah. 1487. Sok. Muratpaşa, Antalya',
    phone: '+90 242 248 10 10',
    emergencyPhone: '+90 312 292 29 29',
    lat: 36.8841,
    lon: 30.7056,
    emergencyNum: '112'
  },
  {
    id: 'tr-gaziantep',
    name: 'T.C. Dışişleri Bakanlığı Gaziantep Temsilciliği',
    city: 'Gaziantep',
    country: 'Türkiye',
    address: 'İncilipınar Mah. Muammer Aksoy Blv. Şehitkamil, Gaziantep',
    phone: '+90 342 211 80 00',
    emergencyPhone: '+90 312 292 29 29',
    lat: 37.0662,
    lon: 37.3833,
    emergencyNum: '112'
  },
  {
    id: 'tr-diyarbakir',
    name: 'T.C. Dışişleri Bakanlığı Diyarbakır Temsilciliği',
    city: 'Diyarbakır',
    country: 'Türkiye',
    address: 'Kooperatifler Mah. Kurtismailpaşa 2. Sk. Yenişehir, Diyarbakır',
    phone: '+90 412 228 00 00',
    emergencyPhone: '+90 312 292 29 29',
    lat: 37.9144,
    lon: 40.2306,
    emergencyNum: '112'
  },
  {
    id: 'tr-edirne',
    name: 'T.C. Dışişleri Bakanlığı Edirne Temsilciliği',
    city: 'Edirne',
    country: 'Türkiye',
    address: 'Şükrüpaşa Mah. Kıyık Cad. Merkez, Edirne',
    phone: '+90 284 213 00 00',
    emergencyPhone: '+90 312 292 29 29',
    lat: 41.6772,
    lon: 26.5557,
    emergencyNum: '112'
  },
  {
    id: 'tr-hatay',
    name: 'T.C. Dışişleri Bakanlığı Hatay Temsilciliği',
    city: 'Hatay',
    country: 'Türkiye',
    address: 'Cumhuriyet Cad. Valilik Kompleksi Antakya, Hatay',
    phone: '+90 326 214 00 00',
    emergencyPhone: '+90 312 292 29 29',
    lat: 36.2023,
    lon: 36.1606,
    emergencyNum: '112'
  },

  // İTALYA
  {
    id: 'it-rome',
    name: 'T.C. Roma Büyükelçiliği',
    city: 'Roma',
    country: 'İtalya',
    address: 'Via Palestro, 47, 00185 Roma, İtalya',
    phone: '+39 06 446 9933',
    emergencyPhone: '+39 342 818 1073',
    lat: 41.9056,
    lon: 12.5005,
    emergencyNum: '112'
  },
  {
    id: 'it-milan',
    name: 'T.C. Milano Başkonsolosluğu',
    city: 'Milano',
    country: 'İtalya',
    address: 'Via Antonio Canova, 36, 20145 Milano, İtalya',
    phone: '+39 02 582 1201',
    emergencyPhone: '+39 333 464 6934',
    lat: 45.4764,
    lon: 9.1602,
    emergencyNum: '112'
  },

  // ALMANYA
  {
    id: 'de-berlin',
    name: 'T.C. Berlin Büyükelçiliği',
    city: 'Berlin',
    country: 'Almanya',
    address: 'Tiergartenstraße 19-21, 10785 Berlin, Almanya',
    phone: '+49 30 275 850',
    emergencyPhone: '+49 177 568 3730',
    lat: 52.5098,
    lon: 13.3547,
    emergencyNum: '112'
  },
  {
    id: 'de-frankfurt',
    name: 'T.C. Frankfurt Başkonsolosluğu',
    city: 'Frankfurt',
    country: 'Almanya',
    address: 'Kennedyallee 115-117, 60596 Frankfurt am Main, Almanya',
    phone: '+49 69 920 0300',
    emergencyPhone: '+49 160 9665 3360',
    lat: 50.0967,
    lon: 8.6756,
    emergencyNum: '112'
  },
  {
    id: 'de-munich',
    name: 'T.C. Münih Başkonsolosluğu',
    city: 'Münih',
    country: 'Almanya',
    address: 'Menzinger Str. 3, 80638 München, Almanya',
    phone: '+49 89 178 0310',
    emergencyPhone: '+49 171 144 0404',
    lat: 48.1633,
    lon: 11.5218,
    emergencyNum: '112'
  },
  {
    id: 'de-cologne',
    name: 'T.C. Köln Başkonsolosluğu',
    city: 'Köln',
    country: 'Almanya',
    address: 'Luxemburger Str. 285, 50354 Hürth/Köln, Almanya',
    phone: '+49 2233 974 180',
    emergencyPhone: '+49 174 763 7320',
    lat: 50.8872,
    lon: 6.9021,
    emergencyNum: '112'
  },
  {
    id: 'de-hamburg',
    name: 'T.C. Hamburg Başkonsolosluğu',
    city: 'Hamburg',
    country: 'Almanya',
    address: 'Tesdorpfstraße 18, 20148 Hamburg, Almanya',
    phone: '+49 40 448 0600',
    emergencyPhone: '+49 174 970 8090',
    lat: 53.5645,
    lon: 9.9922,
    emergencyNum: '112'
  },
  {
    id: 'de-stuttgart',
    name: 'T.C. Stuttgart Başkonsolosluğu',
    city: 'Stuttgart',
    country: 'Almanya',
    address: 'Kernerstraße 50, 70182 Stuttgart, Almanya',
    phone: '+49 711 166 670',
    emergencyPhone: '+49 173 346 6480',
    lat: 48.7842,
    lon: 9.1915,
    emergencyNum: '112'
  },
  {
    id: 'de-dusseldorf',
    name: 'T.C. Düsseldorf Başkonsolosluğu',
    city: 'Düsseldorf',
    country: 'Almanya',
    address: 'Cecilienallee 41, 40474 Düsseldorf, Almanya',
    phone: '+49 211 454 780',
    emergencyPhone: '+49 173 570 0984',
    lat: 51.2422,
    lon: 6.7725,
    emergencyNum: '112'
  },

  // FRANSA
  {
    id: 'fr-paris',
    name: 'T.C. Paris Büyükelçiliği',
    city: 'Paris',
    country: 'Fransa',
    address: '16 Avenue de Lamballe, 75016 Paris, Fransa',
    phone: '+33 1 53 92 71 11',
    emergencyPhone: '+33 6 42 27 60 76',
    lat: 48.8546,
    lon: 2.2789,
    emergencyNum: '112'
  },
  {
    id: 'fr-lyon',
    name: 'T.C. Lyon Başkonsolosluğu',
    city: 'Lyon',
    country: 'Fransa',
    address: '87 Rue de Sèze, 69006 Lyon, Fransa',
    phone: '+33 4 72 83 98 40',
    emergencyPhone: '+33 6 43 44 48 76',
    lat: 45.7681,
    lon: 4.8519,
    emergencyNum: '112'
  },
  {
    id: 'fr-marseille',
    name: 'T.C. Marsilya Başkonsolosluğu',
    city: 'Marsilya',
    country: 'Fransa',
    address: '363 Avenue du Prado, 13008 Marseille, Fransa',
    phone: '+33 4 91 29 00 20',
    emergencyPhone: '+33 6 07 43 41 85',
    lat: 43.2662,
    lon: 5.3852,
    emergencyNum: '112'
  },

  // BİRLEŞİK KRALLIK (UK)
  {
    id: 'uk-london',
    name: 'T.C. Londra Büyükelçiliği',
    city: 'Londra',
    country: 'Birleşik Krallık',
    address: '43 Belgrave Square, London SW1X 8HE, İngiltere',
    phone: '+44 20 7393 0202',
    emergencyPhone: '+44 788 777 5606',
    lat: 51.4988,
    lon: -0.1534,
    emergencyNum: '999'
  },
  {
    id: 'uk-manchester',
    name: 'T.C. Manchester Başkonsolosluğu',
    city: 'Manchester',
    country: 'Birleşik Krallık',
    address: '14 Oxford Court, Manchester M2 3WQ, İngiltere',
    phone: '+44 161 804 7770',
    emergencyPhone: '+44 758 757 3344',
    lat: 53.4765,
    lon: -2.2441,
    emergencyNum: '999'
  },
  {
    id: 'uk-edinburgh',
    name: 'T.C. Edinburgh Başkonsolosluğu',
    city: 'Edinburgh',
    country: 'Birleşik Krallık',
    address: '39 Drumsheugh Gardens, Edinburgh EH3 7RN, İskoçya',
    phone: '+44 131 306 4420',
    emergencyPhone: '+44 748 763 3587',
    lat: 55.9507,
    lon: -3.2163,
    emergencyNum: '999'
  },

  // HOLLANDA
  {
    id: 'nl-hague',
    name: 'T.C. Lahey Büyükelçiliği',
    city: 'Lahey',
    country: 'Hollanda',
    address: 'Jan Evertstraat 15, 2514 BS Den Haag, Hollanda',
    phone: '+31 70 302 3100',
    emergencyPhone: '+31 6 15 15 97 74',
    lat: 52.0834,
    lon: 4.3051,
    emergencyNum: '112'
  },
  {
    id: 'nl-rotterdam',
    name: 'T.C. Rotterdam Başkonsolosluğu',
    city: 'Rotterdam',
    country: 'Hollanda',
    address: 'Westblaak 34, 3012 KM Rotterdam, Hollanda',
    phone: '+31 10 201 4900',
    emergencyPhone: '+31 6 41 02 48 54',
    lat: 51.9172,
    lon: 4.4756,
    emergencyNum: '112'
  },
  {
    id: 'nl-amsterdam',
    name: 'T.C. Amsterdam Başkonsolosluğu',
    city: 'Amsterdam',
    country: 'Hollanda',
    address: 'Museumplein 17, 1071 DJ Amsterdam, Hollanda',
    phone: '+31 20 240 3210',
    emergencyPhone: '+31 6 87 24 48 74',
    lat: 52.3582,
    lon: 4.8812,
    emergencyNum: '112'
  },

  // BELÇİKA
  {
    id: 'be-brussels',
    name: 'T.C. Brüksel Büyükelçiliği',
    city: 'Brüksel',
    country: 'Belçika',
    address: 'Rue Montoyer 4, 1000 Bruxelles, Belçika',
    phone: '+32 2 513 4091',
    emergencyPhone: '+32 478 28 66 18',
    lat: 50.8415,
    lon: 4.3697,
    emergencyNum: '112'
  },
  {
    id: 'be-antwerp',
    name: 'T.C. Anvers Başkonsolosluğu',
    city: 'Anvers',
    country: 'Belçika',
    address: 'Sorbenlaan 16, 2610 Wilrijk, Belçika',
    phone: '+32 3 821 0910',
    emergencyPhone: '+32 487 75 08 26',
    lat: 51.1714,
    lon: 4.3986,
    emergencyNum: '112'
  },

  // İSPANYA
  {
    id: 'es-madrid',
    name: 'T.C. Madrid Büyükelçiliği',
    city: 'Madrid',
    country: 'İspanya',
    address: 'C. de Rafael Calvo, 18, 28010 Madrid, İspanya',
    phone: '+34 91 310 3640',
    emergencyPhone: '+34 616 836 290',
    lat: 40.4326,
    lon: -3.6931,
    emergencyNum: '112'
  },
  {
    id: 'es-barcelona',
    name: 'T.C. Barselona Başkonsolosluğu',
    city: 'Barselona',
    country: 'İspanya',
    address: 'Passeig de Gràcia, 7, 08007 Barcelona, İspanya',
    phone: '+34 93 317 9231',
    emergencyPhone: '+34 659 031 382',
    lat: 41.3892,
    lon: 2.1691,
    emergencyNum: '112'
  },

  // AVUSTURYA & İSVİÇRE
  {
    id: 'at-vienna',
    name: 'T.C. Viyana Büyükelçiliği',
    city: 'Viyana',
    country: 'Avusturya',
    address: 'Prinz-Eugen-Straße 40, 1040 Wien, Avusturya',
    phone: '+43 1 505 7338',
    emergencyPhone: '+43 676 544 3388',
    lat: 48.1963,
    lon: 16.3764,
    emergencyNum: '112'
  },
  {
    id: 'ch-bern',
    name: 'T.C. Bern Büyükelçiliği',
    city: 'Bern',
    country: 'İsviçre',
    address: 'Lombachweg 33, 3006 Bern, İsviçre',
    phone: '+41 31 359 7070',
    emergencyPhone: '+41 78 775 8743',
    lat: 46.9421,
    lon: 7.4641,
    emergencyNum: '112'
  },
  {
    id: 'ch-zurich',
    name: 'T.C. Zürih Başkonsolosluğu',
    city: 'Zürih',
    country: 'İsviçre',
    address: 'Weinbergstrasse 65, 8006 Zürich, İsviçre',
    phone: '+41 44 368 2900',
    emergencyPhone: '+41 79 388 9211',
    lat: 47.3822,
    lon: 8.5435,
    emergencyNum: '112'
  },

  // YUNANİSTAN
  {
    id: 'gr-athens',
    name: 'T.C. Atina Büyükelçiliği',
    city: 'Atina',
    country: 'Yunanistan',
    address: 'Vasileos Georgiou B 8, Athina 106 74, Yunanistan',
    phone: '+30 210 726 3000',
    emergencyPhone: '+30 690 980 9820',
    lat: 37.9734,
    lon: 23.7423,
    emergencyNum: '112'
  },
  {
    id: 'gr-thessaloniki',
    name: 'T.C. Selanik Başkonsolosluğu',
    city: 'Selanik',
    country: 'Yunanistan',
    address: 'Apostolou Pavlou 75, Thessaloniki 546 34, Yunanistan',
    phone: '+30 231 024 8450',
    emergencyPhone: '+30 697 447 2465',
    lat: 40.6358,
    lon: 22.9556,
    emergencyNum: '112'
  },

  // KKTC
  {
    id: 'cy-nicosia',
    name: 'T.C. Lefkoşa Büyükelçiliği',
    city: 'Lefkoşa',
    country: 'KKTC',
    address: 'Bedrettin Demirel Cad. Lefkoşa, KKTC',
    phone: '+90 392 600 3100',
    emergencyPhone: '+90 548 830 5000',
    lat: 35.1856,
    lon: 33.3617,
    emergencyNum: '112'
  },

  // ABD & KANADA
  {
    id: 'us-dc',
    name: 'T.C. Washington Büyükelçiliği',
    city: 'Washington D.C.',
    country: 'ABD',
    address: '2525 Massachusetts Ave NW, Washington, DC 20008, ABD',
    phone: '+1 202 612 6700',
    emergencyPhone: '+1 202 431 5925',
    lat: 38.9167,
    lon: -77.0543,
    emergencyNum: '911'
  },
  {
    id: 'us-ny',
    name: 'Türkevi - T.C. New York Başkonsolosluğu',
    city: 'New York',
    country: 'ABD',
    address: '821 1st Ave, New York, NY 10017, ABD',
    phone: '+1 646 258 7100',
    emergencyPhone: '+1 212 949 0160',
    lat: 40.7519,
    lon: -73.9682,
    emergencyNum: '911'
  },
  {
    id: 'us-la',
    name: 'T.C. Los Angeles Başkonsolosluğu',
    city: 'Los Angeles',
    country: 'ABD',
    address: '8564 Wilshire Blvd, Beverly Hills, CA 90211, ABD',
    phone: '+1 310 220 8820',
    emergencyPhone: '+1 310 770 8272',
    lat: 34.0664,
    lon: -118.3789,
    emergencyNum: '911'
  },
  {
    id: 'ca-toronto',
    name: 'T.C. Toronto Başkonsolosluğu',
    city: 'Toronto',
    country: 'Kanada',
    address: '10 Lower Spadina Ave, Toronto, ON M5V 2Z2, Kanada',
    phone: '+1 647 777 4106',
    emergencyPhone: '+1 416 887 8872',
    lat: 43.6395,
    lon: -79.3948,
    emergencyNum: '911'
  },

  // ORTA DOĞU & KÖRFEZ
  {
    id: 'ae-abudhabi',
    name: 'T.C. Abu Dabi Büyükelçiliği',
    city: 'Abu Dabi',
    country: 'BAE',
    address: 'W69-02, Sector E-25, 26th Street, Abu Dabi, BAE',
    phone: '+971 2 410 9999',
    emergencyPhone: '+971 50 811 7604',
    lat: 24.4442,
    lon: 54.4021,
    emergencyNum: '999'
  },
  {
    id: 'ae-dubai',
    name: 'T.C. Dubai Başkonsolosluğu',
    city: 'Dubai',
    country: 'BAE',
    address: 'Dubai World Trade Centre Bldg 8th Fl, Dubai, BAE',
    phone: '+971 4 376 0600',
    emergencyPhone: '+971 50 238 6338',
    lat: 25.2285,
    lon: 55.2867,
    emergencyNum: '999'
  },
  {
    id: 'qa-doha',
    name: 'T.C. Doha Büyükelçiliği',
    city: 'Doha',
    country: 'Katar',
    address: 'Al Dafna, Zone 66, Street 801, Doha, Katar',
    phone: '+974 4495 1300',
    emergencyPhone: '+974 5580 4390',
    lat: 25.3341,
    lon: 51.5284,
    emergencyNum: '999'
  },

  // ASYA & AVRASYA
  {
    id: 'az-baku',
    name: 'T.C. Bakü Büyükelçiliği',
    city: 'Bakü',
    country: 'Azerbaycan',
    address: 'Səməd Vurğun 94, Bakı, Azerbaycan',
    phone: '+994 12 444 7320',
    emergencyPhone: '+994 50 220 7062',
    lat: 40.3842,
    lon: 49.8415,
    emergencyNum: '112'
  },
  {
    id: 'ru-moscow',
    name: 'T.C. Moskova Büyükelçiliği',
    city: 'Moskova',
    country: 'Rusya',
    address: '7-y Rostovskiy Pereulok, 12, Moscow, Rusya',
    phone: '+7 495 994 4808',
    emergencyPhone: '+7 968 853 2501',
    lat: 55.7428,
    lon: 37.5765,
    emergencyNum: '112'
  },
  {
    id: 'jp-tokyo',
    name: 'T.C. Tokyo Büyükelçiliği',
    city: 'Tokyo',
    country: 'Japonya',
    address: '2-33-6 Jingumae, Shibuya-ku, Tokyo 150-0001, Japonya',
    phone: '+81 3 6439 5700',
    emergencyPhone: '+81 90 2486 4485',
    lat: 35.6712,
    lon: 139.7093,
    emergencyNum: '110'
  }
];

// Haversine formülü ile iki koordinat arası kuş uçuşu KM hesaplama
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Dünya yarıçapı (km)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
}

export default function EmergencyCardWidget() {
  const navigate = useNavigate();
  const [nearestMission, setNearestMission] = useState(TURKISH_MISSIONS[0]); // Varsayılan en yakın
  const [distanceKm, setDistanceKm] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [detectedLocationName, setDetectedLocationName] = useState('');
  const [isSafeCopied, setIsSafeCopied] = useState(false);
  const [isGpsHovered, setIsGpsHovered] = useState(false);

  // Google Maps JS API & Snazzy Maps WY (8097) Stili Referansları
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  const [mapError, setMapError] = useState(false);

  // Snazzy Maps WY (8097) Stili ile Canlı Haritayı Yükle ve Güncelle
  useEffect(() => {
    if (!nearestMission || !nearestMission.lat || !nearestMission.lon) return;

    let isMounted = true;
    const apiKey = useSettingsStore.getState().googlePlacesApiKey || 'AIzaSyDLKVedSDIIzh5fbRpUta9oShiW2omr7O4';

    loadGoogleMapsScript(apiKey)
      .then((maps) => {
        if (!isMounted || !mapContainerRef.current) return;

        const center = { lat: Number(nearestMission.lat), lng: Number(nearestMission.lon) };

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

          // Move Travel özel konum pini (Temaya uygun şık SVG pin)
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
            title: nearestMission.name,
            icon: markerSvg
          });

          mapInstanceRef.current = map;
          markerInstanceRef.current = marker;
        } else {
          mapInstanceRef.current.setCenter(center);
          mapInstanceRef.current.setZoom(15);
          if (markerInstanceRef.current) {
            markerInstanceRef.current.setPosition(center);
            markerInstanceRef.current.setTitle(nearestMission.name);
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
  }, [nearestMission]);

  // Koordinatlara göre en yakın temsilciliği veya hizmet binasını bul
  const findNearestMission = (lat, lon, locationLabel = null) => {
    setUserCoords({ lat, lon });
    if (locationLabel) {
      setDetectedLocationName(locationLabel);
    }
    
    let minDistance = Infinity;
    let closest = TURKISH_MISSIONS[0];

    TURKISH_MISSIONS.forEach(m => {
      const dist = getDistanceFromLatLonInKm(lat, lon, m.lat, m.lon);
      if (dist < minDistance) {
        minDistance = dist;
        closest = m;
      }
    });

    setNearestMission(closest);
    setDistanceKm(Math.round(minDistance));
  };

  // Hızlı IP tabanlı anlık konum tespiti (izin engeline takılmadan hemen çalışır)
  const fetchIpLocation = async () => {
    try {
      const res = await fetch('https://ipwho.is/');
      const data = await res.json();
      if (data && data.success !== false && data.latitude && data.longitude) {
        const cityStr = `${data.city || data.region || 'Bölgeniz'}, ${data.country || 'Türkiye'}`;
        findNearestMission(data.latitude, data.longitude, cityStr);
        try {
          const isTr = data.country_code === 'TR' || data.country === 'Türkiye' || data.country === 'Turkey';
          sessionStorage.setItem('user_geo_info', JSON.stringify({
            countryCode: data.country_code,
            countryName: data.country || (isTr ? 'Türkiye' : ''),
            isTurkey: isTr,
            timezone: data.timezone?.id || 'Europe/Istanbul'
          }));
        } catch (e) {}
        return true;
      }
      throw new Error("ipwho failed");
    } catch {
      try {
        const res2 = await fetch('https://freeipapi.com/api/json');
        const data2 = await res2.json();
        if (data2 && data2.latitude && data2.longitude) {
          const cityStr = `${data2.cityName || 'Bölgeniz'}, ${data2.countryName || 'Türkiye'}`;
          findNearestMission(data2.latitude, data2.longitude, cityStr);
          try {
            const isTr = data2.countryCode === 'TR' || data2.countryName === 'Turkey' || data2.countryName === 'Türkiye';
            sessionStorage.setItem('user_geo_info', JSON.stringify({
              countryCode: data2.countryCode,
              countryName: data2.countryName || (isTr ? 'Türkiye' : ''),
              isTurkey: isTr,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul'
            }));
          } catch (e) {}
          return true;
        }
      } catch (err) {
        console.warn("IP Geolocation hatası:", err);
      }
    }
    return false;
  };

  // Cihaz GPS'i ile canlı konum alma
  const handleDetectLocation = (isManual = false) => {
    setIsLocating(true);

    const safetyTimer = setTimeout(() => {
      setIsLocating(false);
    }, 4000);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(safetyTimer);
          const { latitude, longitude } = pos.coords;
          findNearestMission(latitude, longitude);
          setIsLocating(false);
        },
        (err) => {
          clearTimeout(safetyTimer);
          console.warn("Cihaz GPS alınamadı, IP fallback deneniyor:", err);
          fetchIpLocation().finally(() => setIsLocating(false));
          if (isManual && err.code === 1) {
            alert("Tarayıcınızda konum izni verilmemiş. IP bazlı tahmini konumunuz kullanılıyor.");
          }
        },
        { timeout: 4000, enableHighAccuracy: false, maximumAge: 60000 }
      );
    } else {
      clearTimeout(safetyTimer);
      fetchIpLocation().finally(() => setIsLocating(false));
    }
  };

  // Sayfa açıldığında OTOMATİK CANLI KONUM TESPİTİ
  useEffect(() => {
    // 1. Önce anında çalışan IP Geolocation ile kullanıcının şehrini ve ülkesini yakala
    fetchIpLocation();

    // 2. Arka planda izin varsa yüksek hassasiyetli GPS ile tam metre seviyesinde güncelle
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          findNearestMission(latitude, longitude);
        },
        () => {
          // İzin yoksa IP konumu aktif kalır
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    }
  }, []);

  // Tek Dokunuşla Güvendeyim / Canlı GPS Konum Paylaşımı (WhatsApp + Pano)
  const handleShareSafeLocation = () => {
    const coords = userCoords;
    const sendWithCoords = (lat, lon) => {
      const mapLink = `https://maps.google.com/?q=${lat},${lon}`;
      const message = `🚨 GÜVENDEYİM & CANLI GPS KONUMUM:\nMove Yanımda üzerinden paylaşıyorum.\nCanlı Harita: ${mapLink}\n(En Yakın T.C. Noktası: ${nearestMission.name} - Tel: ${nearestMission.emergencyPhone || nearestMission.phone})`;
      
      if (navigator.clipboard) {
        navigator.clipboard.writeText(message);
        setIsSafeCopied(true);
        setTimeout(() => setIsSafeCopied(false), 3000);
      }
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
    };

    if (coords) {
      sendWithCoords(coords.lat, coords.lon);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          sendWithCoords(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          const message = `🚨 GÜVENDEYİM BİLGİLENDİRMESİ: Move Yanımda üzerinden bildirim yapıyorum. Bölgemdeki en yakın T.C. Hizmet Noktası: ${nearestMission.name} (Acil Tel: ${nearestMission.emergencyPhone || nearestMission.phone})`;
          if (navigator.clipboard) {
            navigator.clipboard.writeText(message);
            setIsSafeCopied(true);
            setTimeout(() => setIsSafeCopied(false), 3000);
          }
          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
        }
      );
    }
  };

  // Google Maps embed URL
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(nearestMission.name + ' ' + nearestMission.address)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  // Canlı Yol Tarifi URL'i (Kullanıcının koordinatından doğrudan temsilciliğe)
  const directionsUrl = userCoords 
    ? `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lon}&destination=${encodeURIComponent(nearestMission.address || nearestMission.name)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(nearestMission.address || nearestMission.name)}`;

  // Temsilcilik ismini kısaltma (İstanbul Temsilciliği kısmını keserek temiz gösterme)
  const getShortMissionName = (name) => {
    if (!name) return 'T.C. Temsilciliği';
    if (name.includes('İstanbul Temsilciliği')) {
      return name.replace(/\s*İstanbul Temsilciliği.*/i, '').trim();
    }
    if (name.includes('Temsilciliği')) {
      return name.replace(/\s*[^\s]+\s+Temsilciliği.*/i, '').trim();
    }
    return name;
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #fff5f9 100%)',
      borderRadius: '22px',
      border: '1px solid #FCE7F3',
      padding: '15px 16px',
      marginBottom: '18px',
      boxShadow: '0 4px 16px -2px rgba(215, 20, 122, 0.05)',
      boxSizing: 'border-box',
      position: 'relative'
    }}>
      {/* 1. Canlı Başlık ve GPS Durum Alanı */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div>
          <h2 style={{
            fontSize: '13px',
            fontWeight: '750',
            color: '#0f172a',
            margin: 0,
            letterSpacing: '-0.2px'
          }}>
            Acil Durum & Elçilik Bilgileri
          </h2>
          <div style={{
            fontSize: '10.5px',
            color: '#64748b',
            marginTop: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {detectedLocationName ? (
              <span>Canlı Konumunuz: {detectedLocationName}</span>
            ) : (
              <span>Konumunuza en yakın T.C. temsilciliği canlı taranıyor...</span>
            )}
          </div>
        </div>

        {/* GPS ile Mevcut Canlı Konumu Yenile Butonu */}
        <button
          type="button"
          onClick={() => handleDetectLocation(true)}
          onMouseEnter={() => setIsGpsHovered(true)}
          onMouseLeave={() => setIsGpsHovered(false)}
          title="Canlı Konumumu Yenile & En Yakın Temsilciliği Getir"
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '10px',
            border: isGpsHovered ? '1.2px solid #D7147A' : '1.2px solid #F9BED8',
            background: isGpsHovered 
              ? 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)' 
              : (isLocating ? '#FDF2F8' : '#ffffff'),
            color: isGpsHovered ? '#ffffff' : '#D7147A',
            cursor: isLocating ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            transform: isGpsHovered ? 'scale(1.06)' : 'scale(1)',
            boxShadow: isGpsHovered ? '0 3px 10px rgba(215, 20, 122, 0.25)' : '0 1px 3px rgba(215, 20, 122, 0.08)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {isLocating ? (
            <Loader2 
              size={15} 
              color={isGpsHovered ? '#ffffff' : '#D7147A'} 
              style={{ animation: 'spin 1s linear infinite' }} 
            />
          ) : (
            <LocateFixed 
              size={15} 
              color={isGpsHovered ? '#ffffff' : '#D7147A'} 
              strokeWidth={2.3} 
            />
          )}
        </button>
      </div>

      {/* 2. Popüler Rotalar Kart Mimarisiyle Birebir Birleşik Tek Kart (Harita + Adres + Butonlar) */}
      <div 
        className="landing-card"
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1.2px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Görsel / Harita Alanı (Snazzy Maps WY Stili ile Canlı Google Map) */}
        <div style={{
          position: 'relative',
          height: '165px',
          width: '100%',
          backgroundColor: '#f1f5f9',
          overflow: 'hidden'
        }}>
          <style>{`
            .wy-google-map .gm-style-pbc { display: none !important; }
            .wy-google-map .gm-style-cc { display: none !important; }
            .wy-google-map .gmnoprint { display: none !important; }
            .wy-google-map a[href^="https://maps.google.com/maps"] { opacity: 0.25 !important; }
          `}</style>

          {mapError ? (
            <iframe
              title="En Yakın T.C. Temsilciliği Canlı Haritası"
              src={mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block' }}
              loading="lazy"
              allowFullScreen
            />
          ) : (
            <div
              ref={mapContainerRef}
              className="wy-google-map"
              onClick={() => window.open(directionsUrl, '_blank')}
              title="Google Maps ile Haritada Gör"
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}
            />
          )}

          {/* Sol Üst: Km Rozeti (İtalya Kartı Ülke Rozeti Mimarisiyle Birebir) */}
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
            fontSize: '10.5px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
            zIndex: 10
          }}>
            <MapPin size={12} color="#38bdf8" strokeWidth={2.4} />
            <span>{distanceKm !== null ? `${distanceKm} km` : 'En Yakın'}</span>
          </div>

          {/* Harita Alt Gradient Gölgesi (Beyaz Başlığın Kusursuz Okunması İçin) */}
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

          {/* Sol Alt Görsel / Harita İçi: Temsilcilik Tam Adı */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '12px',
            right: '12px',
            zIndex: 10,
            pointerEvents: 'none'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '750',
              color: '#ffffff',
              letterSpacing: '-0.2px',
              textShadow: '0 2px 8px rgba(0,0,0,0.85)',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word'
            }}>
              {nearestMission.name}
            </div>
          </div>
        </div>

        {/* Görsel Altındaki Bilgiler & Butonlar Bölümü */}
        <div style={{ padding: '18px 14px 16px 14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Dörtlü Hızlı Aksiyon Butonları (Yazısız Lüks Kartlar) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
            justifyItems: 'center',
            alignItems: 'center'
          }}>
            {/* Buton 1: 112 / Yerel Acil İmdat */}
            <a
              href={`tel:${nearestMission.emergencyNum || '112'}`}
              title={`Yerel Acil İmdat (${nearestMission.emergencyNum || '112'})`}
              className="luxury-tool-card"
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '15px',
                background: '#ffffff',
                border: '1.2px solid #FCE7F3',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                background: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc2626',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                <PhoneCall size={20} strokeWidth={2.1} />
              </div>
            </a>

            {/* Buton 2: T.C. Temsilcilik / 7/24 Çağrı Merkezi */}
            <a
              href={`tel:${nearestMission.emergencyPhone || nearestMission.phone}`}
              title={`T.C. Hizmet / Konsolosluk Çağrı Hattını Ara (${nearestMission.emergencyPhone || nearestMission.phone})`}
              className="luxury-tool-card"
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '15px',
                background: '#ffffff',
                border: '1.2px solid #FCE7F3',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                <Building2 size={20} strokeWidth={2.1} />
              </div>
            </a>

            {/* Buton 3: Güvendeyim (Canlı GPS Konum Paylaşımı) */}
            <button
              type="button"
              onClick={handleShareSafeLocation}
              title={isSafeCopied ? "Konum Kopyalandı!" : "Canlı GPS Konumumu Paylaş (Güvendeyim)"}
              className="luxury-tool-card"
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '15px',
                background: '#ffffff',
                border: '1.2px solid #FCE7F3',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                background: isSafeCopied ? '#dcfce7' : '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16a34a',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                {isSafeCopied ? (
                  <Check size={20} strokeWidth={2.6} />
                ) : (
                  <Share2 size={20} strokeWidth={2.1} />
                )}
              </div>
            </button>

            {/* Buton 4: Canlı Yol Tarifi (Navigasyon) */}
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Google Maps ile Doğrudan Canlı Yol Tarifi Al"
              className="luxury-tool-card"
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '15px',
                background: '#ffffff',
                border: '1.2px solid #FCE7F3',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                background: '#FDF2F8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D7147A',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                <Navigation size={20} strokeWidth={2.1} />
              </div>
            </a>
          </div>

          {/* Popüler Rotalar Tarzı Premium Aksiyon Butonu */}
          <div
            onClick={() => navigate('/travel-tools?tab=emergency')}
            role="button"
            tabIndex={0}
            style={{
              background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
              color: '#ffffff',
              borderRadius: '13px',
              padding: '10px 14px',
              fontSize: '11px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 3px 12px rgba(215, 20, 122, 0.22)',
              transition: 'all 0.18s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(215, 20, 122, 0.32)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 3px 12px rgba(215, 20, 122, 0.22)';
            }}
          >
            <span>{nearestMission?.country || 'Türkiye'} Acil Durum & Elçilik Bilgileri</span>
            <ChevronRight size={14} strokeWidth={2.5} />
          </div>
        </div>
      </div>

    </div>
  );
}
