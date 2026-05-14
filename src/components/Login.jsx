import { auth } from "../firebase";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import googleIcon from "../assets/google-brand-color.svg";

function Login() {
  const handleLogin = async () => {
    try {
      const result = await FirebaseAuthentication.signInWithGoogle();
      const credential = GoogleAuthProvider.credential(
        result.credential?.idToken,
        result.credential?.accessToken
      );
      await signInWithCredential(auth, credential);
    } catch (error) {
      console.error("ログイン失敗:", error.code, error.message);
    }
  };

  return (
    <div className="login-page" style={{ textAlign: "center", marginTop: "40px" }}>
      <h2>ログイン</h2>
      <button className="login-btn" onClick={handleLogin}><img className="login-icon" src={googleIcon} alt="" /> でログイン</button>
    </div>
  );
}

export default Login;
