import { RouteObject } from 'react-router-dom';

import HomePage from '../pages/home/page';
import CarilerPage from '../pages/cariler/page';
import CariDetayPage from '../pages/cari-detay/page';
import UrunlerPage from '../pages/urunler/page';
import StokPage from '../pages/stok/page';
import SatisFaturasiPage from '../pages/satis-faturasi/page';
import AlisFaturasiPage from '../pages/alis-faturasi/page';
import OdemelerPage from '../pages/odemeler/page';
import RaporlarPage from '../pages/raporlar/page';
import TumIslemlerPage from '../pages/tum-islemler/page';
import ProfilAyarlariPage from '../pages/profil-ayarlari/page';
import LoginPage from '../pages/login/page';
import KayitPage from '../pages/kayit/page';
import SifreSifirlamaPage from '../pages/sifre-sifirlama/page';
import YeniSifrePage from '../pages/yeni-sifre/page';
import PremiumPage from '../pages/premium/page';
import AIAnalizPage from '../pages/ai-analiz/page';
import MuhasebeDashboard from '../muhasebeDashboard';
import AdminPage from '../pages/admin/page';
import GizlilikPolitikasiPage from '../pages/gizlilik-politikasi/page';
import TanitimPage from '../pages/tanitim/page';
import LandingPage from '../pages/landing/page';
import NotFoundPage from '../pages/NotFound';
import ComingSoonPage from '../pages/ComingSoon';
import SMSVerificationPage from '../pages/sms-verification/page';
import PersonelPage from '../pages/personel/page';
import PuantajTakibiPage from '../pages/personel/puantaj';
import TaksitlerPage from '../pages/taksitler/page';
import TaksitTakibiPage from '../pages/taksit-takibi/page';
import TrialExpiredPage from '../pages/TrialExpired';

// Helper to create stub routes
const stub = (title: string) => <ComingSoonPage title={title} />;

const routes: RouteObject[] = [
  { path: '/tanitim-filmi', element: <TanitimPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/kayit', element: <KayitPage /> },
  { path: '/deneme-suresi-doldu', element: <TrialExpiredPage /> },
  { path: '/', element: <LandingPage /> },
  { path: '/dashboard', element: <MuhasebeDashboard /> },
  { path: '/admin', element: <AdminPage /> },
  { path: '/sms-dogrulama', element: <SMSVerificationPage /> },
  { path: '/cariler', element: <CarilerPage /> },
  { path: '/cari-detay/:id', element: <CariDetayPage /> },
  { path: '/urunler', element: <UrunlerPage /> },
  { path: '/stok', element: <StokPage /> },
  { path: '/satis-faturasi', element: <SatisFaturasiPage /> },
  { path: '/alis-faturasi', element: <AlisFaturasiPage /> },
  { path: '/odemeler', element: <OdemelerPage /> },
  { path: '/raporlar', element: <RaporlarPage /> },
  { path: '/tum-islemler', element: <TumIslemlerPage /> },
  { path: '/profil-ayarlari', element: <ProfilAyarlariPage /> },
  { path: '/ai-analiz', element: <AIAnalizPage /> },
  { path: '/personel', element: <PersonelPage /> },
  { path: '/puantaj-takibi', element: <PuantajTakibiPage /> },

  // New "Cari" Style Routes (Stubs)
  { path: '/teklifler', element: stub('Teklif Yönetimi') },
  { path: '/satis-siparis', element: stub('Satış Siparişleri') },
  { path: '/alis-siparis', element: stub('Alış Siparişleri') },
  { path: '/urun-varyantlari', element: stub('Ürün Varyantları') },
  { path: '/uretim-recetesi', element: stub('Üretim Reçetesi') },
  { path: '/uretim', element: stub('Üretim Planlama') },
  { path: '/stok-transferi', element: stub('Depo Transferi') },
  { path: '/stok-karlilik', element: stub('Kârlılık Analizi') },
  { path: '/urun-ekstre', element: stub('Ürün Hareket Ekstresi') },
  { path: '/bankalar', element: stub('Banka Hesapları') },
  { path: '/cek-senet', element: stub('Çek ve Senetler') },
  { path: '/taksit-takibi', element: <TaksitTakibiPage /> },
  { path: '/taksitler', element: <TaksitlerPage /> },
  { path: '/kdv-raporu', element: stub('KDV Raporu') },
  { path: '/cari-ekstre', element: stub('Cari Ekstre Raporu') },
  { path: '/zimmet-listesi', element: stub('Zimmet Takibi') },

  { path: '/gizlilik-politikasi', element: <GizlilikPolitikasiPage /> },
  { path: '*', element: <NotFoundPage /> },
];

export default routes;
