import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Building2, Zap, Calendar, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchService } from '../../api';
import { debounce } from '../../utils';

interface CommandPaletteProps {
  onClose: () => void;
}

export default function CommandPalette({ onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = debounce(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const data = await searchService.search(q);
      setResults(data);
    } catch {}
    setLoading(false);
  }, 300);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    doSearch(e.target.value);
  };

  const goTo = (path: string) => {
    navigate(path);
    onClose();
  };

  const hasResults = results && (
    results.employees?.length > 0 ||
    results.departments?.length > 0 ||
    results.skills?.length > 0 ||
    results.leaves?.length > 0
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -20 }}
        transition={{ duration: 0.15 }}
        className="fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 mx-4"
      >
        <div className="rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(10, 15, 30, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          }}>
          {/* Search Input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
            <Search size={18} className="text-white/30 flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={handleInput}
              placeholder="Search employees, departments, skills..."
              className="flex-1 bg-transparent text-white placeholder-white/25 text-base outline-none"
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults(null); }}>
                <X size={16} className="text-white/30 hover:text-white/60 transition-colors" />
              </button>
            )}
            <kbd className="text-xs px-2 py-1 rounded font-mono text-white/20"
              style={{ background: 'rgba(255,255,255,0.05)' }}>ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-[480px] overflow-y-auto p-2">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}

            {!loading && !results && (
              <div className="py-10 text-center">
                <p className="text-sm text-white/20">Type to search across PeopleFlow</p>
                <div className="flex items-center justify-center gap-6 mt-6">
                  {[
                    { icon: Users, label: 'Employees', path: '/employees' },
                    { icon: Building2, label: 'Departments', path: '/departments' },
                    { icon: Zap, label: 'Skills', path: '/skills' },
                    { icon: Calendar, label: 'Leaves', path: '/leaves' },
                  ].map(({ icon: Icon, label, path }) => (
                    <button key={path} onClick={() => goTo(path)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <Icon size={18} className="text-primary" />
                      <span className="text-xs text-white/40">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!loading && results && !hasResults && (
              <div className="py-10 text-center">
                <p className="text-sm text-white/30">No results for "{query}"</p>
              </div>
            )}

            {!loading && hasResults && (
              <div className="space-y-1">
                {results.employees?.length > 0 && (
                  <ResultSection title="Employees" icon={Users}>
                    {results.employees.map((emp: any) => (
                      <ResultItem
                        key={emp.id}
                        onClick={() => goTo(`/employees/${emp.id}`)}
                        primary={`${emp.firstName} ${emp.lastName}`}
                        secondary={emp.designation || emp.employeeCode}
                        avatar={emp.profilePictureUrl}
                        initials={`${emp.firstName?.[0]}${emp.lastName?.[0]}`}
                      />
                    ))}
                  </ResultSection>
                )}

                {results.departments?.length > 0 && (
                  <ResultSection title="Departments" icon={Building2}>
                    {results.departments.map((dept: any) => (
                      <ResultItem
                        key={dept.id}
                        onClick={() => goTo(`/departments/${dept.id}`)}
                        primary={dept.name}
                        secondary={dept.code}
                      />
                    ))}
                  </ResultSection>
                )}

                {results.skills?.length > 0 && (
                  <ResultSection title="Skills" icon={Zap}>
                    {results.skills.map((skill: any) => (
                      <ResultItem
                        key={skill.id}
                        onClick={() => goTo(`/skills`)}
                        primary={skill.name}
                        secondary={skill.description}
                      />
                    ))}
                  </ResultSection>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/5 flex items-center gap-4 text-xs text-white/20">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function ResultSection({ title, icon: Icon, children }: any) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
        <Icon size={12} className="text-white/30" />
        <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  );
}

function ResultItem({ onClick, primary, secondary, avatar, initials }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group"
    >
      {initials ? (
        <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold text-[#001133] overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #FFE264, #F2A900)' }}>
          {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : initials}
        </div>
      ) : (
        <div className="w-8 h-8 rounded-lg flex-shrink-0"
          style={{ background: 'rgba(48, 127, 226, 0.15)' }} />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/80 truncate">{primary}</p>
        {secondary && <p className="text-xs text-white/30 truncate">{secondary}</p>}
      </div>
      <ArrowRight size={14} className="text-white/0 group-hover:text-white/30 transition-colors flex-shrink-0" />
    </button>
  );
}