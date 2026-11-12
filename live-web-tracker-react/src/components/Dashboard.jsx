
function Dashboard({
  user,
  onLogout,
  onCreateSpace,
  onJoinSpace,
  roomInput,
  setRoomInput,
}) {
  return (
    <div className="section">

      <div className="user">
        <img
          src={user.photoURL}
          alt="Profile"
        />

        <h2>{user.displayName}</h2>
      </div>

      <button onClick={onLogout}>
        Logout
      </button>

      <hr />

      <div className="actions">

        <h3>Create a Space</h3>

        <button onClick={onCreateSpace}>
          Create Space
        </button>

        <h3>Or Join a Space</h3>

        <input
          type="text"
          placeholder="Enter Room Key"
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value)}
        />

        <button onClick={onJoinSpace}>
          Join Space
        </button>

      </div>
    </div>
  );
}

export default Dashboard;
