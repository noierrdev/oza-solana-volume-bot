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

const wallets=[];
const walletsJson={}

//create Random Wallets 
for (let i = 0; i < (Number(process.env.WALLETS)); i++) {
    const newWallet=Keypair.generate();
    wallets.push(newWallet);
    walletsJson[newWallet.publicKey.toBase58()]=newWallet;
    fs.appendFileSync(path.resolve(walletsPath,newWallet.publicKey.toBase58()),bs58.encode(Buffer.from(newWallet.secretKey)));
}

//First Deposit
async function deposit(){
    const depositTx=new Transaction();

    for(var oneWallet of wallets){
        depositTx.add(
            SystemProgram.transfer({
            fromPubkey: mainWallet.publicKey,
            toPubkey: oneWallet.publicKey,
            lamports: BigInt(Number(process.env.DEPOSIT_AMOUNT)*(10**9)),
            })
        );
    }
    const jito_tip_accounts=[
        "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
        "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
        "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
        "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
        "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
        "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
        "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
        "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT"
    ]
    var jito_tip_amount=BigInt(Number(5000))
    var jito_tip_index=(Math.round(Math.random()*10))%8;
    var jito_tip_account=new PublicKey(jito_tip_accounts[jito_tip_index]);
    depositTx.add(
        SystemProgram.transfer({
            fromPubkey:mainWallet.publicKey,
            toPubkey:jito_tip_account,
            lamports:jito_tip_amount
        })
    );
    depositTx.feePayer = mainWallet.publicKey;
    const latestBlock=await connection.getLatestBlockhash();
    depositTx.recentBlockhash=latestBlock.blockhash;

    depositTx.partialSign(mainWallet);
    const depositTxserialized=bs58.encode(depositTx.serialize());
    let payload = {
        jsonrpc: "2.0",
        id: 1,
        method: "sendBundle",
        params: [[depositTxserialized]]
    };
    const jito_endpoints = [
        'https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles',
        'https://mainnet.block-engine.jito.wtf/api/v1/bundles',
        'https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles',
        'https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles',
        'https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles',
    ];
    var depositTxResult=false;
    for(var endpoint of jito_endpoints){
        // const withdrawTxRes=await fetch(`${endpoint}`, {
        await fetch(`${endpoint}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        }).then(response=>response.json())
        .then(response=>{
            if(!response.error) depositTxResult=true;
            console.log(`-------------${endpoint}--------------`)
            console.log(response)
            console.log(`---------------------------`)
        })
        .catch(e=>console.log(e))
    }
}

//Wait for Deposit Confirmed

async function waitForDepositConfirm(){
    let lastWallet=wallets[Number(process.env.WALLETS)-1];
    let lastWalletBalance;
    lastWalletBalance=await connection.getBalance(lastWallet.publicKey);
    let timer=0;
    while(lastWalletBalance<=0){
        lastWalletBalance=await connection.getBalance(lastWallet.publicKey);
        console.log(`${lastWallet.publicKey.toBase58()} : ${lastWalletBalance}`)
        timer++;
        if(timer>60) {
            console.log("Deposit FAILED!!!")
            return false;
        }
        await sleep(500)
    }
    return true
}

//Volume Tx Sending

setTimeout(async () => {
    await deposit();
    console.log("DEPOSIT FINISHED!!!!");
    const depositConfirmed=await waitForDepositConfirm()
    if(!depositConfirmed){
        console.log("Process Finished!")
        return;
    }
    console.log("DEPOSIT CONFIRMED!!!!");

}, 0);



