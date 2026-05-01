import type { Request } from 'express';
import { verifyMessage } from 'viem';

export function contentReadMessage(communityId: string, wallet: string): string {
  return `Read SORTS content\nCommunity: ${communityId}\nWallet: ${wallet}`;
}

export async function verifyContentReadProof(req: Request, communityId: string, wallet: string): Promise<boolean> {
  const signature = headerOrQuery(req, 'x-sorts-signature', 'signature');
  const message = headerOrQuery(req, 'x-sorts-message', 'message') ?? contentReadMessage(communityId, wallet);

  if (!signature) return false;

  try {
    return await verifyMessage({
      address: wallet as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
  } catch {
    return false;
  }
}

function headerOrQuery(req: Request, header: string, query: string): string | undefined {
  const headerValue = req.header(header);
  if (headerValue) return headerValue;
  const queryValue = req.query[query];
  return typeof queryValue === 'string' ? queryValue : undefined;
}
