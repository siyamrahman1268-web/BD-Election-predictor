
import React, { useState } from 'react';
import { MockPost } from '../types';

interface SentimentFeedProps {
  posts: MockPost[];
}

const SentimentFeed: React.FC<SentimentFeedProps> = ({ posts }) => {
  const [voted, setVoted] = useState<Record<string, string>>({});

  const handleFeedback = (post: MockPost, type: 'positive' | 'negative') => {
    const feedbackId = `${post.username}-${post.timestamp}`;
    if (voted[feedbackId]) return;

    const feedbackEntry = {
      id: Math.random().toString(36).substr(2, 9),
      postId: feedbackId,
      type: type,
      content: post.content,
      sentiment: post.sentiment,
      timestamp: new Date().toISOString()
    };

    // Simulate Cloud Save
    const existingFeedback = JSON.parse(localStorage.getItem('vbd_cloud_feedback') || '[]');
    localStorage.setItem('vbd_cloud_feedback', JSON.stringify([feedbackEntry, ...existingFeedback]));
    
    setVoted(prev => ({ ...prev, [feedbackId]: type }));

    console.log(`Cloud Telemetry: Feedback saved to simulated endpoint.`, feedbackEntry);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
          Live Sentiment Evidence
        </h3>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-md">
            Cloud Sync Active
          </span>
          <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-md animate-pulse">
            Live
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {posts.map((post, idx) => {
          const feedbackId = `${post.username}-${post.timestamp}`;
          const currentVote = voted[feedbackId];

          return (
            <div 
              key={idx} 
              className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all animate-in slide-in-from-bottom-2 fade-in relative group"
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs uppercase">
                    {post.username.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{post.username}</p>
                    <p className="text-[10px] text-slate-400 font-medium capitalize">{post.platform}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {post.platform === 'facebook' ? (
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-snug italic mb-4">"{post.content}"</p>
              <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                     post.sentiment === 'pro-al' ? 'bg-emerald-50 text-emerald-600' :
                     post.sentiment === 'pro-bnp' ? 'bg-yellow-50 text-yellow-600' :
                     post.sentiment === 'pro-jam' ? 'bg-teal-50 text-teal-600' :
                     'bg-slate-50 text-slate-500'
                   }`}>
                     {post.sentiment.replace('pro-', '')} Tone
                   </span>
                   <span className="text-[10px] text-slate-400 font-bold">{post.timestamp}</span>
                 </div>
                 
                 <div className="flex items-center gap-1.5">
                   <button 
                    onClick={() => handleFeedback(post, 'positive')}
                    disabled={!!currentVote}
                    className={`p-1.5 rounded-lg transition-colors ${currentVote === 'positive' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-300 hover:bg-emerald-50 hover:text-emerald-500'}`}
                    title="Accurate Analysis"
                   >
                     <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 10h4.708C19.746 10 20.5 10.74 20.5 11.656a.656.656 0 01-.1.34L18 19.344A1.656 1.656 0 0116.608 20H8.5V10l3.852-5.778a1.5 1.5 0 012.148.514L14 10zM3 20v-8a1 1 0 011-1h2.5a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1z" />
                     </svg>
                   </button>
                   <button 
                    onClick={() => handleFeedback(post, 'negative')}
                    disabled={!!currentVote}
                    className={`p-1.5 rounded-lg transition-colors ${currentVote === 'negative' ? 'bg-rose-100 text-rose-600' : 'text-slate-300 hover:bg-rose-50 hover:text-rose-500'}`}
                    title="Inaccurate Analysis"
                   >
                     <svg className="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 10h4.708C19.746 10 20.5 10.74 20.5 11.656a.656.656 0 01-.1.34L18 19.344A1.656 1.656 0 0116.608 20H8.5V10l3.852-5.778a1.5 1.5 0 012.148.514L14 10zM3 20v-8a1 1 0 011-1h2.5a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1z" />
                     </svg>
                   </button>
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SentimentFeed;
