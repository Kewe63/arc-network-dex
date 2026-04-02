import { createPublicClient, http } from 'viem';
import { arcTestnet } from 'viem/chains';

const AGENTIC_COMMERCE_CONTRACT = "0x0747EEf0706327138c69792bF28Cd525089e4583";

const publicClient = createPublicClient({
    chain: arcTestnet,
    transport: http('https://rpc.testnet.arc.network/')
});

const getJobAbi = [{
    type: "function",
    name: "getJob",
    stateMutability: "view",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [{
        type: "tuple",
        components: [
            { name: "id", type: "uint256" },
            { name: "client", type: "address" },
            { name: "provider", type: "address" },
            { name: "evaluator", type: "address" },
            { name: "description", type: "string" },
            { name: "budget", type: "uint256" },
            { name: "expiredAt", type: "uint256" },
            { name: "status", type: "uint8" },
            { name: "hook", type: "address" },
        ]
    }]
}];

async function main() {
    try {
        const jobData = await publicClient.readContract({
            address: AGENTIC_COMMERCE_CONTRACT,
            abi: getJobAbi,
            functionName: 'getJob',
            args: [1n],
        });
        console.log("jobData type:", Array.isArray(jobData) ? "array" : typeof jobData);
        console.log(jobData);
        
        console.log("\nAccessing id:", jobData.id, jobData[0]);
    } catch (e) {
        console.error(e.message);
    }
}
main();
