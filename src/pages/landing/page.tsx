import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';

export default function LandingPage() {
    const { currentUser } = useProfile();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // If logged in, maybe show a "Go to Dashboard" button in hero
    const handleAction = () => {
        if (currentUser) {
            navigate('/dashboard');
        } else {
            navigate('/kayit');
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 font-sans overflow-x-hidden">
            {/* Background Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[140px] animate-aurora-2"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-purple-600/5 rounded-full blur-[120px] animate-aurora-1"></div>
            </div>

            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 py-4' : 'py-8'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <i className="ri-brain-line text-2xl text-white"></i>
                        </div>
                        <span className="text-xl font-black tracking-tighter uppercase whitespace-nowrap">Net Muhasebe <span className="text-indigo-500">AI</span></span>
                    </div>

                    <div className="hidden lg:flex items-center gap-10">
                        {['Özellikler', 'AI-Analiz', 'Fiyatlandırma', 'İletişim'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                                {item}
                            </a>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        {currentUser ? (
                            <Link to="/dashboard" className="premium-button px-8 h-12 text-[10px] tracking-widest bg-indigo-600 shadow-xl shadow-indigo-600/20">DASHBOARD'A GİT</Link>
                        ) : (
                            <>
                                <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white px-6 hidden sm:block">Giriş Yap</Link>
                                <Link to="/kayit" className="premium-button px-8 h-12 text-[10px] tracking-widest bg-indigo-600 shadow-xl shadow-indigo-600/20">HEMEN BAŞLA</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header id="hakkımızda" className="relative pt-48 pb-32 px-6">
                <div className="max-w-5xl mx-auto text-center space-y-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest animate-fade-in">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        2026 Nesil Yapay Zeka Altyapısı Aktif
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] animate-slide-up">
                        Muhasebeyi <br />
                        <span className="text-gradient from-indigo-400 via-purple-400 to-indigo-600">Yapay Zeka</span> <br />
                        İle Yönetin.
                    </h1>

                    <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed animate-fade-in delay-200">
                        Hatalı kayıtlara, karışık tablolara ve bitmeyen raporlamalara elveda deyin.
                        Net Muhasebe AI ile işletmeniz kendi kendini yönetsin.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6 animate-slide-up delay-300">
                        <button onClick={handleAction} className="premium-button px-12 h-20 text-xs tracking-[0.2em] font-black bg-indigo-600 shadow-2xl shadow-indigo-600/40 w-full sm:w-auto">
                            SİSTEME ÜCRETSİZ KATIL <i className="ri-arrow-right-line ml-2"></i>
                        </button>
                        <Link to="/tanitim-filmi" className="px-12 h-20 border border-white/10 bg-white/5 rounded-3xl font-black text-xs tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/10 transition-all uppercase w-full sm:w-auto">
                            <i className="ri-play-circle-fill text-2xl text-indigo-500"></i>
                            TANITIM FİLMİ
                        </Link>
                    </div>

                    {/* Social Proof */}
                    <div className="pt-20 animate-fade-in delay-500">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8">GLOBAL STANDARTLARDA GÜVENLİK VE HIZ</p>
                        <div className="flex flex-wrap justify-center items-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                            {['Google Cloud', 'PostgreSQL', 'Stripe', '256-bit SSL', 'ISO-27001'].map((tag) => (
                                <span key={tag} className="text-xl font-bold tracking-tighter">{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Dashboard Image Preview */}
                <div className="mt-32 relative max-w-6xl mx-auto animate-slide-up delay-700">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-[120px] -z-10"></div>
                    <div className="bg-slate-900/50 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-4 shadow-2xl overflow-hidden group">
                        <img src="/ad-hero.png" className="w-full h-auto rounded-[2rem] shadow-2xl transition-transform duration-1000 group-hover:scale-105" alt="Dashboard Preview" />
                    </div>
                </div>
            </header>

            {/* Features Grid */}
            <section id="özellikler" className="py-32 px-6">
                <div className="max-w-7xl mx-auto space-y-20">
                    <div className="text-center space-y-4">
                        <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">NEDEN MUHASEBE AI?</h2>
                        <h3 className="text-4xl md:text-5xl font-black tracking-tighter">İşletmeniz İçin <span className="text-indigo-400">Tam Donanım.</span></h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { title: 'Yapay Zeka Analizi', desc: 'Verilerinizi analiz eder, karlılık öngörüleri oluşturur ve stratejik tavsiyeler verir.', icon: 'ri-brain-line', color: 'indigo' },
                            { title: 'Otomatik Fatura', desc: 'Saniyeler içinde e-fatura formatında satış ve alış faturaları oluşturun.', icon: 'ri-file-list-3-line', color: 'emerald' },
                            { title: 'Gerçek Zamanlı Stok', desc: 'Faturalar ile senkronize otomatik stok takibi ve kritik seviye uyarıları.', icon: 'ri-box-3-line', color: 'orange' },
                            { title: 'Cari Risk Yönetimi', desc: 'Borç-alacak dengesini takip edin, geciken ödemeler için otomatik hatırlatmalar yapın.', icon: 'ri-user-shield-line', color: 'blue' },
                            { title: 'Akıllı Raporlama', desc: 'KDV beyannamelerinden gelir-gider tablolarına kadar her şey tek tıkla hazır.', icon: 'ri-bar-chart-box-line', color: 'purple' },
                            { title: 'Bulut Güvencesi', desc: 'Verileriniz en üst düzey şifreleme ve yedekleme sistemleri ile korunur.', icon: 'ri-shield-check-line', color: 'rose' },
                        ].map((feature, i) => (
                            <div key={i} className="premium-card p-10 group hover:border-indigo-500/30 transition-all">
                                <div className={`w-16 h-16 bg-${feature.color}-500/10 rounded-2xl flex items-center justify-center border border-${feature.color}-500/20 text-${feature.color}-500 mb-8 group-hover:bg-${feature.color}-500 group-hover:text-white transition-all`}>
                                    <i className={`${feature.icon} text-3xl`}></i>
                                </div>
                                <h4 className="text-xl font-black mb-4 uppercase tracking-tighter">{feature.title}</h4>
                                <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AI Advisor Showcase */}
            <section id="ai-analiz" className="py-32 relative group overflow-hidden">
                <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-10">
                        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-600/40">
                            <i className="ri-robot-2-line text-4xl"></i>
                        </div>
                        <h3 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">
                            Kendi <span className="text-gradient from-indigo-400 to-purple-500"> Finans Direktörünüz.</span>
                        </h3>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Net Muhasebe AI, sadece bir kayıt aracı değildir. Verilerinizi işleyen bir zekadır.
                            "Önümüzdeki ay nakit sıkışıklığı yaşayabilir misiniz?", "Hangi ürün size daha çok kazandırıyor?" gibi soruların cevapları cebinizde.
                        </p>
                        <ul className="space-y-4">
                            {['Likidite ve Cari Oran Analizi', 'Gelecek Ay Tahminleme', 'Sektörel Karşılaştırma', 'Otomatik Anomali Tespiti'].map((item) => (
                                <li key={item} className="flex items-center gap-4 text-slate-300 font-bold uppercase text-[10px] tracking-widest">
                                    <i className="ri-checkbox-circle-fill text-indigo-500 text-xl"></i>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="premium-card p-8 bg-slate-900 border-indigo-500/20 shadow-2xl relative">
                        <div className="absolute -top-6 -right-6 px-6 py-2 bg-indigo-600 rounded-xl text-[10px] font-black tracking-widest animate-bounce">AI ADVISOR AKTİF</div>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-500/20"><i className="ri-brain-line text-xl"></i></div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-black uppercase">Stratejik Analiz</p>
                                    <p className="text-xs font-bold">Özet Rapor Alınıyor...</p>
                                </div>
                            </div>
                            <p className="text-sm font-medium leading-relaxed italic text-indigo-200">
                                "Uyarı: Alacak yaşlandırma raporuna göre, ortalama tahsilat süreniz 45 günden 52 güne çıktı.
                                Nakit akışını korumak için vadesi geçen bakiyeler için hatırlatma yapmanız önerilir."
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Cari Oran</p>
                                    <p className="text-xl font-bold text-emerald-400">1.82 <i className="ri-arrow-up-line"></i></p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Büyüme Potansiyeli</p>
                                    <p className="text-xl font-bold text-indigo-400">%84</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="fiyatlandırma" className="py-32 px-6">
                <div className="max-w-7xl mx-auto space-y-20">
                    <div className="text-center space-y-4">
                        <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">FİYATLANDIRMA</h2>
                        <h3 className="text-4xl md:text-5xl font-black tracking-tighter">Şeffaf ve <span className="text-indigo-400">Esnek Planlar.</span></h3>
                        <p className="text-slate-400 max-w-2xl mx-auto">Size en uygun planı seçin, yapay zeka gücüyle işletmenizi büyütün.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
                        {[
                            {
                                name: 'STANDART AI',
                                price: '500',
                                period: '/aylık',
                                desc: 'Küçük işletmeler için tam kontrol.',
                                features: ['Gelir-Gider Takibi', 'Sınırsız Fatura', 'Stok Yönetimi', 'PDF Raporlar'],
                                popular: false,
                            },
                            {
                                name: 'ENTERPRISE AI',
                                price: '5000',
                                period: '/yıllık',
                                desc: 'Büyük ölçekli veriler için yapay zeka.',
                                features: ['AI Analitik Tahminler', 'Gelişmiş Veri Görselleştirme', 'Ekip Yönetimi', '7/24 Teknik Destek', 'Öncelikli API Erişimi'],
                                popular: true,
                            }
                        ].map((plan, i) => (
                            <div key={i} className={`premium-card p-12 relative flex flex-col ${plan.popular ? 'border-indigo-500/40 bg-indigo-500/[0.03] scale-[1.05]' : ''}`}>
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full text-[10px] font-black tracking-[0.2em] uppercase shadow-lg shadow-indigo-600/30">
                                        EN ÇOK TERCİH EDİLEN
                                    </div>
                                )}
                                <div className="mb-10 text-center">
                                    <p className="text-[11px] font-black tracking-[0.3em] text-indigo-400 mb-4 uppercase">{plan.name}</p>
                                    <div className="flex items-baseline justify-center gap-2">
                                        <span className="text-6xl font-black">₺{plan.price}</span>
                                        <span className="text-slate-500 font-bold uppercase text-xs">{plan.period}</span>
                                    </div>
                                    <p className="mt-6 text-slate-400 text-sm font-medium">{plan.desc}</p>
                                </div>
                                <ul className="space-y-6 mb-12 flex-1">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-4 text-slate-300 font-bold text-xs uppercase tracking-tight">
                                            <i className="ri-check-line text-emerald-500 text-xl"></i>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={() => navigate('/kayit')} className={`w-full h-16 rounded-2xl font-black tracking-widest transition-all ${plan.popular ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-500' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}>
                                    HEMEN BAŞLA
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="sss" className="py-32 px-6 bg-white/[0.01]">
                <div className="max-w-3xl mx-auto space-y-16">
                    <div className="text-center space-y-4">
                        <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">SSS</h2>
                        <h3 className="text-4xl font-black tracking-tighter">Merak Edilenler</h3>
                    </div>

                    <div className="space-y-6">
                        {[
                            { q: 'Verilerim güvende mi?', a: 'Evet, tüm verileriniz endüstri standartlarında AES-256 şifreleme ve global bulut yedekleme sistemleri ile korunmaktadır.' },
                            { q: 'Yapay zeka nasıl tahminleme yapıyor?', a: 'Sistemimiz geçmişteki gelir-gider verilerinizi, cari hareketlerinizi ve piyasa trendlerini analiz ederek nakit akış tahminleri oluşturur.' },
                            { q: 'Platformu mobili cihazlarda kullanabilir miyim?', a: 'Evet, Net Muhasebe AI tamamen responsive bir yapıya sahiptir. Telefon, tablet ve bilgisayarlarınızdan sorunsuz erişebilirsiniz.' },
                            { q: 'Hangi ödeme yöntemleri geçerli?', a: 'Kredi kartı ve havale/EFT ile ödeme kabul ediyoruz. Tüm kart işlemleriniz güvenli virtual POS altyapımız üzerinden gerçekleşir.' }
                        ].map((faq, i) => (
                            <div key={i} className="premium-card p-8 group cursor-pointer hover:border-white/20 transition-all">
                                <h4 className="text-lg font-black mb-4 uppercase tracking-tighter flex items-center justify-between">
                                    {faq.q}
                                    <i className="ri-add-line text-slate-500 group-hover:rotate-90 transition-transform"></i>
                                </h4>
                                <p className="text-slate-500 font-medium text-sm leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="iletişim" className="py-32 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">
                    <div className="space-y-10">
                        <h3 className="text-5xl font-black tracking-tighter leading-none">Bizimle <span className="text-indigo-400">İletişime</span> Geçin.</h3>
                        <p className="text-slate-400 text-lg leading-relaxed">Sistem hakkında herhangi bir sorunuz veya özel bir talebiniz mi var? Ekibimiz her zaman yardıma hazır.</p>

                        <div className="space-y-6">
                            {[
                                { icon: 'ri-phone-line', label: 'DESTEK HATTI', val: '534 740 12 56' },
                                { icon: 'ri-mail-line', label: 'E-POSTA', val: 'destek@netmuhasebe.net.tr' },
                                { icon: 'ri-map-pin-line', label: 'MERKEZ', val: 'İstanbul, Türkiye' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                                    <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                                        <i className={`${item.icon} text-2xl`}></i>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">{item.label}</p>
                                        <p className="text-lg font-bold">{item.val}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="premium-card p-10 space-y-8 bg-slate-900/50">
                        <div className="grid grid-cols-2 gap-6">
                            <input type="text" placeholder="ADINIZ" className="premium-input bg-black/50" />
                            <input type="email" placeholder="E-POSTA" className="premium-input bg-black/50" />
                        </div>
                        <input type="text" placeholder="KONU" className="premium-input bg-black/50" />
                        <textarea placeholder="MESAJINIZ" rows={5} className="premium-input bg-black/50 resize-none pt-6"></textarea>
                        <button className="premium-button w-full h-20 text-xs font-black tracking-[0.3em]">MESAJI GÖNDER</button>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-48 px-6 text-center">
                <div className="max-w-4xl mx-auto space-y-12">
                    <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                        İşletmenizi <br />
                        <span className="text-indigo-500">Dijital Devrime</span> Dahil Edin.
                    </h2>
                    <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto">
                        Karmaşıklığı geride bırakın. Basit, hızlı ve akıllı muhasebe ile tanışın.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
                        <button onClick={handleAction} className="premium-button px-16 h-24 text-sm tracking-[0.3em] font-black bg-white text-indigo-900 w-full sm:w-auto">
                            KRAL MUHASEBEYİ ÜCRETSİZ DENE
                        </button>
                    </div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Kredi kartı gerekmez • 14 gün PRO deneme • İstediğin zaman iptal et</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-white/5 px-6 relative">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <i className="ri-brain-line text-lg"></i>
                            </div>
                            <span className="text-lg font-black tracking-tighter uppercase">MUHASEBE <span className="text-indigo-500">AI</span></span>
                        </div>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed">
                            Türkiye'nin en gelişmiş yapay zeka destekli ön muhasebe yazılımı.
                            2026 yılından beri işletmelerin yanında.
                        </p>
                    </div>
                    <div>
                        <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-6">ÜRÜN</h5>
                        <ul className="space-y-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <li className="hover:text-indigo-400 transition-colors cursor-pointer"><a href="#özellikler">ÖZELLİKLER</a></li>
                            <li className="hover:text-indigo-400 transition-colors cursor-pointer"><a href="#ai-analiz">AI ANALİZ</a></li>
                            <li className="hover:text-indigo-400 transition-colors cursor-pointer"><a href="#özellikler">E-FATURA</a></li>
                            <li className="hover:text-indigo-400 transition-colors cursor-pointer"><a href="#özellikler">STOK TAKİBİ</a></li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-6">KURUMSAL</h5>
                        <ul className="space-y-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <li className="hover:text-indigo-400 transition-colors cursor-pointer"><a href="#hakkımızda">HAKKIMIZDA</a></li>
                            <li className="hover:text-indigo-400 transition-colors cursor-pointer"><a href="#fiyatlandırma">FİYATLANDIRMA</a></li>
                            <li className="hover:text-indigo-400 transition-colors cursor-pointer"><a href="#sss">SIKÇA SORULAN SORULAR</a></li>
                            <li className="hover:text-indigo-400 transition-colors cursor-pointer"><a href="#iletişim">İLETİŞİM</a></li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-6">YASAL</h5>
                        <ul className="space-y-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <li className="hover:text-indigo-400 transition-colors cursor-pointer"><Link to="/gizlilik-politikasi">Gizlilik Sözleşmesi</Link></li>
                            <li className="hover:text-indigo-400 transition-colors cursor-pointer"><Link to="/gizlilik-politikasi">Kullanım Koşulları</Link></li>
                            <li className="hover:text-indigo-400 transition-colors cursor-pointer"><Link to="/gizlilik-politikasi">KVKK Aydınlatma</Link></li>
                            <li className="hover:text-indigo-400 transition-colors cursor-pointer"><Link to="/gizlilik-politikasi">Çerez Politikası</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">© 2026 NET MUHASEBE AI. TÜM HAKLARI SAKLIDIR.</p>
                    <div className="flex gap-6 text-xl text-slate-500">
                        <i className="ri-instagram-line hover:text-pink-500 transition-colors cursor-pointer"></i>
                        <i className="ri-twitter-x-line hover:text-white transition-colors cursor-pointer"></i>
                        <i className="ri-linkedin-box-line hover:text-blue-500 transition-colors cursor-pointer"></i>
                        <i className="ri-youtube-line hover:text-red-500 transition-colors cursor-pointer"></i>
                    </div>
                </div>
            </footer>
        </div>
    );
}
