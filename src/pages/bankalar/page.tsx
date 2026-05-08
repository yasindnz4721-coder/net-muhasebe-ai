import React, { useState, useEffect } from 'react';
import {
  kasalar as kasalarApi,
  Kasa
} from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import Sidebar from '../../components/feature/Sidebar';
import Header from '../../components/feature/Header';
import {
  Building2,
  Plus,
  Search,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight
} from 'lucide-react';

const BankalarPage = () => {
  const { selectedProfile } = useProfile();
  const [bankaList, setBankaList] = useState<Kasa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Kasa>>({
    ad: '',
    bakiye: 0,
    tip: 'Banka',
    banka_adi: '',
    iban: '',
    hesap_no: ''
  });

  useEffect(() => {
    if (selectedProfile) {
      loadBankalar();
    }
  }, [selectedProfile]);

  const loadBankalar = async () => {
    try {
      setLoading(true);
      const res = await kasalarApi.getAll(selectedProfile!.id);
      if (res.data) {
        // Sadece banka tipinde olanları filtrele
        setBankaList(res.data.filter(k => k.tip === 'Banka'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedProfile) return;
      const res = await kasalarApi.create({
        ...formData,
        profile_id: selectedProfile.id,
        tip: 'Banka'
      });

      if (res.data) {
        setShowModal(false);
        loadBankalar();
        setFormData({
          ad: '',
          bakiye: 0,
          tip: 'Banka',
          banka_adi: '',
          iban: '',
          hesap_no: ''
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!selectedProfile) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden relative">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/15 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="flex relative z-10">
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
          <Header />

          <main className="flex-1 p-6 md:p-10 space-y-10 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                  <Building2 size={12} />
                  <span>FİNANSMAN & BANKA YÖNETİMİ</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                  Banka <span className="text-gradient from-blue-400 to-indigo-500">Hesapları.</span>
                </h1>
                <p className="text-slate-500 text-lg font-medium max-w-xl">Banka hesaplarınızı tanımlayın, bakiyelerinizi ve para akışını tek noktadan yönetin.</p>
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 h-16 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-600/20 flex items-center gap-3"
              >
                <Plus size={20} /> YENİ BANKA HESABI
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="premium-card p-8 group transition-all flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">TOPLAM BANKA BAKİYESİ</span>
                  <div className="text-4xl font-black tracking-tighter text-white">
                    ₺{bankaList.reduce((acc, curr) => acc + Number(curr.bakiye), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                  <Building2 size={24} />
                </div>
              </div>

              <div className="premium-card p-8 group transition-all flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">AKTİF HESAP SAYISI</span>
                  <div className="text-4xl font-black tracking-tighter text-indigo-400">{bankaList.length}</div>
                </div>
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                  <CreditCard size={24} />
                </div>
              </div>
            </div>

            {/* Accounts List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {loading ? (
                [...Array(2)].map((_, i) => (
                  <div key={i} className="premium-card h-48 animate-pulse bg-white/5"></div>
                ))
              ) : bankaList.length === 0 ? (
                <div className="lg:col-span-2 premium-card p-20 text-center space-y-4">
                   <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-600">
                     <Building2 size={40} />
                   </div>
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Henüz kayıtlı banka hesabı bulunamadı.</p>
                </div>
              ) : (
                bankaList.map((banka) => (
                  <div key={banka.id} className="premium-card p-8 group hover:border-blue-500/30 transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Building2 size={120} />
                    </div>
                    
                    <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-2xl font-black tracking-tight text-white uppercase">{banka.ad}</h3>
                          <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">{banka.banka_adi || 'Banka Belirtilmemiş'}</p>
                        </div>
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-slate-400">
                          <CreditCard size={24} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">IBAN</p>
                          <p className="text-sm font-bold text-slate-300 tracking-wider font-mono">
                            {banka.iban ? banka.iban.replace(/(.{4})/g, '$1 ') : 'TR-- ---- ---- ---- ---- ---- --'}
                          </p>
                        </div>
                        
                        <div className="flex items-end justify-between">
                           <div className="space-y-1">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GÜNCEL BAKİYE</p>
                             <div className="text-3xl font-black tracking-tighter text-white">
                               ₺{Number(banka.bakiye).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                             </div>
                           </div>
                           <button className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-all">
                             <ChevronRight size={20} />
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Add Bank Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-[#020617]/60 animate-fade-in">
          <div className="premium-card w-full max-w-xl p-10 space-y-8 animate-slide-up relative overflow-hidden">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter">Banka <span className="text-blue-500">Tanımla.</span></h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Lütfen hesap bilgilerini giriniz.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">HESAP ADI (ÖRN: TİCARİ HESAP)</label>
                <input
                  type="text" required
                  value={formData.ad}
                  onChange={e => setFormData({...formData, ad: e.target.value.toUpperCase()})}
                  className="premium-input h-14"
                  placeholder="HESAP TAKMA ADI..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">BANKA ADI</label>
                <input
                  type="text" required
                  value={formData.banka_adi}
                  onChange={e => setFormData({...formData, banka_adi: e.target.value.toUpperCase()})}
                  className="premium-input h-14"
                  placeholder="BANKA İSMİ..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">AÇILIŞ BAKİYESİ</label>
                <input
                  type="number" step="0.01"
                  value={formData.bakiye}
                  onChange={e => setFormData({...formData, bakiye: Number(e.target.value)})}
                  className="premium-input h-14 font-black text-blue-400"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">IBAN</label>
                <input
                  type="text" required
                  value={formData.iban}
                  onChange={e => setFormData({...formData, iban: e.target.value.toUpperCase()})}
                  className="premium-input h-14 font-mono tracking-wider"
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                />
              </div>

              <div className="md:col-span-2 pt-4">
                <button type="submit" className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-600/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                  BANKA HESABINI SİSTEME EKLE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankalarPage;
