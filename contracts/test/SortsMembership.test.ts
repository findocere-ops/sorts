import { expect } from 'chai';
import { ethers } from 'hardhat';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import type { MockERC20, SortsFactory, SortsMembership } from '../typechain-types';
import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('SortsFactory + SortsMembership', () => {
  let usdc: MockERC20;
  let factory: SortsFactory;
  let membership: SortsMembership;
  let owner: HardhatEthersSigner;
  let creator: HardhatEthersSigner;
  let member: HardhatEthersSigner;
  let other: HardhatEthersSigner;

  const TIER_PRICES = [
    ethers.parseUnits('10', 6),  // Basic
    ethers.parseUnits('25', 6),  // Pro
    ethers.parseUnits('50', 6),  // VIP
  ];
  const TIER_DURATIONS = [30 * 86400, 30 * 86400, 30 * 86400]; // 30 days
  const MEMBER_USDC = ethers.parseUnits('1000', 6);

  async function approveMembership(signer: HardhatEthersSigner, amount = MEMBER_USDC) {
    await usdc.connect(signer).approve(await membership.getAddress(), amount);
  }

  beforeEach(async () => {
    [owner, creator, member, other] = await ethers.getSigners();

    const Usdc = await ethers.getContractFactory('MockERC20');
    usdc = await Usdc.deploy('Mock USDC', 'USDC') as MockERC20;
    await usdc.waitForDeployment();

    const Factory = await ethers.getContractFactory('SortsFactory');
    factory = await Factory.deploy(owner.address, await usdc.getAddress()) as SortsFactory;
    await factory.waitForDeployment();

    const tx = await factory.connect(creator).createCommunity(
      'Alpha Traders', 'ALPHA',
      [1, 2, 3], TIER_PRICES, TIER_DURATIONS
    );
    await tx.wait();

    const addr = await factory.getCommunity(0);
    membership = await ethers.getContractAt('SortsMembership', addr) as SortsMembership;

    await usdc.mint(member.address, MEMBER_USDC);
  });

  // ── SortsFactory ──────────────────────────────────────────────────────────

  describe('SortsFactory', () => {
    it('stores the USDC payment token', async () => {
      expect(await factory.paymentToken()).to.equal(await usdc.getAddress());
      expect(await membership.paymentToken()).to.equal(await usdc.getAddress());
    });

    it('increments communityCount on each deployment', async () => {
      expect(await factory.communityCount()).to.equal(1);
      await factory.connect(other).createCommunity(
        'Beta Guild', 'BETA', [1], [ethers.parseUnits('10', 6)], [30 * 86400]
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
        factory.createCommunity('', 'X', [1], [ethers.parseUnits('10', 6)], [86400])
      ).to.be.revertedWith('Name required');
    });

    it('rejects symbol longer than 5 chars', async () => {
      await expect(
        factory.createCommunity('Test', 'TOOLONG', [1], [ethers.parseUnits('10', 6)], [86400])
      ).to.be.revertedWith('Symbol max 5 chars');
    });

    it('allows owner to withdraw protocol USDC revenue', async () => {
      await approveMembership(member);
      await membership.connect(member).subscribe(1);

      const factoryBalance = await usdc.balanceOf(await factory.getAddress());
      expect(factoryBalance).to.be.gt(0n);

      const before = await usdc.balanceOf(owner.address);
      await factory.connect(owner).withdrawTokens(owner.address, factoryBalance);
      const after = await usdc.balanceOf(owner.address);
      expect(after - before).to.equal(factoryBalance);
    });
  });

  // ── SortsMembership ───────────────────────────────────────────────────────

  describe('SortsMembership — subscribe', () => {
    it('grants access after subscribing with USDC', async () => {
      expect(await membership.checkAccess(member.address)).to.be.false;
      await approveMembership(member);
      await membership.connect(member).subscribe(1);
      expect(await membership.checkAccess(member.address)).to.be.true;
    });

    it('does not accept native ETH payments', async () => {
      await approveMembership(member);
      await expect(
        membership.connect(member).subscribe(1, { value: 1n })
      ).to.be.reverted;
    });

    it('sets correct expiry (approximately 30 days)', async () => {
      await approveMembership(member);
      await membership.connect(member).subscribe(1);
      const expiry = await membership.getMemberExpiry(member.address);
      const latest = BigInt(await time.latest());
      const diff = expiry - latest;
      expect(diff).to.be.closeTo(BigInt(30 * 86400), BigInt(60)); // ±60 sec
    });

    it('forwards 5% protocol fee to factory in USDC', async () => {
      const factoryAddr = await factory.getAddress();
      const before = await usdc.balanceOf(factoryAddr);
      await approveMembership(member);
      await membership.connect(member).subscribe(1);
      const after = await usdc.balanceOf(factoryAddr);
      const expectedFee = (TIER_PRICES[0] * 500n) / 10000n;
      expect(after - before).to.equal(expectedFee);
    });

    it('forwards remaining 95% to creator in USDC', async () => {
      const before = await usdc.balanceOf(creator.address);
      await approveMembership(member);
      await membership.connect(member).subscribe(1);
      const after = await usdc.balanceOf(creator.address);
      const expectedShare = TIER_PRICES[0] - (TIER_PRICES[0] * 500n) / 10000n;
      expect(after - before).to.equal(expectedShare);
    });

    it('rejects if already active - use renew instead', async () => {
      await approveMembership(member);
      await membership.connect(member).subscribe(1);
      await expect(
        membership.connect(member).subscribe(1)
      ).to.be.revertedWith('Already active - use renew');
    });

    it('rejects without allowance', async () => {
      await expect(
        membership.connect(member).subscribe(1)
      ).to.be.reverted;
    });

    it('rejects with insufficient allowance', async () => {
      await usdc.connect(member).approve(await membership.getAddress(), TIER_PRICES[0] - 1n);
      await expect(
        membership.connect(member).subscribe(1)
      ).to.be.reverted;
    });

    it('rejects with insufficient balance', async () => {
      await usdc.mint(other.address, TIER_PRICES[0] - 1n);
      await usdc.connect(other).approve(await membership.getAddress(), TIER_PRICES[0]);
      await expect(
        membership.connect(other).subscribe(1)
      ).to.be.reverted;
    });

    it('increments aggregate member count', async () => {
      let stats = await membership.getAggregateStats();
      expect(stats.members).to.equal(0n);
      await approveMembership(member);
      await membership.connect(member).subscribe(1);
      stats = await membership.getAggregateStats();
      expect(stats.members).to.equal(1n);
    });

    it('tracks aggregate revenue only', async () => {
      await approveMembership(member);
      await membership.connect(member).subscribe(3);
      const stats = await membership.getAggregateStats();
      expect(stats.members).to.equal(1n);
      expect(stats.revenue).to.equal(TIER_PRICES[2]);
      expect(stats.active).to.equal(1n);
    });
  });

  describe('SortsMembership — tier access', () => {
    it('checkTierAccess returns true for subscribed tier', async () => {
      await approveMembership(member);
      await membership.connect(member).subscribe(2);
      expect(await membership.checkTierAccess(member.address, 1)).to.be.true;
      expect(await membership.checkTierAccess(member.address, 2)).to.be.true;
    });

    it('checkTierAccess returns false for higher tier', async () => {
      await approveMembership(member);
      await membership.connect(member).subscribe(1);
      expect(await membership.checkTierAccess(member.address, 2)).to.be.false;
      expect(await membership.checkTierAccess(member.address, 3)).to.be.false;
    });

    it('confidential balance is a commitment (not plaintext tier)', async () => {
      await approveMembership(member);
      await membership.connect(member).subscribe(1);
      const balance = await membership.confidentialBalanceOf(member.address);
      // Must be a 32-byte commitment, not the literal tier value 1
      expect(balance).to.not.equal(ethers.zeroPadValue('0x01', 32));
      expect(balance.length).to.equal(66); // 0x + 64 hex chars = bytes32
    });

    it('access expires after the subscription window', async () => {
      await approveMembership(member);
      await membership.connect(member).subscribe(2);
      expect(await membership.checkTierAccess(member.address, 2)).to.be.true;

      await time.increase(30 * 86400 + 1);

      expect(await membership.checkAccess(member.address)).to.be.false;
      expect(await membership.checkTierAccess(member.address, 1)).to.be.false;
    });
  });

  describe('SortsMembership — renew', () => {
    it('extends expiry when renewed while active with USDC', async () => {
      await approveMembership(member);
      await membership.connect(member).subscribe(1);
      const before = await membership.getMemberExpiry(member.address);
      await membership.connect(member).renewSubscription();
      const after = await membership.getMemberExpiry(member.address);
      expect(after).to.be.gt(before);
    });

    it('returns the expected USDC base-unit renewal price', async () => {
      await approveMembership(member);
      await membership.connect(member).subscribe(2);
      expect(await membership.getRenewalPrice(member.address)).to.equal(TIER_PRICES[1]);
    });

    it('reverts if no membership exists', async () => {
      await expect(
        membership.connect(other).renewSubscription()
      ).to.be.revertedWith('No membership to renew');
    });
  });

  describe('SortsMembership — ERC-7984 compliance', () => {
    it('all transfer variants are non-transferable', async () => {
      await approveMembership(member);
      await membership.connect(member).subscribe(1);
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
      await approveMembership(member);
      await membership.connect(member).subscribe(1);
      const supplyAfter = await membership.confidentialTotalSupply();

      expect(supplyBefore).to.not.equal(supplyAfter);
      expect(supplyAfter.length).to.equal(66);
    });
  });
});
