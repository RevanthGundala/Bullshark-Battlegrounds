// @ts-ignore
import { groth16 } from "snarkjs";
// @ts-ignore
import { BigNumberish, ethers, utils } from "ethers";

import { BigNumber } from "@ethersproject/bignumber";

export function poseidonHash(poseidon: any, inputs: BigNumberish[]): string {
  const hash = poseidon(inputs.map((x) => BigNumber.from(x).toBigInt()));
  // Make the number within the field size
  const hashStr = poseidon.F.toString(hash);
  // Make it a valid hex string
  const hashHex = BigNumber.from(hashStr).toHexString();
  // pad zero to make it 32 bytes, so that the output can be taken as a bytes32 contract argument
  console.log("hashehx");
  console.log(hashHex);
  const bytes32 = ethers.utils.hexZeroPad(hashHex, 32);
  return bytes32;
}

export const prove = async (witness: any, func_name: string) => {
  // draw or play
  const wasmPath = `/zkproof/${func_name}.wasm`;
  const zkeyPath = `/zkproof/${func_name}_0001.zkey`;
  const { proof } = await groth16.fullProve(
    JSON.parse(witness),
    wasmPath,
    zkeyPath
  );
  return proof;
};
