# Compile the circom template file
cd sui_hacker_house/circuits/draw

circom draw.circom --r1cs --wasm --sym

# Powers of Tau
# Use snarkjs to start a "powers of tau" ceremony
snarkjs powersoftau new bn254 12 pot12_0000.ptau -v

# Contribute to the ceremony
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v

# Phase 2
# Start the generation of phase 2
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

# Start a new .zkey file that will contain the proving and verification keys together with all phase 2 contributions
snarkjs groth16 setup draw.r1cs pot12_final.ptau draw_0000.zkey

# Contribute to the phase 2 of the ceremony
snarkjs zkey contribute draw_0000.zkey draw_0001.zkey --name="Contributor One" -v

cd ../play
circom play.circom --r1cs --wasm --sym

# Powers of Tau
# Use snarkjs to start a "powers of tau" ceremony
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v

# Contribute to the ceremony
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v

# Phase 2
# Start the generation of phase 2
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

# Start a new .zkey file that will contain the proving and verification keys together with all phase 2 contributions
snarkjs groth16 setup play.r1cs pot12_final.ptau play_0000.zkey

# Contribute to the phase 2 of the ceremony
snarkjs zkey contribute play_0000.zkey play_0001.zkey --name="Contributor One" -v

