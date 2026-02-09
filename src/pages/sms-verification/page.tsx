import Sidebar from '../../components/feature/Sidebar';
import Header from '../../components/feature/Header';

export default function SMSVerificationPage() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-slate-900">
            <Sidebar />
            <div className="flex-1 flex flex-col p-10 overflow-y-auto">
                <Header />

                <main className="flex-1 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/60 border border-gray-100 p-12 max-w-5xl w-full flex flex-col md:flex-row items-center gap-16 relative overflow-hidden group">
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors"></div>

                        <div className="flex-1 space-y-8 z-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-rose-500">
                                    <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center border border-rose-500/20">
                                        <i className="ri-error-warning-line text-xl"></i>
                                    </div>
                                    <h1 className="text-2xl font-black uppercase tracking-tight">NUMARANIZI DOĞRULAYIN</h1>
                                </div>
                                <p className="text-slate-500 font-bold text-sm leading-relaxed max-w-md">
                                    Devam edebilmeniz için SMS doğrulaması yapmanız gerekiyor. 6 basamaklı doğrulama kodu içeren bir kısa mesaj gelecektir.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="relative max-w-sm">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                        <i className="ri-phone-line text-2xl"></i>
                                    </div>
                                    <input
                                        type="text"
                                        defaultValue="0534 740 12 56"
                                        className="w-full h-16 pl-16 pr-8 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl text-slate-800 tracking-widest focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                                    />
                                </div>

                                <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 h-16 rounded-[24px] font-black text-xs tracking-[0.1em] uppercase hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-emerald-900/40 flex items-center gap-3">
                                    SMS Gönder ve Doğrula
                                    <i className="ri-arrow-right-line text-lg"></i>
                                </button>
                            </div>

                            <div className="pt-8 border-t border-slate-50">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">© 2020 - 2026 || TECHNOONE YAZILIM SİSTEMLERİ LTD. ŞTİ.</p>
                            </div>
                        </div>

                        <div className="flex-1 hidden md:block z-10">
                            <div className="relative">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full"></div>
                                <img
                                    src="https://img.freepik.com/free-vector/authentication-concept-illustration_114360-2168.jpg"
                                    alt="SMS Verification"
                                    className="relative z-10 w-full max-w-md animate-float drop-shadow-2xl"
                                />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
