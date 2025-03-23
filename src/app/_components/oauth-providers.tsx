import GoogleIcon from "@/components/icons/google-icon";
import { Button } from "@/components/ui/button";
import ButtonLoader from "@/components/ui/ButtonLoader";
import { AuthContext } from "@/context/auth-provider";
import { signIn } from "next-auth/react";
import React, { useCallback, useContext } from "react";
import { toast } from "sonner";

export default function OauthProvider() {
  const { loadingProvider, setLoadingProvider, callbackUrl } =
    useContext(AuthContext);

  const handleSignInWithGoogle = useCallback(async () => {
    try {
      setLoadingProvider("google");
      await signIn("google", {
        redirect: true,
        redirectTo: callbackUrl ?? "/",
      });
    } catch (error) {
      toast.error("Failed to sign in with google", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoadingProvider(null);
    }
  }, [callbackUrl, setLoadingProvider]);

  return (
    <Button
      variant="outline"
      className="sm:cursor-pointer"
      onClick={handleSignInWithGoogle}
      disabled={!!loadingProvider}
    >
      <ButtonLoader loading={loadingProvider === "google"}>
        <GoogleIcon />
      </ButtonLoader>
      Sign in with Google
    </Button>
  );
}
