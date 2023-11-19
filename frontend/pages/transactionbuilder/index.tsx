import React, { useContext, useState } from 'react';
import styles from "../../styles/Home.module.css"
import { FormControl, FormLabel, Input, InputGroup, InputRightElement, Select } from '@chakra-ui/react';
import FunctionForm from '../../components/TransactionBuilder/FunctionForm';
import { AccountAbstractionContext } from '../../contexts/AccountAbstractionContext';
import { TypedDataDomain, ethers } from 'ethers';
import { hashOrder, domain, OrderBalance, Order, OrderKind } from "@cowprotocol/contracts"
import { BuyTokenDestination, COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS, OrderBookApi, OrderQuoteSideKindSell, SellTokenSource, SigningScheme, SupportedChainId } from "@cowprotocol/cow-sdk";
import PreTransactionBuilder from '../../components/TransactionBuilder/PreTransactionBuilder';
import PostTransactionBuilder from '../../components/TransactionBuilder/PostTransactionBuilder';
import { TransactionContext } from '../../contexts/TransactionContext';


const TransactionBuilderIndex = () => {

    const [activeState, setActiveState] = useState(1);

    const { generateOrderUid, quote, postHook, orderUID } = useContext(TransactionContext);

    const [preContractAddress, setPreContractAddress] = useState();

    const [postContractAddress, setPostContractAddress] = useState();

    return (
        <div className={styles.container} >



            {/* <div className='bg-white px-8 py-2 text-black rounded-md' onClick={transactionOrder}>Generate Order</div> */}

            {orderUID && <div>{orderUID}</div>}

            {quote && postHook && <div className='bg-white px-8 py-2 text-black rounded-md' onClick={generateOrderUid}>Generate ORder UID</div>
            }
            <div className='mt-12'>

                <div className='w-[100%] flex flex-row my-8'>
                    <div
                        className={`text-[18px] flex-1 ${activeState === 1 && 'bg-slate-500 rounded-lg'} flex flex-row gap-[12px] items-center cursor-pointer hover:bg-slate-500 hover:rounded-lg px-12 py-2`}
                        onClick={() => setActiveState(1)}>Pre Hook</div>
                    <div
                        className={` flex-1 ${activeState === 2 && 'bg-slate-500 rounded-lg'} flex flex-row gap-[12px] items-center cursor-pointer hover:bg-slate-500 hover:rounded-lg px-12 py-2`}

                        onClick={() => setActiveState(2)}>Post Hook</div>
                </div>




                {activeState === 1 && <PreTransactionBuilder
                    setPreContractAddress={setPreContractAddress}
                    preContractAddress={preContractAddress}

                />}
                {activeState === 2 && <PostTransactionBuilder
                    setPostContractAddress={setPostContractAddress}
                    postContractAddress={postContractAddress}
                />}

            </div>
        </div>
    );
};

export default TransactionBuilderIndex;