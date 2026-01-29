export { };

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
        SC: any;
    }
}
