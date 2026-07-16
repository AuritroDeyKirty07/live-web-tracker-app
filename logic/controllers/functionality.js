import { auth, db, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, doc, setDoc, getDoc, onSnapshot, deleteDoc, collection, getDocs } from "../firebase.js";

// Global Variables
let currentUser = null;
let currentRoom = null;
let watchId = null;
let map = null;
let markers = {};
let unsubscribeRoom = null;
let lastKnownLocation = null;
let addressCache = {};

// DOM Elements
const loginSection = document.getElementById("login");
const dashboardSection = document.getElementById("dashboard");
const mapSection = document.getElementById("mapContainer");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const createSpaceBtn = document.getElementById("createSpaceBtn");
const joinSpaceBtn = document.getElementById("joinSpaceBtn");
const leaveRoomBtn = document.getElementById("leaveRoomBtn");
const copyRoomBtn = document.getElementById("copyRoomBtn");
const roomInput = document.getElementById("roomInput");
const roomDisplay = document.getElementById("roomDisplay");

// Helper function to switch screens
function showSection(sectionId) {
  loginSection.classList.add("hidden");
  dashboardSection.classList.add("hidden");
  mapSection.classList.add("hidden");
  document.getElementById(sectionId).classList.remove("hidden");
}

// Login functionality
loginBtn.addEventListener("click", function () {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider).catch(function (error) {
    alert(`Login error: ${error.message}`);
  });
});

// Logout functionality
logoutBtn.addEventListener("click", () => {
  signOut(auth);
});

// Watch for user login/logout state changes
onAuthStateChanged(auth, function (user) {
  if (user) {
    currentUser = user;
    document.getElementById("userName").innerText = user.displayName;
    document.getElementById("userPic").src = user.photoURL || "";
    if (currentRoom == null) {
      showSection("dashboard");
    }
  } else {
    currentUser = null;
    leaveRoom();
    showSection("login");
  }
});

// Generate a random 6-character room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create Space Logic
createSpaceBtn.addEventListener("click", async function () {
  try {
    const roomId = generateRoomCode();
    await setDoc(doc(db, "rooms", roomId), {
      createdAt: new Date().toISOString(),
      createdBy: currentUser.uid,
    });
    joinRoom(roomId);
  } catch (e) {
    console.error("Create space error:", e);
    alert(
      `Error creating space: ${e.message}\n\nMake sure Cloud Firestore Database is created in your Firebase Console!`,
    );
  }
});

// Join Space Logic
joinSpaceBtn.addEventListener("click", async () => {
  const roomId = roomInput.value.trim().toUpperCase();

  if (roomId.length == 0) {
    alert("Please enter a room key");
    return;
  }

  try {
    let roomSnap = await getDoc(doc(db, "rooms", roomId));
    if (roomSnap.exists()) {
      joinRoom(roomId);
    } else {
      alert("Room not found!");
    }
  } catch (e) {
    console.error("Join space error:", e);
    alert(
      `Error joining space: ${e.message}\n\nMake sure Cloud Firestore Database is created in your Firebase Console!`,
    );
  }
});

// Join a specific room and initialize the map
async function joinRoom(roomId) {
  currentRoom = roomId;
  roomDisplay.innerText = `Room: ${roomId}`;
  showSection("mapContainer");

  if (map == null) {
    map = L.map("map").setView([20, 78], 4);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);
  }

  startLocationTracking();
  listenToRoom(roomId);
}

// Leave the current room and cleanup
async function leaveRoom() {
  if (currentRoom != null && currentUser != null) {
    try {
      const roomToLeave = currentRoom;
      // Remove self from members list
      await deleteDoc(
        doc(db, "rooms", roomToLeave, "members", currentUser.uid),
      );

      // If room is empty, delete the room itself
      let membersSnap = await getDocs(
        collection(db, "rooms", roomToLeave, "members"),
      );
      if (membersSnap.empty) {
        await deleteDoc(doc(db, "rooms", roomToLeave));
      }
    } catch (e) {
      console.log("Error leaving room", e);
    }
  }

  // Stop tracking location
  if (watchId != null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  // Stop listening to database changes
  if (unsubscribeRoom != null) {
    unsubscribeRoom();
    unsubscribeRoom = null;
  }

  // Remove all markers from the map
  let ids = Object.keys(markers);
  for (let i = 0; i < ids.length; i++) {
    map.removeLayer(markers[ids[i]]);
  }
  markers = {};

  currentRoom = null;
  lastKnownLocation = null;

  if (currentUser) {
    showSection("dashboard");
  }
}

leaveRoomBtn.addEventListener("click", leaveRoom);

copyRoomBtn.addEventListener("click", function () {
  navigator.clipboard.writeText(currentRoom);
  alert("Room key copied!");
});

// Get human-readable address from coordinates
async function getAddress(lat, lon) {
  const cacheKey = `${lat},${lon}`;
  if (addressCache[cacheKey]) {
    return addressCache[cacheKey];
  }

  try {
    let res = await fetch(
      `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=3a0335a01c244f04a3763233e25be3fe`,
    );
    let data = await res.json();
    console.log(data);
    let address = data.features[0].properties.formatted || "Unknown address";
    addressCache[cacheKey] = address;
    return address;
  } catch (e) {
    return "Address unavailable";
  }
}

// Track user's location continuously
function startLocationTracking() {
  if (!("geolocation" in navigator)) {
    alert("Geolocation not available in this browser");
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    async function (position) {
      let latitude = position.coords.latitude;
      let longitude = position.coords.longitude;

      // Only update if moved significantly to save API calls
      if (lastKnownLocation != null) {
        let latDiff = Math.abs(lastKnownLocation.lat - latitude);
        let lonDiff = Math.abs(lastKnownLocation.lon - longitude);

        if (latDiff < 0.0001 && lonDiff < 0.0001) {
          return;
        }
      }

      lastKnownLocation = { lat: latitude, lon: longitude };
      let address = await getAddress(latitude, longitude);

      // Update location in Firestore
      let memberRef = doc(db, "rooms", currentRoom, "members", currentUser.uid);
      await setDoc(memberRef, {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        latitude: latitude,
        longitude: longitude,
        address: address,
        lastUpdated: new Date().toISOString(),
      });
    },
    function (error) {
      console.log("Location error: ", error);
    },
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 },
  );
}

// Listen for updates from other members in the room
function listenToRoom(roomId) {
  let membersRef = collection(db, "rooms", roomId, "members");
  unsubscribeRoom = onSnapshot(membersRef, function (snapshot) {
    snapshot.docChanges().forEach(function (change) {
      let memberId = change.doc.id;
      let data = change.doc.data();

      // Add or move marker
      if (change.type == "added" || change.type == "modified") {
        updateMarker(memberId, data);
      }
      
      // Remove marker if member left
      if (change.type == "removed") {
        if (markers[memberId]) {
          map.removeLayer(markers[memberId]);
          delete markers[memberId];
        }
      }
    });

    // Auto-adjust map to show everyone
    let keys = Object.keys(markers);
    if (keys.length > 0) {
      let allMarkers = [];
      for (let j = 0; j < keys.length; j++) {
        allMarkers.push(markers[keys[j]]);
      }
      let group = new L.featureGroup(allMarkers);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  });
}

// Place or update a marker on the map
function updateMarker(memberId, data) {
  let latLng = [data.latitude, data.longitude];
  let isMe = false;
  if (memberId == currentUser.uid) {
    isMe = true;
  }

  const now = new Date();
  const timeString = now.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const popupContent = `
        <div style="text-align: center;">
            <img src="${data.photoURL}" referrerpolicy="no-referrer" style="width:40px; height:40px; border-radius:50%;"><br>
            <strong>${data.displayName} ${isMe ? "(You)" : ""}</strong><br>
             ${data.address}<br>
             Updated: ${timeString}
        </div>
    `;

  if (markers[memberId]) {
    // If marker already exists, just move it
    markers[memberId].setLatLng(latLng);
    markers[memberId].getPopup().setContent(popupContent);
  } else {
    // If new member, create a new marker
    let marker;
    if (isMe == true) {
      let myIcon = L.icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      marker = L.marker(latLng, { icon: myIcon }).addTo(map);
    } else {
      marker = L.marker(latLng).addTo(map);
    }
    marker.bindPopup(popupContent);
    markers[memberId] = marker;
  }
}

// Cleanup if the user closes the tab suddenly
window.addEventListener("beforeunload", function () {
  if (currentRoom != null && currentUser != null) {
    const roomToLeave = currentRoom;
    deleteDoc(doc(db, "rooms", roomToLeave, "members", currentUser.uid)).then(
      () => {
        getDocs(collection(db, "rooms", roomToLeave, "members")).then(
          (snap) => {
            if (snap.empty) {
              deleteDoc(doc(db, "rooms", roomToLeave));
            }
          },
        );
      },
    );
  }
});
