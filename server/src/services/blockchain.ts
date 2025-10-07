import { ethers } from 'ethers';
import { config } from '../config/env';
import { logger } from '../config/logger';

export type AnchorResult = { txHash: string; chainId: number };

export class BlockchainService {
  private provider?: ethers.JsonRpcProvider;
  private wallet?: ethers.Wallet;
  private contract: ethers.Contract | null = null;

  constructor() {
    if (!config.rpcUrl || !config.privateKey) {
      logger.warn('Blockchain not configured; RPC_URL or PRIVATE_KEY missing');
      return;
    }
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl, config.chainId);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    if (config.contractAddress) {
      const abi = [
        'function anchor(bytes32 hash) public returns (bool)',
        'event Anchored(bytes32 indexed hash, address indexed by)'
      ];
      this.contract = new ethers.Contract(config.contractAddress, abi, this.wallet);
    }
  }

  async anchorHash(hashHex: string): Promise<AnchorResult> {
    if (!this.wallet) throw new Error('Blockchain wallet not configured');
    if (!hashHex.startsWith('0x')) throw new Error('hashHex must be 0x-prefixed hex');

    const provider = this.wallet.provider!;

    if (this.contract !== null) {
      const contract = this.contract as unknown as { anchor: (hash: string) => Promise<ethers.TransactionResponse> };
      const tx = await contract.anchor(hashHex);
      const receipt = await tx.wait();
      const net = await provider.getNetwork();
      return { txHash: receipt?.hash ?? tx.hash, chainId: Number(net.chainId) };
    }
    // Fallback: self tx with data = hash
    const tx = await this.wallet.sendTransaction({ to: this.wallet.address, data: hashHex });
    const receipt = await tx.wait();
    const net = await provider.getNetwork();
    return { txHash: receipt?.hash ?? tx.hash, chainId: Number(net.chainId) };
  }
}
