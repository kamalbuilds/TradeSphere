**Name: TradeSphere**

**Tagline: Empowering DeFi Traders with a Social Edge**

![WhatsApp Image 2023-11-19 at 10 14 29_f8edf397](https://github.com/kamalbuilds/TradeSphere/assets/95926324/c3280556-faec-4096-90d1-86cdd3a24908)


## Technologies used

Gearbot - SparkLend - 1inch marginal trades

![WhatsApp Image 2023-11-19 at 10 23 15_4b9bf13f](https://github.com/kamalbuilds/TradeSphere/assets/95926324/6ebe2b5a-ed75-4c94-ae19-bf8a7a54939d)

Cow Swaps- JIT Place Smart Orders using the Safe AA kit 

Web3InboxSDK - In-Dapp Messages

Next.ID - Relational Service for Universal Profiles and Discovery

Lens - Onchain Publication Actions

Deploy on scroll , gnosis

API3 price feed calls

Curvegrid - Building SocialFi using MultiBass API
https://do7qenwji5gedjg53jykeaa3h4.multibaas.com/

Chronicle Scribe calls to read the onchain Feeds

**Features:**

1. **Social DeFi Integration:**
   - Unite the power of decentralized finance with a social layer, fostering collaboration and knowledge sharing among on-chain traders.

2. **Multi-Protocol Trading Strategies:**
   - Leverage Gearbots' multicall feature to build intricate crypto trading strategies seamlessly across various protocols, including 1inch and Cow Swap.

3. **Pre and Post Hooks Customization:**
   - Customize your trading experience with pre and post hooks, enabling users to fine-tune strategies before placing orders.

4. **Lens Smart Posts:**
   - Share your trading strategies with the community using Lens smart posts, providing insights into your approach and fostering a vibrant ecosystem of shared knowledge.

5. **Monetization Opportunities:**
   - Earn money for your trading strategies by allowing other users to access and implement them. Monetize your expertise and contribute to the growth of a collaborative trading community.

6. **Onchain Price Feeds:**
   - Access accurate and real-time price data through onchain oracles like Chronicle Protocol and API3, ensuring reliable information for informed decision-making.

7. **Decentralized Data Storage:**
   - Benefit from decentralized data storage for enhanced security and privacy, ensuring that your trading strategies and insights remain in your control.

8. **Community-driven Development:**
   - Engage with a vibrant community of developers and traders, contributing to the ongoing development and improvement of TradeSphere.

9. **User-Friendly Interface:**
   - Enjoy a seamless and intuitive user interface designed for both novice and experienced traders, making DeFi trading and strategy sharing accessible to all.


Stack used:

- **[Next.js](https://nextjs.org/)**: Epic React framework for building production-ready apps.
- **[TypeScript](https://www.typescriptlang.org/)**: Type-safety for writing less buggy code.
- **[GraphQL](https://graphql.org/)** and **[urql](https://formidable.com/open-source/urql/)**: Query data from Lens with GraphQL.
- **[React Query](https://react-query.tanstack.com/)**: Utility for fetching, caching and updating data from Lens.

Steps to use for Using Transaction Builder for staking
1. Make sure you have connected with safe and your safe has been deployed.
2. First you need to allow USDC Address -> 0xe27658a36cA8A59fE5Cc76a14Bde34a51e587ab4
   1. Go to Pre Hook, Enter Contract Address (i.e,0xe27658a36cA8A59fE5Cc76a14Bde34a51e587ab4). Click on Get Functions, it will fetch ABI from etherscan and display available functions and select the function 'approve' from the dropdown.
   2. Enter spender addresss (i.e, GPV2Realyer = 0xC92E8bdf79f0507f65a392b0ab4667716BFE0110 and enter value in uint256 i.e, 1 USDC = 1000000).
   3. Click on set Pre Hook to set approval as pre hook function.
   4. After setting Pre Hook, Click on Get Quote this will fetch the best price from the Cow Protocol for Cow Token by selling USDC.
   5. After Clicking on get Quote, you can see Fetched Quote.
   6. Sell Token is USDC, Buy Token is Cow Token.
3. After Getting Quote, Click on Post Hook for setting post hook function.
4. Enter Staking Addresss (i.e, 0x553f41489A719ED723Eb493fdB6DB494453143af). Click on Get Functions, it will fetch ABI from etherscan and display available functions and select the function 'stake' from the dropdown.
5. After Clicking, Enter the value that you want to stake. (Remember: You can stake Cow Token till the amount that is fetched from Quote from Cow Swap.)
6. Click on Set Post Hook. When you see Post Hook Set, Click on Generate Order UID. Sign the Metamask pop up and boom you can get the order Id in console and you have staked Cow Token into the staking contract.

