
import { useEffect, useRef, useState } from "react";
import { updateMemberLocation } from "../services/roomService";




async function getAddress(latitude, longitude) {
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;

  if (!apiKey) {
    console.error("Geoapify API key is missing!");
    return "Address unavailable";
  }

  try {
    const url = new URL(
      "https://api.geoapify.com/v1/geocode/reverse"
    );

    url.searchParams.set("lat", latitude);
    url.searchParams.set("lon", longitude);
    url.searchParams.set("apiKey", apiKey);

    const response = await fetch(url);

    if (!response.ok) {
      const errorBody = await response.text();

      console.error("Geoapify API error:", {
        status: response.status,
        response: errorBody,
      });

      return "Address unavailable";
    }

    const data = await response.json();

    return (
      data.features?.[0]?.properties?.formatted ||
      "Unknown address"
    );

  } catch (error) {
    console.error("Geoapify request failed:", error);
    return "Address unavailable";
  }
}


function useLocationTracking(roomId, user) {
  const watchId = useRef(null);

  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomId || !user) return;

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    let active = true;

    
const handleSuccess = async (position) => {
  if (!active) return;

  setError(null);

  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

  const speedKmH =
    position.coords.speed != null
      ? Math.round(position.coords.speed * 3.6)
      : 0;

  // Fetch readable address
  const address = await getAddress(latitude, longitude);

  if (!active) return;

  const locationData = {
    latitude,
    longitude,
    speed: speedKmH,
    address,
  };

  setLocation(locationData);

  try {
    await updateMemberLocation(
      roomId,
      user.uid,
      locationData
    );

    console.log("Firestore location updated:", locationData);

  } catch (err) {
    console.error("Location update failed:", err);
  }
};


    const handleError = (err) => {
  let errorMessage = "";

  switch (err.code) {
    case 1:
      errorMessage = "Location permission denied.";
      break;

    case 2:
      errorMessage = "Unable to determine location. Retrying...";
      break;

    case 3:
      errorMessage = "Location request timed out. Retrying...";
      break;

    default:
      errorMessage = "Unknown location error.";
  }

  console.warn("Geolocation:", errorMessage, {
    code: err.code,
    message: err.message,
  });

  setError(errorMessage);
};

    watchId.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000,
      }
    );

    return () => {
      active = false;

      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [roomId, user]);

  return { location, error };
}

export default useLocationTracking;
