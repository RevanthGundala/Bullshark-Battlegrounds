import { fromB64, toB64 } from "@mysten/bcs";
import { blake2b } from "@noble/hashes/blake2b";
import { bytesToHex } from "@noble/hashes/utils";
import { PublicKey, bytesEqual } from "../cryptography/publickey.js";
import {
  SIGNATURE_FLAG_TO_SCHEME,
  SIGNATURE_SCHEME_TO_FLAG,
  parseSerializedSignature
} from "../cryptography/signature.js";
import { normalizeSuiAddress } from "../utils/sui-types.js";
import { builder } from "../builder/bcs.js";
import { publicKeyFromRawBytes } from "../verify/index.js";
const MAX_SIGNER_IN_MULTISIG = 10;
class MultiSigPublicKey extends PublicKey {
  /**
   * Create a new MultiSigPublicKey object
   */
  constructor(value) {
    super();
    if (typeof value === "string") {
      this.rawBytes = fromB64(value);
      this.multisigPublicKey = builder.de("MultiSigPublicKey", this.rawBytes);
    } else if (value instanceof Uint8Array) {
      this.rawBytes = value;
      this.multisigPublicKey = builder.de("MultiSigPublicKey", this.rawBytes);
    } else {
      this.multisigPublicKey = value;
      this.rawBytes = builder.ser("MultiSigPublicKey", value).toBytes();
    }
    this.publicKeys = this.multisigPublicKey.pk_map.map(({ pubKey, weight }) => {
      const [scheme, bytes] = Object.entries(pubKey)[0];
      return {
        publicKey: publicKeyFromRawBytes(scheme, Uint8Array.from(bytes)),
        weight
      };
    });
    if (this.publicKeys.length > MAX_SIGNER_IN_MULTISIG) {
      throw new Error(`Max number of signers in a multisig is ${MAX_SIGNER_IN_MULTISIG}`);
    }
  }
  static fromPublicKeys({
    threshold,
    publicKeys
  }) {
    return new MultiSigPublicKey({
      pk_map: publicKeys.map(({ publicKey, weight }) => {
        const scheme = SIGNATURE_FLAG_TO_SCHEME[publicKey.flag()];
        return {
          pubKey: { [scheme]: Array.from(publicKey.toRawBytes()) },
          weight
        };
      }),
      threshold
    });
  }
  /**
   * Checks if two MultiSig public keys are equal
   */
  equals(publicKey) {
    return super.equals(publicKey);
  }
  /**
   * Return the byte array representation of the MultiSig public key
   */
  toRawBytes() {
    return this.rawBytes;
  }
  getPublicKeys() {
    return this.publicKeys;
  }
  /**
   * Return the Sui address associated with this MultiSig public key
   */
  toSuiAddress() {
    const maxLength = 1 + (64 + 1) * MAX_SIGNER_IN_MULTISIG + 2;
    const tmp = new Uint8Array(maxLength);
    tmp.set([SIGNATURE_SCHEME_TO_FLAG["MultiSig"]]);
    tmp.set(builder.ser("u16", this.multisigPublicKey.threshold).toBytes(), 1);
    let i = 3;
    for (const { publicKey, weight } of this.publicKeys) {
      const bytes = publicKey.toSuiBytes();
      tmp.set(bytes, i);
      i += bytes.length;
      tmp.set([weight], i++);
    }
    return normalizeSuiAddress(bytesToHex(blake2b(tmp.slice(0, i), { dkLen: 32 })));
  }
  /**
   * Return the Sui address associated with this MultiSig public key
   */
  flag() {
    return SIGNATURE_SCHEME_TO_FLAG["MultiSig"];
  }
  /**
   * Verifies that the signature is valid for for the provided message
   */
  async verify(message, multisigSignature) {
    if (typeof multisigSignature !== "string") {
      throw new Error("Multisig verification only supports serialized signature");
    }
    const { signatureScheme, multisig } = parseSerializedSignature(multisigSignature);
    if (signatureScheme !== "MultiSig") {
      throw new Error("Invalid signature scheme");
    }
    let signatureWeight = 0;
    if (!bytesEqual(
      builder.ser("MultiSigPublicKey", this.multisigPublicKey).toBytes(),
      builder.ser("MultiSigPublicKey", multisig.multisig_pk).toBytes()
    )) {
      return false;
    }
    for (const { publicKey, weight, signature } of parsePartialSignatures(multisig)) {
      if (!await publicKey.verify(message, signature)) {
        return false;
      }
      signatureWeight += weight;
    }
    return signatureWeight >= this.multisigPublicKey.threshold;
  }
  combinePartialSignatures(signatures) {
    let bitmap = 0;
    const compressedSignatures = new Array(signatures.length);
    for (let i = 0; i < signatures.length; i++) {
      let parsed = parseSerializedSignature(signatures[i]);
      if (parsed.signatureScheme === "MultiSig") {
        throw new Error("MultiSig is not supported inside MultiSig");
      }
      let bytes2 = Array.from(parsed.signature.map((x) => Number(x)));
      if (parsed.signatureScheme === "ED25519") {
        compressedSignatures[i] = { ED25519: bytes2 };
      } else if (parsed.signatureScheme === "Secp256k1") {
        compressedSignatures[i] = { Secp256k1: bytes2 };
      } else if (parsed.signatureScheme === "Secp256r1") {
        compressedSignatures[i] = { Secp256r1: bytes2 };
      }
      let publicKeyIndex;
      for (let j = 0; j < this.publicKeys.length; j++) {
        if (bytesEqual(parsed.publicKey, this.publicKeys[j].publicKey.toRawBytes())) {
          if (bitmap & 1 << j) {
            throw new Error("Received multiple signatures from the same public key");
          }
          publicKeyIndex = j;
          break;
        }
      }
      if (publicKeyIndex === void 0) {
        throw new Error("Received signature from unknown public key");
      }
      bitmap |= 1 << publicKeyIndex;
    }
    let multisig = {
      sigs: compressedSignatures,
      bitmap,
      multisig_pk: this.multisigPublicKey
    };
    const bytes = builder.ser("MultiSig", multisig).toBytes();
    let tmp = new Uint8Array(bytes.length + 1);
    tmp.set([SIGNATURE_SCHEME_TO_FLAG["MultiSig"]]);
    tmp.set(bytes, 1);
    return toB64(tmp);
  }
}
function parsePartialSignatures(multisig) {
  let res = new Array(multisig.sigs.length);
  for (let i = 0; i < multisig.sigs.length; i++) {
    const [signatureScheme, signature] = Object.entries(multisig.sigs[i])[0];
    const pkIndex = asIndices(multisig.bitmap).at(i);
    const pair = multisig.multisig_pk.pk_map[pkIndex];
    const pkBytes = Uint8Array.from(Object.values(pair.pubKey)[0]);
    if (signatureScheme === "MultiSig") {
      throw new Error("MultiSig is not supported inside MultiSig");
    }
    const publicKey = publicKeyFromRawBytes(signatureScheme, pkBytes);
    res[i] = {
      signatureScheme,
      signature: Uint8Array.from(signature),
      publicKey,
      weight: pair.weight
    };
  }
  return res;
}
function asIndices(bitmap) {
  if (bitmap < 0 || bitmap > 1024) {
    throw new Error("Invalid bitmap");
  }
  let res = [];
  for (let i = 0; i < 10; i++) {
    if ((bitmap & 1 << i) !== 0) {
      res.push(i);
    }
  }
  return Uint8Array.from(res);
}
export {
  MAX_SIGNER_IN_MULTISIG,
  MultiSigPublicKey,
  parsePartialSignatures
};
//# sourceMappingURL=publickey.js.map
