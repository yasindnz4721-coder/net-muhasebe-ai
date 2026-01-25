import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  satisFaturalari as satisApi,
  alisFaturalari as alisApi,
  cariler as carilerApi,
  urunler as urunlerApi,
  odemeler as odemelerApi,
  stokHareketleri as stokApi,
  Cari,
  Urun,
  SatisFaturasi
} from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import ProfileSelector from '../../components/feature/ProfileSelector';

interface UrunItem {
  urun_id: string;
  urun_ad: string;
  miktar: number;
  birim_fiyat: number;
  toplam: number;
}

interface Fatura {
  id: string;
  cari_id: string;
  cari_ad: string;
  fatura_no: string;
  tarih: string;
  urunler: UrunItem[];
  kdv: number;
  toplam: number;
  durum: string;
  aciklama?: string;
  profile_id: string;
  created_at: string;
  tutar: number;
}

export default function SatisFaturasi() {
  const { selectedProfile } = useProfile();
  const [faturalar, setFaturalar] = useState<Fatura[]>([]);
  const [cariler, setCariler] = useState<Cari[]>([]);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedFatura, setSelectedFatura] = useState<Fatura | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cariBakiye, setCariBakiye] = useState<number>(0);
  const [printCariBakiye, setPrintCariBakiye] = useState<number>(0);
  const [formData, setFormData] = useState({
    cari_id: '',
    cari_ad: '',
    fatura_no: '',
    tarih: new Date().toISOString().split('T')[0],
    aciklama: '',
    urunler: [{ urun_id: '', urun_ad: '', miktar: 1, birim_fiyat: 0, toplam: 0 }],
    kdv_orani: 20,
    kdv_uygula: true,
    durum: 'Onaylandı'
  });

  useEffect(() => {
    if (selectedProfile) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [selectedProfile]);

  const generateFaturaNo = async () => {
    if (!selectedProfile) return 'SF-0001';

    try {
      const { data } = await satisApi.getAll(selectedProfile.id);

      if (data && data.length > 0) {
        // En son fatura numarasını bul
        const sortedData = [...data].sort((a, b) =>
          new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        );
        const lastNo = sortedData[0].fatura_no;
        const match = lastNo.match(/SF-(\d+)/);
        if (match) {
          const nextNo = parseInt(match[1]) + 1;
          return `SF-${nextNo.toString().padStart(4, '0')}`;
        }
      }
      return 'SF-0001';
    } catch (error) {
      console.error('Fatura no oluşturulurken hata:', error);
      return 'SF-0001';
    }
  };

  const loadData = async () => {
    if (!selectedProfile) return;

    try {
      setLoading(true);
      const { data: faturalarData } = await satisApi.getAll(selectedProfile.id);
      const { data: carilerData } = await carilerApi.getAll(selectedProfile.id);
      const { data: urunlerData } = await urunlerApi.getAll(selectedProfile.id);

      setFaturalar((faturalarData as Fatura[]) || []);
      setCariler(carilerData || []);
      setUrunler(urunlerData || []);
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (urunler: UrunItem[], kdvUygula: boolean, kdvOrani: number) => {
    const araToplam = urunler.reduce((sum, u) => sum + (u.miktar * u.birim_fiyat), 0);
    const kdv = kdvUygula ? araToplam * (kdvOrani / 100) : 0;
    const toplam = araToplam + kdv;
    return { araToplam, kdv, toplam };
  };

  const calculateCariBakiye = async (cariId: string) => {
    if (!selectedProfile || !cariId) return 0;

    try {
      let toplamBorc = 0;
      let toplamAlacak = 0;

      // Satış faturaları (Borç)
      const { data: satisFaturalari } = await satisApi.getAll(selectedProfile.id);
      if (satisFaturalari) {
        toplamBorc = satisFaturalari
          .filter(f => f.cari_id === cariId)
          .reduce((sum, f) => sum + parseFloat(f.toplam.toString()), 0);
      }

      // Alış faturaları (Alacak)
      const { data: alisFaturalari } = await alisApi.getAll(selectedProfile.id);
      if (alisFaturalari) {
        toplamAlacak = alisFaturalari
          .filter(f => f.cari_id === cariId)
          .reduce((sum, f) => sum + parseFloat(f.toplam.toString()), 0);
      }

      // Ödemeler
      const { data: odemeler } = await odemelerApi.getAll(selectedProfile.id);
      if (odemeler) {
        odemeler.filter(o => o.cari_id === cariId).forEach(odeme => {
          if (odeme.tip === 'Ödeme Alındı' || odeme.tip === 'Tahsilat') {
            toplamAlacak += parseFloat(odeme.tutar.toString());
          } else if (odeme.tip === 'Ödeme Yapıldı' || odeme.tip === 'Tediye') {
            toplamBorc += parseFloat(odeme.tutar.toString());
          }
        });
      }

      return toplamBorc - toplamAlacak;
    } catch (error) {
      console.error('Bakiye hesaplanırken hata:', error);
      return 0;
    }
  };

  const handleCariChange = async (cariId: string) => {
    const cari = cariler.find(c => c.id === cariId);
    setFormData({
      ...formData,
      cari_id: cariId,
      cari_ad: cari ? cari.ad : ''
    });

    // Bakiye hesapla
    const bakiye = await calculateCariBakiye(cariId);
    setCariBakiye(bakiye);
  };

  const handleUrunChange = (index: number, field: string, value: any) => {
    const newUrunler = [...formData.urunler];
    newUrunler[index] = { ...newUrunler[index], [field]: value };

    if (field === 'urun_id') {
      const urun = urunler.find(u => u.id === value);
      if (urun) {
        newUrunler[index].urun_ad = urun.ad;
        newUrunler[index].birim_fiyat = 0;
      }
    }

    if (field === 'miktar' || field === 'birim_fiyat') {
      newUrunler[index].toplam = newUrunler[index].miktar * newUrunler[index].birim_fiyat;
    }

    setFormData({
      ...formData,
      urunler: newUrunler
    });
  };

  const handleKdvChange = (uygula: boolean, oran?: number) => {
    setFormData({
      ...formData,
      kdv_uygula: uygula,
      kdv_orani: oran !== undefined ? oran : formData.kdv_orani
    });
  };

  const addUrunRow = () => {
    setFormData({
      ...formData,
      urunler: [...formData.urunler, { urun_id: '', urun_ad: '', miktar: 1, birim_fiyat: 0, toplam: 0 }]
    });
  };

  const removeUrunRow = (index: number) => {
    if (formData.urunler.length > 1) {
      const newUrunler = formData.urunler.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        urunler: newUrunler
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    if (!formData.cari_id || formData.urunler.length === 0) {
      return;
    }

    // Tüm ürünlerin seçildiğinden emin ol
    const hasEmptyProduct = formData.urunler.some(u => !u.urun_id || u.miktar <= 0 || u.birim_fiyat <= 0);
    if (hasEmptyProduct) {
      return;
    }

    try {
      const faturaNo = formData.fatura_no || await generateFaturaNo();
      const { araToplam, kdv, toplam } = calculateTotals(formData.urunler, formData.kdv_uygula, formData.kdv_orani);

      const faturaData = {
        cari_id: formData.cari_id,
        cari_ad: formData.cari_ad,
        fatura_no: faturaNo,
        tarih: formData.tarih,
        tutar: Number(araToplam.toFixed(2)),
        aciklama: formData.aciklama || undefined,
        urunler: formData.urunler.map(u => ({
          urun_id: u.urun_id,
          urun_ad: u.urun_ad,
          miktar: Number(u.miktar),
          birim_fiyat: Number(u.birim_fiyat),
          toplam: Number(u.toplam)
        })),
        kdv: Number(kdv.toFixed(2)),
        toplam: Number(toplam.toFixed(2)),
        durum: formData.durum,
        profile_id: selectedProfile.id
      };

      if (isEditing && selectedFatura) {
        // Eski faturanın stok üzerindeki etkisini geri al
        if (selectedFatura.urunler && Array.isArray(selectedFatura.urunler)) {
          for (const urun of selectedFatura.urunler) {
            if (urun.urun_id) {
              const { data: urunData } = await urunlerApi.getById(urun.urun_id);
              if (urunData) {
                const yeniStok = Number(urunData.stok_miktari) + Number(urun.miktar);
                await urunlerApi.update(urun.urun_id, { stok_miktari: yeniStok });
              }
            }
          }
        }

        const { error } = await satisApi.update(selectedFatura.id, faturaData);
        if (error) {
          console.error('API hatası:', error);
          return;
        }

        // Yeni faturanın stok üzerindeki etkisini uygula
        for (const urun of faturaData.urunler) {
          if (urun.urun_id) {
            const { data: urunData } = await urunlerApi.getById(urun.urun_id);
            if (urunData) {
              const yeniStok = Number(urunData.stok_miktari) - Number(urun.miktar);
              await urunlerApi.update(urun.urun_id, { stok_miktari: yeniStok });
            }
          }
        }
      } else {
        const { error } = await satisApi.create(faturaData);
        if (error) {
          console.error('API hatası:', error);
          return;
        }
      }

      await loadData();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Fatura eklenirken hata:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedFatura || !selectedProfile) return;

    try {
      const { error } = await satisApi.delete(selectedFatura.id);

      if (error) throw new Error(error);

      // Stok iade
      if (selectedFatura.urunler && Array.isArray(selectedFatura.urunler)) {
        for (const urun of selectedFatura.urunler) {
          if (urun.urun_id) {
            const { data: urunData } = await urunlerApi.getById(urun.urun_id);

            if (urunData) {
              const yeniStok = Number(urunData.stok_miktari) + Number(urun.miktar);
              await urunlerApi.update(urun.urun_id, { stok_miktari: yeniStok });

              await stokApi.create({
                urun_id: urun.urun_id,
                urun_ad: urun.urun_ad,
                hareket_tipi: 'Giriş',
                miktar: Number(urun.miktar),
                aciklama: `Satış Faturası İptal: ${selectedFatura.fatura_no}`,
                tarih: new Date().toISOString().split('T')[0],
                profile_id: selectedProfile.id
              });
            }
          }
        }
      }

      await loadData();
      setShowDeleteModal(false);
      setSelectedFatura(null);
    } catch (error) {
      console.error('Fatura silinirken hata:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const resetForm = async () => {
    const newFaturaNo = await generateFaturaNo();
    setFormData({
      cari_id: '',
      cari_ad: '',
      fatura_no: newFaturaNo,
      tarih: new Date().toISOString().split('T')[0],
      aciklama: '',
      urunler: [{ urun_id: '', urun_ad: '', miktar: 1, birim_fiyat: 0, toplam: 0 }],
      kdv_orani: 20,
      kdv_uygula: true,
      durum: 'Onaylandı'
    });
    setIsEditing(false);
    setSelectedFatura(null);
  };

  const openModal = async () => {
    const newFaturaNo = await generateFaturaNo();
    setFormData({
      ...formData,
      fatura_no: newFaturaNo
    });
    setCariBakiye(0);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEdit = async (fatura: Fatura) => {
    setSelectedFatura(fatura);
    setFormData({
      cari_id: fatura.cari_id,
      cari_ad: fatura.cari_ad,
      fatura_no: fatura.fatura_no,
      tarih: fatura.tarih,
      aciklama: fatura.aciklama || '',
      urunler: fatura.urunler.map(u => ({ ...u })),
      kdv_orani: fatura.kdv > 0 ? 20 : 0, // Basitleştirilmiş, KDV oranını datada tutmuyoruz
      kdv_uygula: fatura.kdv > 0,
      durum: fatura.durum
    });
    setIsEditing(true);
    const bakiye = await calculateCariBakiye(fatura.cari_id);
    setCariBakiye(bakiye);
    setShowModal(true);
  };

  const openPrintModal = async (fatura: Fatura) => {
    setSelectedFatura(fatura);
    // Güncel bakiyeyi hesapla (Fatura zaten kayıtlı olduğu için bakiye içinde dahil)
    const guncelBakiye = await calculateCariBakiye(fatura.cari_id);
    setPrintCariBakiye(guncelBakiye);
    setShowPrintModal(true);
  };

  const filteredFaturalar = faturalar.filter(fatura =>
    fatura.cari_ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fatura.fatura_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { araToplam, kdv, toplam } = calculateTotals(formData.urunler, formData.kdv_uygula, formData.kdv_orani);

  if (!selectedProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/">
                  <img
                    src="https://public.readdy.ai/ai/img_res/599009ac-e967-4692-9000-451db39762de.png"
                    alt="Logo"
                    className="h-10 w-auto object-contain cursor-pointer"
                  />
                </Link>
                <div className="h-8 w-px bg-slate-300"></div>
                <h1 className="text-xl font-bold text-slate-800">Satış Faturası Yönetimi</h1>
              </div>
              <ProfileSelector />
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-user-add-line text-3xl text-yellow-600"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Profil Seçin</h3>
            <p className="text-gray-600">Lütfen üst menüden bir profil seçin veya yeni profil oluşturun.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/">
                  <img
                    src="https://public.readdy.ai/ai/img_res/599009ac-e967-4692-9000-451db39762de.png"
                    alt="Logo"
                    className="h-10 w-auto object-contain cursor-pointer"
                  />
                </Link>
                <div className="h-8 w-px bg-slate-300"></div>
                <h1 className="text-xl font-bold text-slate-800">Satış Faturası Yönetimi</h1>
              </div>
              <ProfileSelector />
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <img
                  src="https://public.readdy.ai/ai/img_res/599009ac-e967-4692-9000-451db39762de.png"
                  alt="Logo"
                  className="h-10 w-auto object-contain cursor-pointer"
                />
              </Link>
              <div className="h-8 w-px bg-slate-300"></div>
              <h1 className="text-xl font-bold text-slate-800">Satış Faturası Yönetimi</h1>
            </div>
            <ProfileSelector />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-73px)] sticky top-[73px]">
          <nav className="p-4 space-y-1">
            <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-dashboard-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Dashboard</span>
            </Link>
            <Link to="/cariler" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-user-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Cariler</span>
            </Link>
            <Link to="/urunler" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-product-hunt-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Ürünler</span>
            </Link>
            <Link to="/satis-faturasi" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 transition-all cursor-pointer">
              <i className="ri-file-text-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Satış Faturası</span>
            </Link>
            <Link to="/alis-faturasi" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-file-list-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Alış Faturası</span>
            </Link>
            <Link to="/odemeler" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-money-dollar-circle-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Ödemeler</span>
            </Link>
            <Link to="/stok" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-archive-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Depodaki Stok</span>
            </Link>
            <Link to="/tum-islemler" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-list-check-2 text-xl"></i>
              <span className="font-medium whitespace-nowrap">Tüm İşlemler</span>
            </Link>
            <Link to="/raporlar" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-bar-chart-box-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">Raporlar</span>
            </Link>
            <Link to="/ai-analiz" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
              <i className="ri-sparkling-2-line text-xl"></i>
              <span className="font-medium whitespace-nowrap">AI Finansal Analiz ⭐</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Satış Faturaları</h2>
                <p className="text-sm text-slate-600 mt-1">Toplam {faturalar.length} fatura</p>
              </div>
              <button
                onClick={openModal}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all font-medium whitespace-nowrap cursor-pointer"
              >
                <i className="ri-add-line mr-2"></i>
                Yeni Fatura Kes
              </button>
            </div>

            <div className="mb-6">
              <div className="relative">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
                <input
                  type="text"
                  placeholder="Cari adı veya fatura no ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {filteredFaturalar.length === 0 ? (
              <div className="text-center py-16">
                <i className="ri-file-text-line text-6xl text-slate-300 mb-4"></i>
                <p className="text-slate-500 text-lg mb-2">Henüz satış faturası yok</p>
                <p className="text-slate-400 text-sm">Yeni fatura keserek başlayın</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Fatura No</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Cari</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Tarih</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Toplam</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">Durum</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredFaturalar.map((fatura) => (
                      <tr
                        key={fatura.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => handleEdit(fatura)}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-slate-800 whitespace-nowrap">{fatura.fatura_no}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{fatura.cari_ad}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{fatura.tarih}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600 whitespace-nowrap">₺{Number(fatura.toplam).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${fatura.durum === 'Onaylandı' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                            {fatura.durum}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openPrintModal(fatura)}
                              className="text-indigo-600 hover:text-indigo-700 cursor-pointer"
                              title="Yazdır"
                            >
                              <i className="ri-printer-line text-lg"></i>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedFatura(fatura);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-600 hover:text-red-700 cursor-pointer"
                              title="Sil"
                            >
                              <i className="ri-delete-bin-line text-lg"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">{isEditing ? 'Faturayı Düzenle' : 'Yeni Satış Faturası'}</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cari Seçin *</label>
                  <select
                    value={formData.cari_id}
                    onChange={(e) => handleCariChange(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    required
                  >
                    <option value="">Cari seçin...</option>
                    {cariler.map(cari => (
                      <option key={cari.id} value={cari.id}>{cari.ad}</option>
                    ))}
                  </select>
                  {formData.cari_id && (
                    <div className={`mt-2 px-3 py-2 rounded-lg text-sm font-medium ${cariBakiye >= 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                      }`}>
                      <i className={`${cariBakiye >= 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} mr-1`}></i>
                      Mevcut Bakiye: ₺{Math.abs(cariBakiye).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="ml-1">({cariBakiye >= 0 ? 'Cari Borçlu' : 'Cari Alacaklı'})</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Fatura No</label>
                  <input
                    type="text"
                    value={formData.fatura_no}
                    readOnly={!isEditing}
                    onChange={(e) => isEditing && setFormData({ ...formData, fatura_no: e.target.value })}
                    className={`w-full px-4 py-2 border border-slate-300 rounded-lg text-sm ${!isEditing ? 'bg-slate-50' : 'focus:ring-2 focus:ring-indigo-500'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tarih *</label>
                  <input
                    type="date"
                    value={formData.tarih}
                    onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-700">Ürünler *</label>
                  <button
                    type="button"
                    onClick={addUrunRow}
                    className="px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-add-line mr-1"></i>
                    Ürün Ekle
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.urunler.map((urun, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-5">
                        <select
                          value={urun.urun_id}
                          onChange={(e) => handleUrunChange(index, 'urun_id', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                          required
                        >
                          <option value="">Ürün seçin...</option>
                          {urunler.map(u => (
                            <option key={u.id} value={u.id}>{u.ad} (Stok: {u.stok_miktari})</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={urun.miktar}
                          onChange={(e) => handleUrunChange(index, 'miktar', parseFloat(e.target.value) || 0)}
                          placeholder="Miktar"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                          min="0.01"
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={urun.birim_fiyat}
                          onChange={(e) => handleUrunChange(index, 'birim_fiyat', parseFloat(e.target.value) || 0)}
                          placeholder="Birim Fiyat"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={`₺${urun.toplam.toFixed(2)}`}
                          readOnly
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm"
                        />
                      </div>
                      <div className="col-span-1">
                        {formData.urunler.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeUrunRow(index)}
                            className="w-full px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Ara Toplam:</span>
                  <span className="font-semibold text-slate-800">₺{araToplam.toFixed(2)}</span>
                </div>

                <div className="border-t border-slate-300 pt-3">
                  <div className="flex items-center gap-3 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.kdv_uygula}
                        onChange={(e) => handleKdvChange(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700">KDV Uygula</span>
                    </label>
                    {formData.kdv_uygula && (
                      <select
                        value={formData.kdv_orani}
                        onChange={(e) => handleKdvChange(true, parseInt(e.target.value))}
                        className="px-3 py-1 border border-slate-300 rounded-lg text-sm"
                      >
                        <option value="1">%1</option>
                        <option value="10">%10</option>
                        <option value="20">%20</option>
                      </select>
                    )}
                  </div>
                  {formData.kdv_uygula && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">KDV (%{formData.kdv_orani}):</span>
                      <span className="font-semibold text-slate-800">₺{kdv.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-lg border-t border-slate-300 pt-2">
                  <span className="font-bold text-slate-800">Toplam:</span>
                  <span className="font-bold text-green-600">₺{toplam.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Açıklama</label>
                <textarea
                  value={formData.aciklama}
                  onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="Fatura ile ilgili notlar..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all whitespace-nowrap cursor-pointer"
                >
                  {isEditing ? 'Güncelle' : 'Fatura Kes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-delete-bin-line text-2xl text-red-600"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Faturayı Sil</h3>
              <p className="text-slate-600 text-center mb-6">
                Bu faturayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve stok miktarları güncellenecektir.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setSelectedFatura(null); }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  İptal
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {showPrintModal && selectedFatura && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:rounded-none">
            <div className="p-6 print:p-0">
              <div className="flex items-center justify-between mb-6 print:hidden">
                <h3 className="text-xl font-bold text-slate-800">Fatura Önizleme</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    <i className="ri-printer-line mr-2"></i>
                    Yazdır
                  </button>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Kapat
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-6 print:border-0">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">SATIŞ FATURASI</h2>
                  <p className="text-slate-600">{selectedFatura.fatura_no}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-slate-600">Cari:</p>
                    <p className="font-semibold">{selectedFatura.cari_ad}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Tarih:</p>
                    <p className="font-semibold">{selectedFatura.tarih}</p>
                  </div>
                </div>

                {selectedFatura.urunler && (
                  <table className="w-full mb-6">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold">Ürün</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">Miktar</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">Birim Fiyat</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">Toplam</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFatura.urunler.map((urun, i) => (
                        <tr key={i} className="border-b">
                          <td className="px-4 py-2">{urun.urun_ad}</td>
                          <td className="px-4 py-2 text-right">{urun.miktar}</td>
                          <td className="px-4 py-2 text-right">₺{Number(urun.birim_fiyat).toFixed(2)}</td>
                          <td className="px-4 py-2 text-right">₺{Number(urun.toplam).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="flex justify-end">
                  <div className="w-64">
                    <div className="flex justify-between py-2 border-b">
                      <span>Ara Toplam:</span>
                      <span>₺{Number(selectedFatura.tutar).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>KDV:</span>
                      <span>₺{Number(selectedFatura.kdv).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold text-lg">
                      <span>Genel Toplam:</span>
                      <span className="text-green-600">₺{Number(selectedFatura.toplam).toFixed(2)}</span>
                    </div>
                    {/* Bakiye Gösterimi */}
                    <div className={`flex justify-between py-2 border-t mt-2 ${printCariBakiye >= 0 ? 'text-red-600' : 'text-green-600'} font-medium`}>
                      <span>Mevcut Bakiye:</span>
                      <span>
                        ₺{Math.abs(printCariBakiye).toFixed(2)}
                        <span className="text-xs ml-1">({printCariBakiye >= 0 ? 'Borçlu' : 'Alacaklı'})</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
