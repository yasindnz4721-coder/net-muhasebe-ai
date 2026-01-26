import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/feature/Sidebar';

export default function PremiumPage() {
    const navigate = useNavigate();

    return (
        <div className="flex bg-[#020617] min-h-screen text-white">
            <Sidebar />
            <main className="flex-1 p-8 md:p-12 overflow-y-auto relative">
                {/* Background Aurora */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6">
                            <i className="ri-vip-crown-2-fill"></i>
                            <span>Net Muhasebe PRO Üyesisiniz</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
                            Tüm Profesyonel Özellikler <br />
                            <span className="bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent">Elinizin Altında.</span>
                        </h1>
                        <p className="text-slate-400 text-lg font-medium max-w-2xl">
                            Kayıt olduğunuz için tüm premium özellikler hesabınıza otomatik olarak tanımlandı. Herhangi bir ek ücret ödemeden tüm yapay zeka araçlarını kullanabilirsiniz.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        {features.map((f, i) => (
                            <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-start gap-4 hover:bg-white/10 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 shrink-0">
                                    <i className="ri-checkbox-circle-fill text-xl"></i>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">{f.title}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-8 rounded-[40px] bg-gradient-to-r from-indigo-600/20 to-blue-600/20 border border-white/10 text-center">
                        <h2 className="text-2xl font-bold mb-4">Yardıma mı ihtiyacınız var?</h2>
                        <p className="text-slate-400 mb-8 max-w-md mx-auto">
                            PRO özelliklerin kullanımı veya teknik konularda destek ekibimize ulaşabilirsiniz.
                        </p>
                        <a href="tel:5347401256" className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20">
                            <i className="ri-phone-fill text-xl"></i>
                            <span>Destek Hattını Ara: 534 740 12 56</span>
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
}

const features = [
    { title: "Yapay Zeka Analizi", desc: "Gelir ve giderlerinizi yapay zeka ile analiz edin, gelecek projeksiyonları çıkarın." },
    { title: "Gelişmiş Raporlama", desc: "Vergi, KDV ve nakit akış tablolarınızı tek tıkla profesyonel PDF formatında indirin." },
    { title: "Sınırsız İşlem", desc: "Fatura, ürün ve cari kayıtlarında hiçbir sınır olmadan çalışın." },
    { title: "Banka Entegrasyonu", desc: "Hale hazırda geliştirilen modüllerle banka hareketlerinizi yakında sitemize bağlayabilirsiniz." }
];

