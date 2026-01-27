import { useState, useRef, useEffect } from 'react';

interface Option {
    id: string;
    name: string;
    subText?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    required?: boolean;
}

export default function SearchableSelect({ options, value, onChange, placeholder = "SEÇİNİZ...", label, required }: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(o => o.id === value);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative w-full" ref={wrapperRef}>
            {label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 mb-2 block">{label}</label>}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`premium-input h-14 flex items-center justify-between cursor-pointer group hover:border-indigo-500/50 ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-600/20' : ''}`}
            >
                <div className="flex flex-col">
                    <span className={selectedOption ? "text-white font-black text-sm tracking-tight" : "text-slate-600 font-bold text-sm"}>
                        {selectedOption ? selectedOption.name.toUpperCase() : placeholder}
                    </span>
                    {selectedOption?.subText && <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{selectedOption.subText}</span>}
                </div>
                <i className={`ri-arrow-down-s-line text-xl transition-all duration-300 ${isOpen ? 'rotate-180 text-indigo-400' : 'text-slate-600'}`}></i>
            </div>

            {isOpen && (
                <div className="absolute z-[150] w-full mt-2 bg-[#020617] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up" style={{ animationDuration: '0.2s' }}>
                    <div className="p-3 border-b border-white/5 bg-white/[0.02]">
                        <div className="relative group">
                            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"></i>
                            <input
                                type="text"
                                autoFocus
                                placeholder="ARAMAK İÇİN YAZIN..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs font-black tracking-widest text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all uppercase"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && filteredOptions.length > 0) {
                                        onChange(filteredOptions[0].id);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar bg-[#020617]">
                        {filteredOptions.length === 0 ? (
                            <div className="p-8 text-center text-slate-600 text-[10px] font-black uppercase tracking-widest italic">Sonuç bulunamadı</div>
                        ) : (
                            filteredOptions.map(option => (
                                <div
                                    key={option.id}
                                    onClick={() => {
                                        onChange(option.id);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className={`px-5 py-4 cursor-pointer hover:bg-indigo-600/[0.15] transition-all flex flex-col gap-1 border-b border-white/[0.02] last:border-0 ${value === option.id ? 'bg-indigo-600/20 border-l-4 border-l-indigo-500' : ''}`}
                                >
                                    <span className="text-xs font-black text-slate-200 tracking-tight">{option.name.toUpperCase()}</span>
                                    {option.subText && <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{option.subText}</span>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Hidden input for form validation if needed */}
            {required && <input type="text" value={value} required readOnly className="opacity-0 absolute h-0 w-0" />}
        </div>
    );
}
