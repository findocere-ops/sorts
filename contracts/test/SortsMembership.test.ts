import { expect } from 'chai';
import { ethers } from 'hardhat';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import type { SortsFactory, SortsMembership } from '../typechain-types';
import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('SortsFactory + SortsMembership', () => {
  let factory: SortsFactory;
  let membership: SortsMembership;
  let owner: HardhatEthersSigner;
  let creator: HardhatEthersSigner;
  let member: HardhatEthersSigner;
  let other: HardhatEthersSigner;

  const TIER_PRICES = [
    ethers.parseEther('0.001'), // Basic
    ethers.parseEther('0.005'), // Pro
    ethers.parseEther('0.01'),  // VIP
  ];
  const TIER_DURATIONS = [30 * 86400, 30 * 86400, 30 * 86400]; // 30 days

  beforeEach(async () => {
    [owner, creator, member, other] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory('SortsFactory');
    factory = await Factory.deploy(owner.address) as SortsFactory;
    await factory.waitForDeployment();

    const tx = await factory.connect(creator).createCommunity(
      'Alpha Traders', 'ALPHA',
      [1, 2, 3], TIER_PRICES, TIER_DURATIONS
    );
    await tx.wait();

    const addr = await factory.getCommunity(0);
    membership = await ethers.getContractAt('SortsMembership', addr) as SortsMembership;
  });

  // ── SortsFactory ──────────────────────────────────────────────────────────

  describe('SortsFactory', () => {
    it('increments communityCount on each deployment', async () => {
      expect(await factory.communityCount()).to.equal(1);
      await factory.connect(other).createCommunity(
        'Beta Guild', 'BETA', [1], [ethers.parseEther('0.001')], [30 * 86400]
      );
      expect(await factory.communityCount()).to.equal(2);
    });

    it('records creator communities', async () => {
      const creatorCommunities = await factory.getCreatorCommunities(creator.address);
      expect(creatorCommunities).to.have.length(1);
      expect(creatorCommunities[0]).to.equal(await factory.getCommunity(0));
    });

    it('rejects empty name', async () => {
      await expect(
        factory.createCommunity('', 'X', [1], [ethers.parseEther('0.001')], [86400])
      ).to.be.revertedWith('Name required');
    });

    it('rejects symbol longer than 5 chars', async () => {
      await expect(
        factory.createCommunity('Test', 'TOOLONG', [1], [ethers.parseEther('0.001')], [86400])
      ).to.be.revertedWith('Symbol max 5 chars');
    });

    it('allows owner to withdraw protocol revenue', async () => {
      // Subscribe to generate a fee
      await membership.connect(member).subscribe(1, { value: TIER_PRICES[0] });

      const factoryBalance = await ethers.provider.getBalance(await factory.getAddress());
      expect(factoryBalance).to.be.gt(0n);

      const before = await ethers.provider.getBalance(owner.address);
      await factory.connect(owner).withdrawRevenue(owner.address, factoryBalance);
      const after = await ethers.provider.getBalance(owner.address);
      expect(after).to.be.gt(before);
    });
  });

  // ── SortsMembership ───────────────────────────────────────────────────────

  describe('SortsMembership — subscribe', () => {
    it('grants access after subscribing', async () => {
      expect(await membership.checkAccess(member.address)).to.be.false;
      await membership.connect(member).subscribe(1, { value: TIER_PRICES[0] });
      expect(await membership.checkAccess(member.address)).to.be.true;
    });

    it('sets correct expiry (approximately 30 days)', async () => {
      await membership.connect(member).subscribe(1, { value: TIER_PRICES[0] });
      const expiry = await membership.getMemberExpiry(member.address);
      const now = BigInt(Math.floor(Date.now() / 1000));
      const diff = expiry - now;
      expect(diff).to.be.closeTo(BigInt(30 * 86400), BigInt(60)); // ±60 sec
    });

    it('forwards 5% protocol fee to factory', async () => {
      const factoryAddr = await factory.getAddress();
      const before = await ethers.provider.getBalance(factoryAddr);
      await membership.connect(member).subscribe(1, { value: TIER_PRICES[0] });
      const after = await ethers.provider.getBalance(factoryAddr);
      const expectedFee = (TIER_PRICES[0] * 500n) / 10000n;
      expect(after - before).to.equal(expectedFee);
    });

    it('forwards remaining 95% to creator', async () => {
      const before = await ethers.provider.getBalance(creator.address);
      await membership.connect(member).subscribe(1, { value: TIER_PRICES[0] });
      const after = await ethers.provider.getBalance(creator.address);
      const expectedShare = TIER_PRICES[0] - (TIER_PRICES[0] * 500n) / 10000n;
      expect(after - before).to.equal(expectedShare);
    });

    it('rejects if already active - use renew instead', async () => {
      await membership.connect(member).subscribe(1, { value: TIER_PRICES[0] });
      await expect(
        membership.connect(member).subscribe(1, { value: TIER_PRICES[0] })
      ).to.be.revertedWith('Already active - use renew');
    });

    it('rejects insufficient payment', async () => {
      await expect(
        membership.connect(member).subscribe(1, { value: ethers.parseEther('0.0001') })
      ).to.be.revertedWith('Insufficient payment');
    });

    it('increments aggregate member count', async () => {
      let stats = await membership.getAggregateStats();
      expect(stats.members).to.equal(0n);
      await membership.connect(member).subscribe(1, { value: TIER_PRICES[0] });
      stats = await membership.getAggregateStats();
      expect(stats.members).to.equal(1n);
    });

    it('tracks aggregate revenue only', async () => {
      await membership.connect(member).subscribe(3, { value: TIER_PRICES[2] });
      const stats = await membership.getAggregateStats();
      expect(stats.members).to.equal(1n);
      expect(stats.revenue).to.equal(TIER_PRICES[2]);
      expect(stats.active).to.equal(1n);
    });
  });

  describe('SortsMembership — tier access', () => {
    it('checkTierAccess returns true for subscribed tier', async () => {
      await membership.connect(member).subscribe(2, { value: TIER_PRICES[1] });
      expect(await membership.checkTierAccess(member.address, 1)).to.be.true;
      expect(await membership.checkTierAccess(member.address, 2)).to.be.true;
    });

    it('checkTierAccess returns false for higher tier', async () => {
      await membership.connect(member).subscribe(1, { value: TIER_PRICES[0] });
      expect(await membership.checkTierAccess(member.address, 2)).to.be.false;
      expect(await membership.checkTierAccess(member.address, 3)).to.be.false;
    });

    it('confidential balance is a commitment (not plaintext tier)', async () => {
      await membership.connect(member).subscribe(1, { value: TIER_PRICES[0] });
      const balance = await membership.confidentialBalanceOf(member.address);
      // Must be a 32-byte commitment, not the literal tier value 1
      expect(balance).to.not.equal(ethers.zeroPadValue('0x01', 32));
      expect(balance.length).to.equal(66); // 0x + 64 hex chars = bytes32
    });

    it('access expires after the subscription window', async () => {
      await membership.connect(member).subscribe(2, { value: TIER_PRICES[1] });
      expect(await membership.checkTierAccess(member.address, 2)).to.be.true;

      await time.increase(30 * 86400 + 1);

      expect(await membership.checkAccess(member.address)).to.be.false;
      expect(await membership.checkTierAccess(member.address, 1)).to.be.false;
    });
  });

  describe('SortsMembership — renew', () => {
    it('extends expiry when renewed while active', async () => {
      await membership.connect(member).subscribe(1, { value: TIER_PRICES[0] });
      const before = await membership.getMemberExpiry(member.address);
      await membership.connect(member).renewSubscription({ value: TIER_PRICES[0] });
      const after = await membership.getMemberExpiry(member.address);
      expect(after).to.be.gt(before);
    });

    it('reverts if no membership exists', async () => {
      await expect(
        membership.connect(other).renewSubscription({ value: TIER_PRICES[0] })
      ).to.be.revertedWith('No membership to renew');
    });
  });

  describe('SortsMembership — ERC-7984 compliance', () => {
    it('all transfer variants are non-transferable', async () => {
      await membership.connect(member).subscribe(1, { value: TIER_PRICES[0] });
      const token = membership.connect(member) as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>;
      const calls: Array<[string, unknown[]]> = [
        ['confidentialTransfer(address,bytes32)', [other.address, ethers.ZeroHash]],
        ['confidentialTransfer(address,bytes32,bytes)', [other.address, ethers.ZeroHash, '0x']],
        ['confidentialTransferFrom(address,address,bytes32)', [member.address, other.address, ethers.ZeroHash]],
        ['confidentialTransferFrom(address,address,bytes32,bytes)', [member.address, other.address, ethers.ZeroHash, '0x']],
        ['confidentialTransferAndCall(address,bytes32,bytes)', [other.address, ethers.ZeroHash, '0x']],
        ['confidentialTransferAndCall(address,bytes32,bytes,bytes)', [other.address, ethers.ZeroHash, '0x', '0x']],
        ['confidentialTransferFromAndCall(address,address,bytes32,bytes)', [member.address, other.address, ethers.ZeroHash, '0x']],
        ['confidentialTransferFromAndCall(address,address,bytes32,bytes,bytes)', [member.address, other.address, ethers.ZeroHash, '0x', '0x']],
      ];

      for (const [signature, args] of calls) {
        await expect(token[signature](...args)).to.be.revertedWith('Non-transferable membership token');
      }
    });

    it('supports ERC-7984 interface ID', async () => {
      expect(await membership.supportsInterface('0x4958f2a4')).to.be.true;
    });

    it('exposes name and symbol', async () => {
      expect(await membership.name()).to.equal('Alpha Traders');
      expect(await membership.symbol()).to.equal('ALPHA');
    });

    it('exposes confidential metadata and operator approvals', async () => {
      expect(await membership.decimals()).to.equal(0);
      expect(await membership.contractURI()).to.equal('');

      const supplyBefore = await membership.confidentialTotalSupply();
      await membership.connect(member).setOperator(other.address, (await time.latest()) + 1000);
      expect(await membership.isOperator(member.address, other.address)).to.equal(true);
      await membership.connect(member).subscribe(1, { value: TIER_PRICES[0] });
      const supplyAfter = await membership.confidentialTotalSupply();

      expect(supplyBefore).to.not.equal(supplyAfter);
      expect(supplyAfter.length).to.equal(66);
    });
  });
});
