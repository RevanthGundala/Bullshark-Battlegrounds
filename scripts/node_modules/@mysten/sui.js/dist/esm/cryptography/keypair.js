import { toSerializedSignature } from "./signature.js";
import { IntentScope, messageWithIntent } from "./intent.js";
import { blake2b } from "@noble/hashes/blake2b";
import { bcs } from "../bcs/index.js";
import { toB64 } from "@mysten/bcs";
const PRIVATE_KEY_SIZE = 32;
const LEGACY_PRIVATE_KEY_SIZE = 64;
class BaseSigner {
  async signWithIntent(bytes, intent) {
    const intentMessage = messageWithIntent(intent, bytes);
    const digest = blake2b(intentMessage, { dkLen: 32 });
    const signature = toSerializedSignature({
      signature: await this.sign(digest),
      signatureScheme: this.getKeyScheme(),
      pubKey: this.getPublicKey()
    });
    return {
      signature,
      bytes: toB64(bytes)
    };
  }
  async signTransactionBlock(bytes) {
    return this.signWithIntent(bytes, IntentScope.TransactionData);
  }
  async signPersonalMessage(bytes) {
    return this.signWithIntent(
      bcs.ser(["vector", "u8"], bytes).toBytes(),
      IntentScope.PersonalMessage
    );
  }
  /**
   * @deprecated use `signPersonalMessage` instead
   */
  async signMessage(bytes) {
    return this.signPersonalMessage(bytes);
  }
  toSuiAddress() {
    return this.getPublicKey().toSuiAddress();
  }
}
class Keypair extends BaseSigner {
}
export {
  BaseSigner,
  Keypair,
  LEGACY_PRIVATE_KEY_SIZE,
  PRIVATE_KEY_SIZE
};
//# sourceMappingURL=keypair.js.map
