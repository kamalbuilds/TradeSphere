import {
  ChainId,
  ConnectWallet,
  useAddress,
  useNetwork,
  useNetworkMismatch,
  useSDK,
} from "@thirdweb-dev/react";
import Link from "next/link";
import styles from "./Header.module.css";
import useLensUser from "../../utils/useLensUser";
import login from "../../utils/login";
import { useContext } from "react";
import { AccountAbstractionContext } from "../../contexts/AccountAbstractionContext";
import { useRouter } from "next/router";

export default function Header() {
  const sdk = useSDK();
  const address = useAddress();
  const isWrongNetwork = useNetworkMismatch();
  const [, switchNetwork] = useNetwork();
  const { isSignedIn, setIsSignedIn, loadingSignIn, profile, loadingProfile } =
    useLensUser();

  const { safeSelected, logoutWeb3Auth, loginWeb3Auth } = useContext(AccountAbstractionContext);


  async function signIn() {
    if (!address || !sdk) return;

    if (isWrongNetwork) {
      switchNetwork?.(ChainId.Polygon);
      return;
    }

    await login(address, sdk);
    setIsSignedIn(true);
  }

  const router = useRouter();
  const { pathname } = router;

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.homeNavigator}>
        <img src="/lens.jpeg" alt="Lens Logo" className={styles.logo} />
        <h1 className={styles.logoText}>Lens SocialFI</h1>
      </Link>

      {safeSelected ? <>

        <div onClick={logoutWeb3Auth} className="bg-white rounded-md text-black px-[14px] py-[7px]"> Log out</div>

      </> : <div className="flex flex-row gap-2">
        {pathname !== '/safe' && <RightSide />}
        {!address && <Link href='/safe' className="bg-white font-medium flex items-center rounded-md text-black px-[14px] py-[7px]">Connect with safe</Link>}
      </div>}

      {!safeSelected && <div onClick={loginWeb3Auth} className="bg-white rounded-md text-black px-[14px] py-[7px]"> Log In</div>
      }
    </div>
  );

  // Separate component for what to show on right side
  function RightSide() {
    // Connect Wallet First
    if (!address) {
      return (
        <div style={{ marginRight: 12 }}>
          <ConnectWallet />
        </div>
      );
    }

    // Loading sign in state
    if (loadingSignIn) {
      return <div>Loading...</div>;
    }

    // Not signed in
    if (!isSignedIn) {
      return (
        <button className={styles.signInButton} onClick={signIn}>
          {isWrongNetwork ? "Switch Network" : "Sign In with Lens"}
        </button>
      );
    }

    // Loading profile
    if (loadingProfile) {
      return <div>Loading...</div>;
    }

    // Is signed in but doesn't have profile
    if (!profile) {
      return <p className={styles.profileName}>No Lens profile.</p>;
    }

    // Is signed in and has profile
    return <p className={styles.profileName}>@{profile.handle} </p>;
  }
}
