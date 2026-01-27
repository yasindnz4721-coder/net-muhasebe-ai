import { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../../lib/api';

export default function KayitPage() {
  const [step, setStep] = useState(1); // 1: Plans, 2: Payment, 3: Register Form
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
  });
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiry: '',
    cvc: '',
    holderName: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'eft'>('card');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 2) {
      setStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data, error: registerError } = await auth.register(
        formData.email.trim(),
        formData.password,
        formData.companyName.trim(),
        paymentMethod
      );

      if (registerError) {
        setError(registerError);
        return;
      }

      if (data?.user) {
        if (paymentMethod === 'eft') {
          setSuccess('✅ Kayıt talebiniz alındı! EFT ödemeniz onaylandıktan sonra hesabınız aktif edilecektir.');
        } else {
          setSuccess('✅ Ödeme başarılı ve hesabınız oluşturuldu!');
        }
        setFormData({ email: '', password: '', companyName: '' });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } catch (err) {
      console.error('Kayıt hatası:', err);
      setError('İşlem şu an gerçekleştirilemiyor. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: 'STANDART AI',
      price: '500',
      period: '/aylik',
      desc: 'Küçük işletmeler için tam kontrol.',
      features: ['Gelir-Gider Takibi', 'Sınırsız Fatura', 'Stok Yönetimi', 'PDF Raporlar'],
      popular: false,
      buttonText: 'BU PLANI SEÇ',
    },
    {
      name: 'ENTERPRISE AI',
      price: '5000',
      period: '/yillik',
      desc: 'Büyük ölçekli veriler için yapay zeka.',
      features: ['AI Analitik Tahminler', 'Gelişmiş Veri Görselleştirme', 'Ekip Yönetimi', '7/24 Teknik Destek', 'Öncelikli API Erişimi'],
      popular: true,
      buttonText: 'HEMEN PRO OL',
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden relative">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/15 rounded-full blur-[140px] animate-aurora-1"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[120px] animate-aurora-2"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        <nav className="p-8 md:px-16 flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/30 group-hover:rotate-12 transition-all">
              <i className="ri-file-list-3-line text-2xl text-white"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter uppercase text-white">Net Muhasebe <span className="text-indigo-500">AI</span></span>
              <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase leading-none mt-1">netmuhasebe.net.tr</span>
            </div>
          </Link>
          <Link to="/login" className="text-sm font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">GİRİŞ YAP</Link>
        </nav>

        <main className="flex-1 flex flex-col items-center justify-center p-6 pb-24">
          <div className="text-center mb-16 space-y-4 animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none">
              {step === 1 ? <>Geleceğe <span className="text-gradient">Adım Atın.</span></> :
                step === 2 ? 'Ödeme Bilgileri.' : 'Bilgilerinizi Doldurun.'}
            </h1>
            <p className="text-slate-500 text-lg font-medium">
              {step === 2 ? 'Kredi veya banka kartınız ile güvenli ödeme yapın.' : 'Net Muhasebe AI ile işletmenizi geleceğe taşıyın.'}
            </p>
          </div>

          {step === 1 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl w-full animate-fade-in">
              {plans.map((plan, i) => (
                <div
                  key={i}
                  className={`
                    premium-card p-10 relative flex flex-col
                    ${plan.popular ? 'border-indigo-500/40 bg-indigo-500/[0.03] scale-[1.05]' : ''}
                  `}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full text-[10px] font-black tracking-[0.2em] uppercase shadow-lg shadow-indigo-600/30">
                      EN ÇOK TERCİH EDİLEN
                    </div>
                  )}

                  <div className="mb-10">
                    <p className="text-[11px] font-black tracking-[0.3em] text-indigo-400 mb-2 uppercase">{plan.name}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black">₺{plan.price}</span>
                      <span className="text-slate-500 font-bold">{plan.period}</span>
                    </div>
                    <p className="mt-4 text-slate-400 font-medium">{plan.desc}</p>
                  </div>

                  <ul className="space-y-6 mb-12 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-4 text-slate-300 font-bold text-sm">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <i className="ri-check-line text-emerald-500"></i>
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => { setSelectedPlan(plan); setStep(2); }}
                    className={`
                      w-full h-16 rounded-2xl font-black tracking-widest transition-all active:scale-95
                      ${plan.popular
                        ? 'bg-white text-black hover:bg-slate-200 shadow-xl'
                        : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                      }
                    `}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              ))}
            </div>
          ) : step === 2 ? (
            <div className="max-w-[540px] w-full animate-slide-up">
              <div className="premium-card p-12 relative overflow-hidden">
                <form onSubmit={handleNextStep} className="relative z-10 space-y-8">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-indigo-400 font-black text-[10px] tracking-widest uppercase flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <i className="ri-arrow-left-line"></i> GERİ DÖN
                    </button>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ÖDENECEK TUTAR</p>
                      <p className="text-2xl font-black text-indigo-400">₺{selectedPlan?.price}</p>
                    </div>
                  </div>

                  {/* Payment Method Tabs */}
                  <div className="flex p-1 bg-white/[0.03] border border-white/5 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'card' ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                      Kredi / Banka Kartı
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('eft')}
                      className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'eft' ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                      EFT / Havale
                    </button>
                  </div>

                  {paymentMethod === 'card' ? (
                    <div className="space-y-6 animate-fade-in">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">KART ÜZERİNDEKİ İSİM</label>
                        <input
                          type="text"
                          required
                          value={paymentData.holderName}
                          onChange={(e) => setPaymentData({ ...paymentData, holderName: e.target.value })}
                          className="premium-input"
                          placeholder="AD SOYAD"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">KART NUMARASI</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            maxLength={19}
                            value={paymentData.cardNumber}
                            onChange={(e) => setPaymentData({ ...paymentData, cardNumber: e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim() })}
                            className="premium-input pr-16"
                            placeholder="0000 0000 0000 0000"
                          />
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-1">
                            <i className="ri-visa-line text-2xl text-slate-600"></i>
                            <i className="ri-mastercard-line text-2xl text-slate-600"></i>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">SKT (AA/YY)</label>
                          <input
                            type="text"
                            required
                            maxLength={5}
                            value={paymentData.expiry}
                            onChange={(e) => setPaymentData({ ...paymentData, expiry: e.target.value.replace(/\D/g, '').replace(/(.{2})/, '$1/').trim() })}
                            className="premium-input text-center"
                            placeholder="MM/YY"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">CVC / CVV</label>
                          <input
                            type="password"
                            required
                            maxLength={3}
                            value={paymentData.cvc}
                            onChange={(e) => setPaymentData({ ...paymentData, cvc: e.target.value.replace(/\D/g, '') })}
                            className="premium-input text-center"
                            placeholder="000"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-fade-in">
                      <div className="p-6 rounded-[32px] bg-indigo-600/5 border border-indigo-500/10 space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {/* Garanti BBVA */}
                        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GARANTİ BBVA</p>
                            <i className="ri-bank-line text-indigo-400"></i>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ALICI ADI</p>
                            <p className="text-sm font-black text-slate-200">YASİN DENİZ</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                              IBAN ADRESİ
                              <button onClick={() => { navigator.clipboard.writeText('TR10 0006 2000 6760 0006 8829 00'); alert('Kopyalandı!'); }} className="text-indigo-400 hover:text-white transition-colors">KOPYALA</button>
                            </p>
                            <p className="text-sm font-black text-indigo-400 font-mono tracking-wider break-all">TR10 0006 2000 6760 0006 8829 00</p>
                          </div>
                        </div>

                        {/* QNB Finansbank */}
                        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">QNB FİNANSBANK</p>
                            <i className="ri-bank-line text-indigo-400"></i>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ALICI ADI</p>
                            <p className="text-sm font-black text-slate-200">YASİN DENİZ</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                              IBAN ADRESİ
                              <button onClick={() => { navigator.clipboard.writeText('TR07 0011 1000 0000 0152 0397 34'); alert('Kopyalandı!'); }} className="text-indigo-400 hover:text-white transition-colors">KOPYALA</button>
                            </p>
                            <p className="text-sm font-black text-indigo-400 font-mono tracking-wider break-all">TR07 0011 1000 0000 0152 0397 34</p>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400 leading-relaxed italic text-center">
                          * Açıklama kısmına kayıt olacağınız e-posta adresini yazmayı unutmayınız. Ödeme sonrası üyeliğiniz manuel olarak onaylanacaktır.
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl flex items-center gap-4">
                      <i className="ri-shield-check-line text-3xl text-emerald-500"></i>
                      <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
                        256-BIT SSL İLE GÜVENLİ ÖDEME. KART BİLGİLERİNİZ SİSTEMİMİZDE SAKLANMAZ.
                      </p>
                    </div>
                  )}

                  <button type="submit" className="premium-button w-full h-[72px] text-lg uppercase tracking-widest">
                    {paymentMethod === 'card' ? 'ÖDEME BİLGİLERİNİ ONAYLA' : 'HAVALE YAPTIM, DEVAM ET'}
                    <i className="ri-arrow-right-line text-2xl"></i>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="max-w-[540px] w-full animate-slide-up">
              <div className="premium-card p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 bg-indigo-600/10 blur-3xl"></div>

                <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-indigo-400 font-black text-[10px] tracking-widest uppercase flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <i className="ri-arrow-left-line font-black"></i>
                    ÖDEME BİLGİLERİNE DÖN
                  </button>

                  {error && (
                    <div className="p-5 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-bold flex gap-3">
                      <i className="ri-error-warning-fill text-lg"></i>{error}
                    </div>
                  )}

                  {success && (
                    <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm font-bold flex gap-3">
                      <i className="ri-checkbox-circle-fill text-lg"></i>{success}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">İşletme / Şirket Adı</label>
                      <input
                        type="text"
                        required
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="premium-input"
                        placeholder="Örn: Net Teknoloji Ltd."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">E-Posta Adresi</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="premium-input"
                        placeholder="eposta@sirketiniz.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Şifre</label>
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="premium-input"
                        placeholder="••••••••"
                        minLength={6}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="premium-button w-full h-[72px] text-lg bg-indigo-600 hover:bg-indigo-700"
                  >
                    {loading ? (
                      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>KAYDI TAMAMLA VE BAŞLAT</>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      <p className="fixed bottom-8 left-1/2 -translate-x-1/2 text-slate-600 text-[10px] font-black tracking-[0.3em] uppercase whitespace-nowrap">
        NET MUHASEBE AI • 2026 GELECEĞİN MUHASEBESİ • netmuhasebe.net.tr
      </p>
    </div>
  );
}
