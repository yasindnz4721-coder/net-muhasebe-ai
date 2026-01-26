import { useLocation, useNavigate } from "react-router-dom";

export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] animate-aurora-2"></div>
        <div className="absolute bottom-[20%] right-[20%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[100px] animate-aurora-1"></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto space-y-10">
        <h1 className="text-[12rem] md:text-[18rem] font-black leading-none tracking-tighter text-white/[0.03] select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          404
        </h1>

        <div className="premium-card p-12 md:p-16 relative overflow-hidden backdrop-blur-3xl bg-white/[0.02] border-white/5 shadow-2xl">
          <div className="w-24 h-24 bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-indigo-500/20 shadow-xl shadow-indigo-500/10">
            <i className="ri-ghost-line text-5xl text-indigo-400"></i>
          </div>

          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            Kayıp <span className="text-gradient from-indigo-400 to-purple-500 italic">Veri Bloğu.</span>
          </h2>

          <p className="text-slate-400 text-lg font-medium mb-8 max-w-sm mx-auto leading-relaxed">
            Aradığınız sayfa ağdan kaldırılmış veya henüz sisteme tanımlanmamış olabilir.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="premium-button px-10 h-16 text-[10px] font-black tracking-widest uppercase bg-white/5 border-white/10 hover:bg-white/10"
            >
              <i className="ri-arrow-go-back-line text-xl"></i>
              Geri Dön
            </button>
            <button
              onClick={() => navigate('/')}
              className="premium-button px-10 h-16 text-[10px] font-black tracking-widest uppercase bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 border-indigo-400/30"
            >
              <i className="ri-home-4-line text-xl"></i>
              Ana Sayfa
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 font-mono">ARANAN PATH:</p>
            <code className="text-indigo-400 bg-indigo-500/5 px-4 py-2 rounded-lg text-xs font-mono">{location.pathname}</code>
          </div>
        </div>
      </div>
    </div>
  );
}