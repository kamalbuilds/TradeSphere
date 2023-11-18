// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import {Balance} from "@gearbox-protocol/core-v2/contracts/libraries/Balances.sol";
import {MultiCall} from "@gearbox-protocol/core-v2/contracts/libraries/MultiCall.sol";
import {ICreditManagerV3} from "@gearbox-protocol/core-v3/contracts/interfaces/ICreditManagerV3.sol";
import {ICreditFacadeV3} from "@gearbox-protocol/core-v3/contracts/interfaces/ICreditFacadeV3.sol";
import {ICreditFacadeV3Multicall} from "@gearbox-protocol/core-v3/contracts/interfaces/ICreditFacadeV3Multicall.sol";
import "@aave/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import "@aave/contracts/interfaces/IPoolAddressesProvider.sol";

contract SimpleFlashLoan is FlashLoanSimpleReceiverBase {
    address payable owner;

    constructor(address _addressProvider)
        FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider))
    {
    }

    function fn_RequestFlashLoan(address _token, uint256 _amount) public {
        address receiverAddress = address(this);
        address asset = _token;
        uint256 amount = _amount;
        bytes memory params = "";
        uint16 referralCode = 0;

        POOL.flashLoanSimple(
            receiverAddress,
            asset,
            amount,
            params,
            referralCode
        );
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
    ) external {
        IERC20(_token).transferFrom(_ownerOfCreditAccount, address(this), _tokenAmount);
        IERC20(_token).approve(_creditManager, _tokenAmount);

        MultiCall[] memory calls = new MultiCall[](1);

        address facade = ICreditManagerV3(_creditManager).creditFacade();

        calls[0] = MultiCall({
            target: facade,
            callData: abi.encodeCall(ICreditFacadeV3Multicall.addCollateral, (_token, _tokenAmount))
        });

        ICreditFacadeV3(facade).botMulticall(_creditAccount, calls);
    }

    /// @notice Withdraw collateral using bot
    /// @param _token token address
    /// @param _creditManager manager address
    /// @param _tokenAmount amount of token
    /// @param _creditAccount address of credit account
    /// @param _ownerOfCreditAccount address of credit account's owner
    function withdrawCollateral(
        address _token,
        address _creditManager,
        uint256 _tokenAmount,
        address _creditAccount,
        address _ownerOfCreditAccount
    ) external {
        MultiCall[] memory calls = new MultiCall[](1);

        address facade = ICreditManagerV3(_creditManager).creditFacade();

        calls[0] = MultiCall({
            target: facade,
            callData: abi.encodeCall(
                ICreditFacadeV3Multicall.withdrawCollateral, (_token, _tokenAmount, _ownerOfCreditAccount)
                )
        });

        ICreditFacadeV3(facade).botMulticall(_creditAccount, calls);
    }

    /// @notice Borrow funds using bot
    /// @param _creditManager manager address
    /// @param _tokenAmount amount of token
    /// @param _creditAccount address of credit account
    function borrowFunds(address _creditManager, uint256 _tokenAmount, address _creditAccount) external {
        MultiCall[] memory calls = new MultiCall[](1);

        address facade = ICreditManagerV3(_creditManager).creditFacade();

        calls[0] =
            MultiCall({target: facade, callData: abi.encodeCall(ICreditFacadeV3Multicall.increaseDebt, (_tokenAmount))});

        ICreditFacadeV3(facade).botMulticall(_creditAccount, calls);
    }

    /// @notice Repay funds using bot
    /// @param _creditManager manager address
    /// @param _tokenAmount amount of token
    /// @param _creditAccount address of credit account
    function repayFunds(address _creditManager, uint256 _tokenAmount, address _creditAccount) external {
        MultiCall[] memory calls = new MultiCall[](1);

        address facade = ICreditManagerV3(_creditManager).creditFacade();

        calls[0] =
            MultiCall({target: facade, callData: abi.encodeCall(ICreditFacadeV3Multicall.decreaseDebt, (_tokenAmount))});

        ICreditFacadeV3(facade).botMulticall(_creditAccount, calls);
    }

    /// @notice Execute
    /// @param _creditManager manager address
    /// @param _creditAccount address of credit account
    /// @param _target target address to call
    /// @param _calldata calldata to send in muticall
    function execute(address _creditManager, address _creditAccount, address _target, bytes calldata _calldata)
        external
    {
        MultiCall[] memory calls = new MultiCall[](1);

        address facade = ICreditManagerV3(_creditManager).creditFacade();

        calls[0] = MultiCall({target: _target, callData: _calldata});

        ICreditFacadeV3(facade).botMulticall(_creditAccount, calls);
    }

    /**
        This function is called after your contract has received the flash loaned amount
     */
    function  executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    )  external override returns (bool) {
        
        //Logic goes here
        
        uint256 totalAmount = amount + premium;
        IERC20(asset).approve(address(POOL), totalAmount);

        return true;
    }

    receive() external payable {}
}