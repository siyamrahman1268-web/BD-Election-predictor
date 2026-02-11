
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchElectionPrediction } from './geminiService';
import { PredictionData, MockPost, UserFeedback } from './types';
import PredictorCard from './components/PredictorCard';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PredictionData | null>(null);
  const [history, setHistory] = useState<MockPost[]>([]);
  const [error, setError] = useState<{ message: string; type: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [electionDate] = useState("12th February 2026");
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [nextApiUpdate, setNextApiUpdate] = useState(60); // Increased to 60s to avoid 429
  const [isPlaying, setIsPlaying] = useState(true); // Default ON as requested
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastFetchRef = useRef<number>(0);

  // Initialize history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('vbd_sentiment_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    localStorage.setItem('vbd_sentiment_history', JSON.stringify(history.slice(0, 50)));
  }, [history]);

  // Handle default audio play - browser interaction might still be required
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          console.log("Autoplay blocked. Will start on first user click.");
        });
      }
    }
  }, []);

  // Countdown timer - efficient 1s interval
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const diff = endOfDay.getTime() - now.getTime();

      if (diff > 0) {
        setTimeLeft({
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const runPrediction = useCallback(async (isAuto = false) => {
    const now = Date.now();
    // Conservative throttle: 60s for auto-updates to strictly avoid 429 Resource Exhausted
    if (isAuto && now - lastFetchRef.current < 60000) return;

    if (!isAuto && !data) setLoading(true);
    setError(null);
    
    try {
      lastFetchRef.current = now;
      const result = await fetchElectionPrediction(electionDate);
      setData(result);
      setHistory(prev => {
        const newPosts = result.sentimentFeed.filter(np => !prev.some(p => p.content === np.content));
        return [...newPosts, ...prev].slice(0, 50);
      });
      setShowSuccess(true);
      setNextApiUpdate(60);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err: any) {
      console.error("Prediction Error:", err);
      // Only show error on manual trigger; auto-fails are silent to maintain app flow
      if (!isAuto) {
        setError({ 
          message: "The search engine is under heavy load. We have slowed down updates to prevent blocking.", 
          type: "Rate Limit (429)" 
        });
      }
    } finally {
      setLoading(false);
    }
  }, [electionDate, data]);

  // UI Tick every 10s - Visual feedback only, API called every 60s
  useEffect(() => {
    const uiInterval = setInterval(() => {
      setNextApiUpdate(prev => {
        if (prev <= 10) {
          runPrediction(true);
          return 60;
        }
        return prev - 10;
      });

      // Quick visual shuffle for "live" feel without needing new API data
      if (data?.sentimentFeed) {
        setData(prev => {
          if (!prev) return null;
          return { 
            ...prev, 
            sentimentFeed: [...prev.sentimentFeed].sort(() => Math.random() - 0.5) 
          };
        });
      }
    }, 10000); 

    return () => clearInterval(uiInterval);
  }, [runPrediction, data]);

  useEffect(() => {
    runPrediction();
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      <audio 
        ref={audioRef} 
        loop 
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" 
      />

      <div className="bg-slate-900 text-white py-2 px-6 flex justify-between items-center sticky top-0 z-[60] shadow-xl border-b border-emerald-500/30 backdrop-blur-md bg-opacity-95">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              UI Refresh: 10s | Next API: {nextApiUpdate}s
            </span>
          </div>
          <button 
            onClick={toggleMusic}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${isPlaying ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            {isPlaying ? 'Nouka Anthem ON' : 'Nouka Anthem OFF'}
          </button>
        </div>
        <div className="font-mono text-lg font-bold">
           <span className="text-emerald-400">{String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
        </div>
      </div>

      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 py-4 px-6 mb-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <span className="text-white font-bold text-xl italic">V</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">VoteSphere <span className="text-emerald-600">BD</span></h1>
          </div>
          <div className="text-[10px] font-black uppercase text-slate-400">Grounding intelligence • {history.length} Logs</div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 relative">
        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-900 font-bold text-xs tracking-widest uppercase">Optimizing Analysis...</p>
          </div>
        )}

        {error && (
          <div className="bg-white border border-rose-200 p-8 rounded-3xl shadow-xl max-w-2xl mx-auto text-center animate-in slide-in-from-top-4 mb-8">
            <h4 className="text-2xl font-black text-slate-900 mb-2">{error.type}</h4>
            <p className="text-slate-600 mb-8 leading-relaxed">{error.message}</p>
            <button 
              onClick={() => runPrediction()} 
              className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
            >
              Retry Manual Scan
            </button>
          </div>
        )}

        {data && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-10">
            {/* Cleaned up bar - Overlapping text removed per request */}
            <div className="flex items-center justify-between p-3 px-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
              <div className="flex items-center gap-3">
                 <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Live Pulse Scanning</span>
              </div>
              <span className="text-slate-400 font-mono text-[10px]">{data.timestamp}</span>
            </div>

            <PredictorCard data={data} />

            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Recent Sentiment Archive</h3>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{history.length} Saved Snapshots</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {history.slice(0, 9).map((post, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[8px] font-bold uppercase text-slate-400">{post.username}</span>
                      <span className={`text-[8px] font-black uppercase px-1 py-0.5 rounded ${
                        post.sentiment === 'pro-al' ? 'bg-emerald-50 text-emerald-600' :
                        post.sentiment === 'pro-bnp' ? 'bg-yellow-50 text-yellow-600' :
                        'bg-teal-50 text-teal-600'
                      }`}>{post.sentiment.replace('pro-', '')}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed italic line-clamp-2">"{post.content}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-6 left-6 z-[100]">
        <div 
          onClick={toggleMusic}
          className={`p-3 pr-5 rounded-2xl shadow-2xl flex items-center gap-4 cursor-pointer transition-all hover:scale-105 active:scale-95 ${isPlaying ? 'bg-emerald-600' : 'bg-slate-800'}`}
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            {isPlaying ? (
              <div className="flex gap-1 items-end h-3">
                <div className="w-1 bg-white animate-[bounce_0.6s_infinite] h-1.5"></div>
                <div className="w-1 bg-white animate-[bounce_0.8s_infinite] h-3"></div>
                <div className="w-1 bg-white animate-[bounce_0.7s_infinite] h-2"></div>
              </div>
            ) : (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </div>
          <div className="text-white">
            <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Rally Anthem</p>
            <p className="text-xs font-bold truncate max-w-[150px]">Joy Bangla Jitbe Eibar Nouka</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
