export const MODULE_ADDRESS = "0x79670223633188a605e276be598123db5a52e1a307154994461f950fcd8ec770";
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