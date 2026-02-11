
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PredictionData, PartyColor } from '../types';
import SentimentFeed from './SentimentFeed';

interface PredictorCardProps {
  data: PredictionData;
}

const PartyLogo = ({ party, size = "w-6 h-6", className = "" }: { party: string, size?: string, className?: string }) => {
  const getLogoContent = () => {
    switch (party) {
      case 'Awami League':
        // Boat Icon
        return (
          <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 14C3 14 6 18 12 18C18 18 21 14 21 14" strokeLinecap="round"/>
            <path d="M12 18V4L7 9H12" fill="currentColor" fillOpacity="0.2"/>
            <path d="M5 14H19" strokeLinecap="round"/>
          </svg>
        );
      case 'BNP':
        // Sheaf of Paddy
        return (
          <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22V10M12 10C12 10 9 7 9 4M12 10C12 10 15 7 15 4" strokeLinecap="round"/>
            <path d="M12 15C12 15 8 13 6 10M12 15C12 15 16 13 18 10" strokeLinecap="round"/>
          </svg>
        );
      case 'Jamaat-e-Islami':
        // Scales of Justice
        return (
          <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 3V21M12 7L4 10M12 7L20 10" strokeLinecap="round"/>
            <path d="M4 10L2 16C2 18 4 19 4 19S6 18 6 16L4 10Z" fill="currentColor" fillOpacity="0.2"/>
            <path d="M20 10L18 16C18 18 20 19 20 19S22 18 22 16L20 10Z" fill="currentColor" fillOpacity="0.2"/>
          </svg>
        );
      case 'Jatiya Party':
        // Plough Icon
        return (
          <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 18L10 12L20 12M10 12L8 4M10 12L12 20" strokeLinecap="round"/>
            <path d="M16 12L20 8" strokeLinecap="round"/>
          </svg>
        );
      default:
        return (
          <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8M8 12h8" />
          </svg>
        );
    }
  };

  const getBgColor = () => {
    switch (party) {
      case 'Awami League': return 'bg-emerald-100 text-emerald-800';
      case 'BNP': return 'bg-yellow-100 text-yellow-800';
      case 'Jamaat-e-Islami': return 'bg-teal-100 text-teal-800';
      case 'Jatiya Party': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className={`${size} rounded-full flex items-center justify-center p-1 shadow-sm ${getBgColor()} ${className}`}>
      {getLogoContent()}
    </div>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-3 animate-in fade-in zoom-in duration-200">
        <PartyLogo party={data.party} size="w-10 h-10" />
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{data.party}</p>
          <p className="text-xl font-black text-slate-900">{data.percentage}%</p>
          <p className="text-[10px] text-slate-500 font-medium">Leader: {data.leader}</p>
        </div>
      </div>
    );
  }
  return null;
};

const PredictorCard: React.FC<PredictorCardProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    const shareText = `Bangladesh Election Prediction (Feb 2026):\nLikely PM: ${data.likelyPrimeMinister}\n\n${data.predictions.map(p => `${p.party}: ${p.percentage}%`).join('\n')}\n\nSource: VoteSphere BD`;
    
    if (navigator.share) {
      try {
        const shareData: any = {
          title: 'BD Election Prediction 2026',
          text: shareText,
        };

        const currentUrl = window.location.href;
        if (currentUrl && (currentUrl.startsWith('http://') || currentUrl.startsWith('https://'))) {
          shareData.url = currentUrl;
        }

        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
        copyToClipboard(shareText);
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const renderLegend = (value: string) => (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 ml-2">
      <PartyLogo party={value} size="w-5 h-5" />
      {value}
    </span>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      {/* Prime Minister Spotlight */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 p-8 rounded-3xl text-white shadow-xl shadow-emerald-200 flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-500 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="flex-1 text-center md:text-left z-10">
          <span className="bg-emerald-400/30 text-emerald-50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 inline-block backdrop-blur-sm border border-white/10">
            Projected Prime Minister
          </span>
          <h3 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">
            {data.likelyPrimeMinister}
          </h3>
          <p className="text-emerald-100/80 font-medium">Leading national trends as of Feb 12th Status.</p>
        </div>
        <div className="z-10">
          <PartyLogo 
            party={data.predictions.find(p => data.likelyPrimeMinister.includes(p.leader))?.party || 'Others'} 
            size="w-24 h-24" 
            className="ring-4 ring-white/20 scale-110 md:scale-125 transition-transform duration-1000"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-emerald-600 rounded-full"></span>
            Projected Vote Share
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.predictions}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="percentage"
                  stroke="none"
                  isAnimationActive={true}
                  animationDuration={1500}
                >
                  {data.predictions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} formatter={renderLegend} iconType="none" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
            Strength Comparison
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.predictions}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="party" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="percentage" radius={[10, 10, 0, 0]} barSize={32}>
                  {data.predictions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sentiment Feed */}
      {data.sentimentFeed && <SentimentFeed posts={data.sentimentFeed} />}

      {/* Analysis Section */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative group">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-slate-800">Deep Analysis</h3>
            <div className="w-12 h-1 bg-emerald-500 rounded-full"></div>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-all font-semibold text-sm border border-emerald-100"
          >
            {copied ? 'Copied!' : 'Share Report'}
          </button>
        </div>
        <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">
          {data.analysis}
        </p>
      </div>

      {/* Sources */}
      {data.sources.length > 0 && (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Verified Grounding Sources</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.sources.map((source, idx) => (
              <a 
                key={idx} 
                href={source.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 transition-all group"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </div>
                <span className="text-xs text-slate-700 font-bold truncate">{source.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictorCard;
