// @ts-nocheck
import {
    useManageSubscription,
    useSubscription,
    useW3iAccount,
    useInitWeb3InboxClient,
    useMessages
  } from '@web3inbox/widget-react'
  import { useCallback, useEffect } from 'react'
  import { useAddress  } from '@thirdweb-dev/react'
import { useSDK } from '@thirdweb-dev/react';
import styles from "../../styles/Home.module.css";

  export default function App() {
    const  address  = useAddress();
    const sdk = useSDK();
  
    const a = process.env.NEXT_PUBLIC_APP_WC_PROJECT_ID;
    // Initialize the Web3Inbox SDK
    const isReady = useInitWeb3InboxClient({
      // The project ID and domain you setup in the Domain Setup section
      // @ts-ignore
      a,
      domain: 'https://3000-thirdwebexample-lens-b5q8pefryol.ws-us106.gitpod.io',
  
      // Allow localhost development with "unlimited" mode.
      // This authorizes this dapp to control notification subscriptions for all domains (including `app.example.com`), not just `window.location.host`
      isLimited: false
    })
  
    const { account, setAccount, isRegistered, isRegistering, register } = useW3iAccount()
    useEffect(() => {
      if (!address) return
      // Convert the address into a CAIP-10 blockchain-agnostic account ID and update the Web3Inbox SDK with it
      setAccount(`eip155:1:${address}`)
    }, [address, setAccount])
  
    // In order to authorize the dapp to control subscriptions, the user needs to sign a SIWE message which happens automatically when `register()` is called.
    // Depending on the configuration of `domain` and `isLimited`, a different message is generated.
    const performRegistration = useCallback(async () => {
      if (!address) return
      try {
        await register(message => sdk?.wallet.sign( message ))
      } catch (registerIdentityError) {
        alert(registerIdentityError)
      }
    }, [sdk, register, address])
  
    useEffect(() => {
      // Register even if an identity key exists, to account for stale keys
      performRegistration()
    }, [performRegistration])
  
    const { isSubscribed, isSubscribing, subscribe } = useManageSubscription()
  
    const performSubscribe = useCallback(async () => {
      // Register again just in case
      await performRegistration()
      await subscribe()
    }, [subscribe, isRegistered])
  
    const { subscription } = useSubscription()
    const { messages } = useMessages()
  
    return (
      <>
        <div className={styles.container}>
        <div className={styles.iconContainer}>
        {!isReady ? (
          <div>Loading client...</div>
        ) : (
          <>
            {!address ? (
              <div>Connect your wallet</div>
            ) : (
              <>
                <div>Address: {address}</div>
                <div>Account ID: {account}</div>
                {!isRegistered ? (
                  <div>
                    To manage notifications, sign and register an identity key:&nbsp;
                    <button onClick={performRegistration} disabled={isRegistering}>
                      {isRegistering ? 'Signing...' : 'Sign'}
                    </button>
                  </div>
                ) : (
                  <>
                    {!isSubscribed ? (
                      <>
                        <button onClick={performSubscribe} disabled={isSubscribing}>
                          {isSubscribing ? 'Subscribing...' : 'Subscribe to notifications'}
                        </button>
                      </>
                    ) : (
                      <>
                        <div>You are subscribed</div>
                        <div>Subscription: {JSON.stringify(subscription)}</div>
                        <div>Messages: {JSON.stringify(messages)}</div>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
        </div>
        </div>
      </>
    )
  }