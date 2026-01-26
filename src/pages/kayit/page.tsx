import { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../../lib/api';

export default function KayitPage() {
  const [step, setStep] = useState(1); // 1: Plans, 2: Register Form
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data, error: registerError } = await auth.register(
        formData.email.trim(),
        formData.password,
        formData.companyName.trim()
      );

      if (registerError) {
        setError(registerError);
        return;
      }

      if (data?.user) {
        setSuccess('✅ Hesabınız başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.');
        setFormData({ email: '', password: '', companyName: '' });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } catch (err) {
      console.error('Kayıt hatası:', err);
      setError('Kayıt şu an gerçekleştirilemiyor. Lütfen tekrar deneyin.');
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
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-hidden relative">
      {/* Background Aurora */}
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
            <span className="text-2xl font-black tracking-tighter">NET MUHASEBE</span>
          </Link>
          <Link to="/login" className="text-sm font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">GİRİŞ YAP</Link>
        </nav>

        <main className="flex-1 flex flex-col items-center justify-center p-6 pb-24">
          <div className="text-center mb-16 space-y-4 animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none">
              {step === 1 ? <>Geleceğe <span className="text-gradient">Adım Atın.</span></> : 'Bilgilerinizi Doldurun.'}
            </h1>
            <p className="text-slate-500 text-lg font-medium">Net Muhasebe AI ile işletmenizi geleceğe taşıyın. Avantajlı lansman fiyatlarını kaçırmayın!</p>
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
                    onClick={() => setStep(2)}
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
          ) : (
            <div className="max-w-[540px] w-full animate-slide-up">
              <div className="premium-card p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 bg-indigo-600/10 blur-3xl"></div>

                <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-indigo-400 font-black text-[10px] tracking-widest uppercase flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <i className="ri-arrow-left-line font-black"></i>
                    FARKLI BİR PLAN SEÇ
                  </button>

                  {error && (
                    <div className="p-5 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-bold flex gap-3 animate-shake">
                      <i className="ri-error-warning-fill text-lg"></i>
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm font-bold flex gap-3 animate-bounce-subtle">
                      <i className="ri-checkbox-circle-fill text-lg"></i>
                      {success}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">İşletme / Şirket Adı</label>
                      <input
                        type="text"
                        required
                        disabled={loading}
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
                        disabled={loading}
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
                        disabled={loading}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="premium-input"
                        placeholder="••••••••"
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 font-black">AI</div>
                      <div>
                        <p className="text-xs font-black tracking-tight text-white uppercase">SÜRESİZ ENTERPRISE AKTİVASYONU</p>
                        <p className="text-[10px] font-bold text-slate-500">Tüm sistem özellikleri hesabınıza tanımlanacaktır.</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="premium-button w-full h-[72px] text-lg uppercase tracking-widest"
                  >
                    {loading ? (
                      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        HESABI OLUŞTUR
                        <i className="ri-arrow-right-up-line text-2xl"></i>
                      </>
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
