import {
  db,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocs,
} from "./firebase";

export async function addMember(roomId, user) {
  const memberRef = doc(
    db,
    "rooms",
    roomId,
    "members",
    user.uid
  );

  const existingMember = await getDoc(memberRef);
  const existingData = existingMember.exists()
    ? existingMember.data()
    : {};

  await setDoc(
    memberRef,
    {
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL,
      joinedAt: existingData.joinedAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      isSOS: existingData.isSOS ?? false,
    },
    { merge: true }
  );
}


export async function removeMember(roomId, uid) {
  try {
    // 1. Remove the departing member
    const memberRef = doc(
      db,
      "rooms",
      roomId,
      "members",
      uid
    );

    await deleteDoc(memberRef);

    console.log(`Member ${uid} removed from room ${roomId}`);

    // 2. Check remaining members
    const membersRef = collection(
      db,
      "rooms",
      roomId,
      "members"
    );

    const membersSnap = await getDocs(membersRef);

    // 3. Delete room if no members remain
    if (membersSnap.empty) {
      const roomRef = doc(db, "rooms", roomId);

      await deleteDoc(roomRef);

      console.log(`Empty room ${roomId} deleted from Firestore`);

      return { roomDeleted: true };
    }

    console.log(
      `Room ${roomId} still has ${membersSnap.size} active member(s)`
    );

    return { roomDeleted: false };

  } catch (error) {
    console.error("Member removal / room cleanup failed:", error);
    throw error;
  }
}


export function subscribeToMembers(roomId, callback) {
  const membersRef = collection(
    db,
    "rooms",
    roomId,
    "members"
  );

  return onSnapshot(membersRef, (snapshot) => {
    const members = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));

    callback(members);
  });
}


export async function updateMemberLocation(roomId, uid, locationData) {
  const memberRef = doc(
    db,
    "rooms",
    roomId,
    "members",
    uid
  );

  await setDoc(
    memberRef,
    {
      ...locationData,
      lastUpdated: new Date().toISOString(),
    },
    { merge: true }
  );
}


export async function updateMemberSOS(roomId, uid, isSOS) {
  const memberRef = doc(
    db,
    "rooms",
    roomId,
    "members",
    uid
  );

  await setDoc(
    memberRef,
    {
      isSOS,
      sosUpdatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  console.log(
    `SOS ${isSOS ? "activated" : "deactivated"} for ${uid}`
  );
}
