const {NFTStorage, File} = require("nft.storage");
const fs = require('fs');

const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweEZlZTIyMDkwNGI1ZUREMjBBMjBFY0M2YjRGZjYzYjlCRDY0MTFBMDkiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY5MTk1OTQ4NDAyNiwibmFtZSI6IlNVSV9UQ0cifQ.jAEdDEPBnk4MrL1MMj4KEHJ7k2R4DVeP_dVdEIFLk3E";

const NFTS = [
    {
        name: "Shelby the Shy Shark",
        description: "Shelby is a shy little shark who loves to explore the colorful coral reefs",
        image: "images/front.png",
    },
    {
        name: "Finn the Friendly Shark",
        description: "Finn is the friendliest shark in the ocean, always ready to play hide-and-seek with his fishy pals",
        image: "images/front.png",
    },
    {
        name: "Luna the Curious Shark",
        description: "Luna's curiosity leads her to discover new underwater treasures and make friends with the ocean creatures",
        image: "images/front.png",
    },
    {
        name: "Splash the Playful Shark",
        description: "Splash loves doing somersaults and playing tag with his fellow sea critters",
        image: "images/front.png",
    },
    {
        name: "Bubbles the Bubbly Shark",
        description: "Bubbles is known for her contagious laughter and the bubbles she blows as she swims around",
        image: "images/front.png",
    },
    {
        name: "Sandy the Silly Shark",
        description: "Sandy is a silly shark who enjoys making sandcastles with her tail on the ocean floor",
        image: "images/front.png",
    },
    {
        name: "Rory the Rainbow Shark",
        description: "Rory's scales shimmer in all the colors of the rainbow, and he loves to swim through coral rainbows too",
        image: "images/front.png",
    },
    {
        name: "Nemo the Adventurous Shark",
        description: "Nemo dreams of exploring sunken ships and hidden caves, seeking treasure and exciting discoveries",
        image: "images/front.png",
    },
    {
        name: "Coco the Dancing Shark",
        description: "Coco's graceful moves and underwater dance routines make her the star of the ocean ballet",
        image: "images/front.png",
    },
    {
        name: "Buddy the Brave Shark",
        description: "Buddy fearlessly protects his fellow sea creatures and stands up to bullies, proving that sharks can be heroes too",
        image: "images/front.png",
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
    let nftObject = { name: nft.name, description: nft.description, url: url };
    fs.writeFileSync("../nfts.json", JSON.stringify(nftObject) + '\n', { flag: 'a' });
});