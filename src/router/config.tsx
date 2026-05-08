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
import GiderlerPage from '../pages/giderler/page';
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
import CariEkstrePage from '../pages/cari-ekstre/page';
import SMSVerificationPage from '../pages/sms-verification/page';
import PersonelPage from '../pages/personel/page';
import PuantajTakibiPage from '../pages/personel/puantaj';
import TaksitlerPage from '../pages/taksitler/page';
import TaksitTakibiPage from '../pages/taksit-takibi/page';
import TrialExpiredPage from '../pages/TrialExpired';
import UretimPage from '../pages/uretim/page';
import DenetimPage from '../pages/denetim/page';
import BankalarPage from '../pages/bankalar/page';
import BankaDetayPage from '../pages/banka-detay/page';

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
  { path: '/giderler', element: <GiderlerPage /> },
  { path: '/raporlar', element: <RaporlarPage /> },
  { path: '/tum-islemler', element: <TumIslemlerPage /> },
  { path: '/profil-ayarlari', element: <ProfilAyarlariPage /> },
  { path: '/ai-analiz', element: <AIAnalizPage /> },
  { path: '/personel', element: <PersonelPage /> },
  { path: '/puantaj-takibi', element: <PuantajTakibiPage /> },
  { path: '/uretim', element: <UretimPage /> },
  { path: '/stok-transferi', element: stub('Depo Transferi') },
  { path: '/stok-karlilik', element: stub('Kârlılık Analizi') },
  { path: '/urun-ekstre', element: stub('Ürün Hareket Ekstresi') },
  { path: '/bankalar', element: <BankalarPage /> },
  { path: '/banka-detay/:id', element: <BankaDetayPage /> },
  { path: '/cek-senet', element: stub('Çek ve Senetler') },
  { path: '/taksit-takibi', element: <TaksitTakibiPage /> },
  { path: '/taksitler', element: <TaksitlerPage /> },
  { path: '/kdv-raporu', element: stub('KDV Raporu') },
  { path: '/cari-ekstre', element: <CariEkstrePage /> },
  { path: '/zimmet-listesi', element: stub('Zimmet Takibi') },
  { path: '/denetim', element: <DenetimPage /> },

  { path: '/gizlilik-politikasi', element: <GizlilikPolitikasiPage /> },
  { path: '*', element: <NotFoundPage /> },
];

export default routes;
