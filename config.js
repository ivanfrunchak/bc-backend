import dotenv from "dotenv";
dotenv.config();

export const DBURL = process.env.DBURL

export const UNISWAP_V2_ROUTER_ADDRESS = () => {

	return "0x7a250d5630b4cf539739df2c5dacb4c659f2488d"

};
export const UNISWAP_V3_ROUTER2_ADDRESS = () => {
	return "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45"
}

export const UNISWAP_V2_FACTORY_ADDRESS = () => {
	return "0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f"
};


export const WETH_ADDRESS = () => {
	return '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
}

export const USDT_ADDRESS = () => {
	return '0xdac17f958d2ee523a2206206994597c13d831ec7'
}

export const USDC_ADDRESS = () => {
	return '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
}

export const UNISWAP_EVENT_ABI = [
	"event Transfer(address indexed from, address indexed to, uint256 value)",
	"event Approval(address indexed src, address indexed guy, uint wad)",
	"event Deposit(address indexed dst, uint wad)",
	"event Withdrawal(address indexed src, uint wad)",
	`event Swap(
          address indexed sender,
          uint amount0In,
          uint amount1In,
          uint amount0Out,
          uint amount1Out,
          address indexed to
        )`,
	`event Sync(uint112 reserve0, uint112 reserve1)`,
	`event PairCreated(address indexed token0, address indexed token1, address pair, uint)`,
];