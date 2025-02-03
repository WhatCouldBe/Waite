import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import './FunActivitiesResults.css';
import Navbar from '../components/Navbar';

export default function FunActivitiesResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const [category, setCategory] = useState(initialCategory);
  const [location, setLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const categories = [
    { value: 'outdoor', label: 'Outdoor Activities' },
    { value: 'indoor', label: 'Indoor Activities' },
    { value: 'restaurants', label: 'Restaurants' },
    { value: 'entertainment', label: 'Entertainment' }
  ];
  const getCategoryLabel = (catValue) => {
    const found = categories.find(cat => cat.value === catValue);
    return found ? found.label : 'Fun Activities';
  };
  const [currentLabel, setCurrentLabel] = useState(getCategoryLabel(initialCategory));
  useEffect(() => {
    setCurrentLabel(getCategoryLabel(category));
    setSearchParams({ category });
  }, [category, setSearchParams]);
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => {
          console.error(err);
          setLocation({ lat: 39.8283, lng: -98.5795 });
        }
      );
    } else {
      setLocation({ lat: 39.8283, lng: -98.5795 });
    }
  }, []);
  const loadGoogleMapsScript = () => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
      } else {
        const existingScript = document.getElementById('googleMaps');
        if (existingScript) {
          existingScript.addEventListener('load', resolve);
          return;
        }
        const script = document.createElement('script');
        script.id = 'googleMaps';
        const clientKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${clientKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject('Google Maps script failed to load.');
        document.body.appendChild(script);
      }
    });
  };
  useEffect(() => {
    if (location) {
      loadGoogleMapsScript()
        .then(() => {
          if (mapRef.current) {
            const initMap = new window.google.maps.Map(mapRef.current, {
              center: location,
              zoom: 14,
              mapTypeId: 'satellite',
              mapTypeControlOptions: {
                style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: window.google.maps.ControlPosition.TOP_RIGHT,
                mapTypeIds: ['roadmap', 'satellite']
              },
              mapTypeControl: false
            });
            setMap(initMap);
          }
        })
        .catch(err => console.error(err));
    }
  }, [location]);
  useEffect(() => {
    if (!location || !category || !map) return;
    setLoading(true);
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);
    fetch(`/api/places?category=${category}&lat=${location.lat}&lng=${location.lng}`)
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.results) {
          setPlaces(data.results);
          const newMarkers = [];
          const infoWindow = new window.google.maps.InfoWindow();
          data.results.forEach(place => {
            if (place.geometry && place.geometry.location) {
              const pos = {
                lat: typeof place.geometry.location.lat === 'function'
                  ? place.geometry.location.lat()
                  : place.geometry.location.lat,
                lng: typeof place.geometry.location.lng === 'function'
                  ? place.geometry.location.lng()
                  : place.geometry.location.lng
              };
              const marker = new window.google.maps.Marker({
                position: pos,
                map: map,
                title: place.name
              });
              marker.addListener('click', () => {
                infoWindow.close();
                infoWindow.setContent(`<div style="max-width:200px;padding:5px;">
                  <h3 style="margin:0;font-size:16px;">${place.name}</h3>
                  <p style="margin:0;font-size:14px;">${place.formatted_address || place.vicinity || ''}</p>
                  </div>`);
                infoWindow.open(map, marker);
              });
              newMarkers.push(marker);
            }
          });
          setMarkers(newMarkers);
          if (data.results.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            data.results.forEach(place => {
              if (place.geometry && place.geometry.location) {
                const pos = {
                  lat: typeof place.geometry.location.lat === 'function'
                    ? place.geometry.location.lat()
                    : place.geometry.location.lat,
                  lng: typeof place.geometry.location.lng === 'function'
                    ? place.geometry.location.lng()
                    : place.geometry.location.lng
                };
                bounds.extend(pos);
              }
            });
            map.fitBounds(bounds);
          } else {
            map.setCenter(location);
          }
        } else {
          setPlaces([]);
        }
        if (window.google && window.google.maps && map) {
          window.google.maps.event.trigger(map, 'resize');
          map.setCenter(location);
        }
      })
      .catch(err => {
        console.error('Error fetching places:', err);
        setLoading(false);
      });
  }, [category, location, map]);
  return (
    <div className="fun-activities-results-container">
      <Navbar onSignOut={() => {
        localStorage.removeItem('bacshotsUser');
        window.location.href = '/signin';
      }} />
      <div className="fun-activities-results-content">
        <div className="results-header">
          <h2>{currentLabel}</h2>
          <div className="controls-container">
            <div className="category-selector-manual">
              <select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="" disabled>Select a category</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="results-layout">
          <div className="results-list">
            <div className="results-items">
              {loading ? (
                <p>Searching for activities...</p>
              ) : places.length === 0 ? (
                <p>No activities found. Try a different category.</p>
              ) : (
                places.map(place => (
                  <div key={place.place_id} className="place-item">
                    <h3>{place.name}</h3>
                    <p>{place.formatted_address || place.vicinity}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="results-map">
            <div className="map-container" ref={mapRef}>
              {!location && <p>Loading map...</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
