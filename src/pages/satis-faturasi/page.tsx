import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import Header from '../../components/feature/Header';
import Sidebar from '../../components/feature/Sidebar';
import SearchableSelect from '../../components/ui/SearchableSelect';

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
  const [saving, setSaving] = useState(false);
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
  const location = useLocation();
  const [stateProcessed, setStateProcessed] = useState(false);

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

  useEffect(() => {
    if (!loading && faturalar.length > 0 && !stateProcessed && location.state) {
      const state = location.state as any;
      if (state.autoOpen && state.id) {
        const fatura = faturalar.find(f => f.id === state.id);
        if (fatura) {
          if (state.action === 'edit') {
            handleEdit(fatura);
          } else if (state.action === 'print') {
            openPrintModal(fatura);
          }
          setStateProcessed(true);
        }
      }
    }
  }, [loading, faturalar, location.state, stateProcessed]);

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
      setSaving(true);
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
        const { error } = await satisApi.update(selectedFatura.id, faturaData);
        if (error) {
          console.error('Fatura güncellenirken hata oluştu:', error);
          return;
        }
      } else {
        const { error } = await satisApi.create(faturaData);
        if (error) {
          console.error('Fatura oluşturulurken hata oluştu:', error);
          return;
        }
      }

      await loadData();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Fatura eklenirken hata:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFatura || !selectedProfile) return;

    try {
      const { error } = await satisApi.delete(selectedFatura.id);
      if (error) throw new Error(error);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-black text-xs tracking-widest uppercase">Finansal Veriler İşleniyor...</p>
        </div>
      </div>
    );
  }

  if (!selectedProfile) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6 text-center">
        <div className="premium-card p-12 max-w-md animate-slide-up">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
            <i className="ri-profile-line text-4xl text-indigo-500"></i>
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Profil Seçimi Gerekli</h3>
          <p className="text-slate-400 font-medium mb-8">Faturaları yönetmek için bir profil seçmelisiniz.</p>
          <button onClick={() => window.location.reload()} className="premium-button px-10 h-14 text-xs tracking-widest uppercase">YENİDEN DENE</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden relative">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/15 rounded-full blur-[140px] animate-aurora-1"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[120px] animate-aurora-2"></div>
      </div>

      <div className="flex relative z-10">
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
          <Header />

          <main className="flex-1 p-6 md:p-10 space-y-10 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                  <i className="ri-file-text-line"></i>
                  <span>FİNANSAL DÖKÜMANTASYON</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                  Satış <span className="text-gradient">Faturaları.</span>
                </h1>
                <p className="text-slate-500 text-lg font-medium max-w-xl">Müşterilerinize kestiğiniz tüm faturaları yönetin, ödeme durumlarını takip edin ve yazdırın.</p>
                {/* Limit Göstergesi */}
                {selectedProfile && (
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden max-w-[200px]">
                      <div
                        className={`h-full transition-all duration-1000 ${(faturalar.filter(f => new Date(f.created_at || '').getMonth() === new Date().getMonth()).length / (useProfile().currentUser?.subscription_tier === 'tam' ? 100 : 50)) >= 1 ? 'bg-rose-500' : 'bg-indigo-500'
                          }`}
                        style={{
                          width: `${Math.min(100, (faturalar.filter(f => new Date(f.created_at || '').getMonth() === new Date().getMonth()).length / (useProfile().currentUser?.subscription_tier === 'tam' ? 100 : useProfile().currentUser?.subscription_tier === 'vip' ? 1 : 50)) * 100)}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      AYLIK KREDİ: {faturalar.filter(f => new Date(f.created_at || '').getMonth() === new Date().getMonth()).length} / {useProfile().currentUser?.subscription_tier === 'vip' ? '∞' : (useProfile().currentUser?.subscription_tier === 'tam' ? '100' : '50')}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  const currentMonthCount = faturalar.filter(f => new Date(f.created_at || '').getMonth() === new Date().getMonth()).length;
                  const limit = useProfile().currentUser?.subscription_tier === 'tam' ? 100 : (useProfile().currentUser?.subscription_tier === 'vip' ? Infinity : 50);
                  if (currentMonthCount >= limit) {
                    alert(`Aylık fatura limitinize ulaştınız (${limit}). Daha fazla işlem için paketinizi yükseltin.`);
                    return;
                  }
                  openModal();
                }}
                className={`premium-button px-8 h-16 text-sm uppercase tracking-widest group ${faturalar.filter(f => new Date(f.created_at || '').getMonth() === new Date().getMonth()).length >= (useProfile().currentUser?.subscription_tier === 'tam' ? 100 : useProfile().currentUser?.subscription_tier === 'vip' ? Infinity : 50)
                  ? 'bg-rose-600/20 border-rose-500/30 text-rose-400'
                  : 'bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600 hover:text-white'
                  }`}
              >
                <span>{faturalar.filter(f => new Date(f.created_at || '').getMonth() === new Date().getMonth()).length >= (useProfile().currentUser?.subscription_tier === 'tam' ? 100 : useProfile().currentUser?.subscription_tier === 'vip' ? Infinity : 50) ? 'LİMİT DOLDU' : 'YENİ FATURA KES'}</span>
                <i className={`${faturalar.filter(f => new Date(f.created_at || '').getMonth() === new Date().getMonth()).length >= (useProfile().currentUser?.subscription_tier === 'tam' ? 100 : useProfile().currentUser?.subscription_tier === 'vip' ? Infinity : 50) ? 'ri-error-warning-line' : 'ri-add-line'} text-xl group-hover:rotate-90 transition-transform`}></i>
              </button>
            </div>

            {/* List Section */}
            <div className="premium-card overflow-hidden">
              <div className="p-8 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="relative w-full md:max-w-md group">
                  <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"></i>
                  <input
                    type="text"
                    placeholder="Cari adı veya Fatura No ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="premium-input pl-12 h-14"
                  />
                </div>
              </div>

              {filteredFaturalar.length === 0 ? (
                <div className="p-24 text-center space-y-6">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <i className="ri-file-text-line text-5xl text-slate-700"></i>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-200 uppercase">Fatura Bulunamadı</h3>
                  <p className="text-slate-500 font-bold max-w-sm mx-auto uppercase tracking-widest text-[10px]">Henüz bir satış faturası kesilmemiş veya arama kriterine uygun kayıt yok.</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[calc(100vh-420px)] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left relative border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-[#0f172a] shadow-sm">
                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">FATURA NO</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">CARİ / MÜŞTERİ</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">TARİH</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">TOPLAM TUTAR</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">DURUM</th>
                        <th className="px-8 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">AKSİYON</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {filteredFaturalar.map((fatura) => (
                        <tr key={fatura.id} className="hover:bg-white/[0.02] transition-colors group/row">
                          <td className="px-8 py-6 font-black text-slate-200 tracking-wider">
                            {fatura.fatura_no}
                          </td>
                          <td className="px-8 py-6">
                            <div className="font-bold text-slate-300">{fatura.cari_ad}</div>
                          </td>
                          <td className="px-8 py-6 text-slate-500 font-bold">
                            {new Date(fatura.tarih).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-lg font-black tracking-tighter text-emerald-500">
                              ₺{Number(fatura.toplam).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${fatura.durum === 'Onaylandı' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                              {fatura.durum}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover/row:opacity-100 transition-all translate-x-4 group-hover/row:translate-x-0">
                              <button
                                onClick={() => openPrintModal(fatura)}
                                className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all"
                              >
                                <i className="ri-printer-line"></i>
                              </button>
                              <button
                                onClick={() => handleEdit(fatura)}
                                className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
                              >
                                <i className="ri-edit-line"></i>
                              </button>
                              <button
                                onClick={() => { setSelectedFatura(fatura); setShowDeleteModal(true); }}
                                className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white transition-all"
                              >
                                <i className="ri-delete-bin-line"></i>
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
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="premium-card p-0 w-full max-w-5xl max-h-[90vh] flex flex-col animate-slide-up border-white/10 relative overflow-hidden">
            <div className="px-10 py-10 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.01]">
              <div className="space-y-1">
                <h3 className="text-3xl font-black tracking-tight text-white uppercase leading-none">
                  {isEditing ? 'Faturayı Güncelle' : 'Yeni Satış Faturası'}
                </h3>
                <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Resmi döküman oluşturma ve envanter çıkışı.</p>
              </div>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
              {/* Üst Bilgiler */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <SearchableSelect
                    label="MÜŞTERİ / CARİ SEÇİMİ *"
                    options={cariler.map(c => ({ id: c.id, name: c.ad, subText: c.vergi_no }))}
                    value={formData.cari_id}
                    onChange={handleCariChange}
                    placeholder="CARİ SEÇİN..."
                  />
                  {formData.cari_id && (
                    <div className={`mt-3 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase border ${cariBakiye >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                      <i className={`${cariBakiye >= 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} mr-2`}></i>
                      BAKİYE: ₺{Math.abs(cariBakiye).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">FATURA NUMARASI</label>
                  <input
                    type="text"
                    value={formData.fatura_no}
                    readOnly={!isEditing}
                    onChange={(e) => isEditing && setFormData({ ...formData, fatura_no: e.target.value })}
                    className={`premium-input h-14 font-black tracking-widest ${!isEditing ? 'opacity-50 grayscale' : ''}`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">DÖKÜMAN TARİHİ *</label>
                  <input
                    type="date"
                    value={formData.tarih}
                    onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
                    className="premium-input h-14 font-black"
                    required
                  />
                </div>
              </div>

              {/* Ürün Listesi */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">KALEM BİLGİLERİ (ÜRÜNLER)</h4>
                  <button
                    type="button"
                    onClick={addUrunRow}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-widest uppercase hover:bg-indigo-500 hover:text-white transition-all"
                  >
                    <i className="ri-add-line text-lg"></i>
                    <span>KALEM EKLE</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.urunler.map((urun, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white/[0.02] p-6 rounded-3xl border border-white/5 relative group/row">
                      <div className="md:col-span-5 space-y-2">
                        <SearchableSelect
                          label="ÜRÜN / HİZMET"
                          options={urunler.map(u => ({ id: u.id, name: u.ad, subText: `STOK: ${u.stok_miktari}` }))}
                          value={urun.urun_id}
                          onChange={(value) => handleUrunChange(index, 'urun_id', value)}
                          placeholder="ÜRÜN SEÇİN..."
                          required
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">MİKTAR</label>
                        <input
                          type="number"
                          value={urun.miktar}
                          onChange={(e) => handleUrunChange(index, 'miktar', parseFloat(e.target.value) || 0)}
                          className="premium-input h-12 text-center font-black"
                          min="0.01"
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">BİRİM FİYAT</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-black">₺</span>
                          <input
                            type="number"
                            value={urun.birim_fiyat}
                            onChange={(e) => handleUrunChange(index, 'birim_fiyat', parseFloat(e.target.value) || 0)}
                            className="premium-input h-12 pl-8 text-right font-black"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">KALEM TUTARI</label>
                        <div className="h-12 flex items-center justify-end px-4 bg-white/5 border border-white/10 rounded-2xl text-indigo-400 font-black">
                          ₺{urun.toplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="md:col-span-1">
                        {formData.urunler.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeUrunRow(index)}
                            className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all translate-y-1 mb-1"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alt Bilgiler ve Toplamlar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-10 border-t border-white/5">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">FATURA NOTLARI / AÇIKLAMA</label>
                  <textarea
                    value={formData.aciklama}
                    onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                    rows={6}
                    className="premium-input p-6 resize-none h-full"
                    placeholder="Fatura ayrıntıları, ödeme vadeleri vb. özel notlar..."
                  />
                </div>

                <div className="premium-card bg-white/[0.01] border-white/5 p-8 space-y-6">
                  <div className="flex items-center justify-between text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                    <span>ARA TOPLAM</span>
                    <span className="text-sm font-black text-slate-200">₺{araToplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.kdv_uygula ? 'bg-indigo-500 border-indigo-500' : 'border-white/10 group-hover:border-white/20'
                          }`}>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={formData.kdv_uygula}
                            onChange={(e) => handleKdvChange(e.target.checked)}
                          />
                          {formData.kdv_uygula && <i className="ri-check-line text-white"></i>}
                        </div>
                        <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">KDV HESAPLA</span>
                      </label>
                      {formData.kdv_uygula && (
                        <select
                          value={formData.kdv_orani}
                          onChange={(e) => handleKdvChange(true, parseInt(e.target.value))}
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 focus:outline-none"
                        >
                          <option value="1">%1</option>
                          <option value="10">%10</option>
                          <option value="20">%20</option>
                        </select>
                      )}
                    </div>

                    {formData.kdv_uygula && (
                      <div className="flex items-center justify-between text-indigo-400 font-bold uppercase tracking-widest text-[10px] animate-fade-in">
                        <span>KDV TOPLAMI (%{formData.kdv_orani})</span>
                        <span className="text-sm font-black">₺{kdv.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-8 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[12px] font-black text-white tracking-[0.3em] uppercase">GENEL TOPLAM</span>
                    <span className="text-4xl font-black tracking-tighter text-emerald-500">
                      ₺{toplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Aksiyonları */}
              <div className="flex gap-6 pt-10 sticky bottom-0 bg-[#020617]/80 backdrop-blur-xl -mx-10 px-10 pb-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 h-16 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors border border-white/5 rounded-2xl"
                >
                  VAZGEÇ / İPTAL
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`premium-button flex-[2] h-16 text-sm uppercase tracking-widest font-black flex items-center justify-center gap-3 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>KAYDEDİLİYOR...</span>
                    </>
                  ) : (
                    <span>{isEditing ? 'DEĞİŞİKLİKLERİ KAYDET' : 'FATURAYI KES VE ONAYLA'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {
        showDeleteModal && (
          <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-fade-in">
            <div className="premium-card p-10 w-full max-w-md animate-slide-up border-rose-500/20 text-center">
              <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                <i className="ri-delete-bin-line text-4xl text-rose-500"></i>
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Faturayı İptal Et</h3>
              <p className="text-slate-400 font-medium mb-10">
                Bu faturayı sildiğinizde ilgili stok hareketleri geri alınacak ve envanteriniz güncellenecektir. Bu işlem geri alınamaz.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => { setShowDeleteModal(false); setSelectedFatura(null); }}
                  className="flex-1 h-14 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors border border-white/5 rounded-2xl"
                >
                  VAZGEÇ
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 h-14 bg-rose-600 text-white rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
                >
                  EVET, SİL
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Print Modal */}
      {
        showPrintModal && selectedFatura && (
          <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-fade-in print:bg-white print:p-0">
            <div className="premium-card p-0 w-full max-w-3xl max-h-[90vh] flex flex-col animate-slide-up border-white/10 relative overflow-hidden print:shadow-none print:border-0 print:max-w-none print:max-h-none print:bg-white print:text-black">
              {/* Modal Header - Hidden in Print */}
              <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.01] print:hidden">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tight text-white uppercase leading-none">Fatura Önizleme</h3>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Dökümanı kontrol edin ve yazdırın.</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handlePrint}
                    className="px-6 h-12 bg-indigo-600 text-white rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                  >
                    <i className="ri-printer-line text-lg"></i>
                    <span>YAZDIR</span>
                  </button>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all"
                  >
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                </div>
              </div>

              {/* Fatura Content */}
              <div className="flex-1 overflow-y-auto p-12 bg-white text-black custom-scrollbar print:p-0">
                <div className="flex justify-between items-start mb-12">
                  <div className="space-y-4">
                    {selectedProfile?.logo_url ? (
                      <img
                        src={selectedProfile.logo_url}
                        alt="Logo"
                        className="h-16 w-auto object-contain"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                        <i className="ri-building-line text-3xl text-slate-400"></i>
                      </div>
                    )}
                    <div className="space-y-1">
                      <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">{selectedProfile?.name}</h1>
                      <h2 className="text-2xl font-black tracking-tighter uppercase whitespace-nowrap text-indigo-600">SATIŞ FATURASI</h2>
                      <div className="inline-block px-3 py-1 bg-black text-white text-[10px] font-black tracking-widest uppercase">{selectedFatura.fatura_no}</div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DÜZENLEME TARİHİ</p>
                    <p className="text-lg font-black">{new Date(selectedFatura.tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                <div className="mb-12 pb-12 border-b-2 border-slate-100">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">MÜŞTERİ BİLGİLERİ</p>
                    <div className="space-y-1">
                      <p className="text-xl font-black tracking-tight">{selectedFatura.cari_ad.toUpperCase()}</p>
                    </div>
                  </div>
                </div>

                <table className="w-full mb-12">
                  <thead>
                    <tr className="border-b-2 border-black">
                      <th className="py-4 text-left text-[10px] font-black uppercase tracking-widest">ÜRÜN / HİZMET TANIMI</th>
                      <th className="py-4 text-center text-[10px] font-black uppercase tracking-widest w-24">MİKTAR</th>
                      <th className="py-4 text-right text-[10px] font-black uppercase tracking-widest w-32">BİRİM FİYAT</th>
                      <th className="py-4 text-right text-[10px] font-black uppercase tracking-widest w-32">TOPLAM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedFatura.urunler?.map((urun, i) => (
                      <tr key={i}>
                        <td className="py-5 font-bold">{urun.urun_ad.toUpperCase()}</td>
                        <td className="py-5 text-center font-black">{urun.miktar}</td>
                        <td className="py-5 text-right font-bold">₺{Number(urun.birim_fiyat).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-5 text-right font-black">₺{Number(urun.toplam).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end pt-8">
                  <div className="w-80 space-y-3">
                    <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                      <span>ARA TOPLAM</span>
                      <span>₺{Number(selectedFatura.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                      <span>KDV TOPLAMI</span>
                      <span>₺{Number(selectedFatura.kdv).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t-2 border-black">
                      <span className="text-[10px] font-black tracking-widest">GENEL TOPLAM</span>
                      <span className="text-2xl font-black tracking-tighter text-indigo-600">
                        ₺{Number(selectedFatura.toplam).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {/* Bakiye Gösterimi */}
                    <div className={`flex justify-between items-center p-3 rounded-xl mt-6 ${printCariBakiye >= 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                      } font-bold text-[10px] tracking-widest uppercase`}>
                      <span>GÜNCEL BAKİYE</span>
                      <span>
                        ₺{Math.abs(printCariBakiye).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        <span className="text-[8px] ml-1">({printCariBakiye >= 0 ? 'BORÇLU' : 'ALACAKLI'})</span>
                      </span>
                    </div>
                  </div>
                </div>

                {selectedFatura.aciklama && (
                  <div className="mt-12 pt-8 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">NOTLAR / AÇIKLAMALAR</p>
                    <p className="text-sm font-medium text-slate-600 italic">"{selectedFatura.aciklama}"</p>
                  </div>
                )}

                <div className="mt-24 pt-12 border-t border-slate-100 flex justify-between items-end text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">
                  <div>BU BELGE ELEKTRONİK OLARAK OLUŞTURULMUŞTUR</div>
                  <div>NET MUHASEBE AI v2.0-PRO</div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
