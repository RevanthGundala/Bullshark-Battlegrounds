export const MODULE_ADDRESS = "0x6fc529a9c2f89e9744d69ca5112ffeeb55a90cf0039dc750fdafe2f9cb0cff60";
export const MAX_HAND_SIZE = 6;
export const STARTING_DECK_SIZE = 4;
export const TOTAL_DECK_SIZE = 10; 

export type Card = {
    id: string;
    name: string;
    description: string;
    image_url: string;
    attack: number;
    defense: number;
};

export const NFTS = [
    {
        "name": "Sui",
        "description": "The Sui is a very powerful card",
        "image_url": "https://i.imgur.com/3gj0hjg.png",
    },
    
]