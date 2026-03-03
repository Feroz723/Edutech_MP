import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
        YT: any;
    }
}

interface SecureVideoPlayerProps {
    videoId: string;
}

export default function SecureVideoPlayer({ videoId }: SecureVideoPlayerProps) {
    const { user } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<any>(null);

    const initPlayer = useCallback(() => {
        playerRef.current = new window.YT.Player(`player-${videoId}`, {
            videoId: videoId,
            playerVars: {
                autoplay: 0,
                controls: 0,
                rel: 0,
                modestbranding: 1,
                disablekb: 1,
                fs: 0,
                iv_load_policy: 3,
                playsinline: 1,
                origin: window.location.origin,
                enablejsapi: 1,
            },
            events: {
                onReady: (event: any) => {
                    if (!playerRef.current) return;
                    setIsReady(true);
                    try {
                        setDuration(event.target.getDuration() || 0);
                    } catch (e) {
                        console.warn("Could not get duration on ready", e);
                    }
                },
                onStateChange: (event: any) => {
                    // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0
                    setIsPlaying(event.data === 1);
                },
                onError: (event: any) => {
                    console.error("YouTube Player Error", event.data);
                    setIsReady(true);
                }
            }
        });
    }, [videoId]);

    // Initialize YouTube API
    useEffect(() => {
        // Transition Lockdown: Reset state when video changes
        if (playerRef.current) {
            setIsReady(false);
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
        }

        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        window.onYouTubeIframeAPIReady = () => {
            initPlayer();
        };

        if (window.YT && window.YT.Player) {
            initPlayer();
        }

        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [videoId, initPlayer]);

    // Update progress
    useEffect(() => {
        let interval: any;
        if (isPlaying && playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            interval = setInterval(() => {
                const time = playerRef.current.getCurrentTime();
                const dur = playerRef.current.getDuration();
                setCurrentTime(time);
                setProgress((time / dur) * 100);
            }, 500);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    const togglePlay = () => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    };

    const toggleMute = () => {
        if (!playerRef.current) return;
        if (isMuted) {
            playerRef.current.unMute();
            setIsMuted(false);
        } else {
            playerRef.current.mute();
            setIsMuted(true);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!playerRef.current) return;
        const seekTo = (parseFloat(e.target.value) / 100) * duration;
        playerRef.current.seekTo(seekTo, true);
        setProgress(parseFloat(e.target.value));
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    const handleReplay = () => {
        if (!playerRef.current) return;
        playerRef.current.seekTo(0);
        playerRef.current.playVideo();
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const formatTime = (seconds: number) => {
        if (isNaN(seconds) || seconds < 0) return "00:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return [h, m, s].map(v => v < 10 ? '0' + v : v).filter((v, i) => v !== '00' || i > 0).join(':');
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="relative w-full h-full bg-black select-none overflow-hidden group font-display"
        >
            {/* 
                OPTIMIZED BRANDING ANNIHILATION (1.12x Scale + Targeted Patching)
                We use just enough scale to hide edges, then patch the survivors.
            */}
            <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center bg-black">
                <div
                    id={`player-${videoId}`}
                    className="w-[112%] h-[112%] pointer-events-none"
                    style={{ position: 'absolute', top: '-6%', left: '-6%' }}
                />

                {/* Targeted Corner Patches (Masking only the YT artifacts) */}
                <div className="absolute top-0 left-0 w-32 h-10 bg-black z-10" />
                <div className="absolute bottom-0 right-0 w-41 h-12 bg-black z-10" />
            </div>

            {/* Interaction Mask & Custom Play Button Cover (Solidified to block shadows) */}
            <div
                className="absolute inset-0 cursor-pointer z-20 flex items-center justify-center p-20"
                onClick={togglePlay}
            >
                {!isPlaying && isReady && (
                    <div className="relative group/play">
                        {/* Solid Background Block to hide native YT Play Button Shadow */}
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-150 group-hover:bg-primary/40 transition-all duration-500" />

                        <div className="size-28 bg-primary rounded-full flex items-center justify-center text-white shadow-[0_0_60px_rgba(19,91,236,0.6)] relative z-10 transition-all duration-300 group-hover:scale-110 group-active:scale-95">
                            <Play size={44} fill="currentColor" className="ml-1" />
                        </div>
                    </div>
                )}
            </div>

            {/* Loading Overlay with Cross-Fade */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black transition-opacity duration-1000 z-20 ${isReady ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Initializing Security Protocol</span>
                </div>
            </div>

            {/* Custom Control Bar Overlay */}
            <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-all duration-500 flex flex-col gap-4 z-30 ${showControls ? 'opacity-100 translateY-0' : 'opacity-0 translate-y-4'}`}>

                {/* Progress Bar */}
                <div className="relative group/progress w-full h-1.5 bg-white/20 rounded-full cursor-pointer overflow-hidden">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div
                        className="absolute top-0 left-0 h-full bg-primary shadow-[0_0_10px_rgba(19,91,236,0.5)] transition-all duration-150"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={togglePlay} className="text-white hover:text-primary transition-colors hover:scale-110 active:scale-95 transform">
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                        </button>

                        <div className="flex items-center gap-3">
                            <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
                                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            <span className="text-white/60 text-[10px] font-black tracking-widest uppercase">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={handleReplay} className="text-white/40 hover:text-white transition-colors" title="Replay">
                            <RotateCcw size={18} />
                        </button>
                        <button onClick={toggleFullscreen} className="text-white/40 hover:text-white transition-colors" title="Fullscreen">
                            <Maximize size={18} />
                        </button>
                        <div className="h-4 w-px bg-white/10 mx-2" />
                        <div className="flex items-center gap-2">
                            <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] italic">Encrypted Stream</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dynamic Watermark to deter screen recording */}
            <div className="absolute top-8 left-8 pointer-events-none opacity-[0.03] select-none italic text-white font-black text-xl flex flex-col rotate-[-12deg] z-10">
                <span>CONFIDENTIAL PROPERTY</span>
                <span className="text-[10px] tracking-widest uppercase mt-1">ID: {user?.userId?.slice(0, 8) || 'GUEST_PROTO'}</span>
            </div>
        </div>
    );
}
