import { get_object_from_id } from "./api_calls";
// TODO: Create a function that queries user's cards
export const cardObjectDefinitions = [
    {id: 1, image_path: "/images/cards/1.png"},
];

const cardBackImgPath = "/images/cards/back.jpeg";

let cards: any[] = [];


export function create_game(){
    cards = document.querySelectorAll(".card");

}

function createCards()
{
    cardObjectDefinitions.forEach((cardItem)=>{
        createCard(cardItem)
    })
}


function createCard(cardItem: any){
    //create div elements that make up a card
    const cardElem = document.createElement('div')
    const cardInnerElem = document.createElement('div')
    const cardFrontElem = document.createElement('div')
    const cardBackElem = document.createElement('div')

    //create front and back image elements for a card
    const cardFrontImg = document.createElement('img')
    const cardBackImg = document.createElement('img')

    //add class and id to card element
    addClassToElement(cardElem, 'card')
    addClassToElement(cardElem, 'fly-in')
    addIdToElement(cardElem, cardItem.id)

    //add class to inner card element
    addClassToElement(cardInnerElem, 'card-inner')
    
    //add class to front card element
    addClassToElement(cardFrontElem, 'card-front')

    //add class to back card element
    addClassToElement(cardBackElem, 'card-back')

    //add src attribute and appropriate value to img element - back of card
    addSrcToImageElem(cardBackImg, cardBackImgPath)

    //add src attribute and appropriate value to img element - front of card
    addSrcToImageElem(cardFrontImg, cardItem.imagePath)

    //assign class to back image element of back of card
    addClassToElement(cardBackImg, 'card-img')
   
    //assign class to front image element of front of card
    addClassToElement(cardFrontImg, 'card-img')

    //add front image element as child element to front card element
    addChildElement(cardFrontElem, cardFrontImg)

    //add back image element as child element to back card element
    addChildElement(cardBackElem, cardBackImg)

    //add front card element as child element to inner card element
    addChildElement(cardInnerElem, cardFrontElem)

    //add back card element as child element to inner card element
    addChildElement(cardInnerElem, cardBackElem)

    //add inner card element as child element to card element
    addChildElement(cardElem, cardInnerElem)

    //add card element as child element to appropriate grid cell
    addCardToGridCell(cardElem)

    initializeCardPositions(cardElem)

    attatchClickEventHandlerToCard(cardElem)

}

function addClassToElement(elem: any, className: any){
    elem.classList.add(className)
}
function addIdToElement(elem: any, id: any){
    elem.id = id
}
function addSrcToImageElem(imgElem, src){
    imgElem.src = src
}
function addChildElement(parentElem, childElem){
    parentElem.appendChild(childElem)
}
function addCardToGridCell(card)
{
    const cardPositionClassName = mapCardIdToGridCell(card)

    const cardPosElem = document.querySelector(cardPositionClassName)

    addChildElement(cardPosElem, card)

}
function mapCardIdToGridCell(card){
   
    if(card.id == 1)
    {
        return '.card-pos-a'
    }
    else if(card.id == 2)
    {
        return '.card-pos-b'
    }
    else if(card.id == 3)
    {
        return '.card-pos-c'
    }
    else if(card.id == 4)
    {
        return '.card-pos-d'
    }
}

export function start_game(){
    initalize_new_game();
    start_round();
}

function initialize_card_positions(){

}

export function initalize_new_game(){

}

export function start_round(){

}