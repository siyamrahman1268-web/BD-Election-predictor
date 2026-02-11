
import React, { useState, memo } from 'react';
import { MockPost } from '../types';

interface SentimentFeedProps {
  posts: MockPost[];
}

const SentimentFeed: React.FC<SentimentFeedProps> = ({ posts }) => {
  const [voted, setVoted] = useState<Record<string, string>>({});

  const handleFeedback = (post: MockPost, type: 'positive' | 'negative') => {
    const feedbackId = `${post.username}-${post.timestamp}`;
    if (voted[feedbackId]) return;
    setVoted(prev => ({ ...prev, [feedbackId]: type }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-3 bg-blue-500 rounded-full"></span>
          Sentiment Pulse
        </h3>
        <span className="text-[9px] font-bold text-slate-400">CLOUDSYNC ACTIVE</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {posts.map((post, idx) => {
          const feedbackId = `${post.username}-${post.timestamp}`;
          const currentVote = voted[feedbackId];

          return (
            <div key={idx} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-[10px] uppercase">
                    {post.username.charAt(0)}
                  </div>
                  <span className="text-[10px] font-bold text-slate-800">{post.username}</span>
                </div>
                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                  post.sentiment === 'pro-al' ? 'bg-emerald-50 text-emerald-600' :
                  post.sentiment === 'pro-bnp' ? 'bg-yellow-50 text-yellow-600' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {post.sentiment.replace('pro-', '')}
                </span>
              </div>
              <p className="text-xs text-slate-600 italic mb-2">"{post.content}"</p>
              <div className="flex items-center justify-end gap-1">
                 <button 
                  onClick={() => handleFeedback(post, 'positive')}
                  className={`p-1 rounded transition-colors ${currentVote === 'positive' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300 hover:text-emerald-500'}`}
                 >
                   <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/></svg>
                 </button>
                 <button 
                  onClick={() => handleFeedback(post, 'negative')}
                  className={`p-1 rounded transition-colors ${currentVote === 'negative' ? 'text-rose-600 bg-rose-50' : 'text-slate-300 hover:text-rose-500'}`}
                 >
                   <svg className="w-3 h-3 rotate-180" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/></svg>
                 </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default memo(SentimentFeed);
