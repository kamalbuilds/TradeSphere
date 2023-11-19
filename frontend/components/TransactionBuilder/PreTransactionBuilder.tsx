// @ts-nocheck
import React, { useContext, useEffect, useState } from 'react';
import styles from "../../styles/Home.module.css"
import { FormControl, FormLabel, Input, InputGroup, InputRightElement, Select } from '@chakra-ui/react';
import FunctionForm from '../../components/TransactionBuilder/FunctionForm';
import { AccountAbstractionContext } from '../../contexts/AccountAbstractionContext';
import { TransactionContext } from '../../contexts/TransactionContext';
import { ethers } from 'ethers';
import { MetaTransactionData, OperationType } from '@safe-global/safe-core-sdk-types';


const PreTransactionBuilder = ({
    setPreContractAddress,
    preContractAddress
}: any) => {


    const {
        setSellToken,
        setPreHook,
        preHook,
        setSellAmount,
        fetchQuote,
        quote,
        setQuote,
        setOrderUID
    } = useContext(TransactionContext);
    const {
        web3Provider,
        ownerAddress,
        chainId,
        safeSelected
    } = useContext(AccountAbstractionContext)

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
        setPreContractAddress(e.target.value);
    }

    useEffect(() => {

        if (preContractAddress) {
            setPreHook('');
            setQuote();
            handleContractAddress();
        }

    }, [preContractAddress])


    const handleContractAddress = async () => {
        setFunctionSelected(null);
        setPreHook('');
        setOrderUID('');
        setQuote();
        setFunctions({});
        setFunctionInput(null);
        setIsLoading(true);
        console.log("Contract Address", preContractAddress);
        // setSellToken(preContractAddress);
        const ETHERSCAN_API = '7PTPYY1WYN9DRSF2QHSKPJX7ZE8FD4RTQS';

        console.log("API key", ETHERSCAN_API);
        if (preContractAddress) {
            try {
                const url = `https://api-goerli.etherscan.io/api?module=contract&action=getabi&address=${preContractAddress}&apikey=${ETHERSCAN_API}`
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
        const updatedInputValues = { ...inputValues };
        //@ts-ignore
        updatedInputValues[name] = e.target.value;
        setInputValues(updatedInputValues);
        console.log("Input Values", inputValues, updatedInputValues)
    }

    const [preHookLoading, setIsPreHookLoading] = useState(false);
    const generateRawTransaction = async () => {

        console.log("Input values", inputValues);
        console.log("Is confirm", web3Provider, contractABI, preContractAddress, functionSelected)

        setIsPreHookLoading(true);
        if (web3Provider && contractABI && preContractAddress && functionSelected) {
            try {
                const signer = web3Provider?.getSigner();
                console.log("Signer ", signer);

                const contract = new ethers.Contract(
                    '0x07865c6E87B9F70255377e024ace6630C1Eaa37F',
                    contractABI,
                    signer,//or provider check once
                );
                console.log("Contract Instance", contract);

                console.log("Function Details", functionSelected, functionInput, inputValues);


                const param = Object.values(inputValues);
                console.log("Param", param, inputValues?.value);

                if (inputValues?.value) {
                    setSellAmount(inputValues?.value)
                }

                const gasLimit = "1000000";

                const preHook = {
                    to: contract.address,
                    data: contract.interface.encodeFunctionData(functionSelected, param),
                    value: "0",
                    gasLimit: "228533",
                };

                console.log("Pre Hook", preHook);

                setPreHook(preHook);
                setIsPreHookLoading(false);


            } catch (error) {
                console.log("Error", error);
                setIsPreHookLoading(false);


            }

        }

        setIsPreHookLoading(false);


    }

    console.log("quote", quote)


    return (
        <div className='w-[90vw] m-[auto] '>

            <div className='flex flex-row gap-4 shadow-lg border-2 border-zinc-800 p-8 rounded-lg'>
                <FormControl className=' flex-1 flex flex-col'>

                    <p className='text-[28px] mb-4 text-red-600 text-center'>
                        Contract Details
                    </p>

                    <FormLabel>Enter Contract Address</FormLabel>
                    <InputGroup>
                        <Input defaultValue={preContractAddress} placeholder='Enter Contract Address'
                            onChange={handleInputChange}
                        />
                    </InputGroup>

                    <button className='border-2 p-2 my-4 w-fit rounded-lg border-transparent py-2 px-4 bg-[#1d4ed8]'
                        onClick={handleContractAddress}> Get Functions </button>

                    {Object.keys(functions).length !== 0 && (
                        <FunctionForm
                            functions={functions}
                            contractAddress={preContractAddress}
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



                    {preContractAddress ? (
                        <div className='flex flex-col '>
                            <div className='text-center text-[28px] text-green-500'>
                                {quote ? 'Your Fetched Quote' : 'Your transaction Batch'}
                            </div>
                            {!quote && <div className='text-[#7e7a7a]'>
                                <p className='text-[18px]'>&#123;</p>
                                <div className='ml-16'>
                                    <div className='flex flex-row gap-2'>
                                        <p>to: </p>
                                        <p>{preContractAddress}</p>
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
                            </div>}

                            {quote && <div className='text-[#7e7a7a]'>

                                <p className='text-[18px]'>&#123;</p>
                                <div className='ml-16'>
                                    <div className='flex flex-row gap-2'>
                                        <p>Sell Token: </p>
                                        <p>{quote.sellToken}</p>
                                    </div>
                                    <div className='flex flex-row gap-2'>
                                        <p>Sell Token Amount: </p>
                                        <p>{quote.sellAmount}</p>
                                    </div>

                                    <div className='flex flex-row gap-2'>
                                        <p>Buy Token: </p>
                                        <p>{quote.buyToken}</p>
                                    </div>

                                    <div className='flex flex-row gap-2'>
                                        <p>Buy Token Amount: </p>
                                        <p>{quote.buyAmount}</p>
                                    </div>

                                </div>
                                <div>
                                    <p className='text-[18px]'>&#125;</p>
                                </div>
                            </div>}


                            <div className='mt-12'>
                                {preHook ? <div className='text-green-600'>  Pre Hook Set</div> : <button className='bg-white rounded-md text-black px-8 py-2' onClick={generateRawTransaction}> {
                                    preHookLoading ? 'Loading..' :
                                        'set Pre Hook'
                                }</button>}
                            </div>

                            <div className='mt-12 ml-4'>
                                {preHook && <button className='bg-white rounded-md text-black px-8 py-2' onClick={fetchQuote}> Get Quote</button>}
                            </div>







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

export default PreTransactionBuilder;