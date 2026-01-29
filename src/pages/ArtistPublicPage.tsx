import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Play, Loader2, Pause, Instagram, Youtube, Music2 } from 'lucide-react';
import Navbar from '../components/Navbar';

interface UserProfile {
    id: string;
    handle: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    main_track_id: string | null;
}

interface Track {
    id: string;
    title: string;
    url: string;
    platform: 'youtube' | 'soundcloud';
    created_at: string;
}

const ArtistPublicPage: React.FC = () => {
    const { handle } = useParams<{ handle: string }>();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // BGM State
    const [isPlaying, setIsPlaying] = useState(false);
    const [bgmTrack, setBgmTrack] = useState<Track | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [scrollProgress, setScrollProgress] = useState(0);

    // Player Refs
    const ytPlayerRef = useRef<any>(null);
    const scWidgetRef = useRef<any>(null);
    const activePlatformRef = useRef<'youtube' | 'soundcloud' | null>(null);

    // Helpers to extract ID
    const getYoutubeId = (url: string) => {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : null;
    };

    // --- 1. Load Scripts & Initialize ---
    useEffect(() => {
        // Load YouTube API
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        // Load SoundCloud API
        if (!window.SC) {
            const tag = document.createElement('script');
            tag.src = "https://w.soundcloud.com/player/api.js";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        // Define generic callbacks if needed or handle via checking window.YT
    }, []);

    // --- 2. Data Fetching ---
    useEffect(() => {
        const fetchData = async () => {
            if (!handle) {
                setError('No handle specified');
                return;
            }
            try {
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id, handle, display_name, avatar_url, bio, main_track_id')
                    .eq('handle', handle)
                    .single();

                if (userError || !userData) throw new Error('Artist not found');
                setProfile(userData);

                const { data: tracksData, error: tracksError } = await supabase
                    .from('tracks')
                    .select('id, title, url, platform, created_at')
                    .eq('user_id', userData.id)
                    .order('created_at', { ascending: false });

                if (tracksError) throw tracksError;

                const loadedTracks = tracksData || [];
                setTracks(loadedTracks);

                if (loadedTracks.length > 0) {
                    if (userData.main_track_id) {
                        const main = loadedTracks.find(t => t.id === userData.main_track_id);
                        setBgmTrack(main || loadedTracks[0]);
                    } else {
                        setBgmTrack(loadedTracks[0]);
                    }
                }

            } catch (err: any) {
                console.error('Error fetching artist data:', err);
                setError('Artist not found.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [handle]);


    // --- 3. Initialize Players on BGM Track Change (Lazy Init) ---
    // We render the iframe first, then hook up the API.
    useEffect(() => {
        if (!bgmTrack) return;

        // Cleanup previous state if switching platforms
        if (activePlatformRef.current === 'youtube' && bgmTrack.platform === 'soundcloud') {
            if (ytPlayerRef.current) {
                ytPlayerRef.current.stopVideo(); // Stop old
            }
        } else if (activePlatformRef.current === 'soundcloud' && bgmTrack.platform === 'youtube') {
            if (scWidgetRef.current) {
                scWidgetRef.current.pause();
            }
        }

        activePlatformRef.current = bgmTrack.platform;

        if (bgmTrack.platform === 'youtube') {
            const videoId = getYoutubeId(bgmTrack.url);
            if (!videoId) return;

            // Wait for YT API to be ready
            const initYT = () => {
                if (!window.YT || !window.YT.Player) {
                    setTimeout(initYT, 100);
                    return;
                }

                // If player already exists, just load new video
                if (ytPlayerRef.current) {
                    // Check if player is destroyed or valid
                    try {
                        ytPlayerRef.current.loadVideoById(videoId);
                        if (isPlaying) ytPlayerRef.current.playVideo();
                    } catch (e) {
                        // Re-init if error (e.g. iframe removed)
                        createYTPlayer(videoId);
                    }
                } else {
                    createYTPlayer(videoId);
                }
            };
            initYT();

        } else if (bgmTrack.platform === 'soundcloud') {
            // SoundCloud Widget Logic
            const initSC = () => {
                const iframe = document.getElementById('sc-player-iframe') as HTMLIFrameElement;
                if (!iframe || !window.SC) {
                    setTimeout(initSC, 100);
                    return;
                }

                if (!scWidgetRef.current) {
                    scWidgetRef.current = window.SC.Widget(iframe);
                    scWidgetRef.current.bind(window.SC.Widget.Events.FINISH, handleTrackEnd);
                    scWidgetRef.current.bind(window.SC.Widget.Events.READY, () => {
                        // Ready
                        if (isPlaying) scWidgetRef.current.play();
                    });
                } else {
                    // Load new URL
                    scWidgetRef.current.load(bgmTrack.url, {
                        auto_play: isPlaying,
                        callback: () => {
                            // Loaded
                        }
                    });
                }
            }
            initSC();
        }
    }, [bgmTrack]); // Only re-init when track changes (or mount)

    const createYTPlayer = (videoId: string) => {
        // Destroy existing if any check handled above
        ytPlayerRef.current = new window.YT.Player('yt-player-iframe', {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
                'playsinline': 1,
                'autoplay': isPlaying ? 1 : 0, // Auto-play if state says so
                'controls': 0,
                'disablekb': 1,
                'fs': 0,
                'origin': window.location.origin,
                'widgetid': 1
            },
            events: {
                'onReady': (event: any) => {
                    if (isPlaying) event.target.playVideo();
                },
                'onStateChange': (event: any) => {
                    // YT.PlayerState.ENDED = 0
                    if (event.data === 0) {
                        handleTrackEnd();
                    }
                }
            }
        });
    }

    // --- 4. Controls ---

    const handlePlayClick = () => {
        if (!bgmTrack) return;

        const newIsPlaying = !isPlaying;
        setIsPlaying(newIsPlaying);

        if (bgmTrack.platform === 'youtube' && ytPlayerRef.current) {
            if (newIsPlaying) ytPlayerRef.current.playVideo();
            else ytPlayerRef.current.pauseVideo();
        }
        else if (bgmTrack.platform === 'soundcloud' && scWidgetRef.current) {
            if (newIsPlaying) scWidgetRef.current.play();
            else scWidgetRef.current.pause();
        }
    };

    const handleTrackSelect = (track: Track) => {
        // Correct logic: Set track, set playing true. The Effect will pick up the new track.
        setBgmTrack(track);
        setIsPlaying(true);
        // Effect will handle the player.load() or creation
    };

    const handleTrackEnd = () => {
        console.log('Track Ended. Finding next...');
        if (tracks.length <= 1) return;

        // Find current index
        const currentIndex = tracks.findIndex(t => t.id === bgmTrack?.id);
        const nextIndex = (currentIndex + 1) % tracks.length;
        const nextTrack = tracks[nextIndex];

        console.log('Playing next track:', nextTrack.title);
        setBgmTrack(nextTrack);
        setIsPlaying(true);
        // Effect will trigger load
    };

    // Scroll Handler
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        const windowHeight = window.innerHeight;
        const spacerHeight = windowHeight * 0.6;
        let progress = scrollTop / spacerHeight;
        if (progress > 1) progress = 1;
        setScrollProgress(progress);
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
            <Loader2 className="w-8 h-8 animate-spin text-white/50" />
        </div>
    );

    if (error || !profile) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white/50 gap-4">
            <p className="text-lg">{error || 'Artist not found'}</p>
            <Link to="/" className="text-white hover:text-white/80 text-sm underline">Go Home</Link>
        </div>
    );

    // Visuals
    const placeholderImage = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1080";
    const displayImage = profile.avatar_url || placeholderImage;
    const mainTrackTitle = bgmTrack?.title || "No tracks released yet";
    const displayNameText = profile.display_name || profile.handle;

    const blurAmount = scrollProgress * 20;
    const brightnessAmount = 100 - (scrollProgress * 60);
    const headerBgOpacity = scrollProgress * 0.9;

    return (
        <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-black text-white">
            <div className="absolute z-50 w-full top-0 left-0 pointer-events-none">
                <div className="pointer-events-auto">
                    <Navbar />
                </div>
            </div>

            <div className="fixed inset-0 z-0">
                <img
                    src={displayImage}
                    alt="Background"
                    className="w-full h-full object-cover transition-all duration-100 ease-out"
                    style={{
                        filter: `blur(${blurAmount}px) brightness(${brightnessAmount}%)`,
                        transform: 'scale(1.1)'
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
            </div>

            {/* GHOST PLAYER CONTAINER */}
            <div className="absolute top-0 left-0 w-px h-px opacity-0 pointer-events-none -z-50 overflow-hidden">
                {/* 
                  Native API requires a stable DOM element to attach to.
                  We conditionally render depending on the platform to avoid API conflicts 
                  or just keep both containers and activate one.
                  Best approach: Render container divs. The API will inject/replace iframe.
                */}

                {bgmTrack?.platform === 'youtube' && (
                    // YouTube replaces this div with an iframe
                    <div id="yt-player-iframe"></div>
                )}

                {bgmTrack?.platform === 'soundcloud' && (
                    <iframe
                        id="sc-player-iframe"
                        src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(bgmTrack.url)}&auto_play=${isPlaying}&initializing=true`}
                        allow="autoplay"
                        title="SC Player"
                    />
                )}
            </div>


            <div
                className="relative z-10 h-full overflow-y-auto snap-y snap-mandatory scroll-smooth overscroll-y-none"
                onScroll={handleScroll}
            >
                <div className="w-full h-[45vh] md:h-[60vh] snap-start bg-transparent pointer-events-none" />

                <div className="min-h-screen w-full snap-start flex flex-col">
                    <div
                        className="sticky top-0 z-20 pt-20 pb-6 px-8 border-b border-transparent transition-colors duration-300"
                        style={{
                            backgroundColor: `rgba(0, 0, 0, ${headerBgOpacity})`,
                            borderColor: scrollProgress > 0.8 ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                            backdropFilter: scrollProgress > 0.5 ? 'blur(12px)' : 'none'
                        }}
                    >
                        <div className="max-w-[240px] space-y-6">
                            <div className="flex flex-col gap-4">
                                <div className="space-y-2">
                                    <h1 className="text-5xl font-black tracking-tighter text-white drop-shadow-2xl leading-none">
                                        {displayNameText}
                                    </h1>
                                    <p className="text-white/90 text-sm font-medium tracking-wide drop-shadow-lg leading-relaxed">
                                        {profile.bio || "Artist"}
                                    </p>
                                </div>
                                <div className="w-8 h-1 bg-white/30 rounded-full" />
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">
                                            Now Playing
                                        </p>
                                        <p className="text-white text-base font-medium drop-shadow-lg truncate">
                                            {mainTrackTitle}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handlePlayClick}
                                        disabled={!bgmTrack}
                                        className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full pl-2 pr-6 py-2 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-fit"
                                    >
                                        <div
                                            className={`flex items-center justify-center w-10 h-10 rounded-full bg-white text-black transition-transform duration-300 ${isPlaying ? "scale-95" : "group-hover:scale-110"}`}
                                        >
                                            {isPlaying ? (
                                                <Pause className="w-4 h-4" fill="currentColor" />
                                            ) : (
                                                <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                                            )}
                                        </div>
                                        <span className="text-white text-sm font-bold tracking-tight text-left">
                                            {isPlaying ? "Pause" : "Play Now"}
                                        </span>
                                    </button>
                                    <div className={`flex gap-3 pt-1 transition-all duration-300 ${scrollProgress > 0.8 ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'}`}>
                                        <a href="#" className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all transform hover:scale-110"><Instagram className="w-3.5 h-3.5" /></a>
                                        <a href="#" className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all transform hover:scale-110"><Youtube className="w-3.5 h-3.5" /></a>
                                        <a href="#" className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all transform hover:scale-110"><Music2 className="w-3.5 h-3.5" /></a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 bg-black/40 backdrop-blur-md min-h-screen">
                        <div className="max-w-2xl mx-auto space-y-2">
                            {tracks.map((track, idx) => (
                                <div
                                    key={track.id}
                                    onClick={() => handleTrackSelect(track)}
                                    className={`group flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border ${bgmTrack?.id === track.id && isPlaying
                                        ? 'bg-white/20 border-white/30 shadow-inner'
                                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className="text-white/40 text-sm font-mono w-6 text-center">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`text-sm md:text-base font-medium truncate transition-colors ${bgmTrack?.id === track.id && isPlaying ? 'text-indigo-400' : 'text-white'
                                            }`}>
                                            {track.title}
                                        </h3>
                                        <p className="text-xs text-white/40 capitalize">
                                            {track.platform}
                                        </p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play className="w-4 h-4 text-white" />
                                    </div>
                                    {bgmTrack?.id === track.id && isPlaying && (
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                    )}
                                </div>
                            ))}

                            {tracks.length === 0 && (
                                <div className="text-center text-white/30 py-10">
                                    No tracks available.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArtistPublicPage;
