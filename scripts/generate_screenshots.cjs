const express = require('express');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 5566;

const DEVICES = [
  {
    key: 'iphone_6.5',
    name: 'iPhone 6.5" Display (1284 x 2778)',
    viewport: {
      width: 428,
      height: 926,
      deviceScaleFactor: 3, // 428 * 3 = 1284, 926 * 3 = 2778
      isMobile: true,
      hasTouch: true
    },
    folder: path.join(__dirname, '..', 'screenshots', 'iphone_6.5')
  },
  {
    key: 'ipad_13',
    name: 'iPad 13" Display (2048 x 2732)',
    viewport: {
      width: 1024,
      height: 1366,
      deviceScaleFactor: 2, // 1024 * 2 = 2048, 1366 * 2 = 2732
      isMobile: true,
      hasTouch: true
    },
    folder: path.join(__dirname, '..', 'screenshots', 'ipad_13')
  }
];

const SCREENS = [
  {
    filename: '01_welcome_kesfet.png',
    path: '/welcome',
    isPublic: true,
    title: 'Move Yanımda - Dünyayı Keşfetmek Artık Çok Kolay'
  },
  {
    filename: '02_bireysel_dashboard.png',
    path: '/individual/dashboard',
    isPublic: false,
    title: 'Seyahat Paneli & Geri Sayım'
  },
  {
    filename: '03_tintin_ai_rehber.png',
    path: '/tintin',
    isPublic: false,
    title: 'Tintin AI Akıllı Seyahat Danışmanı'
  },
  {
    filename: '04_sehir_rehberi_roma.png',
    path: '/city-guide/roma',
    isPublic: false,
    title: 'Şehir Rehberi - Roma'
  },
  {
    filename: '05_seyahat_araclari.png',
    path: '/travel-tools',
    isPublic: false,
    title: 'Akıllı Seyahat Araçları Merkezi'
  },
  {
    filename: '06_canli_cevirmen.png',
    path: '/travel-tools?tab=translator',
    isPublic: false,
    title: 'Canlı Sesli & Metin Seyahat Çevirmeni'
  },
  {
    filename: '07_ne_giyilir_hava.png',
    path: '/travel-tools?tab=outfit&city=Roma',
    isPublic: false,
    title: 'Ne Giyilir & Hava Durumu Tavsiyeleri'
  },
  {
    filename: '08_dunya_priz_rehberi.png',
    path: '/travel-tools?tab=socket',
    isPublic: false,
    title: 'Dünya Priz & Voltaj Rehberi'
  },
  {
    filename: '09_taxfree_hesaplayici.png',
    path: '/travel-tools?tab=taxfree',
    isPublic: false,
    title: 'Tax Free KDV İadesi Hesaplayıcı'
  },
  {
    filename: '10_akilli_bavul_checklist.png',
    path: '/individual/checklists',
    isPublic: false,
    title: 'Akıllı Bavul & Kontrol Listeleri'
  }
];

const MOCK_AUTH_STORAGE = {
  state: {
    user: {
      id: 'usr_demo_burak',
      name: 'Burak Özkan',
      email: 'burak.ozkan@movetravel.com',
      phone: '+90 532 555 1020',
      role: 'customer',
      userType: 'individual'
    },
    activeMode: 'individual'
  },
  version: 0
};

const MOCK_TINTIN_CHAT = [
  {
    id: 'msg_welcome',
    sender: 'tintin',
    text: "Merhaba Burak Bey! ✈️ Ben akıllı seyahat danışmanınız Tintin. 15-20 Ekim Roma seyahatiniz için uçuş saatleriniz, oteliniz, hava durumu ve kişisel gezi önerilerinizle ilgili her an yanınızdayım. Nasıl yardımcı olabilirim?",
    timestamp: "10:15"
  },
  {
    id: 'msg_user_1',
    sender: 'user',
    text: "Roma'da yarın öğleden sonra serbest zamanımızda nereleri gezebiliriz ve nerede yemek yemeliyiz?",
    timestamp: "10:16"
  },
  {
    id: 'msg_tintin_1',
    sender: 'tintin',
    text: "Harika bir gezi planı hazırladım! 🏛️\n\n1. **Trastevere'de Öğle Yemeği:** Otantik İtalyan lezzetleri için *Da Enzo al 29* veya *Tonnarello*'da taze Cacio e Pepe makarnası deneyebilirsiniz.\n\n2. **Tarihi Yürüyüş:** Panteon ve Navona Meydanı'nı adımlayın; ardından *Giolitti*'den efsanevi fıstıklı Roma dondurması tadın.\n\n3. **Gün Batımı & Trevi:** Trevi Çeşmesi'nde geleneksel dileğinizi dileyin.\n\n☀️ *Yarın Roma'da hava 22°C ve güneşli, rahat yürüyüş ayakkabıları tercih etmenizi öneririm.*",
    timestamp: "10:17"
  }
];

async function startServer() {
  const app = express();
  const distPath = path.resolve(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  const indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
  app.use((req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(indexHtml);
  });

  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`[Server] Live preview server listening on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function run() {
  console.log('[Puppeteer] Launching Chrome at:', CHROME_PATH);
  const server = await startServer();

  for (const dev of DEVICES) {
    fs.mkdirSync(dev.folder, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--hide-scrollbars',
      '--font-render-hinting=none',
      '--force-color-profile=srgb'
    ]
  });

  try {
    for (const dev of DEVICES) {
      console.log(`\n==================================================`);
      console.log(`>>> Capturing for ${dev.name}`);
      console.log(`==================================================`);

      const context = await browser.createBrowserContext();
      await context.overridePermissions(`http://localhost:${PORT}`, ['notifications']);

      const page = await context.newPage();
      await page.setViewport(dev.viewport);

      for (let i = 0; i < SCREENS.length; i++) {
        const screen = SCREENS[i];
        const targetUrl = `http://localhost:${PORT}${screen.path}`;
        const outputPath = path.join(dev.folder, screen.filename);

        console.log(`[${i + 1}/${SCREENS.length}] Navigating to: ${screen.path} (${screen.title})`);

        // Configure mock localStorage and notification override
        await page.evaluateOnNewDocument((isPublic, authStorage, chatHistory) => {
          sessionStorage.setItem('move_pwa_dismissed', '1');
          sessionStorage.setItem('guest_notice_dismissed', '1');

          try {
            window.Notification = {
              permission: 'granted',
              requestPermission: async () => 'granted'
            };
          } catch (e) {}

          if (isPublic) {
            localStorage.removeItem('travel-auth-storage-v4');
          } else {
            localStorage.setItem('travel-auth-storage-v4', JSON.stringify(authStorage));
            localStorage.setItem('tintin_chat_history_usr_demo_burak', JSON.stringify(chatHistory));
            localStorage.setItem('tintin_chat_history_burak.ozkan@movetravel.com', JSON.stringify(chatHistory));
            localStorage.setItem('tintin_chat_history_guest', JSON.stringify(chatHistory));
          }
        }, screen.isPublic, MOCK_AUTH_STORAGE, MOCK_TINTIN_CHAT);

        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

        // Force suppression of notification banners & modal overlays
        await page.addStyleTag({
          content: `
            div[style*="z-index: 9999"],
            div[style*="z-index:9999"],
            div[style*="zIndex: 9999"],
            div[style*="backdrop-filter: blur"] {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              pointer-events: none !important;
            }
            ${dev.key === 'ipad_13' ? `
              .container {
                max-width: 100% !important;
                width: 100% !important;
                padding-left: 48px !important;
                padding-right: 48px !important;
              }
              div[style*="max-width: 640px"],
              div[style*="maxWidth: 640px"],
              div[style*="max-width: 720px"],
              div[style*="maxWidth: 720px"],
              div[style*="max-width: 480px"],
              div[style*="maxWidth: 480px"] {
                max-width: 100% !important;
              }
            ` : ''}
          `
        });

        // Evaluate in page context
        await page.evaluate((isPublic, authStorage, chatHistory) => {
          sessionStorage.setItem('move_pwa_dismissed', '1');
          sessionStorage.setItem('guest_notice_dismissed', '1');

          if (isPublic) {
            localStorage.removeItem('travel-auth-storage-v4');
          } else {
            localStorage.setItem('travel-auth-storage-v4', JSON.stringify(authStorage));
            localStorage.setItem('tintin_chat_history_usr_demo_burak', JSON.stringify(chatHistory));
            localStorage.setItem('tintin_chat_history_burak.ozkan@movetravel.com', JSON.stringify(chatHistory));
            localStorage.setItem('tintin_chat_history_guest', JSON.stringify(chatHistory));
          }

          // Remove any fixed full-screen modal overlays (e.g. notification prompt)
          const allDivs = document.querySelectorAll('div');
          allDivs.forEach(d => {
            const text = (d.textContent || '').trim();
            if (text.includes('Bildirimleri Açın') && text.includes('Şimdi İzin Ver')) {
              d.remove();
            }
          });

          // Ensure scroll position is top
          window.scrollTo(0, 0);
        }, screen.isPublic, MOCK_AUTH_STORAGE, MOCK_TINTIN_CHAT);

        // Wait for fonts and animations
        await new Promise(r => setTimeout(r, 1200));

        // Screen-specific interactions
        if (screen.path.includes('tab=translator')) {
          await page.evaluate(() => {
            const el = document.querySelector('textarea');
            if (el && !el.value) {
              el.value = "Kolezyum'a giden en yakın metro durağı nerede?";
              el.dispatchEvent(new Event('input', { bubbles: true }));
            }
          });
          await new Promise(r => setTimeout(r, 300));
        }

        if (screen.path.includes('tab=taxfree')) {
          await page.evaluate(() => {
            const inputs = document.querySelectorAll('input[type="number"], input[type="text"]');
            inputs.forEach(inp => {
              if (inp.placeholder && inp.placeholder.includes('Tutar')) {
                inp.value = '450';
                inp.dispatchEvent(new Event('input', { bubbles: true }));
              }
            });
          });
          await new Promise(r => setTimeout(r, 300));
        }

        // Capture screenshot of exact viewport
        await page.screenshot({
          path: outputPath,
          type: 'png'
        });

        console.log(`   -> Saved: ${outputPath}`);
      }

      await page.close();
      await context.close();
    }
  } catch (err) {
    console.error('[Error during screenshot capture]:', err);
  } finally {
    await browser.close();
    server.close();
    console.log('\n[Done] All App Store screenshots successfully generated!');
  }
}

run();
