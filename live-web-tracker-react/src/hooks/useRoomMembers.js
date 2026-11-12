
import { useEffect, useState } from "react";
import { subscribeToMembers } from "../services/roomService";

function useRoomMembers(roomId) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!roomId) {
      setMembers([]);
      return;
    }

    const unsubscribe = subscribeToMembers(
      roomId,
      (updatedMembers) => {
        setMembers(updatedMembers);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [roomId]);

  return members;
}

export default useRoomMembers;
