import { Link } from 'react-router-dom';

export default function TrialExpiredPage() {
    return (
        <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6 text-center relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-rose-600/10 rounded-full blur-[140px]"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-rose-600/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="premium-card p-12 max-w-xl animate-scale-in relative z-10 border-rose-500/20 bg-rose-500/[0.02]">
                <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-rose-500/20">
                    <i className="ri-time-line text-5xl text-rose-500 animate-pulse"></i>
                </div>

                <h1 className="text-4xl font-black tracking-tighter mb-4 uppercase">Deneme Süreniz <span className="text-rose-500">Sona Erdi.</span></h1>
                <p className="text-slate-400 text-lg font-medium mb-10">
                    14 günlük ücretsiz deneme süreniz dolmuştur. Verileriniz güvenle saklanmaktadır ancak sisteme erişim için üyeliğinizi aktif etmeniz gerekmektedir.
                </p>

                <div className="space-y-4">
                    <a
                        href="https://wa.me/905347401256"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full h-16 bg-white text-black rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-slate-200 transition-all shadow-xl"
                    >
                        <i className="ri-whatsapp-line text-xl"></i>
                        ÜYELİK AKTİVASYONU İÇİN YAZIN
                    </a>

                    <Link
                        to="/login"
                        onClick={() => localStorage.removeItem('auth_token')}
                        className="flex items-center justify-center gap-3 w-full h-16 bg-white/5 border border-white/10 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-white/10 transition-all"
                    >
                        FARKLI HESAPLA GİRİŞ YAP
                    </Link>
                </div>

                <div className="mt-12 pt-8 border-t border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-loose">
                        Yardıma mı ihtiyacınız var?<br />
                        destek@netmuhasebe.net.tr
                    </p>
                </div>
            </div>
        </div>
    );
}
