import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn } from 'lucide-react';
import getCroppedImg from '../lib/cropUtils';
import { useLanguage } from '../contexts/LanguageContext';

interface ImageCropModalProps {
    imageSrc: string;
    onCancel: () => void;
    onCropComplete: (croppedBlob: Blob) => void;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({ imageSrc, onCancel, onCropComplete }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { t } = useLanguage();

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            setIsProcessing(true);
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedBlob) {
                onCropComplete(croppedBlob);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-md z-10">
                <button
                    onClick={onCancel}
                    className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
                <h3 className="text-white font-bold text-lg">{t('modal.adjustPhoto')}</h3>
                <button
                    onClick={handleSave}
                    disabled={isProcessing}
                    className="p-2 rounded-full text-indigo-400 font-bold hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                    {isProcessing ? '...' : <Check className="w-6 h-6" />}
                </button>
            </div>

            {/* Cropper Area */}
            <div className="relative flex-1 bg-black overflow-hidden">
                <div className="absolute inset-0 top-0 bottom-20"> {/* Leave space for controls */}
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={9 / 16}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteHandler}
                        onZoomChange={onZoomChange}
                        showGrid={true}
                        objectFit="cover"
                        style={{
                            containerStyle: { backgroundColor: 'black' },
                            cropAreaStyle: { border: '2px solid white', borderRadius: '12px', boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)' }
                        }}
                    />
                </div>

                {/* Mobile Preview Guide Overlay */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-center opacity-50">
                        <p className="text-white text-sm font-medium drop-shadow-md">{t('modal.mobileViewGuide')}</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-slate-900 p-6 pb-10 space-y-4">
                <div className="flex items-center gap-4">
                    <ZoomIn className="w-5 h-5 text-slate-400" />
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>
                <p className="text-center text-xs text-slate-500">
                    {t('modal.dragToMove')}
                </p>
            </div>
        </div>
    );
};

export default ImageCropModal;
