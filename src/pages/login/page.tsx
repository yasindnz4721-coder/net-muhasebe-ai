import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (auth.isAuthenticated()) {
      window.location.href = '/dashboard';
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: loginError } = await auth.login(email.trim(), password);

      if (loginError) {
        setError(loginError);
        return;
      }

      if (data?.user) {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error('Giriş hatası:', err);
      setError('Sistem şu an meşgul. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const featureHighlights = [
    { icon: 'ri-command-fill', text: 'Tam Otomasyon' },
    { icon: 'ri-brain-line', text: 'AI Finansal Analiz' },
    { icon: 'ri-shield-star-line', text: 'Bulut Güvenliği' },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-hidden relative">
      {/* Hyper-Modern Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-indigo-600/20 rounded-full blur-[120px] animate-aurora-1"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] animate-aurora-2"></div>
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] animate-pulse"></div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <nav className="relative z-50 p-8 md:px-16 flex items-center justify-between">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-14 h-14 bg-white/5 backdrop-blur-3xl rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl group-hover:scale-110 transition-all p-2">
            <img src="/logo.png" alt="Net Muhasebe AI" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter uppercase text-white">Net Muhasebe <span className="text-indigo-500 italic">AI</span></span>
            <span className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase leading-none mt-1">Geleceğin Finansal Teknolojisi</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 bg-white/5 backdrop-blur-xl px-1 py-1 rounded-2xl border border-white/10">
          <Link to="/login" className="px-6 py-3 text-sm font-bold text-white hover:text-indigo-400 transition-colors">Giriş Yap</Link>
          <Link to="/kayit" className="px-8 py-3 text-sm font-black bg-white text-black rounded-xl hover:bg-slate-200 transition-all">HEMEN BAŞLA</Link>
        </div>
      </nav>

      <main className="relative z-10 pt-12 pb-24 px-6 max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
        {/* Left Section: Value Proposition */}
        <div className="space-y-12">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span>2026 Nesil Muhasebe Yazılımı</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9]">
            Finansal <br />
            <span className="text-gradient">Zekayı</span> <br />
            Keşfedin.
          </h1>

          <p className="text-slate-400 text-xl font-medium max-w-lg leading-relaxed">
            Karmaşık işlemleri saniyeler içinde çözen, yapay zeka destekli ilk muhasebe platformu. İşletmeniz için en akıllı kararları verin.
          </p>

          <div className="flex flex-wrap gap-6 mt-12">
            {featureHighlights.map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-300">
                <i className={`${f.icon} text-indigo-500 text-xl`}></i>
                {f.text}
              </div>
            ))}
          </div>

          <div className="pt-12 flex flex-col sm:flex-row items-center gap-6 relative z-30">
            <button
              onClick={() => navigate('/tanitim_filmi')}
              className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all hover:scale-105 shadow-2xl"
            >
              <i className="ri-play-circle-fill text-2xl text-indigo-400"></i>
              TANITIM VİDEOSUNU İZLE
            </button>
            <div className="flex items-center gap-6">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-[#020617] bg-slate-800 flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-bold">10,000+ Şirket</p>
                <p className="text-xs text-slate-500">Bize güveniyor ve büyüyor.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Login Form */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-[3rem] opacity-20 blur-2xl group-hover:opacity-30 transition-opacity"></div>

          <div className="premium-card p-10 md:p-14 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl"></div>

            <form onSubmit={handleLogin} className="space-y-8 relative z-10">
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight">Giriş Yap</h2>
                <p className="text-slate-500 font-medium">İşletmenizi yönetmeye hazır mısınız?</p>
              </div>

              {error && (
                <div className="p-5 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-bold flex gap-3 animate-shake">
                  <i className="ri-error-warning-fill text-lg"></i>
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">İş E-Postası</label>
                  <div className="relative">
                    <i className="ri-mail-line absolute left-6 top-1/2 -translate-y-1/2 text-slate-550 text-xl"></i>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="premium-input pl-14"
                      placeholder="ad@sirketiniz.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Şifre</label>
                    <Link to="/sifre-sifirlama" className="text-[10px] font-black text-indigo-400 hover:text-white transition-colors">ŞİFREMİ UNUTTUM</Link>
                  </div>
                  <div className="relative">
                    <i className="ri-lock-line absolute left-6 top-1/2 -translate-y-1/2 text-slate-550 text-xl"></i>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="premium-input px-14"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="premium-button w-full h-[72px] text-lg"
              >
                {loading ? (
                  <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    SONRAKİ ADIM
                    <i className="ri-arrow-right-up-line text-2xl"></i>
                  </>
                )}
              </button>

              <div className="text-center pt-4">
                <p className="text-slate-500 font-bold text-sm">
                  Henüz üye değil misiniz? <br />
                  <Link to="/kayit" className="text-white hover:text-indigo-400 transition-colors underline decoration-indigo-500/30 decoration-4 underline-offset-8">Yeni Hesap Oluşturun</Link>
                </p>
              </div>

              {/* Aydınlatma Metni */}
              <div className="pt-6 border-t border-white/5">
                <div className="p-5 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 text-[10px] font-bold text-slate-400 leading-relaxed text-justify">
                  <div className="flex items-center gap-2 text-indigo-400 uppercase tracking-widest mb-2">
                    <i className="ri-shield-check-line text-lg"></i>
                    ÖNEMLİ AYDINLATMA
                  </div>
                  Net Muhasebe AI, bir yapay zeka destekli ön muhasebe takip ve karar destek yazılımıdır.
                  Sistem tarafından sunulan AI analizleri ve öngörüler, istatistiksel verilere dayalı olup
                  resmi bir mali tavsiye veya müşavirlik hizmeti niteliği taşımaz. Verileriniz Mardin merkezli
                  yüksek güvenlikli bulut altyapımızda saklanmaktadır. Yasal ve vergisel süreçleriniz için
                  mutlaka yetkili bir <span className="text-white">Serbest Muhasebeci Mali Müşavir (SMMM)</span> ile çalışmanız gerekmektedir.
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer className="relative z-10 max-w-7xl mx-auto px-8 py-12 flex flex-col md:row items-center justify-between gap-8 border-t border-white/5">
        <div className="flex items-center gap-10">
          <p className="text-[10px] font-black tracking-widest text-slate-600 uppercase">© 2026 NET MUHASEBE AI</p>
          <p className="text-[10px] font-black tracking-widest text-slate-600 uppercase">MÜŞTERİ DESTEK: 534 740 12 56</p>
        </div>
        <div className="flex gap-8">
          <Link to="/gizlilik-politikasi" className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em]">Gizlilik</Link>
          <Link to="/" className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em]">Kullanım Şartları</Link>
          <Link to="/" className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em]">netmuhasebe.net.tr</Link>
        </div>
      </footer>
    </div>
  );
}
