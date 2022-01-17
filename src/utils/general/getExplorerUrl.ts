const ETHERSCAN = 'https://etherscan.io/';

const CHAIN_ID_TO_EXPLORER = {
  1: ETHERSCAN,
  42: 'https://kovan.etherscan.io/',
  56: 'https://bscscan.io/',
  1337: '',
  421611: 'https://testnet.arbiscan.io/',
  42161: 'https://arbiscan.io/',
};

function getExplorerUrl(chainId: number): string {
  return CHAIN_ID_TO_EXPLORER[chainId] ?? ETHERSCAN;
}

export default getExplorerUrl;