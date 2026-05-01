import React, { useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        google: any;
    }
}

interface LocationInputProps {
    onLocationSelect: (data: { address: string; latitude: number; longitude: number }) => void;
    onAddressChange?: (address: string) => void;
    placeholder?: string;
    className?: string;
    initialValue?: string;
}

// Global variable to track if the script is loaded
let isGoogleMapsLoaded = false;

const LocationInput: React.FC<LocationInputProps> = ({
    onLocationSelect,
    onAddressChange,
    placeholder = "Search for a location...",
    className = "",
    initialValue = ""
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState(initialValue);
    const autocompleteRef = useRef<any>(null);

    // Sync input value with external prop changes (like form resets)
    useEffect(() => {
        setInputValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        const initAutocomplete = () => {
            if (!inputRef.current || !window.google) return;

            autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
                fields: ["formatted_address", "geometry", "name"],
                types: ["establishment", "geocode"]
            });

            autocompleteRef.current.addListener("place_changed", () => {
                const place = autocompleteRef.current.getPlace();
                if (place.geometry && place.geometry.location) {
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    const address = place.formatted_address || place.name || "";
                    
                    setInputValue(address);
                    onLocationSelect({
                        address,
                        latitude: lat,
                        longitude: lng
                    });
                }
            });
        };

        if (window.google && window.google.maps && window.google.maps.places) {
            initAutocomplete();
        } else if (!isGoogleMapsLoaded) {
            const script = document.createElement("script");
            // NOTE: Ideally the API key should come from an environment variable
            const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || "";
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                isGoogleMapsLoaded = true;
                initAutocomplete();
            };
            document.head.appendChild(script);
        } else {
            // Script is loading, check periodically
            const checkInterval = setInterval(() => {
                if (window.google && window.google.maps && window.google.maps.places) {
                    initAutocomplete();
                    clearInterval(checkInterval);
                }
            }, 500);
            return () => clearInterval(checkInterval);
        }
    }, [onLocationSelect]);

    return (
        <div className="relative w-full">
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                    const val = e.target.value;
                    setInputValue(val);
                    if (onAddressChange) onAddressChange(val);
                }}
                className={className}
                placeholder={placeholder}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/40 pointer-events-none">
                search
            </span>
        </div>
    );
};

export default LocationInput;
