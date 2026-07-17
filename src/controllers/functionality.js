import { auth, db, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, doc, setDoc, getDoc, onSnapshot, deleteDoc, collection, getDocs } from "../utils/firebase.js";

let currentUser = null;
let currentRoom = null;
let watchId = null;
let map = null;
let markers = {};
let unsubscribeRoom = null;

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


function showSection(sectionId) {
  loginSection.classList.add("hidden");
  dashboardSection.classList.add("hidden");
  mapSection.classList.add("hidden");
  document.getElementById(sectionId).classList.remove("hidden");
}


loginBtn.addEventListener("click", function () {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider).catch(function (error) {
    alert(`Login error: ${error.message}`);
  });
});


logoutBtn.addEventListener("click", () => {
  signOut(auth);
});


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


function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}


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


async function leaveRoom() {
  if (currentRoom != null && currentUser != null) {
    try {
      await deleteDoc(doc(db, "rooms", currentRoom, "members", currentUser.uid));
    } catch (e) {
      console.log("Error leaving room", e);
    }
  }


  if (watchId != null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  if (unsubscribeRoom != null) {
    unsubscribeRoom();
    unsubscribeRoom = null;
  }


  let ids = Object.keys(markers);
  for (let i = 0; i < ids.length; i++) {
    map.removeLayer(markers[ids[i]]);
  }
  markers = {};

  currentRoom = null;

  if (currentUser) {
    showSection("dashboard");
  }
}

leaveRoomBtn.addEventListener("click", leaveRoom);

copyRoomBtn.addEventListener("click", function () {
  navigator.clipboard.writeText(currentRoom);
  alert("Room key copied!");
});


async function getAddress(lat, lon) {

  try {
    let res = await fetch(
      `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=3a0335a01c244f04a3763233e25be3fe`,
    );
    let data = await res.json();
    return data.features[0].properties.formatted || "Unknown address";
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

      let address = await getAddress(latitude, longitude);


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
      

      if (change.type == "removed") {
        if (markers[memberId]) {
          map.removeLayer(markers[memberId]);
          delete markers[memberId];
        }
      }
    });
    
  });
}


function updateMarker(memberId, data) {
  let latLng = [data.latitude, data.longitude];
  const timeString = new Date().toLocaleTimeString("en-IN");

  const popupContent = `
        <div style="text-align: center;">
            <img src="${data.photoURL}" referrerpolicy="no-referrer" style="width:40px; height:40px; border-radius:50%;"><br>
            <strong>${data.displayName} ${memberId == currentUser.uid ? "(You)" : ""}</strong><br>
             ${data.address}<br>
             Updated: ${timeString}
        </div>
    `;

  if (markers[memberId]) {
    markers[memberId].setLatLng(latLng);
    markers[memberId].getPopup().setContent(popupContent);
  } else {
  
    let marker = L.marker(latLng).addTo(map);
    marker.bindPopup(popupContent);
    markers[memberId] = marker;
  }
}

