import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function TanitimPage() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [scene, setScene] = useState(0);

    useEffect(() => {
        if (isPlaying) {
            const timer = setInterval(() => {
                setScene(prev => (prev < 3 ? prev + 1 : prev));
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [isPlaying]);

    // VIDEO PLAYER INTERFACE (PRE-PLAY)
    if (!isPlaying) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
                <div
                    onClick={() => setIsPlaying(true)}
                    className="w-full max-w-5xl aspect-video bg-black rounded-[2rem] overflow-hidden relative group cursor-pointer border border-white/10 shadow-2xl"
                >
                    <img src="/ad-hero.png" className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" alt="Thumbnail" />

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.5)] group-hover:scale-110 transition-all">
                            <i className="ri-play-fill text-6xl text-white ml-2"></i>
                        </div>
                    </div>

                    {/* Bottom Bar UI */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                                <img src="/logo.png" className="w-6 h-6 object-contain" alt="Logo" />
                            </div>
                            <span className="font-black text-sm tracking-widest text-white/80 uppercase">NET MUHASEBE AI - TANITIM FİLMİ 2026</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // CINEMATIC MODE (PLAYING)
    return (
        <div className="min-h-screen bg-black text-white overflow-hidden relative font-sans flex items-center justify-center">
            {/* Cinematic Frame */}
            <div className="fixed top-0 left-0 w-full h-[12vh] bg-black z-50"></div>
            <div className="fixed bottom-0 left-0 w-full h-[12vh] bg-black z-50"></div>

            {/* Background Image with Zoom Effect */}
            <div className="absolute inset-0">
                <img
                    src="/ad-hero.png"
                    className={`w-full h-full object-cover opacity-30 transition-transform duration-[30000ms] ${isPlaying ? 'scale-[1.8]' : 'scale-100'}`}
                    alt="bg"
                />
            </div>

            <div className="relative z-10 w-full max-w-4xl px-12 text-center">
                {scene === 0 && (
                    <div className="animate-fade-in space-y-6">
                        <h2 className="text-[10px] font-black tracking-[1em] text-indigo-400 uppercase">Gelecek Yayında</h2>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none italic underline decoration-indigo-500/50 decoration-8 underline-offset-[16px]">NET MUHASEBE AI</h1>
                    </div>
                )}

                {scene === 1 && (
                    <div className="animate-slide-up space-y-8">
                        <h2 className="text-6xl md:text-8xl font-black tracking-tight leading-none bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">Muhasebenin Yeni Boyutu.</h2>
                        <p className="text-lg text-slate-400 font-medium tracking-widest uppercase">"Hata Kabul Etmeyen Teknoloji"</p>
                    </div>
                )}

                {scene === 2 && (
                    <div className="animate-fade-in space-y-12">
                        <div className="flex justify-center gap-16">
                            {[
                                { icon: 'ri-brain-line', label: 'ZEKA' },
                                { icon: 'ri-shield-star-line', label: 'GÜVEN' },
                                { icon: 'ri-speed-up-line', label: 'HIZ' }
                            ].map((item, i) => (
                                <div key={i} className="space-y-4">
                                    <i className={`${item.icon} text-6xl text-indigo-500`}></i>
                                    <p className="text-[10px] font-black tracking-tighter uppercase">{item.label}</p>
                                </div>
                            ))}
                        </div>
                        <h3 className="text-3xl font-bold max-w-2xl mx-auto leading-relaxed text-slate-300 italic">"İşletmeniz İçin En Akıllı Kararları Sizin Yerinize Veriyoruz."</h3>
                    </div>
                )}

                {scene === 3 && (
                    <div className="animate-zoom-in space-y-10">
                        <h4 className="text-6xl font-black tracking-tighter italic">Hazır mısınız?</h4>
                        <div className="flex flex-col md:flex-row gap-6 justify-center mt-12">
                            <Link to="/kayit" className="premium-button px-16 h-20 text-xl shadow-indigo-500/40">SİSTEME KATIL</Link>
                            <button onClick={() => setScene(0)} className="px-16 h-20 bg-white/5 border border-white/10 rounded-3xl font-black hover:bg-white/10 transition-all uppercase tracking-widest text-xs">TEKRAR İZLE</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Exit Control */}
            <button
                onClick={() => setIsPlaying(false)}
                className="fixed bottom-16 right-16 z-[60] text-[10px] font-black tracking-widest text-indigo-400 hover:text-white transition-colors uppercase bg-black/50 px-6 py-3 rounded-full border border-white/5"
            >
                VİDEOYU DURDUR & ÇIK <i className="ri-close-line"></i>
            </button>
        </div>
    );
}
