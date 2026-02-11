
import React, { memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { PredictionData } from '../types';
import SentimentFeed from './SentimentFeed';

const PredictorCard: React.FC<{ data: PredictionData }> = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="bg-emerald-600 p-5 rounded-xl text-white shadow-md border border-emerald-500">
        <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Projected Leader</span>
        <h3 className="text-xl font-black">{data.likelyPrimeMinister}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3">Vote Share</h4>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.predictions} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2} dataKey="percentage" stroke="none" isAnimationActive={false}>
                  {data.predictions.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3">Party Comparison</h4>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.predictions}>
                <XAxis dataKey="party" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 8}} />
                <YAxis hide />
                <Bar dataKey="percentage" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                  {data.predictions.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <SentimentFeed posts={data.sentimentFeed || []} />

      {/* Grounding sources must be listed when using Google Search grounding */}
      {data.sources && data.sources.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Grounding Sources</h4>
          <ul className="space-y-1">
            {data.sources.map((source, idx) => (
              <li key={idx}>
                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-600 hover:underline flex items-center gap-1 font-bold">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Analysis Summary</h4>
        <p className="text-xs text-slate-600 font-medium leading-relaxed">{data.analysis}</p>
      </div>
    </div>
  );
};

export default memo(PredictorCard);
