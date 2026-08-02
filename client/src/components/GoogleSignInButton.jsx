import { useGoogleLogin } from "@react-oauth/google";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

/**
 * Custom-styled Google sign-in. Uses Google OAuth access token → userinfo.
 * Requires VITE_GOOGLE_CLIENT_ID and GoogleOAuthProvider in main.jsx.
 */
export default function GoogleSignInButton({ onSuccess, onError, onStart, disabled, className, children }) {
  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        disabled={disabled}
        className={className}
        onClick={() =>
          onError?.(
            "Google login setup pending. Add VITE_GOOGLE_CLIENT_ID in client/.env (see .env.example)."
          )
        }
      >
        {children}
      </button>
    );
  }

  return (
    <GoogleSignInReady
      onSuccess={onSuccess}
      onError={onError}
      onStart={onStart}
      disabled={disabled}
      className={className}
    >
      {children}
    </GoogleSignInReady>
  );
}

function GoogleSignInReady({ onSuccess, onError, onStart, disabled, className, children }) {
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        if (!res.ok) throw new Error("Could not load Google profile");
        const profile = await res.json();
        if (!profile.email) throw new Error("Google account has no email");
        onSuccess({
          name: profile.name || profile.given_name || profile.email.split("@")[0],
          email: profile.email,
          picture: profile.picture || null,
          provider: "google",
        });
      } catch (err) {
        onError?.(err.message || "Google login failed");
      }
    },
    onError: () => onError?.("Google sign-in was cancelled or failed"),
  });

  return (
    <button
      type="button"
      disabled={disabled}
      className={className}
      onClick={() => {
        onStart?.();
        googleLogin();
      }}
    >
      {children}
    </button>
  );
}

export function hasGoogleClientId() {
  return Boolean(CLIENT_ID);
}
