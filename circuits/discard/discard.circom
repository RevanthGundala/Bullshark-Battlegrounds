pragma circom 2.1.5;
include "../../node_modules/circomlib/circuits/mimcsponge.circom"

template Main() {
    // Public Inputs
    signal input cardHash;

    // Private Inputs (TODO: Change based on number of allowed cards in hand)
    signal input a;
    signal input b;
    signal input c;
    signal input d;

    signal input w;
    signal input x;
    signal input y;
    signal input z;

    component mimc1 = MiMCSponge(4, 220, 1);
    mimc1.ins[0] = a;
    mimc1.ins[1] = b;
    mimc1.ins[2] = c;
    mimc1.ins[3] = d;
    mimc1.k = 0;

    mimc1.out === cardHash;

    component mimc2 = MiMCSponge(4, 220, 1);
    mimc2.ins[0] = w;
    mimc2.ins[1] = x;
    mimc2.ins[2] = y;
    mimc2.ins[3] = z;
    mimc2.k = 0;

    mimc2.out === cardHash;
}

component main {public [cardHash]}= Main();