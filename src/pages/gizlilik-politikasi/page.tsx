import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden relative">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/15 rounded-full blur-[140px] animate-aurora-1"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[120px] animate-aurora-2"></div>
            </div>

            <nav className="relative z-50 p-8 md:px-16 flex items-center justify-between border-b border-white/5 backdrop-blur-3xl">
                <Link to="/" className="flex items-center gap-3 group cursor-pointer">
                    <img src="/logo.png" alt="Net Muhasebe AI" className="w-10 h-10 group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col">
                        <span className="text-xl font-black tracking-tighter uppercase text-white">Net Muhasebe <span className="text-indigo-500">AI</span></span>
                    </div>
                </Link>
                <Link to="/login" className="px-6 py-2 text-xs font-black bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all uppercase tracking-widest">Giriş Yap</Link>
            </nav>

            <main className="relative z-10 max-w-4xl mx-auto px-6 py-24">
                <div className="space-y-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                            <i className="ri-shield-keyhole-line"></i>
                            <span>GÜVENLİK VE GİZLİLİK</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">
                            Gizlilik <span className="text-gradient">Politikası.</span>
                        </h1>
                        <p className="text-slate-500 text-lg font-medium">Verilerinizin güvenliği ve gizliliği bizim önceliğimizdir.</p>
                    </div>

                    <div className="premium-card p-10 md:p-16 space-y-12 leading-relaxed text-slate-350">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">1. Veri Toplama</h2>
                            <p>Net Muhasebe AI, hizmetlerimizi sağlamak ve iyileştirmek için e-posta adresi, şirket bilgileri ve finansal kayıtlar gibi verileri toplar. Bu veriler yalnızca sizin onayınızla ve hizmetin gerektirdiği ölçüde işlenir.</p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">2. Veri Güvenliği</h2>
                            <p>Tüm verileriniz endüstri standartlarında AES-256 şifreleme yöntemleri ile korunur. Sunucularımız yüksek güvenlikli veri merkezlerinde barındırılmaktadır.</p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">3. Üçüncü Taraflarla Paylaşım</h2>
                            <p>Verileriniz, yasal zorunluluklar haricinde hiçbir şekilde üçüncü şahıs veya kurumlarla reklam veya pazarlama amacıyla paylaşılmaz.</p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">4. Çerez Politikası</h2>
                            <p>Platformumuzda kullanıcı deneyimini artırmak ve oturum yönetimini sağlamak amacıyla teknik çerezler kullanılmaktadır.</p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">5. Yasal Sorumluluk Reddi</h2>
                            <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-400 font-bold">
                                <i className="ri-error-warning-line mr-2"></i>
                                Net Muhasebe AI bir karar destek mekanizmasıdır. Resmi bir muhasebe veya mali müşavirlik hizmeti sunmaz. Vergisel ve yasal işlemleriniz için mutlaka lisanslı bir Mali Müşavir ile çalışmanız gerekmektedir.
                            </div>
                        </section>
                    </div>

                    <div className="text-center pt-8">
                        <Link to="/login" className="premium-button inline-flex px-12 h-16 text-sm">
                            ANLADIM, DEVAM ET
                        </Link>
                    </div>
                </div>
            </main>

            <footer className="relative z-10 max-w-7xl mx-auto px-8 py-12 text-center border-t border-white/5">
                <p className="text-[10px] font-black tracking-widest text-slate-600 uppercase">© 2026 NET MUHASEBE AI - TÜM HAKLARI SAKLIDIR</p>
            </footer>
        </div>
    );
}
