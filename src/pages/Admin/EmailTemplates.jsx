import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Header from '../../components/Header';
import { 
  Save, Info, HelpCircle, Send, Mail, Code, Eye, 
  Sparkles, Check, CheckCircle2, Loader2, Copy 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../../store/settingsStore';

const defaultTemplates = {
    tour_email: {
        title: 'Seyahat Kaydı Hoşgeldiniz E-postası',
        description: 'Müşteriye yeni bir seyahat kaydı yapıldığında veya tura dahil edildiğinde gönderilen hoş geldiniz maili.',
        variables: [
            { name: '{{participantName}}', desc: 'Katılımcı Adı' },
            { name: '{{tourName}}', desc: 'Tur İsmi' },
            { name: '{{corporateName}}', desc: 'Firma Adı' },
            { name: '{{username}}', desc: 'Giriş E-postası' },
            { name: '{{accountEmail}}', desc: 'Kullanıcı Adı (E-Posta)' },
            { name: '{{setupUrl}}', desc: 'Hesap Aktivasyon / Şifre Belirleme Bağlantısı' },
            { name: '{{loginUrl}}', desc: 'Giriş Sayfası Bağlantısı' },
            { name: '{{credentialSection}}', desc: 'Giriş Bilgileri ve Aktivasyon Butonu Bloğu' }
        ],
        subject: '{{corporateName}}: {{tourName}} Seyahati Kaydınız Alındı',
        body: `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet"><div style="background-color: #f8fafc; padding: 36px 12px; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.65;">
    <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #edf2f7; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);">
        <div style="height: 3px; background: linear-gradient(90deg, #D7147A 0%, #b80f68 50%, #f43f5e 100%);"></div>
        <div style="padding: 26px 32px 18px 32px; text-align: center; border-bottom: 1px solid #f8fafc;">
            <img src="https://move.com.tr/wp-content/uploads/thegem/logos/logo_34e7aaf6ef74bcbc5b7767b6af85fbb4_1x.png" alt="Move Travel &amp; Mice" style="height: 40px; max-width: 210px; object-fit: contain; display: inline-block;" />
        </div>
        <div style="padding: 28px 32px 34px 32px;">
            <div style="text-align: center; margin-bottom: 22px;">
                <span style="display: inline-block; background: #fdf2f8; color: #D7147A; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase;">
                    Seyahat Kaydı Onayı
                </span>
                <h1 style="color: #1e293b; margin: 12px 0 6px 0; font-size: 21px; font-weight: 600; letter-spacing: -0.2px;">
                    Seyahat Kaydınız Başarıyla Tamamlandı
                </h1>
                <p style="color: #64748b; font-size: 13.5px; font-weight: 500; margin: 0;">Sayın <strong>{{participantName}}</strong>, aramıza hoş geldiniz.</p>
            </div>

            <div style="background: #f8fafc; border-radius: 14px; padding: 18px 20px; border: 1px solid #e2e8f0; border-left: 3px solid #D7147A; margin: 20px 0;">
                <div style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Kayıt Olunan Seyahat</div>
                <div style="font-size: 15.5px; font-weight: 600; color: #1e293b; margin-bottom: 12px;">{{tourName}}</div>
                <div style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Kullanıcı Adı (E-Posta)</div>
                <div style="font-size: 14.5px; font-weight: 600; color: #1e293b;">{{username}}</div>
            </div>

            {{credentialSection}}

            <p style="font-size: 13px; color: #64748b; font-weight: 500; line-height: 1.6; margin-top: 22px; text-align: center;">
                Uygulamamıza giriş yaparak seyahatiniz ile ilgili tüm uçuş, transfer, tur programı ve yetkili rehber bilgilerine dilediğiniz zaman ulaşabilirsiniz.
            </p>
        </div>
        <div style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: 600; color: #475569;">{{corporateName}}</p>
            <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 400; line-height: 1.5;">
                Bu e-posta sistem tarafından otomatik olarak gönderilmiştir.<br/>
                © Move Travel &amp; Mice. Tüm hakları saklıdır.
            </p>
        </div>
    </div>
</div>`
    },
    ticket_email: {
        title: 'Uçuş & Biletleme Bilgilendirme E-postası',
        description: 'Müşteriye PDF uçuş bileti atandığında veya güncellendiğinde e-bilet indirme bağlantısı ile gönderilen bilgilendirme maili.',
        variables: [
            { name: '{{participantName}}', desc: 'Katılımcı / Yolcu Adı' },
            { name: '{{tourName}}', desc: 'Tur / Seyahat İsmi' },
            { name: '{{corporateName}}', desc: 'Firma / Acente Adı' },
            { name: '{{pdfHtml}}', desc: 'Elektronik PDF Bilet İndirme Butonları Bloğu' }
        ],
        subject: '{{corporateName}}: Uçuş Biletleriniz Sisteme Eklendi',
        body: `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet"><div style="background-color: #f8fafc; padding: 36px 12px; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.65;">
    <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #edf2f7; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);">
        <div style="height: 3px; background: linear-gradient(90deg, #D7147A 0%, #b80f68 50%, #f43f5e 100%);"></div>
        <div style="padding: 26px 32px 18px 32px; text-align: center; border-bottom: 1px solid #f8fafc;">
            <img src="https://move.com.tr/wp-content/uploads/thegem/logos/logo_34e7aaf6ef74bcbc5b7767b6af85fbb4_1x.png" alt="Move Travel &amp; Mice" style="height: 40px; max-width: 210px; object-fit: contain; display: inline-block;" />
        </div>
        <div style="padding: 28px 32px 34px 32px;">
            <div style="text-align: center; margin-bottom: 22px;">
                <span style="display: inline-block; background: #fdf2f8; color: #D7147A; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase;">
                    Elektronik Bilet Bildirimi
                </span>
                <h1 style="color: #1e293b; margin: 12px 0 6px 0; font-size: 21px; font-weight: 600; letter-spacing: -0.2px;">
                    Uçuş Biletleriniz Sisteme Eklendi
                </h1>
                <p style="color: #64748b; font-size: 13.5px; font-weight: 500; margin: 0;">Sayın <strong>{{participantName}}</strong>,</p>
            </div>

            <p style="font-size: 13.5px; font-weight: 400; color: #475569; text-align: center; margin: 0 0 18px 0; line-height: 1.6;">
                <strong>{{tourName}}</strong> seyahatiniz için elektronik uçuş biletiniz sisteme yüklenmiştir. Biletinizi aşağıdan hemen görüntüleyebilir veya indirebilirsiniz:
            </p>

            <div style="background: #f8fafc; border-radius: 14px; padding: 18px 20px; border: 1px solid #e2e8f0; border-left: 3px solid #D7147A; margin: 20px 0;">
                <div style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Seyahat Adı</div>
                <div style="font-size: 15.5px; font-weight: 600; color: #1e293b; margin-bottom: 12px;">{{tourName}}</div>
                <div style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Yolcu Adı</div>
                <div style="font-size: 14.5px; font-weight: 600; color: #1e293b;">{{participantName}}</div>
            </div>

            {{pdfHtml}}

            <div style="background: #f8fafc; border-radius: 12px; padding: 11px 16px; margin: 18px 0; text-align: center; border: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 500; line-height: 1.5;">
                    💡 <strong>Önemli Bilgi:</strong> İndirdiğiniz e-bilet PDF dosyasını telefonunuzda saklayabilir veya çıktısını alarak havalimanı kontuarında check-in işlemlerinizde kullanabilirsiniz.
                </p>
            </div>

            <p style="font-size: 13px; color: #64748b; font-weight: 500; line-height: 1.6; text-align: center; margin-top: 22px;">
                Mobil uygulamamıza giriş yaparak seyahatiniz ile ilgili tüm uçuş, transfer, tur programı ve yetkili rehber bilgilerine dilediğiniz an erişebilirsiniz.
            </p>
        </div>
        <div style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: 600; color: #475569;">{{corporateName}}</p>
            <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 400; line-height: 1.5;">
                Bu e-posta sistem tarafından otomatik olarak gönderilmiştir.<br/>
                © Move Travel &amp; Mice. Tüm hakları saklıdır.
            </p>
        </div>
    </div>
</div>`
    },
    forgot_password: {
        title: 'Parola Sıfırlama / Hatırlatma E-postası',
        description: 'Kullanıcı giriş ekranında "Şifremi Unuttum" talebinde bulunduğunda şifre belirleme bağlantısı gönderen mail.',
        variables: [
            { name: '{{accountName}}', desc: 'Alıcı Adı' },
            { name: '{{setupUrl}}', desc: 'Şifre Belirleme Bağlantısı' },
            { name: '{{corporateName}}', desc: 'Firma Adı' }
        ],
        subject: '{{corporateName}}: Parola Sıfırlama / Hatırlatma Talebi',
        body: `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet"><div style="background-color: #f8fafc; padding: 36px 12px; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.65;">
    <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #edf2f7; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);">
        <div style="height: 3px; background: linear-gradient(90deg, #D7147A 0%, #b80f68 50%, #f43f5e 100%);"></div>
        <div style="padding: 26px 32px 18px 32px; text-align: center; border-bottom: 1px solid #f8fafc;">
            <img src="https://move.com.tr/wp-content/uploads/thegem/logos/logo_34e7aaf6ef74bcbc5b7767b6af85fbb4_1x.png" alt="Move Travel &amp; Mice" style="height: 40px; max-width: 210px; object-fit: contain; display: inline-block;" />
        </div>
        <div style="padding: 28px 32px 34px 32px;">
            <div style="text-align: center; margin-bottom: 22px;">
                <span style="display: inline-block; background: #fdf2f8; color: #D7147A; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase;">
                    Güvenlik Talebi
                </span>
                <h1 style="color: #1e293b; margin: 12px 0 6px 0; font-size: 21px; font-weight: 600; letter-spacing: -0.2px;">
                    Parola Sıfırlama Talebi
                </h1>
                <p style="color: #64748b; font-size: 13.5px; font-weight: 500; margin: 0;">Merhaba Sayın <strong>{{accountName}}</strong>,</p>
            </div>

            <p style="font-size: 13.5px; font-weight: 400; color: #475569; text-align: center; margin: 0 0 20px 0; line-height: 1.6;">
                <strong>{{corporateName}}</strong> hesabınız için parola yenileme talebinde bulundunuz. Yeni parolanızı güvenle belirlemek için aşağıdaki butona tıklayabilirsiniz:
            </p>

            <div style="text-align: center; margin: 24px 0 14px 0;">
                <a href="{{setupUrl}}" style="background: linear-gradient(135deg, #D7147A 0%, #b80f68 100%); color: #ffffff; padding: 12px 32px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 13.5px; display: inline-block; box-shadow: 0 4px 12px rgba(215, 20, 122, 0.25); letter-spacing: 0.2px;">
                    Şifrenizi Belirleyin
                </a>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 11px 16px; margin: 18px 0; text-align: center; border: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 500; line-height: 1.5;">
                    🔒 <strong>Güvenliğiniz için:</strong> Bu bağlantı tek kullanımlıktır ve 24 saat geçerlidir. Eğer bu talebi siz yapmadıysanız lütfen bu e-postayı dikkate almayınız.
                </p>
            </div>
        </div>
        <div style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: 600; color: #475569;">{{corporateName}}</p>
            <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 400; line-height: 1.5;">
                Bu e-posta sistem tarafından otomatik olarak gönderilmiştir.<br/>
                © Move Travel &amp; Mice. Tüm hakları saklıdır.
            </p>
        </div>
    </div>
</div>`
    },
    credentials_email: {
        title: 'Kullanıcı Adı ve Şifre İletim E-postası',
        description: 'Katılımcı detayından veya operasyon panelinden müşteriye giriş bilgileri ve güvenli şifre belirleme bağlantısı gönderildiğinde kullanılan mail.',
        variables: [
            { name: '{{accountName}}', desc: 'Katılımcı / Alıcı Adı' },
            { name: '{{accountEmail}}', desc: 'Kullanıcı Adı (E-Posta)' },
            { name: '{{setupUrl}}', desc: 'Şifre Belirleme Bağlantısı' },
            { name: '{{loginUrl}}', desc: 'Giriş Sayfası Bağlantısı' },
            { name: '{{corporateName}}', desc: 'Firma / Acente Adı' }
        ],
        subject: '{{corporateName}}: Giriş Bilgileriniz ve Şifre Belirleme Bağlantısı',
        body: `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet"><div style="background-color: #f8fafc; padding: 36px 12px; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.65;">
    <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #edf2f7; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);">
        <div style="height: 3px; background: linear-gradient(90deg, #D7147A 0%, #b80f68 50%, #f43f5e 100%);"></div>
        <div style="padding: 26px 32px 18px 32px; text-align: center; border-bottom: 1px solid #f8fafc;">
            <img src="https://move.com.tr/wp-content/uploads/thegem/logos/logo_34e7aaf6ef74bcbc5b7767b6af85fbb4_1x.png" alt="Move Travel &amp; Mice" style="height: 40px; max-width: 210px; object-fit: contain; display: inline-block;" />
        </div>
        <div style="padding: 28px 32px 34px 32px;">
            <div style="text-align: center; margin-bottom: 22px;">
                <span style="display: inline-block; background: #fdf2f8; color: #D7147A; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase;">
                    Giriş Bilgileri
                </span>
                <h1 style="color: #1e293b; margin: 12px 0 6px 0; font-size: 21px; font-weight: 600; letter-spacing: -0.2px;">
                    Hesap Giriş Bilgileriniz
                </h1>
                <p style="color: #64748b; font-size: 13.5px; font-weight: 500; margin: 0;">Merhaba Sayın <strong>{{accountName}}</strong>,</p>
            </div>

            <p style="font-size: 13.5px; font-weight: 400; color: #475569; text-align: center; margin: 0 0 18px 0; line-height: 1.6;">
                <strong>{{corporateName}}</strong> sistemine giriş yapabilmeniz için kullanıcı adınız aşağıda yer almaktadır. Sisteme ilk kez giriş yapabilmeniz veya şifrenizi oluşturabilmeniz için aşağıdaki butonu kullanabilirsiniz:
            </p>
            
            <div style="background: #f8fafc; border-radius: 14px; padding: 18px 20px; border: 1px solid #e2e8f0; border-left: 3px solid #D7147A; margin: 20px 0;">
                <div style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Kullanıcı Adı (E-Posta)</div>
                <div style="font-size: 15px; font-weight: 600; color: #1e293b;">{{accountEmail}}</div>
            </div>

            <div style="text-align: center; margin: 24px 0 14px 0;">
                <a href="{{setupUrl}}" style="background: linear-gradient(135deg, #D7147A 0%, #b80f68 100%); color: #ffffff; padding: 12px 32px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 13.5px; display: inline-block; box-shadow: 0 4px 12px rgba(215, 20, 122, 0.25); letter-spacing: 0.2px;">
                    Şifrenizi Belirleyin
                </a>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 11px 16px; margin: 18px 0; text-align: center; border: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 500; line-height: 1.5;">
                    🔒 <strong>Güvenlik Uyarısı:</strong> Bu şifre belirleme bağlantısı tek kullanımlıktır ve 24 saat geçerlidir. Şifrenizi belirledikten sonra doğrudan sisteme giriş yapabilirsiniz.
                </p>
            </div>

            <p style="font-size: 13px; color: #64748b; font-weight: 500; line-height: 1.6; text-align: center; margin: 18px 0 0 0;">
                Uygulamaya giriş yaparak seyahatiniz ile ilgili uçuş, otel, transfer, rehber ve acil durum bilgilerine dilediğiniz zaman ulaşabilirsiniz.
            </p>
        </div>
        <div style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: 600; color: #475569;">{{corporateName}}</p>
            <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 400; line-height: 1.5;">
                Bu e-posta sistem tarafından otomatik olarak gönderilmiştir.<br/>
                © Move Travel &amp; Mice. Tüm hakları saklıdır.
            </p>
        </div>
    </div>
</div>`
    },
    account_updated_email: {
        title: 'İletişim & Hesap Bilgileri Güncelleme E-postası',
        description: 'Müşterinin telefon veya e-posta bilgisi güncellendiğinde yeni kullanıcı adı ve aktivasyon bağlantısını otomatik ileten bilgilendirme maili.',
        variables: [
            { name: '{{accountName}}', desc: 'Katılımcı / Alıcı Adı' },
            { name: '{{accountEmail}}', desc: 'Yeni Kullanıcı Adı (E-Posta)' },
            { name: '{{accountPhone}}', desc: 'Güncel Telefon Numarası' },
            { name: '{{setupUrl}}', desc: 'Hesap Aktivasyon / Şifre Belirleme Bağlantısı' },
            { name: '{{loginUrl}}', desc: 'Giriş Sayfası Bağlantısı' },
            { name: '{{corporateName}}', desc: 'Firma / Acente Adı' }
        ],
        subject: '{{corporateName}}: Hesap ve İletişim Bilgileriniz Güncellendi',
        body: `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet"><div style="background-color: #f8fafc; padding: 36px 12px; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.65;">
    <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #edf2f7; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);">
        <div style="height: 3px; background: linear-gradient(90deg, #D7147A 0%, #b80f68 50%, #f43f5e 100%);"></div>
        <div style="padding: 26px 32px 18px 32px; text-align: center; border-bottom: 1px solid #f8fafc;">
            <img src="https://move.com.tr/wp-content/uploads/thegem/logos/logo_34e7aaf6ef74bcbc5b7767b6af85fbb4_1x.png" alt="Move Travel &amp; Mice" style="height: 40px; max-width: 210px; object-fit: contain; display: inline-block;" />
        </div>
        <div style="padding: 28px 32px 34px 32px;">
            <div style="text-align: center; margin-bottom: 22px;">
                <span style="display: inline-block; background: #fdf2f8; color: #D7147A; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase;">
                    Bilgi Güncellemesi
                </span>
                <h1 style="color: #1e293b; margin: 12px 0 6px 0; font-size: 21px; font-weight: 600; letter-spacing: -0.2px;">
                    Hesap ve İletişim Bilgileriniz Güncellendi
                </h1>
                <p style="color: #64748b; font-size: 13.5px; font-weight: 500; margin: 0;">Merhaba Sayın <strong>{{accountName}}</strong>,</p>
            </div>

            <p style="font-size: 13.5px; font-weight: 400; color: #475569; text-align: center; margin: 0 0 18px 0; line-height: 1.6;">
                <strong>{{corporateName}}</strong> sisteminde kayıtlı profil ve iletişim bilgileriniz başarıyla güncellenmiştir. Güncel giriş ve iletişim detaylarınız aşağıda yer almaktadır:
            </p>
            
            <div style="background: #f8fafc; border-radius: 14px; padding: 18px 20px; border: 1px solid #e2e8f0; border-left: 3px solid #D7147A; margin: 20px 0;">
                <div style="margin-bottom: 12px;">
                    <div style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Giriş E-Postası (Kullanıcı Adı)</div>
                    <div style="font-size: 15px; font-weight: 600; color: #1e293b;">{{accountEmail}}</div>
                </div>
                <div>
                    <div style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Kayıtlı Telefon Numarası</div>
                    <div style="font-size: 14.5px; font-weight: 600; color: #1e293b;">{{accountPhone}}</div>
                </div>
            </div>

            <div style="text-align: center; margin: 24px 0 14px 0;">
                <a href="{{setupUrl}}" style="background: linear-gradient(135deg, #D7147A 0%, #b80f68 100%); color: #ffffff; padding: 12px 32px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 13.5px; display: inline-block; box-shadow: 0 4px 12px rgba(215, 20, 122, 0.25); letter-spacing: 0.2px;">
                    Hesabınızı Aktif Edin
                </a>
            </div>

            <p style="font-size: 12px; color: #64748b; font-weight: 500; text-align: center; margin: 0 0 18px 0; line-height: 1.5;">
                Yukarıdaki butona tıklayarak tek tıkla hesabınızı aktif hale getirebilir veya dilediğiniz zaman yeni şifrenizi belirleyebilirsiniz.
            </p>

            <p style="font-size: 13px; color: #64748b; font-weight: 500; line-height: 1.6; text-align: center; margin: 18px 0 0 0;">
                Yeni bilgilerinizle uygulamamıza giriş yaparak seyahatiniz ile ilgili tüm uçuş, transfer, tur programı ve rehber detaylarına dilediğiniz an erişebilirsiniz.
            </p>
        </div>
        <div style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: 600; color: #475569;">{{corporateName}}</p>
            <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 400; line-height: 1.5;">
                Bu e-posta sistem tarafından otomatik olarak gönderilmiştir.<br/>
                © Move Travel &amp; Mice. Tüm hakları saklıdır.
            </p>
        </div>
    </div>
</div>`
    }
};

export default function EmailTemplates() {
    const navigate = useNavigate();
    const [selectedTemplateKey, setSelectedTemplateKey] = useState('tour_email');
    const [activeTab, setActiveTab] = useState('edit'); // 'edit', 'preview', 'test'
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [sendingTest, setSendingTest] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [copiedVar, setCopiedVar] = useState(null);

    const templateMeta = defaultTemplates[selectedTemplateKey];

    // Load template
    useEffect(() => {
        const loadTemplate = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, 'email_templates', selectedTemplateKey);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    let s = docSnap.data().subject || templateMeta.subject;
                    let b = docSnap.data().body || templateMeta.body;
                    
                    // Eski veya güncel olmayan logolu/şifreli/eski uçuş tablolu/kaba fontlu şablon tespitinde otomatik olarak yeni modern Quicksand şablonuna yükselt
                    const hasOldLogo = b.includes('width: 52px; height: 52px; background: #D7147A;') || b.includes('width: 48px; height: 48px;') || !b.includes('logo_34e7aaf6ef74bcbc5b7767b6af85fbb4_1x.png');
                    const hasLegacyPasswordInBody = b.includes('{{accountPassword}}') || b.includes('{{password}}') || b.includes('Pass1234!');
                    const hasLegacyFlightTableInTicket = selectedTemplateKey === 'ticket_email' && (b.includes('{{flightsHtml}}') || !b.includes('{{pdfHtml}}'));
                    const hasNoQuicksand = !b.includes('Quicksand');
                    const hasHeavyWeights = b.includes('font-weight: 800') || b.includes('font-weight: 900') || b.includes('font-weight:800') || b.includes('font-weight:900');
                    if (hasOldLogo || hasLegacyPasswordInBody || hasLegacyFlightTableInTicket || hasNoQuicksand || hasHeavyWeights) {
                        s = templateMeta.subject;
                        b = templateMeta.body;
                        await setDoc(docRef, { subject: s, body: b }, { merge: true });
                    }
                    setSubject(s);
                    setBody(b);
                } else {
                    setSubject(templateMeta.subject);
                    setBody(templateMeta.body);
                }
            } catch (e) {
                console.error("Şablon yükleme hatası:", e);
                setSubject(templateMeta.subject);
                setBody(templateMeta.body);
            } finally {
                setLoading(false);
            }
        };
        loadTemplate();
    }, [selectedTemplateKey, templateMeta]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const docRef = doc(db, 'email_templates', selectedTemplateKey);
            await setDoc(docRef, { subject, body }, { merge: true });
            alert('E-posta şablonu başarıyla kaydedildi!');
        } catch (e) {
            console.error("Şablon kaydetme hatası:", e);
            alert('Şablon kaydedilirken hata oluştu: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSendTest = async () => {
        if (!testEmail || !testEmail.includes('@')) {
            setTestResult({ success: false, message: 'Lütfen geçerli bir test e-posta adresi girin.' });
            return;
        }

        const smtp = useSettingsStore.getState().smtpConfig;
        if (!smtp?.host || !smtp?.user || !smtp?.pass) {
            setTestResult({ success: false, message: 'SMTP ayarlarınız eksik. Lütfen Sistem Konfigürasyonu altından SMTP ayarlarını tamamlayın.' });
            return;
        }

        setSendingTest(true);
        setTestResult(null);

        try {
            const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://move-yanimda.web.app';
            let endpoint = '';
            let payload = {
                host: smtp.host,
                port: smtp.port,
                user: smtp.user,
                pass: smtp.pass,
                to: testEmail,
                customSubject: subject,
                customHtml: body
            };

            if (selectedTemplateKey === 'tour_email') {
                endpoint = '/api/send-tour-email';
                payload = {
                    ...payload,
                    corporateName: 'Move Travel & Mice',
                    participantName: 'Ahmet Yılmaz',
                    tourName: 'Klasik İtalya Turu',
                    setupUrl: 'https://move-yanimda.web.app/set-password?token=ornek_test_token'
                };
            } else if (selectedTemplateKey === 'ticket_email') {
                endpoint = '/api/send-ticket-email';
                payload = {
                    ...payload,
                    participantName: 'Ahmet Yılmaz',
                    tourName: 'Klasik İtalya Turu',
                    flights: [
                        {
                            type: "Gidiş Uçuşu",
                            airline: "Turkish Airlines",
                            from: "IST",
                            to: "FCO",
                            date: "2026-09-20",
                            departureTime: "10:30",
                            arrivalTime: "12:15",
                            pnr: "TK8899",
                            ticketNo: "235-9876543210"
                        }
                    ]
                };
            } else if (selectedTemplateKey === 'forgot_password') {
                endpoint = '/api/forgot-password';
                payload = {
                    ...payload,
                    accountName: 'Ahmet Yılmaz',
                    corporateName: 'Move Travel & Mice',
                    setupUrl: 'https://move-yanimda.web.app/set-password?token=ornek_test_token'
                };
            } else if (selectedTemplateKey === 'credentials_email') {
                endpoint = '/api/send-credentials';
                payload = {
                    ...payload,
                    accountName: 'Ahmet Yılmaz',
                    accountEmail: testEmail,
                    corporateName: 'Move Travel & Mice',
                    setupUrl: 'https://move-yanimda.web.app/set-password?token=ornek_test_token',
                    loginUrl: 'https://move-yanimda.web.app/login'
                };
            } else if (selectedTemplateKey === 'account_updated_email') {
                endpoint = '/api/send-account-update';
                payload = {
                    ...payload,
                    accountName: 'Ahmet Yılmaz',
                    accountEmail: testEmail,
                    accountPhone: '+90 555 123 45 67',
                    corporateName: 'Move Travel & Mice',
                    setupUrl: 'https://move-yanimda.web.app/set-password?token=ornek_test_token',
                    loginUrl: 'https://move-yanimda.web.app/login'
                };
            }

            const res = await fetch(`${baseUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const resData = await res.json();
            if (res.ok) {
                setTestResult({ success: true, message: `Test e-postası '${testEmail}' adresine başarıyla yollandı.` });
            } else {
                setTestResult({ success: false, message: resData.message || 'Gönderim başarısız oldu.' });
            }
        } catch (e) {
            setTestResult({ success: false, message: `Bağlantı hatası: ${e.message}` });
        } finally {
            setSendingTest(false);
        }
    };

    const getPreviewHtml = () => {
        let preview = body;
        const mockFlightsHtml = '';
        const mockPdfHtml = `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03); text-align: center;">
                <div style="display: inline-block; background: #fdf2f8; color: #D7147A; font-size: 11px; font-weight: 600; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">
                    Elektronik Bilet PDF
                </div>
                <div style="font-size: 15px; font-weight: 600; color: #1e293b; margin-bottom: 6px;">
                    Elektronik Uçuş Biletiniz Hazır
                </div>
                <p style="margin: 0 0 16px 0; color: #64748b; font-size: 13px; font-weight: 400;">Biletinizi görüntülemek veya cihazınıza indirmek için aşağıdaki butona tıklayabilirsiniz:</p>
                <div style="margin: 8px 0;">
                    <a href="#" style="display: inline-block; background: linear-gradient(135deg, #D7147A 0%, #b80f68 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: 600; font-size: 13.5px; box-shadow: 0 4px 12px rgba(215, 20, 122, 0.25); letter-spacing: 0.2px;">
                        📥 E-Bilet - Ahmet Yılmaz (PDF İndir / Görüntüle)
                    </a>
                </div>
            </div>
        `;
        const mockCredentialSection = `
            <div style="text-align: center; margin: 24px 0 14px 0;">
                <a href="https://move-yanimda.web.app/set-password?token=ornek_guvenli_token" style="background: linear-gradient(135deg, #D7147A 0%, #b80f68 100%); color: #ffffff; padding: 12px 32px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 13.5px; display: inline-block; box-shadow: 0 4px 12px rgba(215, 20, 122, 0.25); letter-spacing: 0.2px;">
                    Hesabınızı Aktif Edin
                </a>
            </div>
            <p style="font-size: 12px; color: #64748b; font-weight: 500; text-align: center; margin: 0 0 18px 0; line-height: 1.5;">
                Yukarıdaki butona tıklayarak tek tıkla hesabınızı aktif edebilir ve şifrenizi belirleyebilirsiniz.
            </p>
        `;

        preview = preview
            .replace(/{{participantName}}/g, "Ahmet Yılmaz")
            .replace(/{{tourName}}/g, "Klasik İtalya Turu")
            .replace(/{{flightsHtml}}/g, mockFlightsHtml)
            .replace(/{{pdfHtml}}/g, mockPdfHtml)
            .replace(/{{credentialSection}}/g, mockCredentialSection)
            .replace(/{{username}}/g, "ahmet@sirket.com")
            .replace(/{{accountEmail}}/g, "ahmet@sirket.com")
            .replace(/{{email}}/g, "ahmet@sirket.com")
            .replace(/{{password}}/g, "")
            .replace(/{{corporateName}}/g, "Move Travel & Mice")
            .replace(/{{accountName}}/g, "Ahmet Yılmaz")
            .replace(/{{accountPhone}}/g, "+90 555 123 45 67")
            .replace(/{{phone}}/g, "+90 555 123 45 67")
            .replace(/{{accountPassword}}/g, "")
            .replace(/{{setupUrl}}/g, "https://move-yanimda.web.app/set-password?token=ornek_guvenli_token")
            .replace(/{{loginUrl}}/g, "https://move-yanimda.web.app/login");
            
        return preview;
    };

    const insertVariable = (variableName) => {
        setCopiedVar(variableName);
        setTimeout(() => setCopiedVar(null), 1500);

        setBody(prev => {
            const textarea = document.getElementById('bodyTextarea');
            if (!textarea) return prev + variableName;
            
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const before = text.substring(0, start);
            const after = text.substring(end, text.length);
            
            setTimeout(() => {
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd = start + variableName.length;
            }, 10);
            
            return before + variableName + after;
        });
    };

    return (
        <div style={{ paddingBottom: 'calc(160px + env(safe-area-inset-bottom, 0px))', background: '#f8fafc', minHeight: '100vh' }}>
            <Header title="E-Posta Şablon Yönetimi" showBack />

            <div style={{ maxWidth: '680px', margin: '0 auto', padding: '14px 12px' }}>
                
                {/* 1. Template Selector Card */}
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '12px 14px', marginBottom: '10px', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)' }}>
                    <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '4px', display: 'block' }}>
                        YÖNETİLECEK ŞABLON
                    </label>
                    <select 
                        value={selectedTemplateKey}
                        onChange={(e) => setSelectedTemplateKey(e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', color: '#1e293b', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                    >
                        {Object.entries(defaultTemplates).map(([key, value]) => (
                            <option key={key} value={key}>{value.title}</option>
                        ))}
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '10.5px', color: '#64748b' }}>
                        <Info size={12} color="var(--primary)" style={{ flexShrink: 0 }} />
                        <span>{templateMeta.description}</span>
                    </div>
                </div>

                {/* 2. Tab Navigation Card */}
                <div style={{ 
                    background: 'white', 
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0', 
                    padding: '8px', 
                    marginBottom: '12px', 
                    boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)' 
                }}>
                    <div style={{ 
                        display: 'flex', 
                        gap: '6px', 
                        background: '#f8fafc', 
                        padding: '4px', 
                        borderRadius: '12px', 
                        border: '1px solid #f1f5f9' 
                    }}>
                        <button
                            type="button"
                            onClick={() => setActiveTab('edit')}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                padding: '8px 10px',
                                borderRadius: '9px',
                                fontSize: 'clamp(10px, 2.8vw, 11.5px)',
                                fontWeight: activeTab === 'edit' ? '800' : '600',
                                background: activeTab === 'edit' ? 'var(--primary)' : 'transparent',
                                color: activeTab === 'edit' ? 'white' : '#64748b',
                                border: 'none',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.18s ease',
                                boxShadow: activeTab === 'edit' ? '0 2px 6px rgba(215, 20, 122, 0.25)' : 'none'
                            }}
                            onMouseEnter={e => {
                                if (activeTab !== 'edit') e.currentTarget.style.color = '#1e293b';
                            }}
                            onMouseLeave={e => {
                                if (activeTab !== 'edit') e.currentTarget.style.color = '#64748b';
                            }}
                        >
                            <Code size={13} style={{ flexShrink: 0 }} /> Şablon Düzenle
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('preview')}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                padding: '8px 10px',
                                borderRadius: '9px',
                                fontSize: 'clamp(10px, 2.8vw, 11.5px)',
                                fontWeight: activeTab === 'preview' ? '800' : '600',
                                background: activeTab === 'preview' ? 'var(--primary)' : 'transparent',
                                color: activeTab === 'preview' ? 'white' : '#64748b',
                                border: 'none',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.18s ease',
                                boxShadow: activeTab === 'preview' ? '0 2px 6px rgba(215, 20, 122, 0.25)' : 'none'
                            }}
                            onMouseEnter={e => {
                                if (activeTab !== 'preview') e.currentTarget.style.color = '#1e293b';
                            }}
                            onMouseLeave={e => {
                                if (activeTab !== 'preview') e.currentTarget.style.color = '#64748b';
                            }}
                        >
                            <Eye size={13} style={{ flexShrink: 0 }} /> Önizleme
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('test')}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                padding: '8px 10px',
                                borderRadius: '9px',
                                fontSize: 'clamp(10px, 2.8vw, 11.5px)',
                                fontWeight: activeTab === 'test' ? '800' : '600',
                                background: activeTab === 'test' ? 'var(--primary)' : 'transparent',
                                color: activeTab === 'test' ? 'white' : '#64748b',
                                border: 'none',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.18s ease',
                                boxShadow: activeTab === 'test' ? '0 2px 6px rgba(215, 20, 122, 0.25)' : 'none'
                            }}
                            onMouseEnter={e => {
                                if (activeTab !== 'test') e.currentTarget.style.color = '#1e293b';
                            }}
                            onMouseLeave={e => {
                                if (activeTab !== 'test') e.currentTarget.style.color = '#64748b';
                            }}
                        >
                            <Send size={13} style={{ flexShrink: 0 }} /> Test Gönder
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '30px', color: '#64748b', fontSize: '11px' }}>
                        <Loader2 size={16} className="spin" style={{ marginRight: '6px' }} /> Şablon yükleniyor...
                    </div>
                ) : (
                    <>
                        {/* TAB 1: EDIT */}
                        {activeTab === 'edit' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                
                                {/* Variable Chips */}
                                <div style={{ background: 'white', padding: '10px 12px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Sparkles size={11} color="var(--primary)" /> DİNAMİK DEĞİŞKENLER (Dokunarak Ekle)
                                        </div>
                                        {copiedVar && (
                                            <span style={{ fontSize: '9.5px', color: '#059669', fontWeight: '800' }}>✓ Eklendi</span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {templateMeta.variables.map((v) => (
                                            <button 
                                                key={v.name}
                                                type="button"
                                                onClick={() => insertVariable(v.name)}
                                                style={{ 
                                                    background: '#f8fafc', 
                                                    border: '1px solid #cbd5e1', 
                                                    padding: '3px 7px', 
                                                    borderRadius: '6px', 
                                                    fontSize: '10px', 
                                                    color: '#334155', 
                                                    cursor: 'pointer', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '4px',
                                                    transition: 'all 0.15s ease'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#334155'; }}
                                            >
                                                <code style={{ fontWeight: '700', color: 'var(--primary)' }}>{v.name}</code>
                                                <span style={{ color: '#64748b', fontSize: '9px' }}>({v.desc})</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Subject */}
                                <div style={{ background: 'white', padding: '12px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                    <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '4px', display: 'block' }}>E-POSTA KONUSU (SUBJECT)</label>
                                    <input 
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="E-posta konusu..."
                                        style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', color: '#1e293b', fontSize: '11.5px', boxSizing: 'border-box' }}
                                    />
                                </div>

                                {/* HTML Body */}
                                <div style={{ background: 'white', padding: '12px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', display: 'block' }}>E-POSTA İÇERİĞİ (HTML)</label>
                                        <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>UTF-8 / Responsive</span>
                                    </div>
                                    <textarea 
                                        id="bodyTextarea"
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        rows={12}
                                        placeholder="HTML kodları..."
                                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#0f172a', color: '#38bdf8', fontSize: '11px', fontFamily: 'monospace', resize: 'vertical', lineHeight: 1.4, boxSizing: 'border-box' }}
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                        type="button"
                                        onClick={async () => {
                                            if (window.confirm("Bu şablonu orijinal standart ve güvenli tasarıma sıfırlamak istediğinize emin misiniz?")) {
                                                setSubject(templateMeta.subject);
                                                setBody(templateMeta.body);
                                                try {
                                                    const docRef = doc(db, 'email_templates', selectedTemplateKey);
                                                    await setDoc(docRef, { subject: templateMeta.subject, body: templateMeta.body }, { merge: true });
                                                    alert("Şablon varsayılan tasarıma sıfırlandı ve kaydedildi.");
                                                } catch (err) {
                                                    console.warn(err);
                                                }
                                            }
                                        }}
                                        style={{ 
                                            flex: 1,
                                            padding: '10px', 
                                            borderRadius: '10px', 
                                            fontSize: '11.5px', 
                                            fontWeight: '700', 
                                            background: '#f1f5f9', 
                                            color: '#475569', 
                                            border: '1px solid #cbd5e1', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            gap: '6px', 
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Sparkles size={13} color="#64748b" /> Standart Tasarıma Sıfırla
                                    </button>

                                    <button 
                                        onClick={handleSave}
                                        disabled={saving}
                                        style={{ 
                                            flex: 1,
                                            padding: '10px', 
                                            borderRadius: '10px', 
                                            fontSize: '11.5px', 
                                            fontWeight: '800', 
                                            background: 'var(--primary)', 
                                            color: 'white', 
                                            border: 'none', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            gap: '6px', 
                                            cursor: saving ? 'not-allowed' : 'pointer',
                                            boxShadow: '0 2px 8px rgba(215, 20, 122, 0.25)' 
                                        }}
                                    >
                                        {saving ? <Loader2 size={13} className="spin" /> : <Save size={13} />}
                                        {saving ? 'Kaydediliyor...' : 'Şablonu Kaydet'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: LIVE PREVIEW */}
                        {activeTab === 'preview' && (
                            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '12px', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)' }}>
                                <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '8px' }}>
                                    CANLI ÖNİZLEME (Örnek Parametreler ile)
                                </div>
                                <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', background: 'white' }}>
                                    <iframe 
                                        title="E-posta Canlı Önizleme"
                                        srcDoc={getPreviewHtml()}
                                        style={{ width: '100%', height: '360px', border: 'none', display: 'block', background: 'white' }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* TAB 3: TEST SEND */}
                        {activeTab === 'test' && (
                            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '14px', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                    <Mail size={13} color="var(--primary)" />
                                    <h3 style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#1e293b' }}>Canlı Test E-Postası Gönder</h3>
                                </div>
                                <div style={{ fontSize: '10.5px', color: '#64748b', marginBottom: '10px' }}>
                                    Düzenlediğiniz şablonu gerçek gelen kutusunda görmek için bir alıcı adresi girin (Önceden kaydetmeniz gerekmez).
                                </div>

                                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                                    <input 
                                        type="email"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value.toLowerCase().trim())}
                                        placeholder="ornek@alanadi.com"
                                        style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', color: '#1e293b', fontSize: '11px' }}
                                    />
                                    <button 
                                        onClick={handleSendTest}
                                        disabled={sendingTest || !testEmail}
                                        style={{ 
                                            padding: '7px 14px', 
                                            borderRadius: '8px', 
                                            background: '#2563eb', 
                                            color: 'white', 
                                            border: 'none', 
                                            fontWeight: '700', 
                                            fontSize: '11px', 
                                            cursor: sendingTest || !testEmail ? 'not-allowed' : 'pointer', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '5px',
                                            opacity: sendingTest || !testEmail ? 0.6 : 1
                                        }}
                                    >
                                        {sendingTest ? <Loader2 size={12} className="spin" /> : <Send size={12} />}
                                        {sendingTest ? 'Yollanıyor...' : 'Test Yolla'}
                                    </button>
                                </div>

                                {testResult && (
                                    <div style={{ 
                                        padding: '8px 10px', 
                                        borderRadius: '8px', 
                                        fontSize: '11px', 
                                        fontWeight: '600', 
                                        background: testResult.success ? '#ecfdf5' : '#fee2e2', 
                                        color: testResult.success ? '#047857' : '#b91c1c', 
                                        border: `1px solid ${testResult.success ? '#a7f3d0' : '#fecaca'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        {testResult.success ? <CheckCircle2 size={13} /> : <Info size={13} />}
                                        {testResult.message}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
        {/* Bottom clearance spacer so templates are never covered by floating bottom nav & Tintin button */}
        <div style={{ height: '160px', minHeight: '160px', width: '100%', flexShrink: 0, pointerEvents: 'none' }} aria-hidden="true" />
      </div>
    </div>
  );
}
