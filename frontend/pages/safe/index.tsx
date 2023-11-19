"use client"
import React, { useCallback, useContext, useState } from 'react';
import { AccountAbstractionContext } from "../../contexts/AccountAbstractionContext";
import styles from "../../styles/Home.module.css";
import { VscAccount } from "react-icons/vsc";
import { IoBuild } from "react-icons/io5";
import { BsSafe2 } from "react-icons/bs";
import { AiOutlineWarning } from "react-icons/ai";
import usePolling from '../../hooks/usePolling';
import useApi from '../../hooks/useApi';
import isContractAddress from '../../helpers/isContractAddress';
import OwnerDetails from '../../components/SafeUI/OwnerDetails';
import SafeDetails from '../../components/SafeUI/SafeDetails';
import DeploySafe from '../../components/SafeUI/DeploySafe';


const SafeIndex = () => {

    const {
        loadingWeb3Auth,
        userInfo,
        chain,
        safeBalance,
        safeSelected,
        web3Provider,
        chainId,
        ownerAddress,
        isAuthenticated,
        loginWeb3Auth,
        logoutWeb3Auth
    } = useContext(AccountAbstractionContext)

    const [activeState, setActiveState] = useState(1);

    const [isDeployed, setIsDeployed] = useState<boolean>(false)
    const [isDeployLoading, setIsDeployLoading] = useState<boolean>(true)

    const detectSafeIsDeployed = useCallback(async () => {
        // @ts-ignore
        const isDeployed = await isContractAddress(safeSelected, web3Provider)

        setIsDeployed(isDeployed)
        setIsDeployLoading(false)
    }, [web3Provider, safeSelected])

    usePolling(detectSafeIsDeployed)

    const fetchInfo = useCallback(
        // @ts-ignore
        (signal: AbortSignal) => getSafeInfo(safeSelected, chainId, { signal }),
        [safeSelected, chainId]
    )

    const { data: safeInfo, isLoading: isGetSafeInfoLoading } = useApi(fetchInfo)

    console.log("Data", safeInfo, isGetSafeInfoLoading);

    const owners = safeInfo?.owners.length || 1
    const threshold = safeInfo?.threshold || 1
    const isLoading = isDeployLoading || isGetSafeInfoLoading

    console.log("Owners", owners, threshold, isLoading);

    return (
        <div className={styles.container}>
            <div className='w-full'>

                <div className='flex flex-row items-center gap-8 justify-center mb-4 '>
                    <div className='text-[24px] rounded-md  px-4 py-4 text-start flex-1 bg-blue-600 text-gray-200'>Your Profile and Safe Details </div>
                </div>

                {!isDeployed && !isDeployLoading && (
                    <div className='w-fit bg-red-600 text-white gap-2 rounded-md p-1 flex flex-row mb-4 items-center'>
                        <AiOutlineWarning />
                        <p className='text-[14px]'>
                            Safe Wallet not deployed yet. Head over to Deploy Safe or click {" "}
                            <span className='m-o hover:underline cursor-pointer' onClick={() => setActiveState(3)}>here</span>
                        </p>
                    </div>
                )}

                {!isAuthenticated && (
                    <div className='flex flex-col justify-between items-center gap-8'>
                        <div className='text-[22px]'>
                            Create Your Safe wallet in 3 easy steps.
                        </div>

                        <div className='flex flex-col  items-center gap-4'>
                            <div>
                                <button className='border px-4 py-2 opacity-50 hover:opacity-100 border-gray-600 rounded-lg hover:border-white'>
                                    1. Login via Google, Facebook or Metamask
                                </button>
                            </div>
                            <div>
                                <button className='border px-4 py-2 opacity-50 hover:opacity-100 border-gray-600 rounded-lg hover:border-white'>
                                    2. Create Safe and send funds to your safe wallet
                                </button>
                            </div>
                            <div>
                                <button className='border px-4 py-2 opacity-50 hover:opacity-100 border-gray-600 rounded-lg hover:border-white'>
                                    3. Deploy Safe Wallet Contract
                                </button>
                            </div>

                        </div>

                        <div>
                            <button
                                onClick={loginWeb3Auth}
                                className='border-2 text-[20px] border-transparent rounded-lg py-2 px-12 bg-[#1d4ed8]'
                            >
                                Login
                            </button>
                        </div>
                    </div>
                )}

                {isAuthenticated && <div className='flex justify-end my-4'>
                    <button
                        onClick={logoutWeb3Auth}
                        className='border-2 text-[20px] border-transparent rounded-lg py-2 px-12 bg-white text-black'
                    >
                        Logout
                    </button>
                </div>}





                {isAuthenticated && userInfo && (
                    <div className='flex flex-row shadow-lg border-2 border-zinc-800'>
                        <div className='w-3/12 flex flex-col ml-8 mr-4 my-8 gap-3'>
                            <div onClick={() => setActiveState(1)}
                                className={` ${activeState === 1 && 'bg-slate-500 rounded-lg'} flex flex-row gap-[12px] items-center cursor-pointer hover:bg-slate-500 hover:rounded-lg p-2 pl-4`}>
                                <VscAccount className="h-[20px] w-[20px]" />
                                <p className='text-[24px]'>Owner Details</p>
                            </div>
                            <div onClick={() => setActiveState(2)}
                                className={` ${activeState === 2 && 'bg-slate-500 rounded-lg'} flex flex-row gap-[12px] items-center cursor-pointer hover:bg-slate-500 hover:rounded-lg p-2 pl-4`}>
                                <BsSafe2 className="h-[20px] w-[20px]" />
                                <p className='text-[24px]'>Safe Details</p>
                            </div>
                            {!isDeployed && !isDeployLoading && <div onClick={() => setActiveState(3)}
                                className={` ${activeState === 3 && 'bg-slate-500 rounded-lg'} flex flex-row gap-[12px] items-center cursor-pointer hover:bg-slate-500 hover:rounded-lg p-2 pl-4`}>
                                <IoBuild className="h-[20px] w-[20px]" />
                                <p className='text-[24px]'>Deploy Safe</p>
                            </div>}
                        </div>
                        <div className='w-[4px] h-[auto] bg-zinc-800 mx-4'></div>


                        <div className='w-9/12 ml-8 mr-4 mt-8 mb-8'>

                            {activeState == 1 && <OwnerDetails userInfo={userInfo} ownerAddress={ownerAddress} />}
                            {activeState == 2 && <SafeDetails
                                safeAddress={safeSelected}
                                web3Provider={web3Provider}
                                chainId={chainId}
                                chain={chain}
                                safeBalance={safeBalance}
                                setActiveState={setActiveState}
                            />}
                            {activeState == 3 && <DeploySafe />}

                        </div>
                    </div>
                )}




            </div>
        </div>
    );
};

export default SafeIndex;