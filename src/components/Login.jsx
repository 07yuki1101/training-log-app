import { auth } from "../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import googleIcon from "../assets/google-brand-color.svg";
function Login() {
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("ログイン失敗:", error);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h2>ログイン</h2>
      <button className="login-btn" onClick={handleLogin}><img className="login-icon" src={googleIcon} alt="" /> でログイン</button>
    </div>
  );
}

export default Login;
