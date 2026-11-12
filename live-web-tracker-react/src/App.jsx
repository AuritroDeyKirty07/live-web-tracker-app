
import { useEffect, useState, useRef } from "react";

import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Header from "./components/Header";
import MapView from "./components/MapView";
import {
  addMember,
  removeMember,
  updateMemberSOS,
} from "./services/roomService";

import useRoomMembers from "./hooks/useRoomMembers";

import {
  auth,
  db,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  doc,
  setDoc,
  getDoc,
  authReady,
} from "./services/firebase";
import useLocationTracking from "./hooks/useLocationTracking";



function playSOSAlert() {
  try {
    const AudioContext =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) return;

    const audioContext = new AudioContext();

    const playBeep = (frequency, startTime) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(
        0.3,
        startTime + 0.05
      );
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        startTime + 0.4
      );

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.4);
    };

    const startTime = audioContext.currentTime;

    playBeep(880, startTime);
    playBeep(660, startTime + 0.5);
    playBeep(880, startTime + 1);

    setTimeout(() => {
      audioContext.close();
    }, 1800);

  } catch (error) {
    console.error("SOS sound failed:", error);
  }
}

function App() {
  const [user, setUser] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [roomInput, setRoomInput] = useState("");
  const [isSOSActive, setIsSOSActive] = useState(false);
  const members = useRoomMembers(roomId);
  const { location, error: locationError } =
    useLocationTracking(roomId, user);

const previousSOSMembers = useRef(null);

const activeSOSMembers = members.filter(
  (member) => member.isSOS
);

// Sync current user's SOS button with Firestore
useEffect(() => {
  if (!user || !roomId) {
    setIsSOSActive(false);
    return;
  }

  const myMember = members.find(
    (member) => member.uid === user.uid
  );

  setIsSOSActive(myMember?.isSOS ?? false);
}, [members, user, roomId]);

// Detect newly activated SOS from other members
useEffect(() => {
  const currentSOSIds = new Set(
    activeSOSMembers.map((member) => member.uid)
  );

  // First snapshot: initialize without playing an alert
  if (previousSOSMembers.current === null) {
    previousSOSMembers.current = currentSOSIds;
    return;
  }

  const newSOS = activeSOSMembers.some(
    (member) =>
      member.uid !== user?.uid &&
      !previousSOSMembers.current.has(member.uid)
  );

  if (newSOS) {
    playSOSAlert();
  }

  previousSOSMembers.current = currentSOSIds;
}, [members, user]);

useEffect(() => {
  if (!user || !roomId) {
    setIsSOSActive(false);
    return;
  }

  const myMember = members.find(
    (member) => member.uid === user.uid
  );

  setIsSOSActive(myMember?.isSOS ?? false);

}, [members, user, roomId]);

  // Authentication listener
  useEffect(() => {
  let unsubscribe = null;
  let active = true;

  const initializeAuth = async () => {
    try {
      await authReady;

      if (!active) return;

      unsubscribe = onAuthStateChanged(
        auth,
        async (currentUser) => {
          if (!active) return;

          setUser(currentUser);

          if (currentUser) {
            const savedRoomId = localStorage.getItem("activeRoomId");

            if (savedRoomId) {
              try {
                const roomRef = doc(db, "rooms", savedRoomId);
                const roomSnap = await getDoc(roomRef);

                if (!active) return;

                if (roomSnap.exists()) {
                  await addMember(savedRoomId, currentUser);

                  if (!active) return;

                  setRoomId(savedRoomId);
                  console.log("Restored room:", savedRoomId);
                } else {
                  localStorage.removeItem("activeRoomId");
                  setRoomId(null);
                }
              } catch (error) {
                console.error("Room restoration failed:", error);
                setRoomId(null);
              }
            }
          } else {
            setRoomId(null);
          }
        }
      );
    } catch (error) {
      console.error("Authentication initialization failed:", error);
    }
  };

  initializeAuth();

  return () => {
    active = false;
    unsubscribe?.();
  };
}, []);

  // Google Login
  const handleLogin = async () => {
  try {
    await authReady;

    const provider = new GoogleAuthProvider();

    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Login error:", error);
    alert(error.message);
  }
};

  const handleLogout = async () => {
  try {
    if (roomId && user) {
      await removeMember(roomId, user.uid);
    }

    localStorage.removeItem("activeRoomId");

    await signOut(auth);

    setRoomId(null);

  } catch (error) {
    console.error("Logout error:", error);
  }
};

  // Generate unique room code
  const generateRoomCode = () => {
    return Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
  };

  const handleCreateSpace = async () => {
    try {
      const newRoomId = generateRoomCode();

      await setDoc(doc(db, "rooms", newRoomId), {
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
      });

      // Register creator as first room member
      await addMember(newRoomId, user);

      localStorage.setItem("activeRoomId", newRoomId);
setRoomId(newRoomId);

      console.log("Room created:", newRoomId);

    } catch (error) {
      console.error("Create room error:", error);
      alert("Unable to create room");
    }
  };

  const handleJoinSpace = async () => {
    try {
      const enteredRoomId = roomInput.trim().toUpperCase();

      if (!enteredRoomId) {
        alert("Please enter a room key");
        return;
      }

      const roomRef = doc(db, "rooms", enteredRoomId);
      const roomSnap = await getDoc(roomRef);

      if (roomSnap.exists()) {

        await addMember(enteredRoomId, user);

        localStorage.setItem("activeRoomId", enteredRoomId);
setRoomId(enteredRoomId);

        console.log("Joined room:", enteredRoomId);

      } else {
        alert("Room not found!");
      }

    } catch (error) {
      console.error("Join room error:", error);
      alert("Unable to join room");
    }
  };

  const handleShare = async () => {
    if (!roomId) return;

    const link = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

    try {
      await navigator.clipboard.writeText(link);
      alert("Room link copied!");
    } catch (error) {
      console.error("Clipboard error:", error);
      alert("Unable to copy link");
    }
  };

  
const handleSOS = async () => {
  if (!roomId || !user) return;

  const newSOSStatus = !isSOSActive;

  try {
    await updateMemberSOS(
      roomId,
      user.uid,
      newSOSStatus
    );

    setIsSOSActive(newSOSStatus);

  } catch (error) {
    console.error("SOS update failed:", error);
    alert("Unable to update SOS status");
  }
};

  const handleLeave = async () => {
  try {
    if (roomId && user) {
      await removeMember(roomId, user.uid);
    }

    localStorage.removeItem("activeRoomId");

    setRoomId(null);
    setIsSOSActive(false);

  } catch (error) {
    console.error("Leave room error:", error);
    alert("Unable to leave room");
  }
};

  return (
    <>
      {!user && (
        <Login onLogin={handleLogin} />
      )}

      {user && !roomId && (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          onCreateSpace={handleCreateSpace}
          onJoinSpace={handleJoinSpace}
          roomInput={roomInput}
          setRoomInput={setRoomInput}
        />
      )}

      {user && roomId && (
        <div id="mapContainer">
          <Header
            roomId={roomId}
            isSOSActive={isSOSActive}
            members={members}
            onSOS={handleSOS}
            onLeave={handleLeave}
            onShare={handleShare}
          />
          {activeSOSMembers.length > 0 && (
  <div className="sos-alert-container">
    <div className="sos-alert-heading">
      <span className="sos-alert-icon"></span>
      EMERGENCY ALERT
    </div>

    {activeSOSMembers.map((member) => (
      <div className="sos-alert-member" key={member.uid}>
        <div>
          <strong>
            {member.displayName || "Unknown Member"}
            {member.uid === user.uid ? " (You)" : ""}
          </strong>

          <p>
            {member.address || "Location unavailable"}
          </p>

          {typeof member.latitude === "number" &&
            typeof member.longitude === "number" && (
              <small>
                {member.latitude.toFixed(5)},{" "}
                {member.longitude.toFixed(5)}
              </small>
            )}
        </div>

        <span className="sos-active-label">
          SOS ACTIVE
        </span>
      </div>
    ))}
  </div>
)}
          <div style={{
            padding: "10px",
            color: "#8b949e",
            fontSize: "13px"
          }}>
            {location && (
              <p>
                Location: {location.latitude.toFixed(5)},
                {" "}{location.longitude.toFixed(5)}
              </p>
            )}

            {locationError && (
              <p style={{ color: "#f85149" }}>
                Location Error: {locationError}
              </p>
            )}

            {!location && !locationError && (
              <p>Acquiring location...</p>
            )}
          </div>

          <MapView
  members={members}
  currentUser={user}
/>
        </div>
      )}
    </>
  );
}

export default App;
