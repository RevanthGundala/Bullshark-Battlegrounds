pragma circom 2.1.4;

include "../node_modules/circomlib/circuits/poseidon.circom";

// The deck is a commitment: hash(hash(...cards)), salt)
// The salt is a secret value
// we are doing a commit-reveal scheme: 
// reveal: single hash from double hash (this way we know the single hash is the hash of the double hash) i.e. the card we drew was in the deck

template Draw() {
    // Private Inputs
    signal input salt_deck;

    // Public Inputs
    signal input old_deck_commitment; // double hash
    signal input new_deck_commitment; // double hash without hash of card we are drawing
    signal input salt_deck_hash; // hash
    signal input card_id_to_draw_hash
    signal input card_id_to_draw_double_hash; // hash
 
    component draw_hash = Poseidon(1);
    draw_hash.inputs[0] <== card_id_to_draw_hash;
    // ensure we are committing to the actual card id
    draw_hash.out === card_id_to_draw_double_hash;
    
    component hasher = Poseidon(1);
    hasher.inputs[0] <== salt_deck;

    // assert salt_hash == hash(salt)
    salt_deck_hash === hasher.out; 

    // assert hash(card_id_to_play, new_commitment, salt) == old_commitment
    component hash = Poseidon(3);
    hash.inputs[0] <== card_id_to_play_hash;
    hash.inputs[1] <== new_hand_commitment; // double hash
    hash.inputs[2] <== salt_deck;

    old_deck_commitment === hash.out;
}

component main = Draw();