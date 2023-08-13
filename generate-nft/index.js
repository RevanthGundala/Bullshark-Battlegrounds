const {NFTStorage, File} = require("nft.storage");
const fs = require('fs');

const API_KEY = process.env.NFT_STORAGE_API_KEY;

const NFTS = [
    {
        name: "Hacker House",
        description: "Hacker House",
        image: "hacker_house.png",
    },
]

async function storeNFT(name, description, imagePath){
    const client = new NFTStorage({ token: API_KEY });
    const metadata = await client.store({
        name: name,
        description: description,
        image: new File([await fs.promises.readFile(imagePath)], `${name}.png`, { type: "image/png" })
    });
    console.log(metadata.url);
    return metadata.url;
}

NFTS.forEach(async (nft) => {
    let url = await storeNFT(nft.name, nft.description, nft.image);
});


// wallet contents

// get nft images urls and mint to user

// tailwindcss

