import { 
    Connection, 
    JsonRpcProvider, 
    TransactionBlock,
    SuiTransactionBlockResponse,
    ExecuteTransactionRequestType
  } from "@mysten/sui.js";
import { rpcClient } from "typed-rpc";
import {Wallet } from "ethos-connect";
import { get_new_character } from "./move_calls";
import { MAX_HAND_SIZE, STARTING_DECK_SIZE, TOTAL_DECK_SIZE } from "../constants";
// start a new session with shinami key 

// The Key Service is Shinami's secure and stateless way to get access to the Invisible Wallet
const KEY_SERVICE_RPC_URL = "https://api.shinami.com/key/v1/";

// The Wallet Service is the endpoint to issue calls on behalf of the wallet.
const WALLET_SERVICE_RPC_URL = "https://api.shinami.com/wallet/v1/";

// Shinami Sui Node endpoint + Mysten provided faucet endpoint:
const connection = new Connection({
fullnode: `https://api.shinami.com/node/v1/${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`,
});

const suiProvider = new JsonRpcProvider(connection);
const GAS_BUDGET = 5000000;

// Key Service interaction setup
interface KeyServiceRpc {
    shinami_key_createSession(secret: string): string;
}
const keyService = rpcClient<KeyServiceRpc>(KEY_SERVICE_RPC_URL, {
    getHeaders() {
        return {
            "X-API-Key": process.env.NEXT_PUBLIC_ACCESS_TOKEN
        };
    },
});

// Wallet Service interaction setup
interface WalletServiceRpc {
    shinami_wal_createWallet(walletId: string, sessionToken: string): string;
    shinami_wal_getWallet(walletId: string): string;
    shinami_wal_signTransactionBlock(walletId: string, sessionToken: string, txBytes: string):
        SignTransactionResult;
    shinami_wal_executeGaslessTransactionBlock(
        walletId: string, 
        sessionToken: string, 
        txBytes: string, 
        gasBudget: number, 
        options?: {}, 
        requestType?: ExecuteTransactionRequestType
    ): SuiTransactionBlockResponse;
}

interface SignTransactionResult {
    signature: string;
    txDigest: string;
}

const walletService = rpcClient<WalletServiceRpc>(WALLET_SERVICE_RPC_URL, {
    getHeaders() {
        return {
            "X-API-Key": "<API_ACCESS_KEY>"
        };
    },
});

export const get_new_character_gasless = 
async(wallet: Wallet,
     name: string,
    description: string,
    image_url: string,
    attack: number,
    defense: number,
    ) => {
    // Create an ephemeral session token to access Invisible Wallet functionality
    // TODO: Change in futre for security
    const secret = "test";
    const sessionToken = await keyService.shinami_key_createSession(secret);

    // Create a new wallet (can only be done once with the same walletId). Make
    // sure to transfer Sui coins to your wallet before trying to run the
    // following transactions
    const walletId = wallet.address;
    const createdWalletAddress = await walletService.shinami_wal_createWallet(walletId, sessionToken);

    // Retrieve the wallet address via the walletId. Should be the same as createdWalletAddress
    const walletAddress = await walletService.shinami_wal_getWallet(walletId);
    
        // Get the transaction block of the gasless transaction
        const txbGasless = await get_new_character(wallet, name, description, image_url, attack, defense);
        if(txbGasless == null){
            console.log("Error: txbGasless is null");
            return;
        }
        // Generate the bcs serialized transaction payload
        const payloadBytesGasless = await txbGasless.build({ provider: suiProvider, onlyTransactionKind: true });
    
        // Convert the payload byte array to a base64 encoded string
        const payloadBytesGaslessBase64 = btoa(
            payloadBytesGasless.reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
    
        // Sponsor and execute the transaction with one call
        const executeResponseGasless = await walletService.shinami_wal_executeGaslessTransactionBlock(
            walletId,
            sessionToken,
            payloadBytesGaslessBase64,
            GAS_BUDGET,
            {
                showInput: false,
                showRawInput: false,
                showEffects: true,
                showEvents: false,
                showObjectChanges: false,
                showBalanceChanges: false
            },
            "WaitForLocalExecution"
        );
        console.log("Execution Status:", executeResponseGasless.effects?.status.status);
}    


export const create_game = async(accepter: Wallet, opponent: Wallet) => {
    // when someone calls create_game, I know that p2 is the accepter, and p1 owns the object
    localStorage.setItem("player_1", opponent.address);
    localStorage.setItem("player_2", accepter.address);

    // generate random cards from player 1 and 2 for thier hands

    // accepter.contents
    let player_1_deck: string[] = [];
    let player_1_hand = [];
    let player_2_deck: string[] = [];
    let player_2_hand = [];

    for(let i = 0; i < MAX_HAND_SIZE; i++){
        let index: number = Math.floor(Math.random() * TOTAL_DECK_SIZE);
        player_1_hand.push(player_1_deck[index]);
        player_1_deck.splice(index, 1);
    }
    for(let i = 0; i < MAX_HAND_SIZE; i++){
        let index: number = Math.floor(Math.random() * TOTAL_DECK_SIZE);
        player_2_hand.push(player_2_deck[index]);
        
    }

    localStorage.setItem("player_1_hand", JSON.stringify(player_1_hand));
    localStorage.setItem("player_1_deck", JSON.stringify(player_1_deck));
    localStorage.setItem("player_2_hand", JSON.stringify(player_2_hand));
    localStorage.setItem("player_2_deck", JSON.stringify(player_2_deck));
}


// Once i have game struct, I can view p1 and p2 addressses
// turn is determined on whether p1 has game struct, or p2 has game struct

// my state should contain p1 and p2.
// when create_game is called, set localstorage for p1 and p2