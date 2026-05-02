export const USDC_DECIMALS = 6;

const USDC_SCALE = 10n ** BigInt(USDC_DECIMALS);

export function parseUsdc(value: string): bigint {
  const trimmed = value.trim();

  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error('Enter a valid USDC amount.');
  }

  const [whole, fraction = ''] = trimmed.split('.');
  if (fraction.length > USDC_DECIMALS) {
    throw new Error('USDC supports up to 6 decimal places.');
  }

  const wholeUnits = BigInt(whole) * USDC_SCALE;
  const fractionUnits = BigInt(fraction.padEnd(USDC_DECIMALS, '0'));

  return wholeUnits + fractionUnits;
}

export function formatUsdc(value: bigint): string {
  const whole = value / USDC_SCALE;
  const fraction = value % USDC_SCALE;

  if (fraction === 0n) return whole.toString();

  const fractionText = fraction.toString().padStart(USDC_DECIMALS, '0').replace(/0+$/, '');
  return `${whole}.${fractionText}`;
}
