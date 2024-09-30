require("dotenv").config()

const fs=require("fs")
const path=require("path")
const {Keypair,Transaction,Connection,PublicKey, SystemProgram}=require("@solana/web3.js")
const bs58=require("bs58")

function sleep(ms) {
    return new Promise((res) => {
      setTimeout(res, ms);
    });
}

const walletsPath=path.resolve(__dirname,"wallets")
if(!fs.existsSync(walletsPath)){
    fs.mkdirSync(walletsPath);
}

const connection=new Connection(process.env.RPC_URL);

const PRIVATE_KEY =new  Uint8Array(bs58.decode(process.env.PRIVATE_KEY));
const mainWallet = Keypair.fromSecretKey(PRIVATE_KEY);

const walletsStr=fs.readdirSync(walletsPath)