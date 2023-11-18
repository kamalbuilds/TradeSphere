// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import {Test} from "@forge-std/Test.sol";
import "forge-std/console.sol";

import {GearSparkbot} from "../src/GearSparkbot.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {MultiCall} from "@gearbox-protocol/core-v2/contracts/libraries/MultiCall.sol";

import {CreditFacadeV3} from "@gearbox-protocol/core-v3/contracts/credit/CreditFacadeV3.sol";
import {CreditManagerV3} from "@gearbox-protocol/core-v3/contracts/credit/CreditManagerV3.sol";
import {BotListV3} from "@gearbox-protocol/core-v3/contracts/core/BotListV3.sol";
import {PoolV3} from "@gearbox-protocol/core-v3/contracts/pool/PoolV3.sol";
import {ICreditFacadeV3Multicall} from "@gearbox-protocol/core-v3/contracts/interfaces/ICreditFacadeV3Multicall.sol";
import {CreditConfiguratorV3} from "@gearbox-protocol/core-v3/contracts/credit/CreditConfiguratorV3.sol";
import "@gearbox-protocol/core-v3/contracts/interfaces/IAddressProviderV3.sol";
import "@gearbox-protocol/core-v3/contracts/interfaces/ICreditFacadeV3Multicall.sol";
import {IBotListV3} from "@gearbox-protocol/core-v3/contracts/interfaces/IBotListV3.sol";

contract GearSparkbotTest is Test {
    GearSparkbot private bot;
    CreditManagerV3 private manager;
    CreditFacadeV3 private facade;

    address private constant CREDIT_MANAGER = 0x6A489b262A02549c59579811Aa304BF995dbb304; // WETH credit manager
    address private constant CREDIT_FACADE = 0x09a080B42909d12CbDc0c0BB2540FeD129CeaeFB;
    address private constant CONFIGURATOR = 0xa133C9A92Fb8dDB962Af1cbae58b2723A0bdf23b;
    address private constant SPARKLEND = 0xC13e21B648A5Ee794902342038FF3aDAB66BE987;
    address private constant ONEINCHROUTERV5 = 0x1111111254EEB25477B68fb85Ed929f73A960582;

    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address private constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address private constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address private constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
    address private constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address private constant POOL = 0x1E61eFbD463a733e99A424D0514C87dd0aA603c2;

    address private constant USER = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    address private constant EXECUTOR = 0x087F5052fBcD7C02DD45fb9907C57F1EccC2bE25;
    address public creditAccount = address(0);
    uint256 public ETH_AMOUNT = 100000000000000000000;

    /// ----- ///
    /// SETUP ///
    /// ----- ///

    function setUp() public {
        bot = new GearSparkbot(SPARKLEND, ONEINCHROUTERV5);
    }

    function test_addCollaterals() public {
        console.log("///      ADD COLLATERAL LOGS        ///");
        MultiCall[] memory calls;
        vm.startPrank(USER);

        // creating credit account for USER (it'll wrap eth and send WETH to USER)
        address creditAccountCreated =
            CreditFacadeV3(CREDIT_FACADE).openCreditAccount{value: ETH_AMOUNT}(USER, calls, 0);

        creditAccount = creditAccountCreated;

        uint192 permissionsBitmask = ADD_COLLATERAL_PERMISSION | REVOKE_ALLOWANCES_PERMISSION
            | EXTERNAL_CALLS_PERMISSION | WITHDRAW_COLLATERAL_PERMISSION | INCREASE_DEBT_PERMISSION
            | DECREASE_DEBT_PERMISSION | ENABLE_TOKEN_PERMISSION;

        // settings permissions to bot to function onBehalfOf credit account of USER
        CreditFacadeV3(CREDIT_FACADE).setBotPermissions(creditAccountCreated, address(bot), permissionsBitmask);
        vm.stopPrank();
    }

    function test_flashLoan() public {
        test_addCollaterals();
        bot.executeTrade(USDC, 9e10, CREDIT_MANAGER, creditAccount, USER);

        console.log(IERC20(WETH).balanceOf(address(bot)));
    }
}