// @ts-ignore
import { groth16 } from "snarkjs";
// @ts-ignore
import { Contract, ContractFactory, BigNumberish, utils } from "ethers";
// @ts-ignore
import { poseidonContract, buildPoseidon } from "circomlibjs";
import { BigNumber } from "@ethersproject/bignumber";

function poseidonHash(poseidon: any, inputs: BigNumberish[]): string {
  const hash = poseidon(inputs.map((x) => BigNumber.from(x).toBigInt()));
  // Make the number within the field size
  const hashStr = poseidon.F.toString(hash);
  // Make it a valid hex string
  const hashHex = BigNumber.from(hashStr).toHexString();
  // pad zero to make it 32 bytes, so that the output can be taken as a bytes32 contract argument
  const bytes32 = utils.hexZeroPad(hashHex, 32);
  return bytes32;
}

export const prove = async (witness, func_name) => {
  // draw or play
  const wasmPath = `/zkproof/${func_name}.wasm`;
  const zkeyPath = `/zkproof/${func_name}_0001.zkey`;
  const { proof } = await groth16.fullProve(
    JSON.parse(witness),
    wasmPath,
    zkeyPath
  );
  const solProof = {
    a: [proof.pi_a[0], proof.pi_a[1]],
    b: [
      [proof.pi_b[0][1], proof.pi_b[0][0]],
      [proof.pi_b[1][1], proof.pi_b[1][0]],
    ],
    c: [proof.pi_c[0], proof.pi_c[1]],
  };
  return solProof;
};
