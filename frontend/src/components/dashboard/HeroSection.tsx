import { Plus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDate } from '../../utils';

interface HeroSectionProps {
  name?: string;
  activeEmployees?: number;
  newThisMonth?: number;
}

export default function HeroSection({ name = 'there', activeEmployees = 0, newThisMonth = 0 }: HeroSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-lg border border-primary/14 bg-[linear-gradient(135deg,rgba(242,169,0,.15),rgba(255,226,100,.05)_48%,rgba(255,255,255,.03))] p-5"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles size={13} />
            People operations live
          </div>
          <h1 className="text-2xl font-semibold text-white">Good to see you, {name}</h1>
          <p className="mt-1 text-sm text-white/42">{formatDate(new Date(), 'EEEE, MMMM do yyyy')}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:min-w-[280px]">
          <div className="rounded-lg bg-black/22 p-3">
            <p className="text-xs text-white/38">Active staff</p>
            <p className="mt-1 text-2xl font-semibold text-white">{activeEmployees}</p>
          </div>
          <div className="rounded-lg bg-primary p-3 text-midnight font-bold">
            <p className="text-xs font-semibold text-black/56">New this month</p>
            <p className="mt-1 text-2xl font-semibold">{newThisMonth}</p>
          </div>
        </div>
      </div>
      <button className="btn-primary mt-5">
        <Plus size={15} />
        Start workflow
      </button>
    </motion.section>
  );
}
