# Compile the circom template file
cd sui_hacker_house/circuits/main_test

circom main.circom --r1cs --wasm --sym

# Powers of Tau
# Use snarkjs to start a "powers of tau" ceremony
snarkjs powersoftau new bn254 12 pot12_0000.ptau -v

# Contribute to the ceremony
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v

# Phase 2
# Start the generation of phase 2
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

# Start a new .zkey file that will contain the proving and verification keys together with all phase 2 contributions
snarkjs groth16 setup main.r1cs pot12_final.ptau main.zkey

# Contribute to the phase 2 of the ceremony
snarkjs zkey contribute main_0000.zkey main_0001.zkey --name="Contributor One" -v

