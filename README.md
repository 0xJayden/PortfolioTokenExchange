# Portfolio Token Exchange  

Trade ETH for Portfolio Tokens.  

<strong>Website</strong>  

https://portfolio-token-exchange.surge.sh

<strong>How To Use</strong>  

1. Make sure you have MetaMask installed and connect to the site and use the Rinkeby Network.  

2. Make sure you have some ETH in your account on the Rinkeby Network. If you don't, visit a faucet for some ETH e.g. https://faucet.rinkeby.io.  

3. In the Balance section, you may deposit/withdraw ETH or PRT into the exchange. You must have funds deposited to be able to trade.

4. Click on an offer in the Order Book to either buy or sell PRT.

5. To create a buy or sell order, check out the New Order section.  

In the My Transactions section, you can view past trades and orders you've created. You may also cancel your created orders in the Order tab.  

<i>=========================================================================================</i>  

<strong>For Devs</strong>

<strong>Initial Set-Up</strong>

1. Make sure node is installed (Used version 14.17.0, use the same to avoid potential errors.)

2. Install Truffle globally  
`npm i -g truffle`  

3. Install Ganache globally  
`npm i -g ganache`  

4. Download or clone this repository (you may need to install git if cloning using the command line interface - `npm i -g git`)  
`git clone https://github.com/0xJayden/PortfolioTokenExchange.git`  

5. Enter the correct project directory (depends on where you downloaded/cloned the repository to)  
e.g. `cd desktop/PortfolioTokenExchange`  

6. Install dependencies  
`npm install`  

<strong>How To Use</strong>  

1. Open ganache and click the Quickstart button.  

2. Make sure you have MetaMask installed https://metamask.io and connect to a network that matches the network ganache is using (Shows towards the top of Ganache, usually the RPC URL being HTTP://127.0.0.1:7545 and the NETWORK ID being 5777) and the port matches in truffle-config.js.  

3. Import an account from Ganache to your MetaMask.  

4. Deploy the contracts to the development network, which is called development, in truffle-config.js   
`truffle migrate --network development`  

5. Launch the Exchange `npm start` and connect the imported account from MetaMask to the site.  

If you'd like to launch on a test network like Rinkeby, replace development in step 4 with your preffered network (rinkeby is already available in truffle-config.js, if you want to deploy on a different network, then add it in module.exports under networks in truffle-config.js before you migrate)
