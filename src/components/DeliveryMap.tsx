
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl, { LngLatLike } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// IMPORTANT: Replace this with your Mapbox public access token.
// You can get a token from https://www.mapbox.com/
// For production, it's recommended to store this in Supabase secrets.
const MAPBOX_ACCESS_TOKEN = 'YOUR_MAPBOX_ACCESS_TOKEN_HERE';

interface DeliveryMapProps {
  pickupAddress: string;
  deliveryAddress: string;
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({ pickupAddress, deliveryAddress }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (MAPBOX_ACCESS_TOKEN === 'YOUR_MAPBOX_ACCESS_TOKEN_HERE' || !MAPBOX_ACCESS_TOKEN) {
      setError("Mapbox access token is not configured. Please add your token to `src/components/DeliveryMap.tsx`.");
      setLoading(false);
      return;
    }

    if (map.current) return; // initialize map only once

    const geocodeAddress = async (address: string): Promise<LngLatLike> => {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_ACCESS_TOKEN}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to geocode address.');
      }
      const data = await response.json();
      if (!data.features || data.features.length === 0) {
        throw new Error(`Address not found: ${address}`);
      }
      return data.features[0].center;
    };

    const initializeMap = async () => {
      try {
        setLoading(true);
        const pickupCoords = await geocodeAddress(pickupAddress);
        const deliveryCoords = await geocodeAddress(deliveryAddress);

        if (mapContainer.current) {
          mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
          map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: pickupCoords,
            zoom: 11
          });

          // Add markers
          new mapboxgl.Marker({ color: '#00BFFF' }) // Deep sky blue for pickup
            .setLngLat(pickupCoords)
            .setPopup(new mapboxgl.Popup().setText('Pickup Location'))
            .addTo(map.current);

          new mapboxgl.Marker({ color: '#32CD32' }) // Lime green for delivery
            .setLngLat(deliveryCoords)
            .setPopup(new mapboxgl.Popup().setText('Delivery Location'))
            .addTo(map.current);
          
          // Fit map to markers
          const bounds = new mapboxgl.LngLatBounds();
          bounds.extend(pickupCoords);
          bounds.extend(deliveryCoords);
          map.current.fitBounds(bounds, { padding: 80 });
        }
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred while loading the map.');
      } finally {
        setLoading(false);
      }
    };

    initializeMap();

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [pickupAddress, deliveryAddress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="min-h-[400px]">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Map Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return <div ref={mapContainer} style={{ width: '100%', height: '400px' }} />;
};

export default DeliveryMap;
