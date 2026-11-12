
function Header({
  roomId,
  members = [],
  onShare,
  onLeave,
  onSOS,
  isSOSActive,
}) {
  return (
    <div className="header">

      <div>
        <span id="roomDisplay">
          Room: {roomId}
        </span>

        <p style={{ margin: "5px 0 0", fontSize: "13px" }}>
          {members.length} member(s) connected
        </p>
      </div>

      <button onClick={onShare}>
        Share Link
      </button>

      <button onClick={onLeave}>
        Leave Space
      </button>

      <button
        id="sosBtn"
        onClick={onSOS}
      >
        {isSOSActive ? "Cancel SOS" : "SOS"}
      </button>

    </div>
  );
}

export default Header;
