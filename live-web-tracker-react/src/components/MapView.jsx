
import { useEffect, useRef } from "react";
import L from "leaflet";

function MapView({ members, currentUser }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const lastFocusedSOSRef = useRef(null);

  // Initialize map only once
  useEffect(() => {
    if (mapInstance.current) return;

    const map = L.map(mapRef.current).setView(
      [20, 78],
      4
    );

    L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap",
      }
    ).addTo(map);

    mapInstance.current = map;

    return () => {
      Object.values(markersRef.current).forEach(
        (marker) => marker.remove()
      );

      markersRef.current = {};

      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update markers whenever members change
  useEffect(() => {
    const map = mapInstance.current;

    if (!map) return;

    const activeIds = new Set(
      members
        .filter(
          (member) =>
            typeof member.latitude === "number" &&
            typeof member.longitude === "number"
        )
        .map((member) => member.uid)
    );

    // Remove markers of users who left
    Object.keys(markersRef.current).forEach((uid) => {
      if (!activeIds.has(uid)) {
        markersRef.current[uid].remove();
        delete markersRef.current[uid];
      }
    });

    // Add or update markers
    members.forEach((member) => {
      if (
        typeof member.latitude !== "number" ||
        typeof member.longitude !== "number"
      ) {
        return;
      }

      const position = [
        member.latitude,
        member.longitude,
      ];

      const popupContent = `
        <div style="text-align:center">
          <img
            src="${member.photoURL || ""}"
            style="width:40px;height:40px;border-radius:50%"
            referrerpolicy="no-referrer"
          />
          <br/>
          <strong>
            ${member.displayName || "User"}
            ${member.uid === currentUser?.uid ? "(You)" : ""}
          </strong>
          <br/>
          ${member.address || "Address unavailable"}
          <br/>
          Speed: ${member.speed ?? 0} km/h
          <br/>
          ${member.speed > 2 ? "Moving" : "Stationary"}
        </div>
      `;

      if (markersRef.current[member.uid]) {
        const marker = markersRef.current[member.uid];

        marker.setLatLng(position);
        marker.getPopup()?.setContent(popupContent);

      } else {
        const marker = L.marker(position).addTo(map);

        marker.bindPopup(popupContent);

        markersRef.current[member.uid] = marker;
      }

      // Highlight SOS users
      const marker = markersRef.current[member.uid];

      if (marker._icon) {
        marker._icon.style.filter = member.isSOS
          ? "hue-rotate(150deg)"
          : "none";
      }
    });

    
// Automatically fit all active members inside the map
const validMembers = members.filter(
  (member) =>
    typeof member.latitude === "number" &&
    typeof member.longitude === "number"
);

if (validMembers.length === 1) {
  const member = validMembers[0];

  const fitKey = `${member.uid}:${member.latitude.toFixed(3)}:${member.longitude.toFixed(3)}`;

  if (map._lastFitKey !== fitKey) {
    map.flyTo(
      [member.latitude, member.longitude],
      16,
      { animate: true }
    );

    map._lastFitKey = fitKey;
  }
}

if (validMembers.length >= 2) {
  const bounds = L.latLngBounds(
    validMembers.map((member) => [
      member.latitude,
      member.longitude,
    ])
  );

  // Avoid unnecessary zoom changes for tiny GPS movements
  const fitKey = validMembers
    .map((member) =>
      `${member.uid}:${member.latitude.toFixed(3)}:${member.longitude.toFixed(3)}`
    )
    .sort()
    .join("|");

  if (map._lastFitKey !== fitKey) {
    map.flyToBounds(bounds, {
      padding: [60, 60],
      maxZoom: 15,
      animate: true,
      duration: 1,
    });

    map._lastFitKey = fitKey;
  }
}


  }, [members, currentUser]);

  // Automatically focus map on newly activated SOS
useEffect(() => {
  const map = mapInstance.current;

  if (!map) return;

  const sosMember = members.find(
    (member) =>
      member.isSOS &&
      typeof member.latitude === "number" &&
      typeof member.longitude === "number"
  );

  if (!sosMember) {
    lastFocusedSOSRef.current = null;
    return;
  }

  if (lastFocusedSOSRef.current === sosMember.uid) {
    return;
  }

  map.flyTo(
    [sosMember.latitude, sosMember.longitude],
    17,
    { duration: 1.5 }
  );

  const marker = markersRef.current[sosMember.uid];

  if (marker) {
    setTimeout(() => marker.openPopup(), 1500);
  }

  lastFocusedSOSRef.current = sosMember.uid;

}, [members]);

  return (
    <div
      ref={mapRef}
      id="map"
      style={{
        width: "100%",
        flex: 1,
        minHeight: "400px",
        borderRadius: "12px",
      }}
    />
  );
}

export default MapView;
