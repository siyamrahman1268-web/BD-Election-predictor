
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
  const [nextApiUpdate, setNextApiUpdate] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastFetchRef = useRef<number>(0);

  // Initialize history and feedback from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('vbd_sentiment_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    localStorage.setItem('vbd_sentiment_history', JSON.stringify(history.slice(0, 50)));
  }, [history]);

  // Countdown timer
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
    if (isAuto && now - lastFetchRef.current < 20000) return;

    if (!isAuto && !data) setLoading(true);
    setError(null);
    setShowSuccess(false);
    
    try {
      lastFetchRef.current = now;
      const result = await fetchElectionPrediction(electionDate);
      setData(result);
      setHistory(prev => {
        const newPosts = result.sentimentFeed.filter(np => !prev.some(p => p.content === np.content));
        return [...newPosts, ...prev].slice(0, 50);
      });
      setShowSuccess(true);
      setNextApiUpdate(30);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err: any) {
      console.error("Prediction Error:", err);
      if (!isAuto) {
        setError({ 
          message: "The search engine is hitting capacity. Slowing down updates.", 
          type: "Rate Limit (429)" 
        });
      }
    } finally {
      setLoading(false);
    }
  }, [electionDate, data]);

  // UI Tick every 10 seconds (per user request)
  useEffect(() => {
    const uiInterval = setInterval(() => {
      setNextApiUpdate(prev => {
        if (prev <= 10) {
          runPrediction(true);
          return 30;
        }
        return prev - 10;
      });

      if (data && data.sentimentFeed) {
        setData(prev => {
          if (!prev) return null;
          const shuffled = [...prev.sentimentFeed].sort(() => Math.random() - 0.5);
          return { ...prev, sentimentFeed: shuffled };
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
      audioRef.current.play().catch(() => alert("Click again to enable audio"));
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Background Music Handler */}
      <audio 
        ref={audioRef} 
        loop 
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" // Placeholder for high-energy political beat
      />

      <div className="bg-slate-900 text-white py-2 px-6 flex justify-between items-center sticky top-0 z-[60] shadow-xl border-b border-emerald-500/30 backdrop-blur-md bg-opacity-95">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Update Cycle: 10s | Next API Sync: {nextApiUpdate}s
            </span>
          </div>
          <button 
            onClick={toggleMusic}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${isPlaying ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            {isPlaying ? 'Rally Mode ON' : 'Rally Mode OFF'}
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
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">VoteSphere <span className="text-emerald-600">Archive</span></h1>
          </div>
          <div className="text-[10px] font-black uppercase text-slate-400">Grounding Intelligence • {history.length} Events Logged</div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 relative">
        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-900 font-bold">Connecting to Digital Bangladesh...</p>
          </div>
        )}

        {data && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 space-y-12">
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
              <div className="flex items-center gap-3">
                 <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                 <span className="text-xs font-black uppercase tracking-widest text-slate-500">Live: Scanning Trends</span>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 flex gap-8 items-center h-full pointer-events-none opacity-20 whitespace-nowrap overflow-hidden">
                {history.slice(0, 5).map((p, i) => (
                  <span key={i} className="text-[10px] font-bold text-slate-900 uppercase">Snapshot: {p.content.slice(0, 20)}...</span>
                ))}
              </div>
              <span className="text-slate-400 font-mono text-[10px]">{data.timestamp}</span>
            </div>

            <PredictorCard data={data} />

            {/* History Archive Ticker */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">Sentiment History Archive</h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase">{history.length} Logs Stored in Cloud-Sim</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.slice(0, 12).map((post, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-bold uppercase text-slate-400">{post.username}</span>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                        post.sentiment === 'pro-al' ? 'bg-emerald-50 text-emerald-600' :
                        post.sentiment === 'pro-bnp' ? 'bg-yellow-50 text-yellow-600' :
                        'bg-teal-50 text-teal-600'
                      }`}>{post.sentiment.replace('pro-', '')}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-2">"{post.content}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Audio Playback Controls for the 'Viral Songs' */}
      <div className="fixed bottom-6 left-6 z-[100] animate-bounce-slow">
        <div className={`p-4 rounded-2xl shadow-2xl flex items-center gap-4 transition-all ${isPlaying ? 'bg-emerald-600' : 'bg-slate-800'}`}>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <svg className={`w-6 h-6 text-white ${isPlaying ? 'animate-spin-slow' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
          </div>
          <div className="text-white">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Playing Political Anthem</p>
            <p className="text-xs font-bold truncate w-32">Viral Rally Beats BD</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
