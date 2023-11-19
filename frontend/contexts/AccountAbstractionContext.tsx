"use client"
import { createContext, useCallback, useEffect, useState } from "react";
import { Web3AuthOptions } from '@web3auth/modal';
import { CHAIN_NAMESPACES, WALLET_ADAPTERS } from "@web3auth/base";
import { Web3AuthModalPack } from '@safe-global/auth-kit';
import { ethers, utils } from "ethers";
import { GelatoRelayPack } from '@safe-global/relay-kit'
import AccountAbstraction from '@safe-global/account-abstraction-kit-poc'
import { MetaTransactionData, MetaTransactionOptions } from "@safe-global/safe-core-sdk-types";
import getChain from "../helpers/getChain";
import { Chain, initialChain } from "../const/chain";
import usePolling from "../hooks/usePolling";


type accountAbstractionContextValue = {
    ownerAddress: string,
    loadingWeb3Auth: boolean,
    chainId: string,
    chain?: Chain
    safeBalance: string | undefined,
    isAuthenticated: boolean,
    web3Provider: ethers.providers.Web3Provider | undefined,
    safeSelected: string,
    userInfo: any,
    gelatoTaskId: string | undefined,
    isRelayerLoading: boolean,
    loginWeb3Auth: () => void,
    getProvider: () => void,
    logoutWeb3Auth: () => void,
    relayTransaction: () => void,
}

const initialState = {
    ownerAddress: '',
    loadingWeb3Auth: false,
    chainId: '',
    safeBalance: '',
    isAuthenticated: false,
    web3Provider: undefined,
    safeSelected: '',
    userInfo: null,
    gelatoTaskId: '',
    isRelayerLoading: false,
    loginWeb3Auth: () => { },
    getProvider: () => { },
    logoutWeb3Auth: () => { },
    relayTransaction: () => { }

}


export const AccountAbstractionContext = createContext<accountAbstractionContextValue>(initialState);

const AccountAbstractionProvider = ({ children }: any) => {

    const [loadingWeb3Auth, setLoadingWeb3Auth] = useState<boolean>(false);
    const [web3AuthModalPack, setWeb3AuthModalPack] = useState<Web3AuthModalPack>();
    const [ownerAddress, setOwnerAddress] = useState<string>('');
    const [chainId, setChainId] = useState<string>(initialChain.id);
    const [userInfo, setUserInfo] = useState<any>();
    const [safes, setSafes] = useState<string[]>([]);
    const [web3Provider, setWeb3Provider] = useState<ethers.providers.Web3Provider | undefined>()
    const [safeSelected, setSafeSelected] = useState<string>('')


    const Authenticated = !!ownerAddress && !!chainId
    const [isAuthenticated, setIsAuthenticated] = useState(Authenticated);


    const chain = getChain(chainId) || initialChain

    useEffect(() => {
        (async () => {
            setLoadingWeb3Auth(true);
            const options: Web3AuthOptions = {
                clientId: 'BMJmZiWf9lhyOyFLyyMBjgKrY9BPM_3BV90bDIOSuIMGyo85NaF9M-UhUKfSxLGn_9s-u8xX3v6Q28mZN58jOjI',

                chainConfig: {
                    chainNamespace: CHAIN_NAMESPACES.EIP155,
                    chainId: chain.id,
                    rpcTarget: chain.rpcUrl,
                    displayName: chain.label,
                    blockExplorer: chain?.blockExplorerUrl,
                    ticker: chain.token,
                    tickerName: chain.label,
                },
                web3AuthNetwork: 'testnet',
                uiConfig: {
                    modalZIndex: '99998',
                    loginMethodsOrder: ['google', 'facebook']
                }
            }

            const modalConfig = {
                [WALLET_ADAPTERS.TORUS_EVM]: {
                    label: 'torus',
                    showOnModal: false
                },
                [WALLET_ADAPTERS.METAMASK]: {
                    label: 'metamask',
                    showOnDesktop: true,
                    showOnMobile: false
                }
            }

            const web3AuthModalPack = new Web3AuthModalPack({
                txServiceUrl: 'https://safe-transaction-goerli.safe.global'
            })

            await web3AuthModalPack.init({
                options,
                modalConfig
            })

            setLoadingWeb3Auth(false);
            setWeb3AuthModalPack(web3AuthModalPack)
        })()
    }, [chain])

    const loginWeb3Auth = useCallback(async () => {
        if (!web3AuthModalPack) return

        try {
            const { safes, eoa } = await web3AuthModalPack.signIn()
            const provider = web3AuthModalPack.getProvider() as ethers.providers.ExternalProvider

            console.log("Safes", safes, eoa, provider);

            const userInfo = await web3AuthModalPack.getUserInfo()
            console.log("User info: ", userInfo, web3AuthModalPack, new ethers.providers.Web3Provider(provider));

            setIsAuthenticated(true);
            setUserInfo(userInfo);
            setChainId(chain.id)
            setOwnerAddress(eoa)
            setSafes(safes || [])
            setWeb3Provider(new ethers.providers.Web3Provider(provider))
        } catch (error) {
            console.log('error: ', error)
        }


    }, [chain, web3AuthModalPack])

    const logoutWeb3Auth = () => {
        web3AuthModalPack?.signOut()
        setOwnerAddress('')
        setSafes([])
        setChainId(chain.id)
        setWeb3Provider(undefined)
        setSafeSelected('')
        setIsAuthenticated(false);
        setGelatoTaskId(undefined)
    }

    const fetchSafeBalance = useCallback(async () => {
        const balance = await web3Provider?.getBalance(safeSelected)

        return balance?.toString()
    }, [web3Provider, safeSelected])

    const safeBalance = usePolling(fetchSafeBalance)

    const getProvider = useCallback(async () => {
        if (!web3Provider) {
            await loginWeb3Auth();
        }
        return web3Provider;
    }, [loginWeb3Auth, web3Provider])


    useEffect(() => {
        const getSafeAddress = async () => {
            if (web3Provider) {
                try {
                    const signer = web3Provider.getSigner()
                    const relayPack = new GelatoRelayPack()
                    const safeAccountAbstraction = new AccountAbstraction(signer)

                    await safeAccountAbstraction.init({ relayPack })

                    const hasSafes = safes.length > 0

                    const safeSelected = hasSafes ? safes[0] : await safeAccountAbstraction.getSafeAddress()

                    console.log('Safe selected in the context >>>>', safeSelected);

                    setSafeSelected(safeSelected)
                } catch (error) {
                    console.log("Error in the useEffect", error);
                }

            }
        }

        getSafeAddress()
    }, [safes, web3Provider])

    const [isRelayerLoading, setIsRelayerLoading] = useState<boolean>(false)
    const [gelatoTaskId, setGelatoTaskId] = useState<string>()

    useEffect(() => {
        setIsRelayerLoading(false)
        setGelatoTaskId(undefined)
    }, [chainId])

    const [relayLoading, setRelayLoading] = useState(false);

    const relayTransaction = async () => {
        if (web3Provider) {
            setIsRelayerLoading(true)

            try {
                const signer = web3Provider.getSigner()
                const relayPack = new GelatoRelayPack()
                const safeAccountAbstraction = new AccountAbstraction(signer)

                await safeAccountAbstraction.init({ relayPack })

                // we use a dump safe transfer as a demo transaction
                const dumpSafeTransafer: MetaTransactionData[] = [
                    {
                        to: safeSelected,
                        data: '0x',
                        value: utils.parseUnits('0.001', 'ether').toString(),
                        operation: 0,
                    }
                ]

                const options: MetaTransactionOptions = {
                    isSponsored: false,
                    gasLimit: '600000',
                    gasToken: ethers.constants.AddressZero
                }

                const gelatoTaskId = await safeAccountAbstraction.relayTransaction(dumpSafeTransafer, options)

                console.log("Gelato Task Id", gelatoTaskId);

                setIsRelayerLoading(false)
                setGelatoTaskId(gelatoTaskId)
            } catch (error) {
                console.log("Error", error);
                setIsRelayerLoading(false)
            }


        }
    }


    return (
        <AccountAbstractionContext.Provider value={{
            ownerAddress,
            loadingWeb3Auth,
            chainId,
            chain,
            safeBalance,
            isAuthenticated,
            web3Provider,
            safeSelected,
            userInfo,
            gelatoTaskId,
            isRelayerLoading,
            getProvider,
            loginWeb3Auth,
            logoutWeb3Auth,
            relayTransaction
        }}>
            {children}
        </AccountAbstractionContext.Provider>
    )
}

export default AccountAbstractionProvider;