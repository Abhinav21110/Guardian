import { Router } from 'express';
import crypto from 'crypto';
import { BlockchainService } from '../services/blockchain';

export const scanRouter = Router();

const blockchain = new BlockchainService();

scanRouter.post('/', async (req, res, next) => {
  try {
    const { input } = req.body as { input?: string };
    if (!input || typeof input !== 'string' || input.length > 10_000) {
      return res.status(400).json({ error: true, message: 'Invalid input' });
    }
    const hashHex = '0x' + crypto.createHash('sha256').update(input).digest('hex');

    let txHash: string | undefined;
    let chainId: number | undefined;
    try {
      const result = await blockchain.anchorHash(hashHex);
      txHash = result.txHash;
      chainId = result.chainId;
    } catch {
      // anchoring optional if blockchain not configured
    }

    res.json({
      ok: true,
      sha256: hashHex,
      anchored: Boolean(txHash),
      txHash,
      chainId,
    });
  } catch (err) {
    next(err);
  }
});
