import Web3 from "web3";
import Wallet from "./contracts/Wallet.json";

const getWeb3 = () => {
  return new Promise((resolve, reject) => {
    //wait for loading completion to prevent race conditions with web3 injection timing
    window.addEventListener("load", async () => {
      //for modern browsers
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          //requests metamask access
          await window.ethereum.enable();
          //accounts exposed
          resolve(web3);
        } catch (error) {
          reject(error);
        }
        //for older browsers
      } else if (window.web3) {
        resolve(window.web3);
      } else {
        const provider = new Web3.providers.HttpProvider(
          "http://localhost:9545"
        ); //else resolves to using ganache
        const web3 = new Web3(provider);
        console.log("NO metamask, using local web3");
        resolve(web3);
      }
    });
  });
};

const getWallet = async (web3) => {
  const networkId = await web3.eth.net.getId(); //this current network Id
  const contractDeployment = Wallet.networks[networkId]; //pass network Id to the contract being deployed
  return new web3.eth.Contract(
    Wallet.abi,
    contractDeployment && contractDeployment.address
  ); //passes the abi & contract being deployed
};

export { getWeb3, getWallet };
