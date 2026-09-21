import { useEffect, useState } from 'react';
import { api, compact } from '../lib/signal-api';

const items = [
  { label: 'Total Allocated', key: 'totalAllocated', prefix: '₹', suffix: ' Cr' },
  { label: 'Active MPs', key: 'totalMps', prefix: '', suffix: ' MPs' },
  { label: 'Works Recommended', key: 'recommended', prefix: '', suffix: '' },
  { label: 'Works Sanctioned', key: 'sanctioned', prefix: '', suffix: '' },
  { label: 'Works Completed', key: 'completed', prefix: '', suffix: '' },
  { label: 'Calamity Relief', key: 'calamity', prefix: '₹', suffix: ' Cr' },
  { label: 'Anomaly Model', key: 'model', prefix: '', suffix: '' },
];

export default function KpiMarquee({ house }: { house: 'ALL' | 'LS' | 'RS' }) {
  const [data, setData] = useState<any>({});

  useEffect(() => {
    api.getSummary(house).then(res => {
      setData({
        totalAllocated: res.total_allocated_cr,
        totalMps: res.total_mps,
        recommended: compact(res.works_recommended),
        sanctioned: compact(res.works_sanctioned),
        completed: compact(res.works_completed),
        calamity: res.total_calamity_cr,
        model: res.model_status
      });
    });
  }, [house]);

  return (
    <div className="w-full overflow-hidden bg-obsidian py-4 border-y border-white/10 z-30 relative">
      <div className="flex whitespace-nowrap animate-marquee">
        {[...items, ...items, ...items].map((item, idx) => (
          <div key={idx} className="flex items-center mx-6 liquid-glass px-4 py-2 rounded-lg">
            <span className="text-white text-xs font-bold uppercase tracking-wider mr-3">{item.label}</span>
            <span className="text-emerald-400 font-mono font-bold">
              {item.prefix}{data[item.key] || '...'}{item.suffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
