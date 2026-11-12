
function Login({ onLogin }) {
  return (
    <div className="section">
      <h1>Live Location Tracker</h1>

      <button onClick={onLogin}>
        Login with Google
      </button>
    </div>
  );
}

export default Login;
