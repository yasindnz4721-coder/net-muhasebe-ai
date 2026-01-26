
import { lazy } from 'react';
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
import AdminPage from '../pages/admin/page';
import NotFoundPage from '../pages/NotFound';

const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/kayit',
    element: <KayitPage />,
  },
  {
    path: '/sifre-sifirlama',
    element: <SifreSifirlamaPage />,
  },
  {
    path: '/yeni-sifre',
    element: <YeniSifrePage />,
  },
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/admin',
    element: <AdminPage />,
  },
  {
    path: '/cariler',
    element: <CarilerPage />,
  },
  {
    path: '/cari-detay/:id',
    element: <CariDetayPage />,
  },
  {
    path: '/urunler',
    element: <UrunlerPage />,
  },
  {
    path: '/stok',
    element: <StokPage />,
  },
  {
    path: '/satis-faturasi',
    element: <SatisFaturasiPage />,
  },
  {
    path: '/alis-faturasi',
    element: <AlisFaturasiPage />,
  },
  {
    path: '/odemeler',
    element: <OdemelerPage />,
  },
  {
    path: '/raporlar',
    element: <RaporlarPage />,
  },
  {
    path: '/tum-islemler',
    element: <TumIslemlerPage />,
  },
  {
    path: '/profil-ayarlari',
    element: <ProfilAyarlariPage />,
  },
  {
    path: '/premium',
    element: <PremiumPage />,
  },
  {
    path: '/ai-analiz',
    element: <AIAnalizPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

export default routes;
