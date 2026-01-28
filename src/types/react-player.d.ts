declare module 'react-player/lazy' {
    import ReactPlayer from 'react-player';
    export default ReactPlayer;
}

declare module 'react-player' {
    import * as React from 'react';

    export interface ReactPlayerProps {
        url?: string | string[] | MediaStream;
        playing?: boolean;
        loop?: boolean;
        controls?: boolean;
        light?: boolean | string;
        volume?: number;
        muted?: boolean;
        playbackRate?: number;
        width?: string | number;
        height?: string | number;
        style?: React.CSSProperties;
        progressInterval?: number;
        playsinline?: boolean;
        pip?: boolean;
        stopOnUnmount?: boolean;
        fallback?: React.ReactElement;
        wrapper?: any;
        playIcon?: React.ReactElement;
        previewTabIndex?: number;
        config?: any; // Simplify config to any for MVP
        onReady?: (player: ReactPlayer) => void;
        onStart?: () => void;
        onPlay?: () => void;
        onProgress?: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
        onDuration?: (duration: number) => void;
        onPause?: () => void;
        onBuffer?: () => void;
        onBufferEnd?: () => void;
        onSeek?: (seconds: number) => void;
        onEnded?: () => void;
        onError?: (error: any, data?: any, hlsInstance?: any, hlsGlobal?: any) => void;
        onClickPreview?: (event: any) => void;
        onEnablePIP?: () => void;
        onDisablePIP?: () => void;
    }

    export default class ReactPlayer extends React.Component<ReactPlayerProps, any> {
        static canPlay(url: string): boolean;
        static canEnablePIP(url: string): boolean;
        static addCustomPlayer(player: any): void;
        static removeCustomPlayer(player: any): void;
        seekTo(amount: number, type?: 'seconds' | 'fraction'): void;
        getCurrentTime(): number;
        getDuration(): number;
        getInternalPlayer(key?: string): any;
    }
}
