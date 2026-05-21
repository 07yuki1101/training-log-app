import { auth } from "../firebase";
import { GoogleAuthProvider, OAuthProvider, signInWithCredential } from "firebase/auth";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import googleIcon from "../assets/google-brand-color.svg";

function Login() {
  const handleGoogleLogin = async () => {
    try {
      const result = await FirebaseAuthentication.signInWithGoogle();
      const credential = GoogleAuthProvider.credential(
        result.credential?.idToken,
        result.credential?.accessToken
      );
      await signInWithCredential(auth, credential);
    } catch (error) {
      console.error("Googleログイン失敗:", error.code, error.message);
    }
  };

  const handleAppleLogin = async () => {
    try {
      const result = await FirebaseAuthentication.signInWithApple();
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: result.credential?.idToken,
        rawNonce: result.credential?.nonce,
      });
      await signInWithCredential(auth, credential);
    } catch (error) {
      console.error("Appleログイン失敗:", error.code, error.message);
    }
  };

  return (
    <div className="login-page" style={{ textAlign: "center", marginTop: "40px" }}>
      <h2>ログイン</h2>
      <button className="login-btn" onClick={handleGoogleLogin}>
        <img className="login-icon" src={googleIcon} alt="" /> Googleでログイン
      </button>
      <button className="login-btn apple-btn" onClick={handleAppleLogin}>
        <span style={{ fontSize: 20, marginRight: 8 }}>&#xf8ff;</span> Appleでログイン
      </button>
    </div>
  );
}

export default Login;
