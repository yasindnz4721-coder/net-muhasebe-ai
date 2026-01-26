import { Link } from 'react-router-dom';

export default function TanitimPage() {
    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-hidden relative">
            {/* Background Cinematic Effects */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <img
                    src="/ad-hero.png"
                    alt="Campaign Hero"
                    className="w-full h-full object-cover opacity-30 scale-110 animate-pulse-slow active:scale-100 transition-transform duration-[10000ms]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]"></div>
                <div className="absolute inset-0 bg-indigo-600/5 backdrop-blur-[2px]"></div>

                {/* Glowing Orbs */}
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-aurora-1"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-aurora-2"></div>
            </div>

            <div className="relative z-10 min-h-screen flex flex-col">
                <nav className="p-8 md:px-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <img src="/logo.png" alt="Logo" className="w-10 h-10 group-hover:rotate-12 transition-transform" />
                        <span className="text-xl font-black tracking-tighter uppercase">Net Muhasebe <span className="text-indigo-400">AI</span></span>
                    </Link>
                    <Link to="/login" className="premium-button px-6 h-12 text-xs">GİRİŞ YAP</Link>
                </nav>

                <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                    <div className="max-w-4xl space-y-12">
                        <div className="space-y-4 animate-slide-up">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-xs font-black uppercase tracking-[0.3em]">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                TANITIM FİLMİ 2026
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">
                                Muhasebenin <br />
                                <span className="text-gradient">Yeni Boyutu.</span>
                            </h1>
                        </div>

                        <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed animate-fade-in delay-300">
                            Yapay zeka ile güçlendirilmiş, hata kabul etmeyen ve işletmenizin her kuruşunu mili-saniyeler içinde analiz eden dijital finans ortağınız.
                        </p>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-12 animate-slide-up delay-500">
                            <Link to="/kayit" className="premium-button px-12 h-20 text-lg group w-full md:w-auto">
                                HEMEN ÜCRETSİZ DENE
                                <i className="ri-arrow-right-line group-hover:translate-x-2 transition-transform"></i>
                            </Link>
                            <button className="px-12 h-20 text-lg font-black bg-white/5 border border-white/10 text-white rounded-[2rem] hover:bg-white/10 transition-all backdrop-blur-xl w-full md:w-auto">
                                ÖZELLİKLERİ İNCELE
                            </button>
                        </div>
                    </div>
                </main>

                <footer className="p-12 text-center opacity-50">
                    <div className="flex items-center justify-center gap-8 mb-4">
                        <i className="ri-ai-generate text-3xl text-indigo-400 animate-pulse"></i>
                        <i className="ri-shield-check-line text-3xl"></i>
                        <i className="ri-speed-up-line text-3xl"></i>
                    </div>
                    <p className="text-[10px] font-black tracking-[0.5em] uppercase">Powered by Advanced Intelligence Units</p>
                </footer>
            </div>

            {/* Cinematic Frame Stripes */}
            <div className="fixed top-0 left-0 w-full h-12 bg-black/80 z-50 pointer-events-none"></div>
            <div className="fixed bottom-0 left-0 w-full h-12 bg-black/80 z-50 pointer-events-none"></div>
        </div>
    );
}
