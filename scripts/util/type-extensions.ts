import "hardhat/types/config";

declare module "hardhat/types/config" {
    interface HardhatNetworkUserConfig {
        maxFeePerGas?: number | string | bigint;
        maxPriorityFeePerGas?: number | string | bigint;
    }
    interface HardhatNetworkConfig {
        maxFeePerGas?: number | string | bigint;
        maxPriorityFeePerGas?: number | string | bigint;
    }

    interface HttpNetworkUserConfig {
        maxFeePerGas?: number | string | bigint;
        maxPriorityFeePerGas?: number | string | bigint;
    }
    interface HttpNetworkConfig {
        maxFeePerGas?: number | string | bigint;
        maxPriorityFeePerGas?: number | string | bigint;
    }
}
