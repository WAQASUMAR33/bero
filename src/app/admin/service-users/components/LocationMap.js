'use client';

import { useEffect, useRef, useState } from 'react';

export default function LocationMap({ 
  postalCode, 
  latitude, 
  longitude, 
  onLocationSelect, 
  readOnly = false,
  className = "w-full h-64 rounded-lg border"
}) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastGeocodedPostalCode, setLastGeocodedPostalCode] = useState(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize Leaflet map
    const initMap = async () => {
      try {
        // Dynamically import Leaflet to avoid SSR issues
        const L = (await import('leaflet')).default;
        
        // Check if map container is already initialized and clean it up
        if (mapRef.current._leaflet_id) {
          // Remove existing map instance
          if (map) {
            map.remove();
            setMap(null);
          }
          // Clear the container
          mapRef.current._leaflet_id = undefined;
        }
        
        // Fix default markers in Leaflet
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Default to UK center if no coordinates
        const defaultLat = latitude || 54.5;
        const defaultLng = longitude || -2.0;
        const defaultZoom = (latitude && longitude) ? 15 : 6;

        const mapInstance = L.map(mapRef.current).setView([defaultLat, defaultLng], defaultZoom);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance);

        setMap(mapInstance);

        // Add marker if coordinates exist
        if (latitude && longitude) {
          const markerInstance = L.marker([latitude, longitude]).addTo(mapInstance);
          markerRef.current = markerInstance;
        }

        // Add click handler for non-readonly mode
        if (!readOnly) {
          mapInstance.on('click', async (e) => {
            const { lat, lng } = e.latlng;
            
            // Remove existing marker from the map instance
            if (markerRef.current) {
              mapInstance.removeLayer(markerRef.current);
              markerRef.current = null;
            }
            
            // Add new marker
            const newMarker = L.marker([lat, lng]).addTo(mapInstance);
            markerRef.current = newMarker;
            
            // Call callback with new coordinates
            if (onLocationSelect) {
              onLocationSelect(lat, lng);
            }
          });
        }

      } catch (error) {
        console.error('Error initializing map:', error);
        setError('Failed to load map');
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (markerRef.current && map) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      if (map) {
        map.remove();
        setMap(null);
      }
      // Clear the Leaflet container reference
      if (mapRef.current && mapRef.current._leaflet_id) {
        mapRef.current._leaflet_id = undefined;
      }
    };
  }, []); // Empty dependency array - only initialize once

  // Handle postal code geocoding
  useEffect(() => {
    if (!postalCode || !map || readOnly) return;

    // Validate postal code format (basic UK postal code validation)
    const ukPostalCodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
    const trimmedPostalCode = postalCode.trim();
    
    // Only geocode if it looks like a complete UK postal code
    if (!ukPostalCodeRegex.test(trimmedPostalCode) || trimmedPostalCode.length < 5) {
      return;
    }

    // Don't geocode if we already geocoded this postal code
    if (lastGeocodedPostalCode === trimmedPostalCode) {
      return;
    }

    const geocodePostalCode = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use Nominatim (OpenStreetMap) geocoding service
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=gb&postalcode=${encodeURIComponent(trimmedPostalCode)}&limit=1`
        );
        
        if (!response.ok) {
          throw new Error('Geocoding request failed');
        }

        const data = await response.json();
        
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          const newLat = parseFloat(lat);
          const newLng = parseFloat(lon);

          // Update map view
          map.setView([newLat, newLng], 13);

          // Remove existing marker
          if (markerRef.current) {
            map.removeLayer(markerRef.current);
            markerRef.current = null;
          }

          // Add new marker
          const L = (await import('leaflet')).default;
          const newMarker = L.marker([newLat, newLng]).addTo(map);
          markerRef.current = newMarker;

          // Call callback with geocoded coordinates
          if (onLocationSelect && !readOnly) {
            onLocationSelect(newLat, newLng);
          }

          // Remember this postal code to avoid duplicate requests
          setLastGeocodedPostalCode(trimmedPostalCode);
        } else {
          setError('Postal code not found');
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        setError('Failed to find location for postal code');
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the geocoding request with longer delay
    const timeoutId = setTimeout(geocodePostalCode, 1500);
    return () => clearTimeout(timeoutId);
  }, [postalCode, map, onLocationSelect, readOnly, lastGeocodedPostalCode]);

  // Update marker when coordinates change externally
  useEffect(() => {
    if (!map || !latitude || !longitude) return;

    const updateMarker = async () => {
      // Remove existing marker
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }

      // Add new marker
      const L = (await import('leaflet')).default;
      const newMarker = L.marker([latitude, longitude]).addTo(map);
      markerRef.current = newMarker;

      // Update map view
      map.setView([latitude, longitude], 15);
    };

    updateMarker();
  }, [latitude, longitude, map]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute top-2 left-2 z-[1000] bg-white px-3 py-1 rounded-lg shadow-md">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">Finding location...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-2 left-2 z-[1000] bg-red-100 border border-red-300 px-3 py-1 rounded-lg shadow-md">
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      {!readOnly && (
        <div className="absolute top-2 right-2 z-[1000] bg-white px-3 py-1 rounded-lg shadow-md">
          <span className="text-xs text-gray-600">Click on map to set location</span>
        </div>
      )}

      <div ref={mapRef} className={className} />
    </div>
  );
}
