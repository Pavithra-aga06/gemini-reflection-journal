import React, { useState } from 'react';
import { JournalLocation } from '../types';
import { 
  MapPin, 
  Navigation, 
  ShieldCheck, 
  AlertCircle, 
  X, 
  Check, 
  Loader2, 
  Edit2,
  ExternalLink
} from 'lucide-react';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationAttached: (location: JournalLocation) => void;
  existingLocation?: JournalLocation;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  onLocationAttached,
  existingLocation,
}) => {
  const [step, setStep] = useState<'prompt' | 'fetching' | 'resolving' | 'preview' | 'manual'>('prompt');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resolvedLoc, setResolvedLoc] = useState<JournalLocation | null>(existingLocation || null);
  const [customName, setCustomName] = useState(existingLocation?.placeName || '');
  const [manualPlaceInput, setManualPlaceInput] = useState('');

  if (!isOpen) return null;

  // Request browser geolocation with explicit user consent
  const handleRequestGeolocation = () => {
    setErrorMsg(null);
    setStep('fetching');

    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      setStep('manual');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setStep('resolving');

        try {
          // Call secure server-side reverse geocoding proxy to avoid exposing API keys
          const response = await fetch('/api/location/reverse-geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude }),
          });

          if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
          }

          const data: JournalLocation = await response.json();
          setResolvedLoc(data);
          setCustomName(data.placeName || '');
          setStep('preview');
        } catch (err: any) {
          console.warn('Reverse geocoding error, falling back to raw coordinates:', err);
          // Fall back gracefully to coordinates without crashing
          const fallbackLoc: JournalLocation = {
            latitude,
            longitude,
            placeName: `Location (${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°)`,
            formattedAddress: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
            attachedAt: new Date().toISOString(),
          };
          setResolvedLoc(fallbackLoc);
          setCustomName(fallbackLoc.placeName || '');
          setStep('preview');
        }
      },
      (geoError) => {
        console.error('Geolocation Error:', geoError);
        let message = 'Unable to retrieve your location.';
        if (geoError.code === geoError.PERMISSION_DENIED) {
          message = 'Location access was denied. You can enter a custom place name below.';
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          message = 'Location information is currently unavailable.';
        } else if (geoError.code === geoError.TIMEOUT) {
          message = 'The request to obtain your location timed out.';
        }
        setErrorMsg(message);
        setStep('manual');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Handle manual place entry fallback
  const handleSaveManualLocation = () => {
    if (!manualPlaceInput.trim()) return;
    const cleanName = manualPlaceInput.trim().slice(0, 100);
    const manualLoc: JournalLocation = {
      latitude: 0,
      longitude: 0,
      placeName: cleanName,
      formattedAddress: cleanName,
      attachedAt: new Date().toISOString(),
    };
    onLocationAttached(manualLoc);
    onClose();
  };

  const handleConfirmLocation = () => {
    if (!resolvedLoc) return;
    const finalLocation: JournalLocation = {
      ...resolvedLoc,
      placeName: customName.trim() || resolvedLoc.placeName,
    };
    onLocationAttached(finalLocation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        id="location-consent-modal"
        className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-stone-200 animate-scaleUp"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900">
                {resolvedLoc ? 'Location Details' : 'Attach Location'}
              </h3>
              <p className="text-[11px] text-stone-500">
                Optional location context for this reflection
              </p>
            </div>
          </div>
          <button
            id="close-location-modal-button"
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Privacy & Security Notice */}
          <div className="flex items-start gap-2.5 p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-amber-800">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold">Privacy & Security Guarantee:</span>
              <p className="mt-0.5 text-amber-700">
                Your location is requested with explicit consent. Only minimal details are saved, isolated exclusively in your private Firestore account. API keys remain strictly server-side.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'prompt' && (
            <div className="space-y-4">
              <p className="text-stone-600 leading-relaxed">
                Add a physical setting to your reflection—whether you are writing from a peaceful cafe, a tranquil park, or during your travels.
              </p>

              <div className="space-y-2 pt-1">
                <button
                  id="grant-gps-location-button"
                  type="button"
                  onClick={handleRequestGeolocation}
                  className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  <span>Use My Current Location</span>
                </button>

                <button
                  id="switch-manual-location-button"
                  type="button"
                  onClick={() => setStep('manual')}
                  className="w-full py-2 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-medium transition cursor-pointer"
                >
                  Enter Place Name Manually
                </button>
              </div>
            </div>
          )}

          {(step === 'fetching' || step === 'resolving') && (
            <div className="py-8 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
              <div>
                <p className="font-medium text-stone-800">
                  {step === 'fetching' ? 'Requesting location permission...' : 'Resolving place details securely...'}
                </p>
                <p className="text-[11px] text-stone-500 mt-1">
                  Connecting to Google Maps server-side geocoding service
                </p>
              </div>
            </div>
          )}

          {step === 'preview' && resolvedLoc && (
            <div className="space-y-4">
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400">
                    Detected Location
                  </span>
                  <span className="text-[10px] font-mono text-stone-500">
                    {resolvedLoc.latitude.toFixed(4)}°, {resolvedLoc.longitude.toFixed(4)}°
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-700 mb-1">
                    Display Name
                  </label>
                  <div className="relative">
                    <input
                      id="custom-location-name-input"
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. Kyoto Garden, Home, Coffee Shop"
                      className="w-full pl-3 pr-8 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                    <Edit2 className="w-3 h-3 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {resolvedLoc.formattedAddress && (
                  <p className="text-[11px] text-stone-500 truncate">
                    <span className="font-medium text-stone-700">Address: </span>
                    {resolvedLoc.formattedAddress}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  id="confirm-attach-location-button"
                  type="button"
                  onClick={handleConfirmLocation}
                  className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Attach to Reflection</span>
                </button>
                <button
                  id="retry-location-button"
                  type="button"
                  onClick={() => setStep('prompt')}
                  className="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-medium transition cursor-pointer"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {step === 'manual' && (
            <div className="space-y-3">
              <label className="block text-[11px] font-medium text-stone-700">
                Enter a city, landmark, or location label:
              </label>
              <input
                id="manual-place-name-input"
                type="text"
                value={manualPlaceInput}
                onChange={(e) => setManualPlaceInput(e.target.value)}
                placeholder="e.g. Paris, France or Yosemite National Park"
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                autoFocus
              />

              <div className="flex gap-2 pt-2">
                <button
                  id="save-manual-location-button"
                  type="button"
                  onClick={handleSaveManualLocation}
                  disabled={!manualPlaceInput.trim()}
                  className="flex-1 py-2 px-4 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-xl font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Location</span>
                </button>
                <button
                  id="cancel-manual-location-button"
                  type="button"
                  onClick={() => setStep('prompt')}
                  className="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-medium transition cursor-pointer"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
