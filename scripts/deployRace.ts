import { TonClient, abiContract, signerNone } from "@tonclient/core";
import { libNode } from "@tonclient/lib-node";
import { Cell } from "@ton/core";
import fs from 'fs';

// Load the TON SDK native library
TonClient.useBinaryLibrary(libNode);

// Define the contract ABI
const raceAbi = {
    "ABI version": 2,
    "functions": [
        { "name": "constructor", "inputs": [], "outputs": [] },
        { "name": "recv_internal", "inputs": [
            { "name": "msg_value", "type": "uint32" },
            { "name": "in_msg", "type": "cell" },
            { "name": "in_msg_body", "type": "slice" }
        ], "outputs": [] },
        { "name": "get_leaderboard", "inputs": [], "outputs": [
            { "name": "leaderboard", "type": "cell" }
        ] }
    ],
    "events": [],
    "data": []
};

async function deployRaceContract() {
    const tonClient = new TonClient({
        network: { endpoints: ["https://testnet.ton.dev"] }
    });

    try {
        // Read the compiled contract file
        const bocPath = '../Race/build/race.cell'; // Replace with the actual path to your compiled contract BoC
        const boc = fs.readFileSync(bocPath);
        const cell = Cell.fromBoc(boc)[0];

        // Ensure TVC is correctly encoded
        const deploySet = {
            tvc: boc.toString('base64') // Base64 encoded TVC
        };

        const callSet = {
            function_name: 'constructor',
            input: {}
        };

        const signer = signerNone();

        const messageParams = {
            abi: abiContract(raceAbi),
            deploy_set: deploySet,
            call_set: callSet,
            signer,
        };

        // Encode the deploy message
        const { address } = await tonClient.abi.encode_message(messageParams);

        // Process the deploy message
        await tonClient.processing.process_message({
            send_events: false,
            message_encode_params: messageParams,
        });

        console.log(`Contract deployed at address: ${address}`);

        // Wait for the contract to be deployed and appear on the network
        await tonClient.net.wait_for_collection({
            collection: 'accounts',
            filter: { id: { eq: address } },
            result: 'id',
            timeout: 60000, // Wait for up to 60 seconds
        });

    } catch (error) {
        console.error("Deployment error:", error);
    } finally {
        await tonClient.close();
    }
}

async function run() {
    await deployRaceContract();
}

export { run };
