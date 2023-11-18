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

    const [contractAddress, setContractAddress] = useState();
    const [contractABI, setContractABI] = useState({});
    const [functions, setFunctions] = useState<any>({});
    const [functionSelected, setFunctionSelected] = useState(null);
    const [functionInput, setFunctionInput] = useState(null);
    const [inputValues, setInputValues] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const [activeState, setActiveState] = useState(1);

    const { generateOrderUid, quote, postHook } = useContext(TransactionContext);



    const {
        web3Provider,
        ownerAddress,
        chainId,
        safeSelected
    } = useContext(AccountAbstractionContext)

    const USDC = new ethers.Contract(
        "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
        [
            `
        function decimals() view returns (uint8)
        `,
            `
        function name() view returns (string)
        `,
            `
        function version() view returns (string)
        `,
            `
        function nonces(address owner) view returns (uint256)
        `,
            `
        function approve(address spender, uint256 value)
        `,
            `
        function permit(
            address owner,
            address spender,
            uint256 value,
            uint256 deadline,
            uint8 v,
            bytes32 r,
            bytes32 s
        )
        `,
        ],
        web3Provider,
    );

    const COW = new ethers.Contract(
        "0x91056D4A53E1faa1A84306D4deAEc71085394bC8",
        [],
        web3Provider,
    );

    const BRIDGER = new ethers.Contract(
        // "0xDE11b03aBC360138666fB7D41b2d16bAaC75B74a",
        "0xE2A22b7AAb5cDec8399eb4D2f0e1bEDED8cF7683",
        [
            `
        function getAccountAddress(address user) view returns (address)
        `,
            `
        function bridgeAll(address user, address token)
        `,
        ],
        web3Provider,
    );

    const STAKE = new ethers.Contract(
        '0x553f41489A719ED723Eb493fdB6DB494453143af',
        [
            `
            function stake(uint256 _amount) payable;
            `
        ],
        web3Provider
    )

    const orderBookApi = new OrderBookApi({
        chainId: SupportedChainId.GOERLI,
        env: 'staging'
    });

    const cowEip712Domain = domain(5, COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS[5]!)
    const safeEip712Domain: TypedDataDomain = {
        chainId: 5,
        verifyingContract: safeSelected
    }

    // const transactionOrder = async () => {


    //     const signer = web3Provider?.getSigner();
    //     console.log("Signer", signer, await signer?.getAddress(), safeSelected);

    //     const orderConfig = {
    //         sellToken: USDC.address,
    //         buyToken: COW.address,
    //         sellAmount: `${ethers.utils.parseUnits("10.0", await USDC.decimals())}`,
    //         kind: OrderKind.SELL,
    //         partiallyFillable: false,
    //         buyTokenBalance: OrderBalance.ERC20,
    //         sellTokenBalance: OrderBalance.ERC20,
    //     };

    //     console.log("Order config", orderConfig);


    //     const allowanceHook = {
    //         target: USDC.address,
    //         callData: USDC.interface.encodeFunctionData('approve', [
    //             '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110',
    //             ethers.constants.MaxUint256,
    //         ]),
    //         value: '0',
    //         gasLimit: "228533",
    //     };

    //     console.log("Allowance hook", allowanceHook);

    //     // orderConfig.receiver = await BRIDGER.getAccountAddress(safeSelected);
    //     orderConfig.receiver = await STAKE.address;

    //     // const bridgeHook = {
    //     //     target: BRIDGER.address,
    //     //     callData: BRIDGER.interface.encodeFunctionData("bridgeAll", [
    //     //         safeSelected,
    //     //         COW.address,
    //     //     ]),
    //     //     // Approximate gas limit determined with Tenderly.
    //     //     gasLimit: "228533",
    //     // };

    //     const { id: quoteId, quote } = await fetch(
    //         "https://barn.api.cow.fi/goerli/api/v1/quote",
    //         {
    //             method: "POST",
    //             headers: {
    //                 "content-type": "application/json",
    //             },
    //             body: JSON.stringify({
    //                 from: safeSelected,
    //                 sellAmountBeforeFee: orderConfig.sellAmount,
    //                 ...orderConfig,
    //             }),
    //         },
    //     ).then((response) => response.json());
    //     console.log("quote:", quoteId, quote);

    //     const stakeHook = {
    //         target: STAKE.address,
    //         callData: STAKE.interface.encodeFunctionData("stake", [
    //             ethers.BigNumber.from(quote.buyAmount).mul(99).div(100)
    //         ]),
    //         // Approximate gas limit determined with Tenderly.
    //         gasLimit: "228533",

    //     }
    //     console.log("bridge hook:", stakeHook);

    //     orderConfig.appData = JSON.stringify({
    //         metadata: {
    //             hooks: {
    //                 pre: [allowanceHook],
    //                 post: [stakeHook],
    //             },
    //         },
    //     });


    //     // const { id: quoteId, quote } = await fetch(
    //     //     "https://barn.api.cow.fi/goerli/api/v1/quote",
    //     //     {
    //     //         method: "POST",
    //     //         headers: {
    //     //             "content-type": "application/json",
    //     //         },
    //     //         body: JSON.stringify({
    //     //             from: safeSelected,
    //     //             sellAmountBeforeFee: orderConfig.sellAmount,
    //     //             ...orderConfig,
    //     //         }),
    //     //     },
    //     // ).then((response) => response.json());
    //     // console.log("quote:", quoteId, quote);

    //     const orderData = {
    //         ...orderConfig,
    //         sellAmount: quote.sellAmount,
    //         buyAmount: `${ethers.BigNumber.from(quote.buyAmount).mul(99).div(100)}`,
    //         validTo: quote.validTo,
    //         appData: ethers.utils.id(orderConfig.appData),
    //         feeAmount: quote.feeAmount,
    //     };

    //     console.log("orderData", orderData);


    //     const orderHash = hashOrder(cowEip712Domain, orderData);

    //     const message = ethers.utils.defaultAbiCoder.encode(["bytes32"], [orderHash]);
    //     console.log("orderHash", orderHash, message);
    //     // 3. define a SafeMessage whose content is (2)
    //     const safeMessageType = {
    //         SafeMessage: [
    //             { name: "message", type: "bytes" }
    //         ]
    //     };

    //     const safeMessage = {
    //         message
    //     };

    //     // 4. sign the eip712 typed data with the private key of the Safe owner
    //     const signature = await signer?._signTypedData(safeEip712Domain, safeMessageType, safeMessage);
    //     console.log(signature, "signature");

    //     const safeContract = new ethers.Contract(safeSelected, [
    //         "function isValidSignature(bytes32 _hash, bytes _signature) external view returns (bytes4 magicValue)"
    //     ], signer);

    //     console.log(safeContract, "safeContract");
    //     const isValidSignature = await safeContract.isValidSignature(orderHash, signature);
    //     console.log(isValidSignature, "isValidSignature");

    //     if (isValidSignature !== "0x1626ba7e") {
    //         throw new Error("Invalid signature")
    //     } else {
    //         console.log("Signature is valid!")
    //         console.log("Signature: ", signature)
    //     }


    //     console.log("signedOrder", signature);

    //     const orderUid = await orderBookApi.sendOrder({
    //         ...orderData,
    //         sellAmount: orderData.sellAmount.toString(),
    //         buyAmount: orderData.buyAmount.toString(),
    //         feeAmount: orderData.feeAmount.toString(),
    //         validTo: Number(orderData.validTo.toString()),
    //         appData: orderData.appData.toString(),
    //         buyTokenBalance: BuyTokenDestination.ERC20,
    //         sellTokenBalance: SellTokenSource.ERC20,
    //         from: safeSelected,
    //         signingScheme: SigningScheme.EIP1271,
    //         signature
    //     })

    //     console.log(`OrderUid ${orderUid} submitted!`)


    // }


    const [preContractAddress, setPreContractAddress] = useState();



    const [postContractAddress, setPostContractAddress] = useState();

    return (
        <div className={styles.container} >



            {/* <div className='bg-white px-8 py-2 text-black rounded-md' onClick={transactionOrder}>Generate Order</div> */}


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