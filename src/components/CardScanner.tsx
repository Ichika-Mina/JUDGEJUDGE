import React, { useState, useRef, useEffect } from 'react';
import { HoverableRuleBadge } from './HoverableRuleBadge';
import { Camera, Upload, RefreshCw, Sparkles, MessageSquare, BookOpen, Layers, CheckCircle2, AlertCircle, X, SwitchCamera } from 'lucide-react';

interface ScannedCardData {
  cardName: string;
  manaCost?: string;
  typeLine?: string;
  oracleText?: string;
  powerToughness?: string;
  rulesSummary: string;
  rulesCited: string[];
  keyMechanics?: string[];
  judgeRulings?: string[];
  commonInteractions?: string[];
}

interface CardScannerProps {
  onAskJudge: (cardName: string) => void;
  onNavigateToRule?: (ruleNumber: string) => void;
  onInspectCard?: (cardName: string) => void;
}

export const CardScanner: React.FC<CardScannerProps> = ({
  onAskJudge,
  onNavigateToRule,
  onInspectCard,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<ScannedCardData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setErrorMsg(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setFacingMode(mode);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setIsCameraActive(false);
      setErrorMsg('Could not open camera stream. You can upload or snap a photo using the file button below.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextMode);
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setImagePreview(dataUrl);
      stopCamera();
      processCardImage(dataUrl);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      stopCamera();
      processCardImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const processCardImage = async (dataUrl: string) => {
    setIsScanning(true);
    setErrorMsg(null);
    setScannedResult(null);

    try {
      const res = await fetch('/api/cards/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          mimeType: 'image/jpeg',
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || 'Server could not analyze card image.');
      }

      const data = await res.json();
      if (data.card) {
        setScannedResult(data.card);
      } else {
        throw new Error('No card data recognized.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message || 'Could not recognize the card. Please ensure the card title and text are well lit.'
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setScannedResult(null);
    setErrorMsg(null);
    stopCamera();
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Camera className="w-5 h-5 text-amber-400" /> MTG Visual Card Scanner & Rules Identifier
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Snap a picture of any physical Magic card to instantly recognize it and pull its Comprehensive Rules, Gatherer rulings, and layer interactions.
        </p>
      </div>

      {/* Camera / Capture Section */}
      {!imagePreview && !scannedResult && (
        <div className="space-y-4">
          {/* Live Camera Viewfinder */}
          {isCameraActive ? (
            <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-amber-500/60 shadow-2xl aspect-[4/3] max-w-lg mx-auto flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Card Framing Guide Overlay */}
              <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-amber-400/70 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                <span className="text-[10px] font-mono text-amber-300 bg-slate-900/80 px-2 py-0.5 rounded self-start">
                  Position Card Inside Frame
                </span>
                <span className="text-[10px] font-mono text-amber-300/80 bg-slate-900/80 px-2 py-0.5 rounded self-end">
                  Ensure name is visible
                </span>
              </div>

              {/* Viewfinder Controls */}
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition shadow-lg cursor-pointer"
                  title="Flip camera"
                >
                  <SwitchCamera className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={capturePhotoFromCamera}
                  className="p-4 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-2xl border-4 border-slate-900 ring-2 ring-amber-500 cursor-pointer"
                  title="Snap photo"
                >
                  <Camera className="w-7 h-7" />
                </button>

                <button
                  type="button"
                  onClick={stopCamera}
                  className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition shadow-lg cursor-pointer"
                  title="Cancel camera"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            /* Card Capture Selector */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* Option A: Start Camera Viewfinder */}
              <div
                onClick={() => startCamera('environment')}
                className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-amber-500/50 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-md group space-y-3"
              >
                <div className="p-4 rounded-2xl bg-amber-500/15 text-amber-400 group-hover:scale-105 transition border border-amber-500/30">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition">
                    Open Camera Viewfinder
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Live video stream with card alignment guide.
                  </p>
                </div>
              </div>

              {/* Option B: Snap Photo / File Upload */}
              <label className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-indigo-500/50 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-md group space-y-3">
                <div className="p-4 rounded-2xl bg-indigo-500/15 text-indigo-400 group-hover:scale-105 transition border border-indigo-500/30">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition">
                    Upload or Take Photo
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Snap directly from phone camera or pick from gallery.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      )}

      {/* Scanning Laser Animation & Processing */}
      {isScanning && (
        <div className="p-8 rounded-2xl bg-slate-900/90 border border-amber-500/40 text-center space-y-4 max-w-lg mx-auto">
          {imagePreview && (
            <div className="relative w-48 h-64 mx-auto rounded-xl overflow-hidden border border-slate-700 shadow-xl">
              <img src={imagePreview} alt="Scanning" className="w-full h-full object-cover" />
              {/* Laser line animation */}
              <div className="absolute inset-x-0 h-1 bg-amber-400 shadow-[0_0_12px_#fbbf24] animate-bounce" />
            </div>
          )}
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-300 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Recognizing MTG Card & Parsing Rules...
            </h3>
            <p className="text-xs text-slate-400">
              Judge Gemma is analyzing Oracle text, card types, and Comprehensive Rules.
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-600/40 text-xs text-rose-300 flex items-center justify-between gap-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={handleReset}
            className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-100 font-medium transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Recognized Card & Official Rules Result Card */}
      {scannedResult && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Card Recognized & Rules Verified
            </span>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" /> Scan Another Card
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Card Photo & Identification */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-4">
              {imagePreview && (
                <div className="w-full aspect-[2.5/3.5] rounded-xl overflow-hidden border border-slate-700 shadow-md">
                  <img src={imagePreview} alt={scannedResult.cardName} className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold text-slate-100">{scannedResult.cardName}</h3>
                  {scannedResult.manaCost && (
                    <span className="font-mono text-xs font-bold text-amber-300 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {scannedResult.manaCost}
                    </span>
                  )}
                </div>
                <span className="text-xs text-amber-400 block font-medium mt-0.5">
                  {scannedResult.typeLine}
                </span>
              </div>

              {/* Oracle Rules Text */}
              {scannedResult.oracleText && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 font-serif leading-relaxed whitespace-pre-wrap">
                  {scannedResult.oracleText}
                </div>
              )}

              {scannedResult.powerToughness && (
                <div className="flex justify-end">
                  <span className="font-bold text-xs text-slate-100 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    {scannedResult.powerToughness}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => onAskJudge(scannedResult.cardName)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" /> Ask Judge Gemma About This Card
                </button>
              </div>
            </div>

            {/* Right: Comprehensive Rules & Judge Explanations */}
            <div className="md:col-span-2 space-y-4">
              {/* Rules Summary Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-950/20 border border-amber-500/40 shadow-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Rules Breakdown & Mechanics
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">L3 Judge Verified</span>
                </div>

                <p className="text-sm font-semibold text-slate-100 leading-relaxed">
                  {scannedResult.rulesSummary}
                </p>

                {/* Hoverable Rule Citations Bar */}
                {scannedResult.rulesCited && scannedResult.rulesCited.length > 0 && (
                  <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-amber-400" /> Applicable Rules (Hover to view):
                    </span>
                    {scannedResult.rulesCited.map((cite) => (
                      <HoverableRuleBadge
                        key={cite}
                        citation={cite}
                        onNavigateToRule={onNavigateToRule}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Key Mechanics Chips */}
              {scannedResult.keyMechanics && scannedResult.keyMechanics.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Mechanics:</span>
                  {scannedResult.keyMechanics.map((m) => (
                    <span
                      key={m}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800"
                    >
                      ⚡ {m}
                    </span>
                  ))}
                </div>
              )}

              {/* Official Gatherer & Tournament Rulings */}
              {scannedResult.judgeRulings && scannedResult.judgeRulings.length > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <span>📜 Official Tournament & Gatherer Rulings</span>
                  </h4>
                  <div className="space-y-2 text-xs text-slate-300">
                    {scannedResult.judgeRulings.map((r, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 leading-relaxed">
                        • {r}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Common Card Interactions */}
              {scannedResult.commonInteractions && scannedResult.commonInteractions.length > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <span>⚖️ Known Complex Interactions FAQ</span>
                  </h4>
                  <div className="space-y-2 text-xs text-slate-300">
                    {scannedResult.commonInteractions.map((ci, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 leading-relaxed">
                        • {ci}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
