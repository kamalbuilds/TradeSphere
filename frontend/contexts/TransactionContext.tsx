// @ts-nocheck
"use client"
import { createContext, useContext, useState } from "react";
import { AccountAbstractionContext } from "./AccountAbstractionContext";
import { TypedDataDomain, ethers } from "ethers";
import { OrderBalance, OrderKind, domain, hashOrder } from "@cowprotocol/contracts";
import { BuyTokenDestination, COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS, OrderBookApi, SellTokenSource, SigningScheme, SupportedChainId } from "@cowprotocol/cow-sdk";

interface TransactionContextType {
    setSellToken: (value: any) => void;
    setPreHook: (value: any) => void;
    preHook: any; // Adjust the type accordingly
    setSellAmount: (value: any) => void;
    setReceiverAddress: (value: any) => void;
    setPostHook: (value: any) => void;
    postHook: any; // Adjust the type accordingly
    generateOrderUid: () => void;
    fetchQuote: () => void;
    quote: any; // Adjust the type accordingly
    setQuote: (value: any) => void;
  }

  const initialTransactionContext: TransactionContextType = {
    setSellToken: () => {},
    setPreHook: () => {},
    preHook: null,
    setSellAmount: () => {},
    setReceiverAddress: () => {},
    setPostHook: () => {},
    postHook: null,
    generateOrderUid: () => {},
    fetchQuote: () => {},
    quote: null,
    setQuote: () => {},
  };

  export const TransactionContext = createContext<TransactionContextType>(initialTransactionContext);

const TransactionProvider = ({ children }: any) => {

    const { web3Provider, safeSelected } = useContext(AccountAbstractionContext);

    const [sellToken, setSellToken] = useState('0x07865c6E87B9F70255377e024ace6630C1Eaa37F');
    const [buyToken, setBuyToken] = useState('0x91056D4A53E1faa1A84306D4deAEc71085394bC8');
    const [preHook, setPreHook] = useState();
    const [postHook, setPostHook] = useState();

    const [receiverAddress, setReceiverAddress] = useState();

    const [sellAmount, setSellAmount] = useState();

    const [quote, setQuote] = useState();

    const fetchQuote = async () => {

        const signer = web3Provider?.getSigner();
        console.log("Signer", signer, await signer?.getAddress(), safeSelected);

        console.log("Sell Amount", sellAmount);

        const orderConfig = {
            sellToken: sellToken,
            buyToken: buyToken,
            // sellAmount: `${ethers.utils.parseUnits("1.0", await USDC.decimals())}`,
            sellAmount: sellAmount,
            kind: OrderKind.SELL,
            partiallyFillable: false,
            buyTokenBalance: OrderBalance.ERC20,
            sellTokenBalance: OrderBalance.ERC20,
        };

        console.log("Order Config", orderConfig, receiverAddress);

        const { id: quoteId, quote } = await fetch(
            "https://barn.api.cow.fi/goerli/api/v1/quote",
            {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    from: safeSelected,
                    sellAmountBeforeFee: orderConfig.sellAmount,
                    ...orderConfig,
                }),
            },
        ).then((response) => response.json());
        console.log("quote:", quoteId, quote);

        setQuote(quote);



    }

    const orderBookApi = new OrderBookApi({
        chainId: SupportedChainId.GOERLI,
        env: 'staging'
    });

    const cowEip712Domain = domain(5, COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS[5]!)
    const safeEip712Domain: TypedDataDomain = {
        chainId: 5,
        verifyingContract: safeSelected
    }


    const generateOrderUid = async () => {

        const signer = web3Provider?.getSigner();
        console.log("Signer", signer, await signer?.getAddress(), safeSelected);

        console.log("Sell Amount", sellAmount);

        const orderConfig = {
            sellToken: sellToken,
            buyToken: buyToken,
            // sellAmount: `${ethers.utils.parseUnits("1.0", await USDC.decimals())}`,
            sellAmount: sellAmount,
            kind: OrderKind.SELL,
            partiallyFillable: false,
            buyTokenBalance: OrderBalance.ERC20,
            sellTokenBalance: OrderBalance.ERC20,
        };


        console.log("Order Config", orderConfig, receiverAddress, postHook, preHook, quote);


        if (receiverAddress && preHook && postHook && quote) {

            orderConfig.receiver = receiverAddress;

            orderConfig.appData = JSON.stringify({
                metadata: {
                    hooks: {
                        pre: [preHook],
                        post: [postHook],
                    },
                },
            });

            const orderData = {
                ...orderConfig,
                sellAmount: quote.sellAmount,
                buyAmount: `${ethers.BigNumber.from(quote.buyAmount).mul(99).div(100)}`,
                validTo: quote.validTo,
                appData: ethers.utils.id(orderConfig.appData),
                feeAmount: quote.feeAmount,
            };

            console.log("orderData", orderData);


            const orderHash = hashOrder(cowEip712Domain, orderData);

            const message = ethers.utils.defaultAbiCoder.encode(["bytes32"], [orderHash]);
            console.log("orderHash", orderHash, message);
            // 3. define a SafeMessage whose content is (2)
            const safeMessageType = {
                SafeMessage: [
                    { name: "message", type: "bytes" }
                ]
            };

            const safeMessage = {
                message
            };

            // 4. sign the eip712 typed data with the private key of the Safe owner
            const signature = await signer?._signTypedData(safeEip712Domain, safeMessageType, safeMessage);
            console.log(signature, "signature");

            const safeContract = new ethers.Contract(safeSelected, [
                "function isValidSignature(bytes32 _hash, bytes _signature) external view returns (bytes4 magicValue)"
            ], signer);

            console.log(safeContract, "safeContract");
            const isValidSignature = await safeContract.isValidSignature(orderHash, signature);
            console.log(isValidSignature, "isValidSignature");

            if (isValidSignature !== "0x1626ba7e") {
                throw new Error("Invalid signature")
            } else {
                console.log("Signature is valid!")
                console.log("Signature: ", signature)
            }


            console.log("signedOrder", signature);

            const orderUid = await orderBookApi.sendOrder({
                ...orderData,
                sellAmount: orderData.sellAmount.toString(),
                buyAmount: orderData.buyAmount.toString(),
                feeAmount: orderData.feeAmount.toString(),
                validTo: Number(orderData.validTo.toString()),
                appData: orderData.appData.toString(),
                buyTokenBalance: BuyTokenDestination.ERC20,
                sellTokenBalance: SellTokenSource.ERC20,
                from: safeSelected,
                signingScheme: SigningScheme.EIP1271,
                signature
            })

            console.log(`OrderUid ${orderUid} submitted!`)




        }

    }


    return (
        <TransactionContext.Provider value={{
            setSellToken,
            setPreHook,
            preHook,
            setSellAmount,
            generateOrderUid,
            setReceiverAddress,
            setPostHook,
            postHook,
            fetchQuote,
            quote,
            setQuote
        }}>
            {children}
        </TransactionContext.Provider>
    )
}

export default TransactionProvider;