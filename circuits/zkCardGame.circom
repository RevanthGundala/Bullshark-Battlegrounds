pragma circom 2.1.5;

include "../node_modules/circomlib/circuits/poseidon.circom";

template zkCardGame() {
    component poseidon = Poseidon(1);
    signal input in;
    signal output digest;
    poseidon.inputs[0] <== in;
    digest <== poseidon.out;
}

component main = zkCardGame();