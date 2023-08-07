pragma circom 2.1.5;

include "../node_modules/circomlib/circuits/poseidon.circom";

template zkCardGame() {
    signal input private_seed; 
    signal input opponent_randomness;
    signal input random_number;

    component hash = Poseidon(2);
    hash.inputs[0] <== private_seed;
    hash.inputs[1] <== opponent_randomness;
    hash.out === random_number;

}

component main{public [opponent_randomness]} = zkCardGame();