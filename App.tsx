
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { fetchElectionPrediction } from './geminiService';
import { PredictionData, MockPost } from './types';
import PredictorCard from './components/PredictorCard';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

const DEFAULT_SYNC_INTERVAL = 180; // 3 minutes for safer rate limits
const BACKOFF_SYNC_INTERVAL = 300; // 5 minutes on error

const MemoizedPredictorCard = memo(PredictorCard);

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PredictionData | null>(null);
  const [history, setHistory] = useState<MockPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [nextApiUpdate, setNextApiUpdate] = useState(DEFAULT_SYNC_INTERVAL); 
  const [isPlaying, setIsPlaying] = useState(true); 
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  
  const playerRef = useRef<any>(null);
  const lastFetchRef = useRef<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem('vbd_sentiment_history');
    if (saved) setHistory(JSON.parse(saved));

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '0', width: '0', videoId: '2lH1WEGZoD8',
        playerVars: { autoplay: 1, loop: 1, controls: 0, playlist: '2lH1WEGZoD8' },
        events: { onReady: (e: any) => isPlaying && e.target.playVideo() }
      });
    };
  }, []);

  const runPrediction = useCallback(async (isAuto = false) => {
    const now = Date.now();
    // Prevent overlapping requests
    if (loading) return;
    // Debounce/Throttle: Ensure at least 60s between any request
    if (now - lastFetchRef.current < 60000) return;

    if (!isAuto && !data) setLoading(true);
    setError(null);
    
    try {
      lastFetchRef.current = now;
      const result = await fetchElectionPrediction("12th February 2026");
      setData(result);
      setIsCoolingDown(false);
      setHistory(prev => {
        const newPosts = result.sentimentFeed.filter(np => !prev.some(p => p.content === np.content));
        const merged = [...newPosts, ...prev].slice(0, 20);
        localStorage.setItem('vbd_sentiment_history', JSON.stringify(merged));
        return merged;
      });
      setNextApiUpdate(DEFAULT_SYNC_INTERVAL);
    } catch (err: any) {
      console.error("Fetch failed:", err);
      const isRateLimit = err.message?.includes("429") || err.message?.includes("quota");
      
      if (isRateLimit) {
        setIsCoolingDown(true);
        setNextApiUpdate(BACKOFF_SYNC_INTERVAL);
        setError("Rate limit reached. Entering cool-down mode to protect API quota.");
      } else {
        setError("Failed to fetch latest data. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }, [data, loading]);

  useEffect(() => {
    const uiInterval = setInterval(() => {
      setNextApiUpdate(p => {
        if (p <= 1) { 
          runPrediction(true); 
          return isCoolingDown ? BACKOFF_SYNC_INTERVAL : DEFAULT_SYNC_INTERVAL; 
        }
        return p - 1;
      });
    }, 1000); 
    return () => clearInterval(uiInterval);
  }, [runPrediction, isCoolingDown]);

  useEffect(() => { 
    // Initial fetch
    runPrediction(); 
  }, []);

  const toggleMusic = () => {
    if (!playerRef.current) return;
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen pb-10 overflow-x-hidden bg-slate-50 antialiased">
      <div id="youtube-player" className="hidden"></div>

      <div className={`py-2 px-6 flex justify-between items-center sticky top-0 z-50 shadow-md transition-colors duration-500 ${isCoolingDown ? 'bg-amber-600 text-white' : 'bg-slate-900 text-white'}`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${isCoolingDown ? 'bg-white' : 'bg-emerald-500'}`}></span>
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {isCoolingDown ? `COOL-DOWN: ${nextApiUpdate}S` : `SYNC: ${nextApiUpdate}S`}
            </span>
          </div>
          <button onClick={toggleMusic} className={`text-[10px] font-black px-2 py-1 rounded border uppercase transition-colors ${isCoolingDown ? 'bg-white/20 border-white/40 text-white' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
            {isPlaying ? 'Audio On' : 'Audio Off'}
          </button>
        </div>
        <div className="font-mono text-xs font-bold opacity-80">{new Date().toLocaleTimeString()}</div>
      </div>

      <nav className="bg-white border-b border-slate-200 py-3 px-6 mb-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center shadow-lg">
              <span className="text-white font-black">V</span>
            </div>
            <h1 className="font-bold text-slate-900">VoteSphere<span className="text-emerald-600">BD</span></h1>
          </div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Election Predictor 2026</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6">
        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Analyzing Social Pulse...</p>
          </div>
        )}

        {error && (
          <div className={`p-4 rounded-xl text-center mb-6 border ${isCoolingDown ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
            <p className="text-xs font-bold mb-3">{error}</p>
            {!isCoolingDown && (
              <button onClick={() => runPrediction()} className="text-[10px] font-bold px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                Retry Manually
              </button>
            )}
            {isCoolingDown && (
              <p className="text-[10px] opacity-75 italic">System will resume automatically once the cool-down period ends.</p>
            )}
          </div>
        )}

        {data && (
          <div className="space-y-6 animate-in fade-in duration-700">
            <MemoizedPredictorCard data={data} />

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Sentiment Stream</h3>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[8px] font-bold text-emerald-600">LIVE</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {history.slice(0, 4).map((post, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-[11px] transition-all hover:bg-white hover:shadow-md">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold">{post.username.charAt(0)}</span>
                        <span className="font-bold text-slate-700">{post.username}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${post.sentiment === 'pro-al' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        {post.sentiment.replace('pro-', '')}
                      </span>
                    </div>
                    <p className="text-slate-600 italic leading-relaxed">"{post.content}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6 z-50">
        <div onClick={toggleMusic} className={`p-3 pr-5 rounded-2xl shadow-2xl flex items-center gap-4 cursor-pointer transition-all hover:scale-105 active:scale-95 ${isPlaying ? 'bg-emerald-600' : 'bg-slate-800'}`}>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            {isPlaying ? (
              <div className="flex gap-1 items-end h-3">
                <div className="w-1 bg-white animate-pulse h-1.5"></div>
                <div className="w-1 bg-white animate-pulse h-3"></div>
                <div className="w-1 bg-white animate-pulse h-2"></div>
              </div>
            ) : <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
          </div>
          <div className="text-white">
            <p className="text-[9px] font-black opacity-70 uppercase tracking-widest">Nouka Anthem</p>
            <p className="text-[11px] font-bold">Joy Bangla Jitbe</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
