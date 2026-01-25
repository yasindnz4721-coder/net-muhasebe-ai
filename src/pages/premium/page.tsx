import { useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import Sidebar from '../../components/feature/Sidebar';
import { useProfile } from '../../contexts/ProfileContext';

export default function PremiumPage() {
    const navigate = useNavigate();
    const { isPro, togglePro } = useProfile();

    const handleUpgrade = (plan: string) => {
        if (isPro) {
            alert('Zaten Pro üyesisiniz! Desteğiniz için teşekkürler.');
            return;
        }
        togglePro();
        alert(`${plan} plana geçiş işlemi başarılı! Pro özellikleriniz aktif edildi.`);
        navigate('/');
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
                    <div className="max-w-5xl mx-auto text-center mb-12">
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 bg-gradient-to-r from-teal-600 to-indigo-600 bg-clip-text text-transparent">
                            İşletmenizi Pro ile Büyütün
                        </h1>
                        <p className="text-xl text-gray-600">
                            Tüm finansal kontrolü elinize alın, sınırsız özelliklerin keyfini çıkarın.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Monthly Plan */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-100 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4">
                                <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
                                    <i className="ri-calendar-line text-2xl"></i>
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aylık Pro</h3>
                            <p className="text-gray-500 mb-6">Her ay esnek ödeme</p>
                            <div className="mb-8">
                                <span className="text-5xl font-black text-gray-900">1.200 ₺</span>
                                <span className="text-gray-500"> / ay</span>
                            </div>

                            <ul className="space-y-4 mb-8 text-left">
                                {features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <i className="ri-checkbox-circle-fill text-teal-500 text-xl"></i>
                                        <span className="text-gray-700">{f}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleUpgrade('Aylık')}
                                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors shadow-lg cursor-pointer"
                            >
                                Hemen Başlat
                            </button>
                        </div>

                        {/* Yearly Plan */}
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-2xl hover:scale-[1.02] transition-all relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                            <div className="absolute top-0 right-0 p-4">
                                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-white/30">
                                    En Popüler
                                </span>
                            </div>

                            <h3 className="text-2xl font-bold mb-2">Yıllık Pro</h3>
                            <p className="opacity-80 mb-6">Yıllık ödeme ile tasarruf edin</p>
                            <div className="mb-8">
                                <span className="text-5xl font-black">10.000 ₺</span>
                                <span className="opacity-70"> / yıl</span>
                            </div>

                            <ul className="space-y-4 mb-8 text-left">
                                {features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <i className="ri-checkbox-circle-fill text-white/40 text-xl"></i>
                                        <span className="text-white">{f}</span>
                                    </li>
                                ))}
                                <li className="flex items-center gap-3">
                                    <i className="ri-star-fill text-yellow-400 text-xl"></i>
                                    <span className="text-white font-bold">%30'dan fazla tasarruf</span>
                                </li>
                            </ul>

                            <button
                                onClick={() => handleUpgrade('Yıllık')}
                                className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-bold hover:bg-gray-100 transition-colors shadow-xl cursor-pointer"
                            >
                                Yıllık Planla Yükselt
                            </button>
                        </div>
                    </div>

                    <div className="mt-16 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-8">Neden Pro'ya Geçmelisiniz?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            <div className="p-6">
                                <i className="ri-bar-chart-box-line text-4xl text-teal-600 mb-4 inline-block"></i>
                                <h4 className="font-bold mb-2 text-gray-900">Karar Destek Sistemi</h4>
                                <p className="text-sm text-gray-500">Yapay zeka verilerinizi analiz ederek en karlı yatırım zamanlamasını size söyler.</p>
                            </div>
                            <div className="p-6">
                                <i className="ri-safe-line text-4xl text-indigo-600 mb-4 inline-block"></i>
                                <h4 className="font-bold mb-2 text-gray-900">Risk Yönetimi</h4>
                                <p className="text-sm text-gray-500">Nakit akışınızdaki darboğazları 3 ay önceden tespit ederek uyarır.</p>
                            </div>
                            <div className="p-6">
                                <i className="ri-global-line text-4xl text-purple-600 mb-4 inline-block"></i>
                                <h4 className="font-bold mb-2 text-gray-900">Üretim ve Stok Takibi</h4>
                                <p className="text-sm text-gray-500">Günlük üretim girişleri ve detaylı stok analizleri ile maliyetlerinizi kontrol edin.</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/')}
                        className="mt-12 text-gray-500 hover:text-gray-800 transition-colors underline cursor-pointer"
                    >
                        Dashboard'a Geri Dön
                    </button>
                </main>
            </div>
        </div>
    );
}

const features = [
    "Yapay Zeka Destekli Nakit Tahmini",
    "Gelişmiş Üretim & Stok Takip Sistemi",
    "Otomatik Banka Entegrasyonu",
    "Detaylı Vergi Planlama Öngörüsü",
    "7/24 Öncelikli Teknik Destek"
];
