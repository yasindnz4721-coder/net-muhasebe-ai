import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function TanitimPage() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [scene, setScene] = useState(0);

    useEffect(() => {
        if (isPlaying) {
            const timer = setInterval(() => {
                setScene(prev => (prev < 3 ? prev + 1 : prev));
            }, 4000);
            return () => clearInterval(timer);
        }
    }, [isPlaying]);

    if (!isPlaying) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center cursor-pointer group" onClick={() => setIsPlaying(true)}>
                <div className="absolute inset-0 z-0 opacity-40">
                    <img src="/ad-hero.png" alt="BG" className="w-full h-full object-cover blur-sm" />
                </div>
                <div className="relative z-10 space-y-8">
                    <div className="w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(79,70,229,0.5)] group-hover:scale-110 transition-transform">
                        <i className="ri-play-fill text-6xl text-white ml-2"></i>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black tracking-tighter uppercase">NET MUHASEBE AI</h2>
                        <p className="text-indigo-400 font-bold tracking-[0.3em] text-sm italic">TANITIM FİLMİNİ BAŞLATMAK İÇİN TIKLAYIN</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden relative font-sans">
            {/* Cinematic Overlay */}
            <div className="fixed top-0 left-0 w-full h-[10vh] bg-black z-50"></div>
            <div className="fixed bottom-0 left-0 w-full h-[10vh] bg-black z-50"></div>

            {/* Stage: Background */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/ad-hero.png"
                    alt="Background"
                    className={`w-full h-full object-cover opacity-30 transition-transform duration-[20000ms] ${isPlaying ? 'scale-150' : 'scale-100'}`}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-black"></div>
            </div>

            {/* SCENE 1: INTRODUCTION */}
            {scene === 0 && (
                <div className="relative z-10 h-screen flex flex-col items-center justify-center p-12 animate-fade-in">
                    <div className="w-24 h-24 mb-8">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-contain animate-pulse" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-[0.5em] uppercase text-indigo-500 animate-slide-up">NET MUHASEBE AI</h1>
                    <div className="mt-8 w-32 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 animate-[progress_4s_linear]"></div>
                    </div>
                </div>
            )}

            {/* SCENE 2: VALUE PROP */}
            {scene === 1 && (
                <div className="relative z-10 h-screen flex flex-col items-center justify-center p-12 text-center animate-slide-up">
                    <h2 className="text-6xl md:text-9xl font-black tracking-tighter leading-none mb-8">
                        Muhasebenin <br />
                        <span className="text-gradient">Yeni Boyutu.</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-slate-400 max-w-2xl font-medium leading-relaxed italic">
                        "Yapay zeka artik işinizi sizin için takip ediyor."
                    </p>
                </div>
            )}

            {/* SCENE 3: SPEED & PRECISION */}
            {scene === 2 && (
                <div className="relative z-10 h-screen flex flex-col items-center justify-center p-12 text-center animate-fade-in">
                    <div className="flex gap-12 mb-12">
                        <div className="text-center space-y-2">
                            <i className="ri-speed-up-line text-7xl text-indigo-500"></i>
                            <p className="font-black text-xs tracking-widest uppercase">Ultra Hız</p>
                        </div>
                        <div className="text-center space-y-2">
                            <i className="ri-brain-line text-7xl text-blue-500"></i>
                            <p className="font-black text-xs tracking-widest uppercase">Akıllı Analiz</p>
                        </div>
                        <div className="text-center space-y-2">
                            <i className="ri-shield-star-line text-7xl text-teal-500"></i>
                            <p className="font-black text-xs tracking-widest uppercase">Tam Güvenlik</p>
                        </div>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-black max-w-3xl leading-tight uppercase tracking-tighter">
                        İşletmeniz İçin <br /> <span className="text-white">En Akıllı Kararları Verin.</span>
                    </h3>
                </div>
            )}

            {/* SCENE 4: CALL TO ACTION */}
            {scene === 3 && (
                <div className="relative z-10 h-screen flex flex-col items-center justify-center p-12 text-center animate-zoom-in">
                    <div className="premium-card p-16 space-y-12">
                        <h4 className="text-5xl font-black tracking-tighter">Geleceğe Hazır mısınız?</h4>
                        <div className="flex flex-col md:flex-row gap-6">
                            <Link to="/kayit" className="premium-button px-12 h-20 text-lg">HEMEN BAŞLA</Link>
                            <button onClick={() => setScene(0)} className="px-12 h-20 bg-white/5 border border-white/10 rounded-[2rem] font-bold hover:bg-white/10 transition-all uppercase tracking-widest text-xs">TEKRAR İZLE</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Skip Button */}
            <button
                onClick={() => setIsPlaying(false)}
                className="fixed top-20 right-12 z-[60] text-[10px] font-black tracking-widest text-white/40 hover:text-white transition-colors"
            >
                VİDEODAN ÇIK <i className="ri-close-line"></i>
            </button>
        </div>
    );
}

