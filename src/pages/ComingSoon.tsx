import Sidebar from '../components/feature/Sidebar';
import Header from '../components/feature/Header';

export default function ComingSoonPage({ title }: { title: string }) {
    return (
        <div className="min-h-screen bg-[#020617] text-white flex">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 flex flex-col items-center justify-center p-10 space-y-6">
                    <div className="w-24 h-24 bg-indigo-600/10 rounded-[2rem] flex items-center justify-center border border-indigo-500/20 text-indigo-400 animate-pulse">
                        <i className="ri-tools-line text-5xl"></i>
                    </div>
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-black uppercase tracking-tight">{title}</h1>
                        <p className="text-slate-500 font-medium">Bu modül şu anda geliştirme aşamasındadır. Yakında hizmete açılacaktır.</p>
                    </div>
                    <button
                        onClick={() => window.history.back()}
                        className="premium-button px-8 h-12 text-[10px] tracking-widest bg-white/5 border border-white/10 hover:bg-white/10"
                    >
                        GERİ DÖN
                    </button>
                </main>
            </div>
        </div>
    );
}
