import init, {generate_proof} from "wasm-lib"; 


export type Proof = {
    proof_inputs_bytes: string,
    proof_points_bytes: string,
}

export default function GenerateProof(wasm_path: string, r1cs_path: string, input_path: string, inputs: string[]): Proof | null {
    let proof = null;
    init().then(() => {
        proof = generate_proof(wasm_path, r1cs_path, inputs);
    })
    return proof;
}