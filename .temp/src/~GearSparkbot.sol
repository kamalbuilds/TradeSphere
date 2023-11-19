
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import {Balance} from "@gearbox-protocol/core-v2/contracts/libraries/Balances.sol";
import {MultiCall} from "@gearbox-protocol/core-v2/contracts/libraries/MultiCall.sol";
import {ICreditManagerV3} from "@gearbox-protocol/core-v3/contracts/interfaces/ICreditManagerV3.sol";
import {ICreditFacadeV3} from "@gearbox-protocol/core-v3/contracts/interfaces/ICreditFacadeV3.sol";
import {ICreditFacadeV3Multicall} from "@gearbox-protocol/core-v3/contracts/interfaces/ICreditFacadeV3Multicall.sol";
import {IPool as ISparkPool} from "@spark/ISparkPool.sol";
import "forge-std/~console.sol";
import "@1inch/interfaces/~IAggregationRouterV5.sol";

contract GearSparkbot {
    ISparkPool private sparkPool;
    IAggregationRouterV5 private oneinchRouter;
    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    constructor(address _sparkPool, address _1inchRouter) {
        sparkPool = ISparkPool(_sparkPool);
        oneinchRouter = IAggregationRouterV5(_1inchRouter);
    }

    function executeTrade(
        address _token,
        uint256 _amount,
        address _creditManager,
        address _creditAccount,
        address _ownerOfCreditAccount,
        bytes memory oneinchcalldata
    ) external {
        address receiverAddress = address(this);
        address asset = _token;
        uint256 amount = _amount;
        bytes memory params = _encode(
            _creditManager,
            _creditAccount,
            _ownerOfCreditAccount,
            oneinchcalldata
        );
        uint16 referralCode = 0;

        sparkPool.flashLoanSimple(
            receiverAddress,
            asset,
            amount,
            params,
            referralCode
        );
    }

    /**
        This function is called after your contract has received the flash loaned amount
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool) {

        uint256 totalAmount = amount + premium;
        console.log(IERC20(asset).balanceOf(address(this)));
        console.log(asset);
        console.log(amount);
        console.log(premium);
        console.log(initiator);
        console.log(address(this));
        _executeStrategy(params, asset, amount);
        IERC20(asset).approve(address(sparkPool), totalAmount);

        return true;
    }

    function _oneInchSwap(
        bytes memory _data,
        uint _ethAmt,
        uint256 _tokenAmount,
        address _token
    ) internal {
        IERC20(_token).approve(address(oneinchRouter), _tokenAmount);

        (bool success, bytes memory returnData) = address(oneinchRouter).call{
            value: _ethAmt
        }(_data);
        require(success, "1inch-swap-failed");
    }

    // function _swap1inch(
    //     address executor,
    //     IAggregationRouterV5.SwapDescription memory desc,
    //     bytes memory permit,
    //     bytes memory data
    // ) internal {
    //     oneinchRouter.swap(executor, desc, permit, data);
    // }

    // function _clipperSwap(
    //     address _clipperExchange,
    //     address _srcToken,
    //     address _dstToken,
    //     uint256 _inputAmount,
    //     uint256 _outputAmount,
    //     uint256 _goodUntil,
    //     bytes32 _r,
    //     bytes32 _vs
    // ) internal {
    //     oneinchRouter.clipperSwap(
    //         _clipperExchange,
    //         _srcToken,
    //         _dstToken,
    //         _inputAmount,
    //         _outputAmount,
    //         _goodUntil,
    //         _r,
    //         _vs
    //     );
    // }

    function _executeStrategy(
        bytes calldata params,
        address _token,
        uint256 _amount
    ) internal {
        (
            address _creditManager,
            address _creditAccount,
            address _ownerOfCreditAccount,
            bytes memory oneinchcalldata
        ) = _decode(params);

        // enableTokens(
        //     _creditManager,
        //     0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48,
        //     _creditAccount
        // );

        _addCollateral(_token, _creditManager, _amount, _creditAccount);
        // console.log("added");

        address facade = ICreditManagerV3(_creditManager).creditFacade();
        (uint128 minDebt, uint128 maxDebt) = ICreditFacadeV3(facade)
            .debtLimits();

        borrowFunds(_creditManager, 1e20, _creditAccount);
        // console.log("borrowed");

        withdrawCollateral(WETH, _creditManager, 1e20, _creditAccount, address(this));

        _oneInchSwap(oneinchcalldata, 0, 1e20, WETH);

        // addCollateral(_token, _creditManager, 1e21, _creditAccount, _ownerOfCreditAccount);

        // console.log(IERC20(_token).balanceOf(address(this)));
    }

    /// @notice Adds collateral using bot
    /// @param _token token address
    /// @param _creditManager manager address
    /// @param _tokenAmount amount of token
    /// @param _creditAccount address of credit account
    /// @param _ownerOfCreditAccount address of credit account's owner
    function addCollateral(
        address _token,
        address _creditManager,
        uint256 _tokenAmount,
        address _creditAccount,
        address _ownerOfCreditAccount
    ) public {
        IERC20(_token).transferFrom(
            _ownerOfCreditAccount,
            address(this),
            _tokenAmount
        );

        _addCollateral(_token, _creditManager, _tokenAmount, _creditAccount);
    }

    /// @notice Withdraw collateral using bot
    /// @param _token token address
    /// @param _creditManager manager address
    /// @param _tokenAmount amount of token
    /// @param _creditAccount address of credit account
    /// @param _withdrawAccount address of credit account's owner
    function withdrawCollateral(
        address _token,
        address _creditManager,
        uint256 _tokenAmount,
        address _creditAccount,
        address _withdrawAccount
    ) public {
        MultiCall[] memory calls = new MultiCall[](1);

        address facade = ICreditManagerV3(_creditManager).creditFacade();

        calls[0] = MultiCall({
            target: facade,
            callData: abi.encodeCall(
                ICreditFacadeV3Multicall.withdrawCollateral,
                (_token, _tokenAmount, _withdrawAccount)
            )
        });

        ICreditFacadeV3(facade).botMulticall(_creditAccount, calls);
    }

    /// @notice Borrow funds using bot
    /// @param _creditManager manager address
    /// @param _tokenAmount amount of token
    /// @param _creditAccount address of credit account
    function borrowFunds(
        address _creditManager,
        uint256 _tokenAmount,
        address _creditAccount
    ) public {
        MultiCall[] memory calls = new MultiCall[](1);

        address facade = ICreditManagerV3(_creditManager).creditFacade();

        calls[0] = MultiCall({
            target: facade,
            callData: abi.encodeCall(
                ICreditFacadeV3Multicall.increaseDebt,
                (_tokenAmount)
            )
        });

        ICreditFacadeV3(facade).botMulticall(_creditAccount, calls);
    }

    /// @notice Borrow funds using bot
    /// @param _creditManager manager address
    /// @param _token amount of token
    /// @param _creditAccount address of credit account
    function enableTokens(
        address _creditManager,
        address _token,
        address _creditAccount
    ) public {
        MultiCall[] memory calls = new MultiCall[](1);

        address facade = ICreditManagerV3(_creditManager).creditFacade();

        calls[0] = MultiCall({
            target: facade,
            callData: abi.encodeCall(
                ICreditFacadeV3Multicall.enableToken,
                (_token)
            )
        });

        ICreditFacadeV3(facade).botMulticall(_creditAccount, calls);
    }

    /// @notice Repay funds using bot
    /// @param _creditManager manager address
    /// @param _tokenAmount amount of token
    /// @param _creditAccount address of credit account
    function repayFunds(
        address _creditManager,
        uint256 _tokenAmount,
        address _creditAccount
    ) public {
        MultiCall[] memory calls = new MultiCall[](1);

        address facade = ICreditManagerV3(_creditManager).creditFacade();

        calls[0] = MultiCall({
            target: facade,
            callData: abi.encodeCall(
                ICreditFacadeV3Multicall.decreaseDebt,
                (_tokenAmount)
            )
        });

        ICreditFacadeV3(facade).botMulticall(_creditAccount, calls);
    }

    /// @notice Execute
    /// @param _creditManager manager address
    /// @param _creditAccount address of credit account
    /// @param _target target address to call
    /// @param _calldata calldata to send in muticall
    function execute(
        address _creditManager,
        address _creditAccount,
        address _target,
        bytes calldata _calldata
    ) external {
        MultiCall[] memory calls = new MultiCall[](1);

        address facade = ICreditManagerV3(_creditManager).creditFacade();

        calls[0] = MultiCall({target: _target, callData: _calldata});

        ICreditFacadeV3(facade).botMulticall(_creditAccount, calls);
    }

    function _addCollateral(
        address _token,
        address _creditManager,
        uint256 _tokenAmount,
        address _creditAccount
    ) internal {
        IERC20(_token).approve(_creditManager, _tokenAmount);

        MultiCall[] memory calls = new MultiCall[](1);

        address facade = ICreditManagerV3(_creditManager).creditFacade();

        // console.log(facade);

        calls[0] = MultiCall({
            target: facade,
            callData: abi.encodeCall(
                ICreditFacadeV3Multicall.addCollateral,
                (_token, _tokenAmount)
            )
        });

        ICreditFacadeV3(facade).botMulticall(_creditAccount, calls);
    }

    function _encode(
        address _creditManager,
        address _creditAccount,
        address _ownerOfCreditAccount,
        bytes memory oneinchcalldata
    ) internal pure returns (bytes memory) {
        return (
            abi.encode(_creditManager, _creditAccount, _ownerOfCreditAccount, oneinchcalldata)
        );
    }

    function _decode(
        bytes memory data
    )
        internal
        pure
        returns (
            address _creditManager,
            address _creditAccount,
            address _ownerOfCreditAccount,
            bytes memory oneinchcalldata
        )
    {
        (_creditManager, _creditAccount, _ownerOfCreditAccount, oneinchcalldata) = abi.decode(
            data,
            (address, address, address, bytes)
        );
    }

    receive() external payable {}
}
