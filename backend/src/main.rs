use ark_bn254::Bn254;
use ark_circom::CircomBuilder;
use ark_circom::CircomConfig;
use ark_groth16::Groth16;
use ark_snark::SNARK;
use ark_serialize::CanonicalSerialize;

struct Proof{
    proof_inputs_bytes: Vec<u8>,
    proof_points_bytes: Vec<u8>,
}

fn main() {
    generate_proof();
}

fn generate_proof() -> Proof{
    // Load the WASM and R1CS for witness and proof generation
    let cfg = CircomConfig::<Bn254>::new("../circuits/draw/draw_js/draw.wasm", "../circuits/draw/draw.r1cs").unwrap();

    // Insert our secret inputs as key value pairs. We insert a single input, namely the input to the hash function.
    let mut builder = CircomBuilder::new(cfg);
    builder.push_input("handSalt", 1);
    builder.push_input("hand_card_ids", [1]);
    builder.push_input("deckSalt", 1);
    builder.push_input("deck_card_ids", [1]);
    builder.push_input("card_id_drawn", 1);
    builder.push_input("handSaltHash", 1);
    builder.push_input("hand_card_id_hashes", [1]);
    builder.push_input("handCommittment", 1);
    builder.push_input("deckSaltHash", 1);
    builder.push_input("deck_card_id_hashes", [1]);
    builder.push_input("deckCommittment", 1);

    // Create an empty instance for setting it up
    let circom = builder.setup();

    // WARNING: The code below is just for debugging, and should instead use a verification key generated from a trusted setup.
    // See for example https://docs.circom.io/getting-started/proving-circuits/#powers-of-tau.
    let mut rng = rand::thread_rng();

    let params =
        Groth16::<Bn254>::generate_random_parameters_with_reduction(circom, &mut rng).unwrap();

    let circom = builder.build().unwrap();

    // There's only one public input, namely the hash digest.
    let inputs = circom.get_public_inputs().unwrap();

    // Generate the proof
    let proof = Groth16::<Bn254>::prove(&params, circom, &mut rng).unwrap();

    // Check that the proof is valid
    let pvk = Groth16::<Bn254>::process_vk(&params.vk).unwrap();
    let verified = Groth16::<Bn254>::verify_with_processed_vk(&pvk, &inputs, &proof).unwrap();
    assert!(verified);
    let mut proof_inputs_bytes = Vec::new();
    inputs.serialize_compressed(&mut proof_inputs_bytes).unwrap();

    let mut proof_points_bytes = Vec::new();
    proof.a.serialize_compressed(&mut proof_points_bytes).unwrap();
    proof.b.serialize_compressed(&mut proof_points_bytes).unwrap();
    proof.c.serialize_compressed(&mut proof_points_bytes).unwrap();
    Proof{
        proof_inputs_bytes,
        proof_points_bytes,
    }
}


