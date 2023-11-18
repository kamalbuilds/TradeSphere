import React, { useContext, useState } from 'react';
import styles from "../../styles/Home.module.css"
import { FormControl, FormLabel, Input, InputGroup, InputRightElement, Select } from '@chakra-ui/react';
import FunctionForm from '../../components/TransactionBuilder/FunctionForm';
import { AccountAbstractionContext } from '../../contexts/AccountAbstractionContext';
import { TransactionContext } from '../../contexts/TransactionContext';
import { ethers } from 'ethers';


const PostTransactionBuilder = ({
    setPostContractAddress,
    postContractAddress
}: any) => {

    const { setReceiverAddress, setPostHook, postHook, quote } = useContext(TransactionContext);
    // const [contractAddress, setContractAddress] = useState();
    const [contractABI, setContractABI] = useState({});
    const [functions, setFunctions] = useState<any>({});
    const [functionSelected, setFunctionSelected] = useState(null);
    const [functionInput, setFunctionInput] = useState(null);
    const [inputValues, setInputValues] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleSelect = (e: any) => {
        setFunctionSelected(e.target.value);
        setFunctionInput(functions[e.target.value]?.inputs);
    }

    const handleInputChange = (e: any) => {
        e.preventDefault();
        console.log("Change", e.target.value);
        setInputValues({});
        setPostContractAddress(e.target.value);
    }


    const handleContractAddress = async () => {
        setFunctionSelected(null);
        setFunctions({});
        setPostHook('');
        setFunctionInput(null);
        setIsLoading(true);
        console.log("Contract Address", postContractAddress);
        setReceiverAddress(postContractAddress)
        const ETHERSCAN_API = '7PTPYY1WYN9DRSF2QHSKPJX7ZE8FD4RTQS';

        console.log("API key", ETHERSCAN_API);
        if (postContractAddress) {
            try {
                const url = `https://api-goerli.etherscan.io/api?module=contract&action=getabi&address=${postContractAddress}&apikey=${ETHERSCAN_API}`
                const res = await fetch(url);
                const response = await res.json();

                const abiresponse = JSON.parse(response.result);
                setContractABI(abiresponse);

                getFunctionsFromABI(abiresponse);
                setIsLoading(false);
            } catch (error) {
                console.log("Error", error);
                setIsLoading(false);
            }
        }
    }

    const getFunctionsFromABI = (abiresponse: any) => {
        if ((Object.keys(abiresponse).length !== 0)) {
            console.log("Contract ABI", abiresponse);
            const functionList = abiresponse.filter((element: any) => element.type === 'function' && element.stateMutability !== 'view');

            functionList?.map((item: any) => {
                console.log("Item", item, typeof (item));

                setFunctions((functions: any) => ({
                    ...functions,
                    [item.name]: { ...item }
                }));

            })

        }
    }

    const handleFunctionInput = (e: any, name: any) => {
        let updatedInputValues = { ...inputValues };
        //@ts-ignore
        updatedInputValues[name] = e.target.value;
        console.log("inputValues?._amount", updatedInputValues, inputValues?._amount, typeof (inputValues?._amount), typeof (quote.buyAmount), quote.buyAmount)

        console.log("<<>>>>Comparison", parseInt(updatedInputValues?._amount) > parseInt(quote.buyAmount))
        if (parseInt(updatedInputValues?._amount) > parseInt(quote.buyAmount)) {
            console.log("inputValues?._amount", inputValues?._amount, quote.buyAmount)
            updatedInputValues._amount = quote.buyAmount;
        }
        setInputValues(updatedInputValues);
        console.log("Input Values", inputValues, updatedInputValues, inputValues?._amount, quote.buyAmount)


    }

    const {
        web3Provider,
        ownerAddress,
        chainId,
        safeSelected
    } = useContext(AccountAbstractionContext)

    const [postHookLoading, setIsPostHookLoading] = useState(false);


    const generateRawTransaction = async () => {

        console.log("Input values", inputValues);
        console.log("Is confirm", web3Provider, contractABI, postContractAddress, functionSelected)

        setIsPostHookLoading(true);
        if (web3Provider && contractABI && postContractAddress && functionSelected) {
            try {
                const signer = web3Provider?.getSigner();
                console.log("Signer ", signer);

                const contract = new ethers.Contract(
                    postContractAddress,
                    contractABI,
                    signer,//or provider check once
                );
                console.log("Contract Instance", contract);

                console.log("Function Details", functionSelected, functionInput, inputValues);


                const param = Object.values(inputValues);
                console.log("Param", param, inputValues, inputValues?._amount);

                const gasLimit = "1000000";

                const postHook = {
                    to: contract.address,
                    data: contract.interface.encodeFunctionData(functionSelected, param),
                    value: "0",
                    gasLimit: "228533",
                };

                console.log("post Hook", postHook);

                setPostHook(postHook);
                setIsPostHookLoading(false);


            } catch (error) {
                console.log("Error", error);
                setIsPostHookLoading(false);


            }
        }


    }

    return (
        <div className='w-[90vw] m-[auto] '>

            <div className='flex flex-row gap-4 shadow-lg border-2 border-zinc-800 p-8 rounded-lg'>
                <FormControl className=' flex-1 flex flex-col'>

                    <p className='text-[28px] mb-4 text-red-600 text-center'>
                        Contract Details
                    </p>

                    {/* <button className='border-2 p-2 my-4 w-fit rounded-lg border-transparent py-2 px-4 bg-[#1d4ed8]' onClick={initiateSafe}>
                            Initiate Safe Wallet
                        </button> */}

                    <FormLabel>Enter Contract Address</FormLabel>
                    <InputGroup>
                        <Input placeholder='Enter Contract Address'
                            onChange={handleInputChange}
                        />
                        {/* <InputRightElement>
                                <Oval
                                    height={25}
                                    width={25}
                                    color="#4fa94d"
                                    wrapperStyle={{}}
                                    wrapperClass=""
                                    visible={isLoading ? true : false}
                                    ariaLabel='oval-loading'
                                    secondaryColor="#4fa94d"
                                    strokeWidth={2}
                                    strokeWidthSecondary={2}
                                />
                            </InputRightElement> */}
                    </InputGroup>

                    <button className='border-2 p-2 my-4 w-fit rounded-lg border-transparent py-2 px-4 bg-[#1d4ed8]'
                        onClick={handleContractAddress}> Get Functions </button>

                    {Object.keys(functions).length !== 0 && (
                        <FunctionForm
                            functions={functions}
                            contractAddress={postContractAddress}
                            handleInputChange={handleInputChange}
                            handleSelect={handleSelect}
                            functionInput={functionInput}
                            handleFunctionInput={handleFunctionInput}
                        // getGasFees={getGasFees}
                        // loadingGas={loadingGas}
                        />
                    )}

                </FormControl>

                <div className='w-[4px] h-[auto] bg-zinc-800 mx-4'></div>

                <div className=' w-[50%]'>

                    {/* {txnGasFees && (
                            <div className='flex flex-col '>
                                <div className='text-center text-[28px] text-green-500'>Gas Fees and Safe Details</div>
                                <div className='text-[#7e7a7a]'>
                                    <p className='text-[18px]'>&#123;</p>
                                    <div className='ml-16'>
                                        <div className='flex flex-row gap-2'>
                                            <p>Safe Balance:  </p>
                                            <p>{safeBalance}</p>
                                        </div>
                                        <div className='flex flex-row gap-2'>
                                            <p>Is Safe Deployed:  </p>
                                            <p>{isSafeDeployed}</p>
                                        </div>

                                        <div className='flex flex-row gap-2'>
                                            <p>Gas Fees:  </p>
                                            <p>{txnGasFees} WEI</p>
                                        </div>

                                    </div>
                                    <div>
                                        <p className='text-[18px]'>&#125;</p>
                                    </div>
                                </div>

                            </div>
                        )} */}

                    {postContractAddress ? (
                        <div className='flex flex-col '>
                            <div className='text-center text-[28px] text-green-500'>Your transaction Batch</div>
                            <div className='text-[#7e7a7a]'>
                                <p className='text-[18px]'>&#123;</p>
                                <div className='ml-16'>
                                    <div className='flex flex-row gap-2'>
                                        <p>to: </p>
                                        <p>{postContractAddress}</p>
                                    </div>
                                    <div className='flex flex-row gap-2'>
                                        <p>function: </p>
                                        <p>{functionSelected}</p>
                                    </div>

                                    {functionInput && (
                                        functionInput?.map((item, index) => {
                                            return (
                                                <div key={index}>
                                                    {item?.name}: {inputValues[item?.name]}
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                                <div>
                                    <p className='text-[18px]'>&#125;</p>
                                </div>
                            </div>

                            <div className='mt-12'>
                                {postHook ? <div className='text-green-600'>  Post Hook Set</div> : <button className='bg-white rounded-md text-black px-8 py-2' onClick={generateRawTransaction}> {
                                    postHookLoading ? 'Loading..' :
                                        'set Post Hook'
                                }</button>}
                            </div>

                            {/* <div>
                                    <button className='border-2 p-2 my-4 w-fit rounded-lg border-transparent py-2 px-4 bg-[#1d4ed8]' onClick={handleTransaction}>
                                        {!loadingTxn ? (
                                            'Create Transaction'
                                        ) : (
                                            <Oval
                                                height={25}
                                                width={25}
                                                color="#4fa94d"
                                                wrapperStyle={{}}
                                                wrapperClass=""
                                                visible={loadingTxn ? true : false}
                                                ariaLabel='oval-loading'
                                                secondaryColor="#4fa94d"
                                                strokeWidth={2}
                                                strokeWidthSecondary={2}
                                            />
                                        )}
                                    </button>
                                </div> */}

                            {/* {gelatoTask && (
                                    <div>
                                        <Link target='_blank' className='hover:underline hover:underline-offset-8' href={gelatoTask}>Get Gelato Transaction Detail</Link>
                                    </div>
                                )}

                                {gelatoTaskId && (
                                    <GelatoTaskStatusLabel
                                        gelatoTaskId={gelatoTaskId}
                                        chainId={chainId}
                                        setTransactionHash={setTransactionHash}
                                        transactionHash={transactionHash}
                                    />
                                )} */}




                        </div>
                    ) : (
                        <div>
                            <p className='text-center text-[28px]'> Get Your transaction info</p>
                        </div>
                    )}




                </div>

            </div>
        </div>
    );
};

export default PostTransactionBuilder;