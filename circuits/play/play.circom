pragma circom 2.1.4;

include "../circomlib/poseidon.circom";

// can be used to play or discard a card
template Play(nHandInputs, nDeckInputs) {
     // Private Inputs
    signal input handSalt;
    signal input hand_card_ids[nHandInputs];

    signal input deckSalt;
    signal input deck_card_ids[nDeckInputs];

    // Public Inputs
    signal input handSaltHash;
    signal input hand_card_id_hashes[nHandInputs];
    signal input handCommittment;

    signal input deckSaltHash;
    signal input deck_card_id_hashes[nDeckInputs];
    signal input deckCommittment;

    signal input card_id_to_reveal;
    
    component handHash[nHandInputs];
    component handCommittmentHasher = Poseidon(nHandInputs);
    component handSaltHasher = Poseidon(1);

    component deckHash[nDeckInputs];
    component deckCommittmentHasher = Poseidon(nDeckInputs);
    component deckSaltHasher = Poseidon(1);

    // assert that PubhandSaltHash is the hash of the handSalt
    handSaltHasher.inputs[0] <== handSalt;
    handSaltHasher.out === handSaltHash;

    deckSaltHasher.inputs[0] <== deckSalt;
    deckSaltHasher.out === deckSaltHash;

    // assert that each pub hash id is equal to secret input id 
    // Ensures that the cards are the same and we did not secretly swap out a card
    for(var i = 0; i < nHandInputs; i++){
        handHash[i] = Poseidon(1);
        handHash[i].inputs[0] <== hand_card_ids[i];
        handHash[i].out === hand_card_id_hashes[i];

        if(i == nHandInputs - 1){
            handCommittmentHasher.inputs[i] <== handSalt;
        }
        else{
            handCommittmentHasher.inputs[i] <== hand_card_ids[i];
        }
    }

    for(var i = 0; i < nDeckInputs; i++){
        deckHash[i] = Poseidon(1);
        deckHash[i].inputs[0] <== deck_card_ids[i];
        deckHash[i].out === deck_card_id_hashes[i];

        if(i == nDeckInputs - 1){
            deckCommittmentHasher.inputs[i] <== deckSalt;
        }
        else{
            deckCommittmentHasher.inputs[i] <== deck_card_ids[i];
        }
    }

    // assert that the handCommittment lines up with the hash provided
   handCommittmentHasher.out === handCommittment;
   deckCommittmentHasher.out === deckCommittment;

   // ensures that card id that we are revealing is the same as the one we are playing
   card_id_to_reveal === card_id_to_reveal;
}

// number of cards in hand
component main { public [ handSaltHash, hand_card_id_hashes, handCommittment, deckSaltHash, deck_card_id_hashes, deckCommittment, card_id_to_reveal ] } = Play(6, 12);


