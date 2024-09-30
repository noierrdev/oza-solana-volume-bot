require("dotenv").config()

const fs=require("fs")
const path=require("path")

const walletsPath=path.resolve(__dirname,"wallets")
if(!fs.existsSync(walletsPath)){
    fs.mkdirSync(walletsPath);
}
