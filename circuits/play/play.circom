pragma circom 2.1.4;

include "../node_modules/circomlib/circuits/poseidon.circom";


// The hand is a commitment: hash(...cards, salt)
// The salt is a secret value
// we are doing a commit-reveal scheme: 
// reveal on play: card
// assert that the hash of the hash(card, salt, new commitment (without the card)) == old commitment

// can be used to play or discard a card
template Play() {
    // Private Inputs
    signal input salt_hand;

    // Public Inputs
    signal input old_hand_commitment;
    signal input new_hand_commitment;
    signal input salt_hand_hash;
    signal input card_id_to_play_hash;
    signal input card_id_to_play;


    // ensure that the hash we comitted to actually lines up with the card we are playing
    // Todo: not sure if this needs to be in the circuit or frontend
    component card_hash = Poseidon(1);
    card_hash.inputs[0] <== card_id_to_play;
    card_hash.out === card_id_to_play_hash;
    
    component hasher = Poseidon(1);
    hasher.inputs[0] <== salt_hand;

    // assert salt_hash == hash(salt)
    salt_hand_hash === hasher.out; 

    // assert hash(card_id_to_play, new_commitment, salt) == old_commitment
    component hash = Poseidon(3);
    hash.inputs[0] <== card_id_to_play;
    hash.inputs[1] <== new_hand_commitment;
    hash.inputs[2] <== salt_hand;

    old_hand_commitment === hash.out;
}