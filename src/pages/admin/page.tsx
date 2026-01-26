import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { admin as adminApi, User } from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import Header from '../../components/feature/Header';
import Sidebar from '../../components/feature/Sidebar';

interface AdminUser extends User {
    company_name?: string;
}

export default function AdminPanel() {
    const { isAdmin } = useProfile();
    const navigate = useNavigate();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isAdmin) {
            loadData();
        }
    }, [isAdmin]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersRes, statsRes] = await Promise.all([
                adminApi.getUsers(),
                adminApi.getStats()
            ]);
            setUsers(usersRes.data || []);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Admin verileri yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6 text-center">
                <div className="premium-card p-12 max-w-md animate-slide-up">
                    <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                        <i className="ri-lock-password-line text-4xl text-rose-500"></i>
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Erişim Engellendi</h3>
                    <p className="text-slate-400 font-medium mb-8">Bu alana erişim yetkiniz bulunmamaktadır. Lütfen yönetici hesabınızla giriş yapın.</p>
                    <button onClick={() => navigate('/')} className="premium-button px-10 h-14 text-xs tracking-widest uppercase bg-indigo-600">DASHBOARD'A DÖN</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden relative text-xs">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] animate-aurora-1"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[100px] animate-aurora-2"></div>
            </div>

            <div className="flex relative z-10">
                <Sidebar mbOpen={false} setMbOpen={() => { }} />

                <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
                    <Header onMenuClick={() => { }} />

                    <main className="flex-1 p-6 md:p-10 space-y-10 animate-fade-in">
                        {/* Header Section */}
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest">
                                    <i className="ri-shield-user-line"></i>
                                    <span>SYSTEM ADMINISTRATION CENTER</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                                    Yönetim <span className="text-gradient from-purple-400 to-indigo-500 italic">Paneli.</span>
                                </h1>
                                <p className="text-slate-500 text-lg font-medium max-w-xl">Sistem geneli kullanıcı takibi, şirket istatistikleri ve platform sağlığını buradan izleyin.</p>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={loadData} className="premium-button px-8 h-16 text-[10px] uppercase tracking-widest bg-white/5 border-white/10 hover:bg-white/10">
                                    <i className="ri-refresh-line text-xl"></i>
                                    <span>VERİLERİ TAZELE</span>
                                </button>
                            </div>
                        </div>

                        {/* Admin Stats */}
                        {stats && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="premium-card p-10 bg-gradient-to-br from-indigo-500/5 to-transparent border-indigo-500/10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                                            <i className="ri-group-line text-2xl"></i>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TOPLAM KULLANICI</span>
                                    </div>
                                    <div className="text-4xl font-black tracking-tighter text-slate-200">{stats.users}</div>
                                </div>
                                <div className="premium-card p-10 bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400">
                                            <i className="ri-building-line text-2xl"></i>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AKTİF ŞİRKETLER</span>
                                    </div>
                                    <div className="text-4xl font-black tracking-tighter text-slate-200">{stats.profiles}</div>
                                </div>
                                <div className="premium-card p-10 bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
                                            <i className="ri-file-list-3-line text-2xl"></i>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SİSTEM GENELİ FATURA</span>
                                    </div>
                                    <div className="text-4xl font-black tracking-tighter text-slate-200">{stats.totalInvoices}</div>
                                </div>
                            </div>
                        )}

                        {/* Users Table */}
                        <div className="premium-card overflow-hidden">
                            <div className="p-10 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.01]">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Kullanıcı Listesi</h2>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SİSTEME KAYITLI TÜM AKTİF HESAPLAR</p>
                                </div>
                                <div className="relative w-full md:w-80 group">
                                    <i className="ri-search-line absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors text-lg"></i>
                                    <input
                                        type="text"
                                        placeholder="E-POSTA VEYA ŞİRKET ARA..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl pl-16 pr-6 text-[10px] font-black uppercase tracking-widest focus:bg-white/[0.07] focus:border-purple-500/50 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {loading ? (
                                <div className="p-24 text-center">
                                    <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-slate-500 font-black text-[10px] tracking-widest uppercase">VERİLER ANALİZ EDİLİYOR...</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-white/5">
                                                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">KULLANICI BİLGİLERİ</th>
                                                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">AKTİF ŞİRKET</th>
                                                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">ROL</th>
                                                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">KAYIT TARİHİ</th>
                                                <th className="px-10 py-6 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">STATÜ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredUsers.map((user) => (
                                                <tr key={user.id} className="hover:bg-white/[0.01] transition-colors group">
                                                    <td className="px-10 py-8">
                                                        <div className="font-black text-slate-200 uppercase tracking-tight italic">{user.email}</div>
                                                        <div className="text-[8px] font-mono text-slate-500 mt-1 uppercase tracking-widest">ID: {user.id}</div>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <div className="font-bold text-slate-400 uppercase tracking-wider">
                                                            {user.company_name || <span className="opacity-30 italic">Profil Oluşturulmamış</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <span className={`px-4 py-2 rounded-xl text-[8px] font-black tracking-[0.2em] uppercase border ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                            }`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                                                        {user.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </td>
                                                    <td className="px-10 py-8 text-center">
                                                        <span className={`inline-block px-4 py-2 rounded-lg text-[8px] font-black tracking-widest uppercase border ${user.subscription_tier === 'pro' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-slate-500 border-white/5'
                                                            }`}>
                                                            {user.subscription_tier === 'pro' ? 'PREMIUM PRO AI' : 'STANDARD'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
