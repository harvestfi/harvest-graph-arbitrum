import { Address, BigDecimal, BigInt, dataSource } from "@graphprotocol/graph-ts";
import { pow } from "./MathUtils";
import { stringIdToBytes } from './IdUtils';

export const UNKNOWN = 'unknown';

export const UNISWAP_V3_VALUE = pow(pow(BigDecimal.fromString('2'), 96), 2)
export const SECONDS_OF_YEAR = BigDecimal.fromString('31557600');
export const DEFAULT_DECIMAL = 18;
export const DEFAULT_PRICE = BigInt.fromI32(0);
export const YEAR_PERIOD = BigDecimal.fromString('365')
export const BI_TEN = BigInt.fromI64(10)
export const BI_18 = BigInt.fromI64(10 ** 18)
export const BD_18 = BigDecimal.fromString('1000000000000000000')
export const BD_ZERO = BigDecimal.fromString('0')
export const BD_ONE = BigDecimal.fromString('1')
export const BD_TEN = BigDecimal.fromString('10')
export const BD_ONE_HUNDRED = BigDecimal.fromString('100')
export const USDC_DECIMAL = 6;
export const TWO_WEEKS_IN_SECONDS = BigInt.fromString('1209600');

export const DEFAULT_IFARM_PRICE = BigInt.fromString('40000000000000000000')

export const EVERY_24_HOURS = 86400;
export const BI_12_HOURS = BigInt.fromI32(43200);
export const BI_EVERY_24_HOURS = BigInt.fromString('86400');
export const EVERY_7_DAYS = 604800;
export const BI_EVERY_7_DAYS = BigInt.fromString('604800');
export const MODULE_RESULT = 75600;
export const MODULE_RESULT_V2 = 518400;
export const CONST_ID = stringIdToBytes('1');

export const MAX_TVL = BigDecimal.fromString('100000000')

export const WBTC = Address.fromString('0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f');
export const WETH = Address.fromString('0x82af49447d8a07e3bd95bd0d56f35241523fbab1');
export const USDC_ARBITRUM = Address.fromString('0xff970a61a04b1ca14834a43f5de4533ebddb5cc8');
export const USD_PLUS = Address.fromString('0xe80772eaf6e2e18b651f160bc9158b2a5cafca65');
export const IFARM = Address.fromString('0x9dca587dc65ac0a043828b0acd946d71eb8d46c1');
export const RADIANT = Address.fromString('0x3082CC23568eA640225c2467653dB90e9250AaA0');
export const SILO = Address.fromString('0x0341c0c0ec423328621788d4854119b97f44e391');
export const RADIANT_PRICE = Address.fromString('0x76663727c39Dd46Fed5414d6801c4E8890df85cF');
export const X_GRAIL = Address.fromString('0x3caae25ee616f2c8e13c74da0813402eae3f496b');
export const GRAIL = Address.fromString('0x3d9907f9a368ad0a51be60f7da3b97cf940982d8');
export const WA_WETH = Address.fromString('0x18C100415988bEF4354EfFAd1188d1c22041B046');
export const WST_ETH = Address.fromString('0x5979D7b546E38E414F7E9822514be443A4800529');
export const ST_ETH_A_ETH = Address.fromString('0x5a7f39435fd9c381e4932fa2047c9a5136a5e3e7');
export const R_ETH_A_ETH = Address.fromString('0xcba9ff45cfb9ce238afde32b0148eb82cbe63562');
export const ARB = Address.fromString('0x912CE59144191C1204E64559FE8253a0e49E6548');
export const ARB_POOL = [
  '0xf6da879761961ABD22177242904a6E12BB034C22'.toLowerCase(),
  '0xf6da879761961ABD22177242904a6E12BB034C22'.toLowerCase()
];

export const CONVEX_POOL_LIST = [
  '0x3c64d44Ab19D63F09ebaD38fd7b913Ab7E15e341'.toLowerCase(),
  '0x82670f35306253222F8a165869B28c64739ac62e'.toLowerCase(),
  '0xF7Fed8Ae0c5B78c19Aadd68b700696933B0Cefd9'.toLowerCase()
]

export const WETH_LIST = [
  WETH,
  ST_ETH_A_ETH,
  WA_WETH,
  R_ETH_A_ETH,
  Address.fromString('0x36bf227d6bac96e2ab1ebb5492ecec69c691943f'.toLowerCase()),
  Address.fromString('0xe62880CC6872c9E9Fb1DDd73f400850fdaBE798D'.toLowerCase()),
  Address.fromString('0x5477B2E46DD6D2D8E52f8329f0DC283F6f768cFa'),
  Address.fromString('0x4186BFC76E2E237523CBC30FD220FE055156b41F'),
  Address.fromString('0x6F02C88650837C8dfe89F66723c4743E9cF833cd'),
  Address.fromString('0x95f425c7d730eb7673fca272c2c305f48ed546c3'),
  Address.fromString('0x59745774ed5eff903e615f5a2282cae03484985a'),
  Address.fromString('0x90e6CB5249f5e1572afBF8A96D8A1ca6aCFFd739'),
  Address.fromString('0xd0EC47c54cA5e20aaAe4616c25C825c7f48D4069'),
  Address.fromString('0x2d6CeD12420a9AF5a83765a8c48Be2aFcD1A8FEb'),
  Address.fromString('0x18C14C2D707b2212e17d1579789Fc06010cfca23'),
  Address.fromString('0x18b0fc5a233acf1586da7c199ca9e3f486305a29'),

];
export const CAMELOT_ETH_FARM = Address.fromString('0xd2a7084369cc93672b2ca868757a9f327e3677a4');
export const SUSHI_ETH_RADIANT = Address.fromString('0x3BFB1ac033ff0aE278Be0583FCCc900FBD9382c6');
export const SUSHI_ETH_WSETH = Address.fromString('0xb0d62768e2Fb9bD437a51B993b77B93Ac9F249d5');

export const CAMELOT_FACTORY = Address.fromString('0x6eccab422d763ac031210895c81787e87b43a652');

export const WST_ETH_LIST = [
  WST_ETH,
  Address.fromString('0x79a2e71460c97807EC40D6d670838bEe99848F1d')
]
export const STABLE_COIN_ARRAY_MAINNET = [
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'.toLowerCase(),
  '0xe9e7cea3dedca5984780bafc599bd69add087d56'.toLowerCase(),
  '0xdAC17F958D2ee523a2206206994597C13D831ec7'.toLowerCase(),
  '0x0000000000085d4780B73119b644AE5ecd22b376'.toLowerCase(),
  '0x6B175474E89094C44Da98b954EedeAC495271d0F'.toLowerCase(),

  // Orbit Bridge Polygon Tether USD (oUSDT)
  '0x957da9ebbcdc97dc4a8c274dd762ec2ab665e15f'.toLowerCase()
]

export const STABLE_COIN_ARRAY_MATIC = [
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'.toLowerCase(),
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'.toLowerCase(),
  '0xE840B73E5287865EEc17d250bFb1536704B43B21'.toLowerCase(),
  '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'.toLowerCase(),
  // Euro Tether (PoS) (EURT)
  '0x7BDF330f423Ea880FF95fC41A280fD5eCFD3D09f'.toLowerCase(),
  // Jarvis Synthetic Canadian Dollar (jCAD)
  '0x8ca194A3b22077359b5732DE53373D4afC11DeE3'.toLowerCase(),
  // Jarvis Synthetic Singapore Dollar (jSGD)
  '0xa926db7a4CC0cb1736D5ac60495ca8Eb7214B503'.toLowerCase(),
  // Monerium EUR emoney (EURe)
  '0x18ec0A6E18E5bc3784fDd3a3634b31245ab704F6'.toLowerCase(),
  // Orbit Bridge Polygon Tether USD (oUSDT)
  '0x957da9ebbcdc97dc4a8c274dd762ec2ab665e15f'.toLowerCase(),
  // Orbit Bridge Polygon USD Coin (oUSDC)
  '0x5bef2617ecca9a39924c09017c5f1e25efbb3ba8'.toLowerCase(),
  // Orbit Bridge Polygon ZEMIT (oZEMIT)
  '0xa34e0eacb7fbb0b0d45da89b083e0f87fcdf6157'.toLowerCase(),
  // Orbit Bridge Polygon MOOI (oMOOI)
  '0x746351ab4b9d4f802b7b770f33184d0a6b17363d'.toLowerCase()
]

export const STABLE_COIN_ARRAY_ARBITRUM = [
  '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'.toLowerCase(),
  '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8'.toLowerCase(),
  '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1'.toLowerCase(),
  // STASIS EURS Token (EURS)
  '0xD22a58f79e9481D1a88e00c343885A588b34b68B'.toLowerCase(),
  // USD Coin (Arb1)-LP (S*USDC)
  '0x892785f33cdee22a30aef750f285e18c18040c3e'.toLowerCase(),
  // USD+
  '0xe80772eaf6e2e18b651f160bc9158b2a5cafca65'.toLowerCase(),
  // agEUR
  '0xfa5ed56a203466cbbc2430a43c66b9d8723528e7'.toLowerCase(),
  '0x93b346b6bc2548da6a1e7d98e9a421b42541425b'.toLowerCase(),
  // wjAura
  '0xcB9295ac65De60373A25C18d2044D517ed5da8A9'.toLowerCase(),
  '0xbF353C369Aa753b211374D7ecB286da499991C94'.toLowerCase(),
  '0x0Fa7b744F18D8E8c3D61B64b110F25CC27E73055'.toLowerCase(),
  '0x2977b0B54a76c2b56D32cef19f8ea83Cc766cFD9'.toLowerCase(),
  '0xE5232c2837204ee66952f365f104C09140FB2E43'.toLowerCase(),
  '0x5Ef78a0966BD47dEd63034678083714b4DE6e013'.toLowerCase(),
  '0x85cebd962861be410a777755dfa06914de6af003'.toLowerCase(),

  '0x48ad8eE28af1057Cdec42080D3Fd57b3E877d59C'.toLowerCase(),
  '0xc49bebC972f5390eE1EC8A69E4151838f59334Fc'.toLowerCase(),
  '0x5Ef78a0966BD47dEd63034678083714b4DE6e013'.toLowerCase(),
  '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'.toLowerCase(),

  // underlying
  '0x399f292939668e591957726df3ec9a0e7dc8ac57'.toLowerCase(),
  '0x8409de8e98f80d0e40f42849ef0923c2493beead'.toLowerCase(),
  '0xd86b1c1c7f921f3663921f8917d086379739cda3'.toLowerCase(),
  // GHO
  '0x7dfF72693f6A4149b17e7C6314655f6A9F7c8B33'.toLowerCase(),
  '0x17fc002b466eec40dae837fc4be5c67993ddbd6f'.toLowerCase(),
  '0x1446999b0b0e4f7ada6ee73f2ae12a2cfdc5d9e7'.toLowerCase(),
  '0x68f5d998f00bb2460511021741d098c05721d8ff'.toLowerCase(),
  '0xce3b19d820cb8b9ae370e423b0a329c4314335fe'.toLowerCase(),
  '0x6f33daf91d2acae10f5cd7bbe3f31716ed123f1d'.toLowerCase(),
  '0x93a416206b4ae3204cfe539edfee6bc05a62963e'.toLowerCase(),
  '0x67d11005af05bb1e9fdb1cfc261c23de3e1055a1'.toLowerCase(),
  '0x498Bf2B1e120FeD3ad3D42EA2165E9b73f99C1e5'.toLowerCase(),
  '0x845c8bc94610807fcbab5dd2bc7ac9dabaff3c55'.toLowerCase(),
  '0x45b47fe1bed067de6b4b89e0285e6b571a64c57c'.toLowerCase(),
  '0x12275DCB9048680c4Be40942eA4D92c74C63b844'.toLowerCase(),
  '0xCA5d8F8a8d49439357d3CF46Ca2e720702F132b8'.toLowerCase(),
  '0xb165a74407fE1e519d6bCbDeC1Ed3202B35a4140'.toLowerCase(),
  '0x7CFaDFD5645B50bE87d546f42699d863648251ad'.toLowerCase(),

  // plasma usd vault
  '0x7fbfd8cda97c0221b39c581c34afd24c523a3990'.toLowerCase()
]

export const STABLE_VAULT_ARRAY_ARBITRUM = [
  '0x2f5c116ab613ec601ed810c5a46402a994fd7151'.toLowerCase(),
  '0x1d52512e7a7a101cd2af55f0b7ccd646ebd5f81e'.toLowerCase(),
  '0xbf6028b0af43eee4d26c04f74f1638b7b52a39a7'.toLowerCase(),
  '0xbe70cefa4e5c74093b0b26516d35ebabb840a8b3'.toLowerCase(),
  '0x6c5ea65451796345b068e3acf5e3b85fba6b46ae'.toLowerCase(),
  '0x31dbd3eff737dcd45ca8d0824a5da94e37a79366'.toLowerCase(),
  '0x9c0fbb8cade7b178b135fd2f1da125a37b27f442'.toLowerCase(),
  '0x0f13fb925edc3e1fe947209010d9c0e072986adc'.toLowerCase(),
  ]

export const STABLE_COIN_POOL_ARRAY = [
  '0x3aDf984c937FA6846E5a24E0A68521Bdaf767cE1'.toLowerCase(),
  '0x2FE7AE43591E534C256A1594D326e5779E302Ff4'.toLowerCase(),
  '0x73aF1150F265419Ef8a5DB41908B700C32D49135'.toLowerCase(),
  '0xec090cf6DD891D2d014beA6edAda6e05E025D93d'.toLowerCase(),
  '0xC9B8a3FDECB9D5b218d02555a8Baf332E5B740d5'.toLowerCase(),
  '0x7f90122BF0700F9E7e1F688fe926940E8839F353'.toLowerCase(),
  '0x2bb55dC7c125D132322d6f7056FF6a575D64Fb7C'.toLowerCase(),

]

export const PS_ADDRESSES_MAINNET = [
  '0xd3093e3efbe00f010e8f5efe3f1cb5d9b7fe0eb1'.toLowerCase(),
  '0x8f5adC58b32D4e5Ca02EAC0E293D35855999436C'.toLowerCase(),
  '0xa0246c9032bc3a600820415ae600c6388619a14d'.toLowerCase(),
  '0x25550Cccbd68533Fa04bFD3e3AC4D09f9e00Fc50'.toLowerCase(),
  '0x59258F4e15A5fC74A7284055A8094F58108dbD4f'.toLowerCase(),
]

export const PS_ADDRESSES_MATIC = [
  '0xab0b2ddb9c7e440fac8e140a89c0dbcbf2d7bbff'.toLowerCase(),
]

export const BTC_POOLS = [
  '0x542f16da0efb162d20bf4358efa095b70a100f9e'.toLowerCase(),
  '0x6c1B07ed05656DEdd90321E94B1cDB26981e65f2'.toLowerCase(),
  '0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40'.toLowerCase(),
  '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'.toLowerCase(),
  '0x186cf879186986a20aadfb7ead50e3c20cb26cec'.toLowerCase(),
  '0xe957cE03cCdd88f02ed8b05C9a3A28ABEf38514A'.toLowerCase()
]

export const GAMMA_VAULTS_NAME = [
  'arsETH-WETH'.toLowerCase(),
  'aWBTC-WETH'.toLowerCase(),
  'aUSDC-DAI'.toLowerCase()
]

export const LP_UNI_PAIR_CONTRACT_NAME = [
  '1inch'.toLowerCase(),
  'SushiSwap'.toLowerCase(),
  // only uniswap v2
  'Uniswap'.toLowerCase(),
  'Pancake'.toLowerCase(),
  'Kyber'.toLowerCase(),
  'ApeSwapFinance'.toLowerCase(),
  'Volatile AMM'.toLowerCase(),
  'Stable AMM'.toLowerCase(),
]
export const BALANCER_CONTRACT_NAME = [
  'Balancer'.toLowerCase(),
  '50wstETH-BPT-50bbaUSD'.toLowerCase(),
  'RDNT-WETH'.toLowerCase(),
  '50tBTC-50WETH'.toLowerCase(),
  '80PAL-20OHM'.toLowerCase(),
  'AuraBal'.toLowerCase(),
  'Gyroscope'.toLowerCase(),
]
export const CURVE_CONTRACT_NAME = [
  'Curve.fi'.toLowerCase(),
  'fETH/ETH/xETH'.toLowerCase(),
  '2BTC-ng'.toLowerCase(),
  'Tri'.toLowerCase(),
  ]
export const F_UNI_V3_CONTRACT_NAME = 'fUniV3'.toLowerCase()
export const MESH_SWAP_CONTRACT = 'Meshswap'.toLowerCase()
export const POISON_FINANCE_CONTRACT = 'Poison.Finance Poison Ivy'.toLowerCase();
export const CAMELOT_CONTRACT = 'Camelot'.toLowerCase();
export const MAGPIE_CONTRACT = 'Wombat'.toLowerCase();
export const PENDLE_CONTRACT_NAME = 'Pendle'.toLowerCase()


export const UNISWAP_V3_FEES = [
  '3000',
  '5000',
  '8000',
  '10000'
]

export const FARM_TOKEN_MAINNET = Address.fromString('0xa0246c9032bc3a600820415ae600c6388619a14d')
export const FARM_TOKEN_MATIC = Address.fromString('0xab0b2ddb9c7e440fac8e140a89c0dbcbf2d7bbff')

export const ORACLE_ADDRESS_MAINNET_FIRST = Address.fromString('0x48DC32eCA58106f06b41dE514F29780FFA59c279');
export const ORACLE_ADDRESS_MAINNET_SECOND = Address.fromString('0x1358c91D5b25D3eDAc2b7B26A619163d78f1717d');
export const ORACLE_ADDRESS_MATIC = Address.fromString('0x0E74303d0D18884Ce2CEb3670e72686645c4f38B');

export const SUSHI_SWAP_FACTORY = Address.fromString('0xc35dadb65012ec5796536bd9864ed8773abc74c4');
export const SOLID_LIZARD_FACTORY = Address.fromString('0x734d84631f00dC0d3FCD18b04b6cf42BFd407074');

export const UNISWAP_V3_POISON_FINANCE_POOL = Address.fromString('0xa74eceae9c7670b019e0890881598b4c398d1c01');

export const NULL_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000');

export const MAX_APY_REWARD = BigDecimal.fromString('1000');
export const TAKE_FROM_TOTAL_ASSETS = [
  '0xfC2640ca71B1724B89dc2714E661B0089f8c0EED'.toLowerCase(),
]
export function isStableCoin(address: string): boolean {
  for (let i=0;i<STABLE_COIN_ARRAY_ARBITRUM.length;i++) {
    if (STABLE_COIN_ARRAY_ARBITRUM[i].toLowerCase() == address.toLowerCase()) {
      return true
    }
  }
  return false
}

export function isStableVault(address: string): boolean {
  for (let i=0;i<STABLE_VAULT_ARRAY_ARBITRUM.length;i++) {
    if (STABLE_VAULT_ARRAY_ARBITRUM[i].toLowerCase() == address.toLowerCase()) {
      return true
    }
  }
  return false
}

export function isPsAddress(address: string): boolean {
  if (dataSource.network() == 'mainnet') {
    return PS_ADDRESSES_MAINNET.join(' ').includes(address) == true
  } else if (dataSource.network() == 'matic') {
    return PS_ADDRESSES_MATIC.join(' ').includes(address) == true
  }
  return false
}

export function getOracleAddress(block: number): Address {
  if (dataSource.network() == 'mainnet') {
    if (block >= 12820106) {
      return ORACLE_ADDRESS_MAINNET_FIRST
    } else if (block >= 12015724) {
      return ORACLE_ADDRESS_MAINNET_SECOND
    }
  } else if (dataSource.network() == 'matic') {
    if (block >= 16841617) {
      return ORACLE_ADDRESS_MATIC
    }
  }

  return NULL_ADDRESS
}

export function getFarmToken(): Address {
  if (dataSource.network() == 'mainnet') {
    return FARM_TOKEN_MAINNET
  }
  if (dataSource.network() == 'matic') {
    return FARM_TOKEN_MATIC
  }
  return NULL_ADDRESS
}

export function getFromTotalAssets(address: string): boolean {
  return TAKE_FROM_TOTAL_ASSETS.join(' ').includes(address.toLowerCase()) == true
}

