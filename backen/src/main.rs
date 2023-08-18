#[macro_use] extern crate rocket;

use ark_bn254::Bn254;
use ark_circom::CircomBuilder;
use ark_circom::CircomConfig;
use ark_groth16::Groth16;
use ark_snark::SNARK;
use ark_serialize::CanonicalSerialize;

pub struct Proof{
    proof_inputs_bytes: Vec<u8>,
    proof_points_bytes: Vec<u8>,
}

let proof;

#[post("/")]
fn proof(inputs: u64){
    // Load the WASM and R1CS for witness and proof generation
    let wasm_path = "../circuits/draw/draw_js/draw.wasm";
    let r1cs_path = "../circuits/draw/draw.r1cs";
    let cfg = CircomConfig::<Bn254>::new(wasm_path, r1cs_path).unwrap();

    // Insert our secret inputs as key value pairs. We insert a single input, namely the input to the hash function.
    let mut builder = CircomBuilder::new(cfg);
    builder.push_input("in", inputs);

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
    proof = Groth16::<Bn254>::prove(&params, circom, &mut rng).unwrap();


    // Check that the proof is valid
    let pvk = Groth16::<Bn254>::process_vk(&params.vk).unwrap();
    let verified = Groth16::<Bn254>::verify_with_processed_vk(&pvk, &inputs, &proof).unwrap();
    assert!(verified);
}

#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![proof])
}