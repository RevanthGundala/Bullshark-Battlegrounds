pragma circom 2.1.4;

include "../circomlib/poseidon.circom";

// can be used to play or discard a card
template Draw(nInputs) {
     // Private Inputs
    signal input salt;
    signal input card_ids[nInputs];
    signal input card_id_drawn;

    // Public Inputs
    signal input saltHash;
    signal input card_id_hashes[nInputs];
    signal input committment;
    
    component hash[nInputs];
    component committmentHasher = Poseidon(nInputs);
    component saltHasher = Poseidon(1);

    // assert that PubSaltHash is the hash of the salt
    saltHasher.inputs[0] <== salt;
    saltHasher.out === saltHash;

    // assert that each pub hash id is equal to secret input id 
    // Ensures that the cards are the same and we did not secretly swap out a card
    for(var i = 0; i < nInputs; i++){
        hash[i] = Poseidon(1);
        hash[i].inputs[0] <== card_ids[i];
        hash[i].out === card_id_hashes[i];

        if(i == nInputs - 1){
            committmentHasher.inputs[i] <== salt;
        }
        else{
            committmentHasher.inputs[i] <== card_ids[i];
        }
    }

    // assert that the committment lines up with the hash provided
   committmentHasher.out === committment;

   // ensures that card id that we are drawing the one we specified
   signal card_id_drawn_squared;
   card_id_drawn_squared <== card_id_drawn * card_id_drawn;
}

// number of cards in hand
component main { public [ saltHash, card_id_hashes, committment ] } = Play(6);