const { query } = require('./db');

async function updateSchema() {
    try {
        console.log('🔄 Veritabanı şeması güncelleniyor (Stok Hareketleri)...');
        await query('ALTER TABLE stok_hareketleri ADD COLUMN IF NOT EXISTS cari_id UUID REFERENCES cariler(id) ON DELETE SET NULL');
        await query("ALTER TABLE stok_hareketleri ADD COLUMN IF NOT EXISTS cari_ad VARCHAR(255) DEFAULT ''");

        console.log('🔄 Veritabanı şeması güncelleniyor (Ürünler Genişletme)...');
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS urun_tipi VARCHAR(50) DEFAULT 'Ürün'");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS urun_cinsi VARCHAR(100) DEFAULT ''");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS urun_kodu VARCHAR(100) DEFAULT ''");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS urun_barkodu VARCHAR(100) DEFAULT ''");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS alis_fiyati DECIMAL(15, 2) DEFAULT 0");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS satis_fiyati DECIMAL(15, 2) DEFAULT 0");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS alis_kdv_dahil BOOLEAN DEFAULT FALSE");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS satis_kdv_dahil BOOLEAN DEFAULT FALSE");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS kdv_orani INTEGER DEFAULT 20");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS otv_orani INTEGER DEFAULT 0");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS oiv_orani INTEGER DEFAULT 0");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS stok_takibi BOOLEAN DEFAULT TRUE");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS stok_uyari_limiti DECIMAL(15, 2) DEFAULT 10");

        console.log('🔄 Veritabanı şeması güncelleniyor (Personel Modülü)...');
        await query(`
            CREATE TABLE IF NOT EXISTS personeller (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                ad_soyad VARCHAR(255) NOT NULL,
                unvan VARCHAR(255) DEFAULT '',
                tckn VARCHAR(11) DEFAULT '',
                telefon VARCHAR(50) DEFAULT '',
                email VARCHAR(255) DEFAULT '',
                adres TEXT DEFAULT '',
                ise_giris_tarihi DATE DEFAULT CURRENT_DATE,
                maas DECIMAL(15, 2) DEFAULT 0,
                iban VARCHAR(34) DEFAULT '',
                durum VARCHAR(50) DEFAULT 'Aktif',
                profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);
        await query(`
             CREATE TABLE IF NOT EXISTS personel_puantaj (
                 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                 personel_id UUID REFERENCES personeller(id) ON DELETE CASCADE,
                 tarih DATE NOT NULL,
                 durum VARCHAR(50) DEFAULT 'Geldi',
                 notlar TEXT DEFAULT '',
                 profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                 created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                 UNIQUE(personel_id, tarih)
             )
         `);
        await query(`
            CREATE TABLE IF NOT EXISTS personel_avanslar (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                personel_id UUID REFERENCES personeller(id) ON DELETE CASCADE,
                tarih DATE NOT NULL,
                tutar DECIMAL(15, 2) NOT NULL,
                aciklama TEXT DEFAULT '',
                profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        console.log('🔄 Veritabanı şeması güncelleniyor (Ücretsiz Deneme)...');
        await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE');
        await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE");
        await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'card'");
        await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active'");

        await query(`
            CREATE TABLE IF NOT EXISTS taksitler (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                cari_id UUID REFERENCES cariler(id) ON DELETE SET NULL,
                cari_ad VARCHAR(255),
                toplam_tutar DECIMAL(15, 2) NOT NULL,
                taksit_tutari DECIMAL(15, 2) NOT NULL,
                taksit_sayisi INTEGER NOT NULL,
                odeme_gunu INTEGER NOT NULL,
                baslangic_tarihi DATE NOT NULL,
                aciklama TEXT,
                durum VARCHAR(50) DEFAULT 'Aktif',
                profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS taksit_odemeleri (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                taksit_id UUID REFERENCES taksitler(id) ON DELETE CASCADE,
                vade_tarihi DATE NOT NULL,
                tutar DECIMAL(15, 2) NOT NULL,
                durum VARCHAR(50) DEFAULT 'Bekliyor',
                odeme_tarihi TIMESTAMP WITH TIME ZONE,
                odeme_id UUID REFERENCES odemeler(id) ON DELETE SET NULL,
                profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        console.log('🔄 Veritabanı şeması güncelleniyor (Taksitler & Performans)...');
        await query('CREATE INDEX IF NOT EXISTS idx_taksitler_profile_id ON taksitler(profile_id)');
        await query('CREATE INDEX IF NOT EXISTS idx_taksit_odemeleri_profile_id ON taksit_odemeleri(profile_id)');
        await query('CREATE INDEX IF NOT EXISTS idx_taksit_odemeleri_vade_tarihi ON taksit_odemeleri(vade_tarihi)');
        await query('CREATE INDEX IF NOT EXISTS idx_taksit_odemeleri_taksit_id ON taksit_odemeleri(taksit_id)');

        console.log('🔄 Veritabanı şeması güncelleniyor (Kasa Sistemi)...');
        await query(`
            CREATE TABLE IF NOT EXISTS kasalar (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                ad VARCHAR(255) NOT NULL,
                bakiye DECIMAL(15, 2) DEFAULT 0,
                is_default BOOLEAN DEFAULT FALSE,
                profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        await query('ALTER TABLE odemeler ADD COLUMN IF NOT EXISTS kasa_id UUID REFERENCES kasalar(id) ON DELETE SET NULL');
        await query('ALTER TABLE taksit_odemeleri ADD COLUMN IF NOT EXISTS kasa_id UUID REFERENCES kasalar(id) ON DELETE SET NULL');
        await query('ALTER TABLE personel_avanslar ADD COLUMN IF NOT EXISTS kasa_id UUID REFERENCES kasalar(id) ON DELETE SET NULL');

        // Her profil için varsayılan bir "Ana Kasa" oluştur (yoksa)
        const profilesResult = await query('SELECT id FROM profiles');
        for (const profile of profilesResult.rows) {
            const hasKasa = await query('SELECT id FROM kasalar WHERE profile_id = $1 AND is_default = TRUE', [profile.id]);
            if (hasKasa.rows.length === 0) {
                await query(
                    "INSERT INTO kasalar (ad, bakiye, is_default, profile_id) VALUES ('Ana Kasa', 0, TRUE, $1)",
                    [profile.id]
                );
            }
        }

        console.log('🔄 Veritabanı şeması güncelleniyor (PROFİL EKLEMELERİ)...');
        await query("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url TEXT");
        await query("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name VARCHAR(255)");

        console.log('🔄 Veritabanı şeması güncelleniyor (BİLDİRİMLER)...');
        await query(`
            CREATE TABLE IF NOT EXISTS bildirimler (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                baslik VARCHAR(255) NOT NULL,
                mesaj TEXT NOT NULL,
                tip VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
                okundu BOOLEAN DEFAULT FALSE,
                olusturma_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);
        await query('CREATE INDEX IF NOT EXISTS idx_bildirimler_profile_id ON bildirimler(profile_id)');
        await query('CREATE INDEX IF NOT EXISTS idx_bildirimler_okundu ON bildirimler(okundu)');

        console.log('🔄 Veritabanı şeması güncelleniyor (OTOMASYON EKLEMELERİ)...');
        await query('ALTER TABLE odemeler ADD COLUMN IF NOT EXISTS personel_id UUID REFERENCES personeller(id) ON DELETE SET NULL');

        console.log('🔄 Veritabanı şeması güncelleniyor (DENETİM SİSTEMİ)...');
        await query(`
            CREATE TABLE IF NOT EXISTS denetim_kayitlari (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                islem_tipi VARCHAR(100) NOT NULL,
                tablo_adi VARCHAR(100),
                kayit_id UUID,
                aciklama TEXT,
                kullanici_email VARCHAR(255),
                olusturma_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);
        await query('CREATE INDEX IF NOT EXISTS idx_denetim_profile_id ON denetim_kayitlari(profile_id)');

        console.log('🔄 Veritabanı şeması güncelleniyor (GİDER YÖNETİMİ)...');
        await query(`
            CREATE TABLE IF NOT EXISTS gider_kategorileri (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                ad VARCHAR(100) NOT NULL,
                ikon VARCHAR(100),
                renk VARCHAR(20),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS giderler (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                kategori_id UUID REFERENCES gider_kategorileri(id) ON DELETE SET NULL,
                tutar DECIMAL(15,2) NOT NULL DEFAULT 0,
                tarih TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                kasa_id UUID REFERENCES kasalar(id) ON DELETE SET NULL,
                odeme_yontemi VARCHAR(50) DEFAULT 'Nakit',
                aciklama TEXT,
                kullanici_email VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        // Varsayılan kategorileri ekle (her profil için ilk seferde tetiklenebilir ama burada genel bir tablo gibi düşünelim)
        // Gerçek uygulamada profil seçildiğinde kontrol edilir ama basitlik için şemada bırakalım.

        console.log('🔄 Veritabanı şeması güncelleniyor (Banka & Personel Geliştirmeleri)...');
        await query("ALTER TABLE kasalar ADD COLUMN IF NOT EXISTS tip VARCHAR(20) DEFAULT 'Nakit'");
        await query("ALTER TABLE kasalar ADD COLUMN IF NOT EXISTS banka_adi VARCHAR(255) DEFAULT ''");
        await query("ALTER TABLE kasalar ADD COLUMN IF NOT EXISTS iban VARCHAR(34) DEFAULT ''");
        await query("ALTER TABLE kasalar ADD COLUMN IF NOT EXISTS hesap_no VARCHAR(50) DEFAULT ''");
        await query("ALTER TABLE personeller ADD COLUMN IF NOT EXISTS bakiye DECIMAL(15, 2) DEFAULT 0");

        console.log('✅ Veritabanı şeması başarıyla güncellendi.');
    } catch (error) {
        console.error('❌ Şema güncelleme hatası:', error);
        throw error;
    }
}

module.exports = { updateSchema };
