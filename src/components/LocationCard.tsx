import React, { useState } from 'react';
import { JournalLocation } from '../types';
import { 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Trash2, 
  Map as MapIcon,
  Navigation
} from 'lucide-react';

interface LocationCardProps {
  location: JournalLocation;
  onRemoveLocation: () => void;
  onEditLocation?: () => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  onRemoveLocation,
  onEditLocation,
}) => {
  const [showMapEmbed, setShowMapEmbed] = useState(false);

  const hasCoords =
    typeof location.latitude === 'number' &&
    typeof location.longitude === 'number' &&
    (location.latitude !== 0 || location.longitude !== 0);

  // Safe Google Maps Search URL
  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${location.latitude},${location.longitude}`
      )}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        location.placeName || location.formattedAddress || ''
      )}`;

  // Safe Google Maps Embed URL (zero client API key needed)
  const embedMapUrl = hasCoords
    ? `https://www.google.com/maps?q=${encodeURIComponent(
        `${location.latitude},${location.longitude}`
      )}&z=14&output=embed`
    : null;

  return (
    <div 
      id="attached-location-card"
      className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 sm:p-3 text-xs text-stone-800 transition shadow-2xs"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <MapPin className="w-3.5 h-3.5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-950 truncate text-xs sm:text-sm">
                {location.placeName || 'Attached Location'}
              </span>
              {hasCoords && (
                <span className="hidden sm:inline-block text-[10px] text-emerald-800/80 font-mono bg-emerald-100/70 px-1.5 py-0.5 rounded">
                  {location.latitude.toFixed(3)}°, {location.longitude.toFixed(3)}°
                </span>
              )}
            </div>
            {location.formattedAddress && location.formattedAddress !== location.placeName && (
              <p className="text-[11px] text-emerald-800/90 truncate mt-0.5">
                {location.formattedAddress}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {hasCoords && embedMapUrl && (
            <button
              id="toggle-map-preview-button"
              type="button"
              onClick={() => setShowMapEmbed(!showMapEmbed)}
              className="p-1.5 text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100/60 rounded-lg transition flex items-center gap-1 text-[11px] font-medium cursor-pointer"
              title={showMapEmbed ? 'Hide map preview' : 'View map preview'}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{showMapEmbed ? 'Hide Map' : 'View Map'}</span>
              {showMapEmbed ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}

          <a
            id="open-google-maps-link"
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100/60 rounded-lg transition"
            title="Open in Google Maps"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            id="remove-location-button"
            type="button"
            onClick={onRemoveLocation}
            className="p-1.5 text-emerald-700 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
            title="Remove location"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Embedded Map Section */}
      {showMapEmbed && embedMapUrl && (
        <div className="mt-3 pt-2.5 border-t border-emerald-200/60 animate-fadeIn">
          <div className="rounded-lg overflow-hidden border border-emerald-300/50 bg-stone-100 h-48 sm:h-56 relative shadow-inner">
            <iframe
              id="embedded-google-map-iframe"
              title="Journal Entry Location Map"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={embedMapUrl}
              className="w-full h-full"
              loading="lazy"
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px] text-emerald-800/80">
            <span>Coordinates: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</span>
            <a 
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-0.5 text-emerald-900 font-medium"
            >
              <span>Explore on Google Maps</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
