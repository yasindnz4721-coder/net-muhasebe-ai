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
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        email: '',
        password: '',
        companyName: ''
    });
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');

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

    const handleApprove = async (userId: string) => {
        if (!confirm('Bu kullanıcıyı onaylamak istediğinize emin misiniz?')) return;
        try {
            const { error } = await adminApi.approveUser(userId);
            if (error) {
                console.error(error);
                return;
            }
            console.log('Kullanıcı onaylandı!');
            loadData();
        } catch (err) {
            console.error('Onay hatası:', err);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('DİKKAT! Bu kullanıcıyı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
        try {
            const { error } = await adminApi.deleteUser(userId);
            if (error) {
                console.error(error);
                return;
            }
            console.log('Kullanıcı başarıyla silindi!');
            loadData();
        } catch (err) {
            console.error('Silme hatası:', err);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError('');
        setCreateLoading(true);

        try {
            const { error } = await adminApi.createUser(createFormData);
            if (error) {
                setCreateError(error);
                return;
            }
            setShowCreateModal(false);
            setCreateFormData({ email: '', password: '', companyName: '' });
            loadData();
        } catch (err: any) {
            setCreateError('Beklenmeyen bir hata oluştu.');
        } finally {
            setCreateLoading(false);
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
                <Sidebar />

                <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
                    <Header />

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
                                <button onClick={() => setShowCreateModal(true)} className="premium-button px-8 h-16 text-[10px] tracking-widest uppercase bg-indigo-600 shadow-xl shadow-indigo-600/20">
                                    <i className="ri-user-add-line text-xl"></i>
                                    <span>YENİ KULLANICI OLUŞTUR</span>
                                </button>
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
                                                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">KALAN GÜN</th>
                                                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">ÖDEME YOLU</th>
                                                <th className="px-10 py-6 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">İŞLEM</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredUsers.map((user) => {
                                                const createdAt = user.created_at ? new Date(user.created_at) : new Date();
                                                const now = new Date();
                                                const diffTime = now.getTime() - createdAt.getTime();
                                                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                                const remainingDays = Math.max(0, 14 - diffDays);

                                                return (
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
                                                            {user.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                                                        </td>
                                                        <td className="px-10 py-8">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${remainingDays > 5 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse'}`}>
                                                                    {remainingDays}
                                                                </div>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GÜN</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-8">
                                                            <div className="flex flex-col gap-2">
                                                                <span className={`inline-block px-3 py-1 rounded-lg text-[8px] font-black tracking-widest uppercase border ${user.payment_method === 'eft' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                                                    {user.payment_method === 'eft' ? 'EFT / HAVALE' : 'KREDİ KARTI'}
                                                                </span>
                                                                <span className={`inline-block px-3 py-1 rounded-lg text-[8px] font-black tracking-widest uppercase border ${user.is_approved ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                                                    {user.is_approved ? 'ONAYLI' : 'ONAY BEKLİYOR'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-8 text-center">
                                                            <div className="flex items-center justify-center gap-3">
                                                                {!user.is_approved ? (
                                                                    <button
                                                                        onClick={() => handleApprove(user.id)}
                                                                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20"
                                                                    >
                                                                        ONAYLA
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">AKTİF</span>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDelete(user.id)}
                                                                    className="px-6 py-2 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                                    title="Kullanıcıyı Sil"
                                                                >
                                                                    SİL
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {/* Yeni Kullanıcı Oluştur Modalı */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-md animate-fade-in">
                    <div className="premium-card w-full max-w-lg p-10 relative overflow-hidden animate-slide-up">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl"></div>

                        <div className="flex items-center justify-between mb-10">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black uppercase tracking-tight">Yeni Kullanıcı Hesabı</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SİSTEME MANUEL KAYIT EKLE</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                                <i className="ri-close-line text-2xl"></i>
                            </button>
                        </div>

                        {createError && (
                            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase mb-6 flex items-center gap-3">
                                <i className="ri-error-warning-line text-lg"></i>
                                {createError}
                            </div>
                        )}

                        <form onSubmit={handleCreateUser} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">E-POSTA ADRESİ</label>
                                <input
                                    type="email"
                                    required
                                    value={createFormData.email}
                                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                                    className="premium-input h-14"
                                    placeholder="ornek@sirket.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">GİRİŞ ŞİFRESİ</label>
                                <input
                                    type="password"
                                    required
                                    value={createFormData.password}
                                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                                    className="premium-input h-14"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">ŞİRKET ADI (OPSİYONEL)</label>
                                <input
                                    type="text"
                                    value={createFormData.companyName}
                                    onChange={(e) => setCreateFormData({ ...createFormData, companyName: e.target.value })}
                                    className="premium-input h-14"
                                    placeholder="Global Bilişim Ltd."
                                />
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    className="premium-button w-full h-16 bg-indigo-600 shadow-xl shadow-indigo-600/20 text-[10px] tracking-[0.2em]"
                                >
                                    {createLoading ? (
                                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>HESABI OLUŞTUR VE ONAYLA</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
