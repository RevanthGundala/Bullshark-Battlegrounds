var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var __privateWrapper = (obj, member, setter, getter) => ({
  set _(value) {
    __privateSet(obj, member, value, setter);
  },
  get _() {
    return __privateGet(obj, member, getter);
  }
});
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};

// src/cryptography/utils.ts
import { fromB64 as fromB646 } from "@mysten/bcs";

// src/cryptography/signature.ts
import { fromB64, toB64 } from "@mysten/bcs";

// src/builder/bcs.ts
import { BCS as BCS2 } from "@mysten/bcs";

// src/bcs/index.ts
import { BCS, getSuiMoveConfig } from "@mysten/bcs";
function isPureArg(arg) {
  return arg.Pure !== void 0;
}
var VECTOR = "vector";
var TransactionDataV1 = {
  kind: "TransactionKind",
  sender: BCS.ADDRESS,
  gasData: "GasData",
  expiration: "TransactionExpiration"
};
var BCS_SPEC = {
  enums: {
    "Option<T>": {
      None: null,
      Some: "T"
    },
    ObjectArg: {
      ImmOrOwned: "SuiObjectRef",
      Shared: "SharedObjectRef"
    },
    CallArg: {
      Pure: [VECTOR, BCS.U8],
      Object: "ObjectArg",
      ObjVec: [VECTOR, "ObjectArg"]
    },
    TypeTag: {
      bool: null,
      u8: null,
      u64: null,
      u128: null,
      address: null,
      signer: null,
      vector: "TypeTag",
      struct: "StructTag",
      u16: null,
      u32: null,
      u256: null
    },
    TransactionKind: {
      // can not be called from sui.js; dummy placement
      // to set the enum counter right for ProgrammableTransact
      ProgrammableTransaction: "ProgrammableTransaction",
      ChangeEpoch: null,
      Genesis: null,
      ConsensusCommitPrologue: null
    },
    TransactionExpiration: {
      None: null,
      Epoch: "unsafe_u64"
    },
    TransactionData: {
      V1: "TransactionDataV1"
    }
  },
  structs: {
    SuiObjectRef: {
      objectId: BCS.ADDRESS,
      version: BCS.U64,
      digest: "ObjectDigest"
    },
    SharedObjectRef: {
      objectId: BCS.ADDRESS,
      initialSharedVersion: BCS.U64,
      mutable: BCS.BOOL
    },
    StructTag: {
      address: BCS.ADDRESS,
      module: BCS.STRING,
      name: BCS.STRING,
      typeParams: [VECTOR, "TypeTag"]
    },
    GasData: {
      payment: [VECTOR, "SuiObjectRef"],
      owner: BCS.ADDRESS,
      price: BCS.U64,
      budget: BCS.U64
    },
    // Signed transaction data needed to generate transaction digest.
    SenderSignedData: {
      data: "TransactionData",
      txSignatures: [VECTOR, [VECTOR, BCS.U8]]
    },
    TransactionDataV1
  },
  aliases: {
    ObjectDigest: BCS.BASE58
  }
};
var bcs = new BCS({ ...getSuiMoveConfig(), types: BCS_SPEC });
bcs.registerType(
  "utf8string",
  (writer, str) => {
    const bytes = Array.from(new TextEncoder().encode(str));
    return writer.writeVec(bytes, (writer2, el) => writer2.write8(el));
  },
  (reader) => {
    let bytes = reader.readVec((reader2) => reader2.read8());
    return new TextDecoder().decode(new Uint8Array(bytes));
  }
);
bcs.registerType(
  "unsafe_u64",
  (writer, data) => writer.write64(data),
  (reader) => Number.parseInt(reader.read64(), 10)
);

// src/builder/type-tag-serializer.ts
import { splitGenericParameters as splitGenericParameters2 } from "@mysten/bcs";

// src/utils/sui-types.ts
import { fromB58, splitGenericParameters } from "@mysten/bcs";
var TX_DIGEST_LENGTH = 32;
function isValidTransactionDigest(value) {
  try {
    const buffer = fromB58(value);
    return buffer.length === TX_DIGEST_LENGTH;
  } catch (e) {
    return false;
  }
}
var SUI_ADDRESS_LENGTH = 32;
function isValidSuiAddress(value) {
  return isHex(value) && getHexByteLength(value) === SUI_ADDRESS_LENGTH;
}
function isValidSuiObjectId(value) {
  return isValidSuiAddress(value);
}
function parseTypeTag(type) {
  if (!type.includes("::"))
    return type;
  return parseStructTag(type);
}
function parseStructTag(type) {
  const [address, module] = type.split("::");
  const rest = type.slice(address.length + module.length + 4);
  const name = rest.includes("<") ? rest.slice(0, rest.indexOf("<")) : rest;
  const typeParams = rest.includes("<") ? splitGenericParameters(rest.slice(rest.indexOf("<") + 1, rest.lastIndexOf(">"))).map(
    (typeParam) => parseTypeTag(typeParam.trim())
  ) : [];
  return {
    address: normalizeSuiAddress(address),
    module,
    name,
    typeParams
  };
}
function normalizeStructTag(type) {
  const { address, module, name, typeParams } = typeof type === "string" ? parseStructTag(type) : type;
  const formattedTypeParams = typeParams.length > 0 ? `<${typeParams.map(
    (typeParam) => typeof typeParam === "string" ? typeParam : normalizeStructTag(typeParam)
  ).join(",")}>` : "";
  return `${address}::${module}::${name}${formattedTypeParams}`;
}
function normalizeSuiAddress(value, forceAdd0x = false) {
  let address = value.toLowerCase();
  if (!forceAdd0x && address.startsWith("0x")) {
    address = address.slice(2);
  }
  return `0x${address.padStart(SUI_ADDRESS_LENGTH * 2, "0")}`;
}
function normalizeSuiObjectId(value, forceAdd0x = false) {
  return normalizeSuiAddress(value, forceAdd0x);
}
function isHex(value) {
  return /^(0x|0X)?[a-fA-F0-9]+$/.test(value) && value.length % 2 === 0;
}
function getHexByteLength(value) {
  return /^(0x|0X)/.test(value) ? (value.length - 2) / 2 : value.length / 2;
}

// src/builder/type-tag-serializer.ts
var VECTOR_REGEX = /^vector<(.+)>$/;
var STRUCT_REGEX = /^([^:]+)::([^:]+)::([^<]+)(<(.+)>)?/;
var TypeTagSerializer = class _TypeTagSerializer {
  static parseFromStr(str, normalizeAddress = false) {
    if (str === "address") {
      return { address: null };
    } else if (str === "bool") {
      return { bool: null };
    } else if (str === "u8") {
      return { u8: null };
    } else if (str === "u16") {
      return { u16: null };
    } else if (str === "u32") {
      return { u32: null };
    } else if (str === "u64") {
      return { u64: null };
    } else if (str === "u128") {
      return { u128: null };
    } else if (str === "u256") {
      return { u256: null };
    } else if (str === "signer") {
      return { signer: null };
    }
    const vectorMatch = str.match(VECTOR_REGEX);
    if (vectorMatch) {
      return {
        vector: _TypeTagSerializer.parseFromStr(vectorMatch[1], normalizeAddress)
      };
    }
    const structMatch = str.match(STRUCT_REGEX);
    if (structMatch) {
      const address = normalizeAddress ? normalizeSuiAddress(structMatch[1]) : structMatch[1];
      return {
        struct: {
          address,
          module: structMatch[2],
          name: structMatch[3],
          typeParams: structMatch[5] === void 0 ? [] : _TypeTagSerializer.parseStructTypeArgs(structMatch[5], normalizeAddress)
        }
      };
    }
    throw new Error(`Encountered unexpected token when parsing type args for ${str}`);
  }
  static parseStructTypeArgs(str, normalizeAddress = false) {
    return splitGenericParameters2(str).map(
      (tok) => _TypeTagSerializer.parseFromStr(tok, normalizeAddress)
    );
  }
  static tagToString(tag) {
    if ("bool" in tag) {
      return "bool";
    }
    if ("u8" in tag) {
      return "u8";
    }
    if ("u16" in tag) {
      return "u16";
    }
    if ("u32" in tag) {
      return "u32";
    }
    if ("u64" in tag) {
      return "u64";
    }
    if ("u128" in tag) {
      return "u128";
    }
    if ("u256" in tag) {
      return "u256";
    }
    if ("address" in tag) {
      return "address";
    }
    if ("signer" in tag) {
      return "signer";
    }
    if ("vector" in tag) {
      return `vector<${_TypeTagSerializer.tagToString(tag.vector)}>`;
    }
    if ("struct" in tag) {
      const struct = tag.struct;
      const typeParams = struct.typeParams.map(_TypeTagSerializer.tagToString).join(", ");
      return `${struct.address}::${struct.module}::${struct.name}${typeParams ? `<${typeParams}>` : ""}`;
    }
    throw new Error("Invalid TypeTag");
  }
};

// src/builder/bcs.ts
var ARGUMENT_INNER = "Argument";
var VECTOR2 = "vector";
var OPTION = "Option";
var CALL_ARG = "CallArg";
var TYPE_TAG = "TypeTag";
var OBJECT_ARG = "ObjectArg";
var PROGRAMMABLE_TX_BLOCK = "ProgrammableTransaction";
var PROGRAMMABLE_CALL_INNER = "ProgrammableMoveCall";
var TRANSACTION_INNER = "Transaction";
var COMPRESSED_SIGNATURE = "CompressedSignature";
var PUBLIC_KEY = "PublicKey";
var MULTISIG_PUBLIC_KEY = "MultiSigPublicKey";
var MULTISIG_PK_MAP = "MultiSigPkMap";
var MULTISIG = "MultiSig";
var ENUM_KIND = "EnumKind";
var TRANSACTION = [ENUM_KIND, TRANSACTION_INNER];
var ARGUMENT = [ENUM_KIND, ARGUMENT_INNER];
var PROGRAMMABLE_CALL = "SimpleProgrammableMoveCall";
var builder = new BCS2(bcs);
registerFixedArray(builder, "FixedArray[64]", 64);
registerFixedArray(builder, "FixedArray[33]", 33);
registerFixedArray(builder, "FixedArray[32]", 32);
builder.registerStructType(PROGRAMMABLE_TX_BLOCK, {
  inputs: [VECTOR2, CALL_ARG],
  transactions: [VECTOR2, TRANSACTION]
}).registerEnumType(ARGUMENT_INNER, {
  GasCoin: null,
  Input: { index: BCS2.U16 },
  Result: { index: BCS2.U16 },
  NestedResult: { index: BCS2.U16, resultIndex: BCS2.U16 }
}).registerStructType(PROGRAMMABLE_CALL_INNER, {
  package: BCS2.ADDRESS,
  module: BCS2.STRING,
  function: BCS2.STRING,
  type_arguments: [VECTOR2, TYPE_TAG],
  arguments: [VECTOR2, ARGUMENT]
}).registerEnumType(TRANSACTION_INNER, {
  /**
   * A Move Call - any public Move function can be called via
   * this transaction. The results can be used that instant to pass
   * into the next transaction.
   */
  MoveCall: PROGRAMMABLE_CALL,
  /**
   * Transfer vector of objects to a receiver.
   */
  TransferObjects: {
    objects: [VECTOR2, ARGUMENT],
    address: ARGUMENT
  },
  /**
   * Split `amount` from a `coin`.
   */
  SplitCoins: { coin: ARGUMENT, amounts: [VECTOR2, ARGUMENT] },
  /**
   * Merge Vector of Coins (`sources`) into a `destination`.
   */
  MergeCoins: { destination: ARGUMENT, sources: [VECTOR2, ARGUMENT] },
  /**
   * Publish a Move module.
   */
  Publish: {
    modules: [VECTOR2, [VECTOR2, BCS2.U8]],
    dependencies: [VECTOR2, BCS2.ADDRESS]
  },
  /**
   * Build a vector of objects using the input arguments.
   * It is impossible to construct a `vector<T: key>` otherwise,
   * so this call serves a utility function.
   */
  MakeMoveVec: {
    type: [OPTION, TYPE_TAG],
    objects: [VECTOR2, ARGUMENT]
  },
  /**  */
  Upgrade: {
    modules: [VECTOR2, [VECTOR2, BCS2.U8]],
    dependencies: [VECTOR2, BCS2.ADDRESS],
    packageId: BCS2.ADDRESS,
    ticket: ARGUMENT
  }
}).registerEnumType(COMPRESSED_SIGNATURE, {
  ED25519: ["FixedArray[64]", "u8"],
  Secp256k1: ["FixedArray[64]", "u8"],
  Secp256r1: ["FixedArray[64]", "u8"]
}).registerEnumType(PUBLIC_KEY, {
  ED25519: ["FixedArray[32]", "u8"],
  Secp256k1: ["FixedArray[33]", "u8"],
  Secp256r1: ["FixedArray[33]", "u8"]
}).registerStructType(MULTISIG_PK_MAP, {
  pubKey: PUBLIC_KEY,
  weight: BCS2.U8
}).registerStructType(MULTISIG_PUBLIC_KEY, {
  pk_map: [VECTOR2, MULTISIG_PK_MAP],
  threshold: BCS2.U16
}).registerStructType(MULTISIG, {
  sigs: [VECTOR2, COMPRESSED_SIGNATURE],
  bitmap: BCS2.U16,
  multisig_pk: MULTISIG_PUBLIC_KEY
});
builder.registerType(
  [ENUM_KIND, "T"],
  function encode(writer, data, typeParams, typeMap) {
    const kind = data.kind;
    const invariant = { [kind]: data };
    const [enumType] = typeParams;
    return this.getTypeInterface(enumType)._encodeRaw.call(
      this,
      writer,
      invariant,
      typeParams,
      typeMap
    );
  },
  function decode(reader, typeParams, typeMap) {
    const [enumType] = typeParams;
    const data = this.getTypeInterface(enumType)._decodeRaw.call(
      this,
      reader,
      typeParams,
      typeMap
    );
    const kind = Object.keys(data)[0];
    return { kind, ...data[kind] };
  },
  (data) => {
    if (typeof data !== "object" && !("kind" in data)) {
      throw new Error(`EnumKind: Missing property "kind" in the input ${JSON.stringify(data)}`);
    }
    return true;
  }
);
builder.registerType(
  PROGRAMMABLE_CALL,
  function encodeProgrammableTx(writer, data, typeParams, typeMap) {
    const [pkg, module, fun] = data.target.split("::");
    const type_arguments = data.typeArguments.map(
      (tag) => TypeTagSerializer.parseFromStr(tag, true)
    );
    return this.getTypeInterface(PROGRAMMABLE_CALL_INNER)._encodeRaw.call(
      this,
      writer,
      {
        package: normalizeSuiAddress(pkg),
        module,
        function: fun,
        type_arguments,
        arguments: data.arguments
      },
      typeParams,
      typeMap
    );
  },
  function decodeProgrammableTx(reader, typeParams, typeMap) {
    let data = builder.getTypeInterface(PROGRAMMABLE_CALL_INNER)._decodeRaw.call(this, reader, typeParams, typeMap);
    return {
      target: [data.package, data.module, data.function].join("::"),
      arguments: data.arguments,
      typeArguments: data.type_arguments.map(TypeTagSerializer.tagToString)
    };
  },
  // Validation callback to error out if the data format is invalid.
  // TODO: make sure TypeTag can be parsed.
  (data) => {
    return data.target.split("::").length === 3;
  }
);
function registerFixedArray(bcs2, name, length) {
  bcs2.registerType(
    name,
    function encode2(writer, data, typeParams, typeMap) {
      if (data.length !== length) {
        throw new Error(`Expected fixed array of length ${length}, got ${data.length}`);
      }
      if (typeParams.length !== 1) {
        throw new Error(`Expected one type parameter in a fixed array, got ${typeParams.length}`);
      }
      let [type] = typeof typeParams[0] === "string" ? [typeParams[0], []] : typeParams[0];
      for (let piece of data) {
        this.getTypeInterface(type)._encodeRaw.call(this, writer, piece, typeParams, typeMap);
      }
      return writer;
    },
    function decode2(reader, typeParams, typeMap) {
      if (typeParams.length !== 1) {
        throw new Error(`Expected one type parameter in a fixed array, got ${typeParams.length}`);
      }
      let result = [];
      let [type] = typeof typeParams[0] === "string" ? [typeParams[0], []] : typeParams[0];
      for (let i = 0; i < length; i++) {
        result.push(this.getTypeInterface(type)._decodeRaw.call(this, reader, typeParams, typeMap));
      }
      return result;
    }
  );
}

// src/cryptography/signature.ts
var SIGNATURE_SCHEME_TO_FLAG = {
  ED25519: 0,
  Secp256k1: 1,
  Secp256r1: 2,
  MultiSig: 3
};
var SIGNATURE_SCHEME_TO_SIZE = {
  ED25519: 32,
  Secp256k1: 33,
  Secp256r1: 33
};
var SIGNATURE_FLAG_TO_SCHEME = {
  0: "ED25519",
  1: "Secp256k1",
  2: "Secp256r1",
  3: "MultiSig"
};
function toSerializedSignature({
  signature,
  signatureScheme,
  pubKey,
  publicKey = pubKey
}) {
  if (!publicKey) {
    throw new Error("`publicKey` is required");
  }
  const pubKeyBytes = publicKey.toBytes();
  const serializedSignature = new Uint8Array(1 + signature.length + pubKeyBytes.length);
  serializedSignature.set([SIGNATURE_SCHEME_TO_FLAG[signatureScheme]]);
  serializedSignature.set(signature, 1);
  serializedSignature.set(pubKeyBytes, 1 + signature.length);
  return toB64(serializedSignature);
}
function parseSerializedSignature(serializedSignature) {
  const bytes = fromB64(serializedSignature);
  const signatureScheme = SIGNATURE_FLAG_TO_SCHEME[bytes[0]];
  if (signatureScheme === "MultiSig") {
    const multisig = builder.de("MultiSig", bytes.slice(1));
    return {
      serializedSignature,
      signatureScheme,
      multisig,
      bytes
    };
  }
  if (!(signatureScheme in SIGNATURE_SCHEME_TO_SIZE)) {
    throw new Error("Unsupported signature scheme");
  }
  const size = SIGNATURE_SCHEME_TO_SIZE[signatureScheme];
  const signature = bytes.slice(1, bytes.length - size);
  const publicKey = bytes.slice(1 + signature.length);
  return {
    serializedSignature,
    signatureScheme,
    signature,
    publicKey,
    bytes
  };
}

// src/keypairs/secp256r1/publickey.ts
import { fromB64 as fromB642 } from "@mysten/bcs";

// src/cryptography/publickey.ts
import { toB64 as toB642 } from "@mysten/bcs";

// src/cryptography/intent.ts
var AppId = /* @__PURE__ */ ((AppId2) => {
  AppId2[AppId2["Sui"] = 0] = "Sui";
  return AppId2;
})(AppId || {});
var IntentVersion = /* @__PURE__ */ ((IntentVersion2) => {
  IntentVersion2[IntentVersion2["V0"] = 0] = "V0";
  return IntentVersion2;
})(IntentVersion || {});
var IntentScope = /* @__PURE__ */ ((IntentScope2) => {
  IntentScope2[IntentScope2["TransactionData"] = 0] = "TransactionData";
  IntentScope2[IntentScope2["TransactionEffects"] = 1] = "TransactionEffects";
  IntentScope2[IntentScope2["CheckpointSummary"] = 2] = "CheckpointSummary";
  IntentScope2[IntentScope2["PersonalMessage"] = 3] = "PersonalMessage";
  return IntentScope2;
})(IntentScope || {});
function intentWithScope(scope) {
  return [scope, 0 /* V0 */, 0 /* Sui */];
}
function messageWithIntent(scope, message) {
  const intent = intentWithScope(scope);
  const intentMessage = new Uint8Array(intent.length + message.length);
  intentMessage.set(intent);
  intentMessage.set(message, intent.length);
  return intentMessage;
}

// src/cryptography/publickey.ts
import { blake2b } from "@noble/hashes/blake2b";
import { bytesToHex } from "@noble/hashes/utils";
function bytesEqual(a, b) {
  if (a === b)
    return true;
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
var PublicKey = class {
  /**
   * Checks if two public keys are equal
   */
  equals(publicKey) {
    return bytesEqual(this.toRawBytes(), publicKey.toRawBytes());
  }
  /**
   * Return the base-64 representation of the public key
   */
  toBase64() {
    return toB642(this.toRawBytes());
  }
  /**
   * @deprecated use toBase64 instead.
   *
   * Return the base-64 representation of the public key
   */
  toString() {
    return this.toBase64();
  }
  /**
   * Return the Sui representation of the public key encoded in
   * base-64. A Sui public key is formed by the concatenation
   * of the scheme flag with the raw bytes of the public key
   */
  toSuiPublicKey() {
    const bytes = this.toSuiBytes();
    return toB642(bytes);
  }
  verifyWithIntent(bytes, signature, intent) {
    const intentMessage = messageWithIntent(intent, bytes);
    const digest = blake2b(intentMessage, { dkLen: 32 });
    return this.verify(digest, signature);
  }
  /**
   * Verifies that the signature is valid for for the provided PersonalMessage
   */
  verifyPersonalMessage(message, signature) {
    return this.verifyWithIntent(
      bcs.ser(["vector", "u8"], message).toBytes(),
      signature,
      3 /* PersonalMessage */
    );
  }
  /**
   * Verifies that the signature is valid for for the provided TransactionBlock
   */
  verifyTransactionBlock(transactionBlock, signature) {
    return this.verifyWithIntent(transactionBlock, signature, 0 /* TransactionData */);
  }
  /**
   * Returns the bytes representation of the public key
   * prefixed with the signature scheme flag
   */
  toSuiBytes() {
    const rawBytes = this.toRawBytes();
    const suiBytes = new Uint8Array(rawBytes.length + 1);
    suiBytes.set([this.flag()]);
    suiBytes.set(rawBytes, 1);
    return suiBytes;
  }
  /**
   * @deprecated use `toRawBytes` instead.
   */
  toBytes() {
    return this.toRawBytes();
  }
  /**
   * Return the Sui address associated with this Ed25519 public key
   */
  toSuiAddress() {
    return normalizeSuiAddress(
      bytesToHex(blake2b(this.toSuiBytes(), { dkLen: 32 })).slice(0, SUI_ADDRESS_LENGTH * 2)
    );
  }
};

// src/keypairs/secp256r1/publickey.ts
import { sha256 } from "@noble/hashes/sha256";
import { secp256r1 } from "@noble/curves/p256";
var SECP256R1_PUBLIC_KEY_SIZE = 33;
var Secp256r1PublicKey = class extends PublicKey {
  /**
   * Create a new Secp256r1PublicKey object
   * @param value secp256r1 public key as buffer or base-64 encoded string
   */
  constructor(value) {
    super();
    if (typeof value === "string") {
      this.data = fromB642(value);
    } else if (value instanceof Uint8Array) {
      this.data = value;
    } else {
      this.data = Uint8Array.from(value);
    }
    if (this.data.length !== SECP256R1_PUBLIC_KEY_SIZE) {
      throw new Error(
        `Invalid public key input. Expected ${SECP256R1_PUBLIC_KEY_SIZE} bytes, got ${this.data.length}`
      );
    }
  }
  /**
   * Checks if two Secp256r1 public keys are equal
   */
  equals(publicKey) {
    return super.equals(publicKey);
  }
  /**
   * Return the byte array representation of the Secp256r1 public key
   */
  toRawBytes() {
    return this.data;
  }
  /**
   * Return the Sui address associated with this Secp256r1 public key
   */
  flag() {
    return SIGNATURE_SCHEME_TO_FLAG["Secp256r1"];
  }
  /**
   * Verifies that the signature is valid for for the provided message
   */
  async verify(message, signature) {
    let bytes;
    if (typeof signature === "string") {
      const parsed = parseSerializedSignature(signature);
      if (parsed.signatureScheme !== "Secp256r1") {
        throw new Error("Invalid signature scheme");
      }
      if (!bytesEqual(this.toRawBytes(), parsed.publicKey)) {
        throw new Error("Signature does not match public key");
      }
      bytes = parsed.signature;
    } else {
      bytes = signature;
    }
    return secp256r1.verify(
      secp256r1.Signature.fromCompact(bytes),
      sha256(message),
      this.toRawBytes()
    );
  }
};
Secp256r1PublicKey.SIZE = SECP256R1_PUBLIC_KEY_SIZE;

// src/keypairs/secp256k1/publickey.ts
import { fromB64 as fromB643 } from "@mysten/bcs";
import { secp256k1 } from "@noble/curves/secp256k1";
import { sha256 as sha2562 } from "@noble/hashes/sha256";
var SECP256K1_PUBLIC_KEY_SIZE = 33;
var Secp256k1PublicKey = class extends PublicKey {
  /**
   * Create a new Secp256k1PublicKey object
   * @param value secp256k1 public key as buffer or base-64 encoded string
   */
  constructor(value) {
    super();
    if (typeof value === "string") {
      this.data = fromB643(value);
    } else if (value instanceof Uint8Array) {
      this.data = value;
    } else {
      this.data = Uint8Array.from(value);
    }
    if (this.data.length !== SECP256K1_PUBLIC_KEY_SIZE) {
      throw new Error(
        `Invalid public key input. Expected ${SECP256K1_PUBLIC_KEY_SIZE} bytes, got ${this.data.length}`
      );
    }
  }
  /**
   * Checks if two Secp256k1 public keys are equal
   */
  equals(publicKey) {
    return super.equals(publicKey);
  }
  /**
   * Return the byte array representation of the Secp256k1 public key
   */
  toRawBytes() {
    return this.data;
  }
  /**
   * Return the Sui address associated with this Secp256k1 public key
   */
  flag() {
    return SIGNATURE_SCHEME_TO_FLAG["Secp256k1"];
  }
  /**
   * Verifies that the signature is valid for for the provided message
   */
  async verify(message, signature) {
    let bytes;
    if (typeof signature === "string") {
      const parsed = parseSerializedSignature(signature);
      if (parsed.signatureScheme !== "Secp256k1") {
        throw new Error("Invalid signature scheme");
      }
      if (!bytesEqual(this.toRawBytes(), parsed.publicKey)) {
        throw new Error("Signature does not match public key");
      }
      bytes = parsed.signature;
    } else {
      bytes = signature;
    }
    return secp256k1.verify(
      secp256k1.Signature.fromCompact(bytes),
      sha2562(message),
      this.toRawBytes()
    );
  }
};
Secp256k1PublicKey.SIZE = SECP256K1_PUBLIC_KEY_SIZE;

// src/keypairs/ed25519/publickey.ts
import { fromB64 as fromB644 } from "@mysten/bcs";
import nacl from "tweetnacl";
var PUBLIC_KEY_SIZE = 32;
var Ed25519PublicKey = class extends PublicKey {
  /**
   * Create a new Ed25519PublicKey object
   * @param value ed25519 public key as buffer or base-64 encoded string
   */
  constructor(value) {
    super();
    if (typeof value === "string") {
      this.data = fromB644(value);
    } else if (value instanceof Uint8Array) {
      this.data = value;
    } else {
      this.data = Uint8Array.from(value);
    }
    if (this.data.length !== PUBLIC_KEY_SIZE) {
      throw new Error(
        `Invalid public key input. Expected ${PUBLIC_KEY_SIZE} bytes, got ${this.data.length}`
      );
    }
  }
  /**
   * Checks if two Ed25519 public keys are equal
   */
  equals(publicKey) {
    return super.equals(publicKey);
  }
  /**
   * Return the byte array representation of the Ed25519 public key
   */
  toRawBytes() {
    return this.data;
  }
  /**
   * Return the Sui address associated with this Ed25519 public key
   */
  flag() {
    return SIGNATURE_SCHEME_TO_FLAG["ED25519"];
  }
  /**
   * Verifies that the signature is valid for for the provided message
   */
  async verify(message, signature) {
    let bytes;
    if (typeof signature === "string") {
      const parsed = parseSerializedSignature(signature);
      if (parsed.signatureScheme !== "ED25519") {
        throw new Error("Invalid signature scheme");
      }
      if (!bytesEqual(this.toRawBytes(), parsed.publicKey)) {
        throw new Error("Signature does not match public key");
      }
      bytes = parsed.signature;
    } else {
      bytes = signature;
    }
    return nacl.sign.detached.verify(message, bytes, this.toRawBytes());
  }
};
Ed25519PublicKey.SIZE = PUBLIC_KEY_SIZE;

// src/cryptography/multisig.ts
import { fromB64 as fromB645, toB64 as toB643 } from "@mysten/bcs";
import { blake2b as blake2b2 } from "@noble/hashes/blake2b";
import { bytesToHex as bytesToHex2 } from "@noble/hashes/utils";
var MAX_SIGNER_IN_MULTISIG = 10;
function toMultiSigAddress(pks, threshold) {
  if (pks.length > MAX_SIGNER_IN_MULTISIG) {
    throw new Error(`Max number of signers in a multisig is ${MAX_SIGNER_IN_MULTISIG}`);
  }
  let maxLength = 1 + (64 + 1) * MAX_SIGNER_IN_MULTISIG + 2;
  let tmp = new Uint8Array(maxLength);
  tmp.set([SIGNATURE_SCHEME_TO_FLAG["MultiSig"]]);
  let arr = to_uint8array(threshold);
  tmp.set(arr, 1);
  let i = 3;
  for (const pk of pks) {
    tmp.set([pk.pubKey.flag()], i);
    tmp.set(pk.pubKey.toRawBytes(), i + 1);
    tmp.set([pk.weight], i + 1 + pk.pubKey.toRawBytes().length);
    i += pk.pubKey.toRawBytes().length + 2;
  }
  return normalizeSuiAddress(bytesToHex2(blake2b2(tmp.slice(0, i), { dkLen: 32 })));
}
function combinePartialSigs(sigs, pks, threshold) {
  let multisig_pk = {
    pk_map: pks.map((x) => toPkWeightPair(x)),
    threshold
  };
  let bitmap = 0;
  let compressed_sigs = new Array(sigs.length);
  for (let i = 0; i < sigs.length; i++) {
    let parsed = toSingleSignaturePubkeyPair(sigs[i]);
    let bytes2 = Array.from(parsed.signature.map((x) => Number(x)));
    if (parsed.signatureScheme === "ED25519") {
      compressed_sigs[i] = { ED25519: bytes2 };
    } else if (parsed.signatureScheme === "Secp256k1") {
      compressed_sigs[i] = { Secp256k1: bytes2 };
    } else if (parsed.signatureScheme === "Secp256r1") {
      compressed_sigs[i] = { Secp256r1: bytes2 };
    }
    for (let j = 0; j < pks.length; j++) {
      if (parsed.pubKey.equals(pks[j].pubKey)) {
        bitmap |= 1 << j;
        break;
      }
    }
  }
  let multisig = {
    sigs: compressed_sigs,
    bitmap,
    multisig_pk
  };
  const bytes = builder.ser("MultiSig", multisig).toBytes();
  let tmp = new Uint8Array(bytes.length + 1);
  tmp.set([SIGNATURE_SCHEME_TO_FLAG["MultiSig"]]);
  tmp.set(bytes, 1);
  return toB643(tmp);
}
function decodeMultiSig(signature) {
  const parsed = fromB645(signature);
  if (parsed.length < 1 || parsed[0] !== SIGNATURE_SCHEME_TO_FLAG["MultiSig"]) {
    throw new Error("Invalid MultiSig flag");
  }
  const multisig = builder.de("MultiSig", parsed.slice(1));
  let res = new Array(multisig.sigs.length);
  for (let i = 0; i < multisig.sigs.length; i++) {
    let s = multisig.sigs[i];
    let pk_index = as_indices(multisig.bitmap).at(i);
    let pk_bytes = Object.values(multisig.multisig_pk.pk_map[pk_index].pubKey)[0];
    const scheme = Object.keys(s)[0];
    if (scheme === "MultiSig") {
      throw new Error("MultiSig is not supported inside MultiSig");
    }
    const SIGNATURE_SCHEME_TO_PUBLIC_KEY = {
      ED25519: Ed25519PublicKey,
      Secp256k1: Secp256k1PublicKey,
      Secp256r1: Secp256r1PublicKey
    };
    const PublicKey2 = SIGNATURE_SCHEME_TO_PUBLIC_KEY[scheme];
    res[i] = {
      signatureScheme: scheme,
      signature: Uint8Array.from(Object.values(s)[0]),
      pubKey: new PublicKey2(pk_bytes),
      weight: multisig.multisig_pk.pk_map[pk_index].weight
    };
  }
  return res;
}
function toPkWeightPair(pair) {
  let pk_bytes = Array.from(pair.pubKey.toBytes().map((x) => Number(x)));
  switch (pair.pubKey.flag()) {
    case SIGNATURE_SCHEME_TO_FLAG["Secp256k1"]:
      return {
        pubKey: {
          Secp256k1: pk_bytes
        },
        weight: pair.weight
      };
    case SIGNATURE_SCHEME_TO_FLAG["Secp256r1"]:
      return {
        pubKey: {
          Secp256r1: pk_bytes
        },
        weight: pair.weight
      };
    case SIGNATURE_SCHEME_TO_FLAG["ED25519"]:
      return {
        pubKey: {
          ED25519: pk_bytes
        },
        weight: pair.weight
      };
    default:
      throw new Error("Unsupported signature scheme");
  }
}
function to_uint8array(threshold) {
  if (threshold < 0 || threshold > 65535) {
    throw new Error("Invalid threshold");
  }
  let arr = new Uint8Array(2);
  arr[0] = threshold & 255;
  arr[1] = threshold >> 8;
  return arr;
}
function as_indices(bitmap) {
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

// src/keypairs/ed25519/keypair.ts
import nacl3 from "tweetnacl";

// src/cryptography/mnemonics.ts
import { toHEX } from "@mysten/bcs";
import { mnemonicToSeedSync as bip39MnemonicToSeedSync } from "@scure/bip39";
function isValidHardenedPath(path) {
  if (!new RegExp("^m\\/44'\\/784'\\/[0-9]+'\\/[0-9]+'\\/[0-9]+'+$").test(path)) {
    return false;
  }
  return true;
}
function isValidBIP32Path(path) {
  if (!new RegExp("^m\\/(54|74)'\\/784'\\/[0-9]+'\\/[0-9]+\\/[0-9]+$").test(path)) {
    return false;
  }
  return true;
}
function mnemonicToSeed(mnemonics) {
  return bip39MnemonicToSeedSync(mnemonics, "");
}
function mnemonicToSeedHex(mnemonics) {
  return toHEX(mnemonicToSeed(mnemonics));
}

// src/keypairs/ed25519/ed25519-hd-key.ts
import { sha512 } from "@noble/hashes/sha512";
import { hmac } from "@noble/hashes/hmac";
import nacl2 from "tweetnacl";
import { fromHEX } from "@mysten/bcs";
var ED25519_CURVE = "ed25519 seed";
var HARDENED_OFFSET = 2147483648;
var pathRegex = new RegExp("^m(\\/[0-9]+')+$");
var replaceDerive = (val) => val.replace("'", "");
var getMasterKeyFromSeed = (seed) => {
  const h = hmac.create(sha512, ED25519_CURVE);
  const I = h.update(fromHEX(seed)).digest();
  const IL = I.slice(0, 32);
  const IR = I.slice(32);
  return {
    key: IL,
    chainCode: IR
  };
};
var CKDPriv = ({ key, chainCode }, index) => {
  const indexBuffer = new ArrayBuffer(4);
  const cv = new DataView(indexBuffer);
  cv.setUint32(0, index);
  const data = new Uint8Array(1 + key.length + indexBuffer.byteLength);
  data.set(new Uint8Array(1).fill(0));
  data.set(key, 1);
  data.set(new Uint8Array(indexBuffer, 0, indexBuffer.byteLength), key.length + 1);
  const I = hmac.create(sha512, chainCode).update(data).digest();
  const IL = I.slice(0, 32);
  const IR = I.slice(32);
  return {
    key: IL,
    chainCode: IR
  };
};
var isValidPath = (path) => {
  if (!pathRegex.test(path)) {
    return false;
  }
  return !path.split("/").slice(1).map(replaceDerive).some(
    isNaN
    /* ts T_T*/
  );
};
var derivePath = (path, seed, offset = HARDENED_OFFSET) => {
  if (!isValidPath(path)) {
    throw new Error("Invalid derivation path");
  }
  const { key, chainCode } = getMasterKeyFromSeed(seed);
  const segments = path.split("/").slice(1).map(replaceDerive).map((el) => parseInt(el, 10));
  return segments.reduce((parentKeys, segment) => CKDPriv(parentKeys, segment + offset), {
    key,
    chainCode
  });
};

// src/keypairs/ed25519/keypair.ts
import { toB64 as toB645 } from "@mysten/bcs";

// src/cryptography/keypair.ts
import { blake2b as blake2b3 } from "@noble/hashes/blake2b";
import { toB64 as toB644 } from "@mysten/bcs";
var PRIVATE_KEY_SIZE = 32;
var LEGACY_PRIVATE_KEY_SIZE = 64;
var BaseSigner = class {
  async signWithIntent(bytes, intent) {
    const intentMessage = messageWithIntent(intent, bytes);
    const digest = blake2b3(intentMessage, { dkLen: 32 });
    const signature = toSerializedSignature({
      signature: await this.sign(digest),
      signatureScheme: this.getKeyScheme(),
      pubKey: this.getPublicKey()
    });
    return {
      signature,
      bytes: toB644(bytes)
    };
  }
  async signTransactionBlock(bytes) {
    return this.signWithIntent(bytes, 0 /* TransactionData */);
  }
  async signPersonalMessage(bytes) {
    return this.signWithIntent(
      bcs.ser(["vector", "u8"], bytes).toBytes(),
      3 /* PersonalMessage */
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
};
var Keypair = class extends BaseSigner {
};

// src/keypairs/ed25519/keypair.ts
var DEFAULT_ED25519_DERIVATION_PATH = "m/44'/784'/0'/0'/0'";
var Ed25519Keypair = class _Ed25519Keypair extends Keypair {
  /**
   * Create a new Ed25519 keypair instance.
   * Generate random keypair if no {@link Ed25519Keypair} is provided.
   *
   * @param keypair Ed25519 keypair
   */
  constructor(keypair) {
    super();
    if (keypair) {
      this.keypair = keypair;
    } else {
      this.keypair = nacl3.sign.keyPair();
    }
  }
  /**
   * Get the key scheme of the keypair ED25519
   */
  getKeyScheme() {
    return "ED25519";
  }
  /**
   * Generate a new random Ed25519 keypair
   */
  static generate() {
    return new _Ed25519Keypair(nacl3.sign.keyPair());
  }
  /**
   * Create a Ed25519 keypair from a raw secret key byte array, also known as seed.
   * This is NOT the private scalar which is result of hashing and bit clamping of
   * the raw secret key.
   *
   * The sui.keystore key is a list of Base64 encoded `flag || privkey`. To import
   * a key from sui.keystore to typescript, decode from base64 and remove the first
   * flag byte after checking it is indeed the Ed25519 scheme flag 0x00 (See more
   * on flag for signature scheme: https://github.com/MystenLabs/sui/blob/818406c5abdf7de1b80915a0519071eec3a5b1c7/crates/sui-types/src/crypto.rs#L1650):
   * ```
   * import { Ed25519Keypair, fromB64 } from '@mysten/sui.js';
   * const raw = fromB64(t[1]);
   * if (raw[0] !== 0 || raw.length !== PRIVATE_KEY_SIZE + 1) {
   *   throw new Error('invalid key');
   * }
   * const imported = Ed25519Keypair.fromSecretKey(raw.slice(1))
   * ```
   * @throws error if the provided secret key is invalid and validation is not skipped.
   *
   * @param secretKey secret key byte array
   * @param options: skip secret key validation
   */
  static fromSecretKey(secretKey, options) {
    const secretKeyLength = secretKey.length;
    if (secretKeyLength !== PRIVATE_KEY_SIZE) {
      throw new Error(
        `Wrong secretKey size. Expected ${PRIVATE_KEY_SIZE} bytes, got ${secretKeyLength}.`
      );
    }
    const keypair = nacl3.sign.keyPair.fromSeed(secretKey);
    if (!options || !options.skipValidation) {
      const encoder = new TextEncoder();
      const signData = encoder.encode("sui validation");
      const signature = nacl3.sign.detached(signData, keypair.secretKey);
      if (!nacl3.sign.detached.verify(signData, signature, keypair.publicKey)) {
        throw new Error("provided secretKey is invalid");
      }
    }
    return new _Ed25519Keypair(keypair);
  }
  /**
   * The public key for this Ed25519 keypair
   */
  getPublicKey() {
    return new Ed25519PublicKey(this.keypair.publicKey);
  }
  async sign(data) {
    return this.signData(data);
  }
  /**
   * Return the signature for the provided data using Ed25519.
   */
  signData(data) {
    return nacl3.sign.detached(data, this.keypair.secretKey);
  }
  /**
   * Derive Ed25519 keypair from mnemonics and path. The mnemonics must be normalized
   * and validated against the english wordlist.
   *
   * If path is none, it will default to m/44'/784'/0'/0'/0', otherwise the path must
   * be compliant to SLIP-0010 in form m/44'/784'/{account_index}'/{change_index}'/{address_index}'.
   */
  static deriveKeypair(mnemonics, path) {
    if (path == null) {
      path = DEFAULT_ED25519_DERIVATION_PATH;
    }
    if (!isValidHardenedPath(path)) {
      throw new Error("Invalid derivation path");
    }
    const { key } = derivePath(path, mnemonicToSeedHex(mnemonics));
    return _Ed25519Keypair.fromSecretKey(key);
  }
  /**
   * Derive Ed25519 keypair from mnemonicSeed and path.
   *
   * If path is none, it will default to m/44'/784'/0'/0'/0', otherwise the path must
   * be compliant to SLIP-0010 in form m/44'/784'/{account_index}'/{change_index}'/{address_index}'.
   */
  static deriveKeypairFromSeed(seedHex, path) {
    if (path == null) {
      path = DEFAULT_ED25519_DERIVATION_PATH;
    }
    if (!isValidHardenedPath(path)) {
      throw new Error("Invalid derivation path");
    }
    const { key } = derivePath(path, seedHex);
    return _Ed25519Keypair.fromSecretKey(key);
  }
  /**
   * This returns an exported keypair object, the private key field is the pure 32-byte seed.
   */
  export() {
    return {
      schema: "ED25519",
      privateKey: toB645(this.keypair.secretKey.slice(0, PRIVATE_KEY_SIZE))
    };
  }
};

// src/keypairs/secp256k1/keypair.ts
import { sha256 as sha2563 } from "@noble/hashes/sha256";
import { secp256k1 as secp256k12 } from "@noble/curves/secp256k1";
import { HDKey } from "@scure/bip32";
import { toB64 as toB646 } from "@mysten/bcs";
import { bytesToHex as bytesToHex3 } from "@noble/hashes/utils";
import { blake2b as blake2b4 } from "@noble/hashes/blake2b";
var DEFAULT_SECP256K1_DERIVATION_PATH = "m/54'/784'/0'/0/0";
var Secp256k1Keypair = class _Secp256k1Keypair extends Keypair {
  /**
   * Create a new keypair instance.
   * Generate random keypair if no {@link Secp256k1Keypair} is provided.
   *
   * @param keypair secp256k1 keypair
   */
  constructor(keypair) {
    super();
    if (keypair) {
      this.keypair = keypair;
    } else {
      const secretKey = secp256k12.utils.randomPrivateKey();
      const publicKey = secp256k12.getPublicKey(secretKey, true);
      this.keypair = { publicKey, secretKey };
    }
  }
  /**
   * Get the key scheme of the keypair Secp256k1
   */
  getKeyScheme() {
    return "Secp256k1";
  }
  /**
   * Generate a new random keypair
   */
  static generate() {
    return new _Secp256k1Keypair();
  }
  /**
   * Create a keypair from a raw secret key byte array.
   *
   * This method should only be used to recreate a keypair from a previously
   * generated secret key. Generating keypairs from a random seed should be done
   * with the {@link Keypair.fromSeed} method.
   *
   * @throws error if the provided secret key is invalid and validation is not skipped.
   *
   * @param secretKey secret key byte array
   * @param options: skip secret key validation
   */
  static fromSecretKey(secretKey, options) {
    const publicKey = secp256k12.getPublicKey(secretKey, true);
    if (!options || !options.skipValidation) {
      const encoder = new TextEncoder();
      const signData = encoder.encode("sui validation");
      const msgHash = bytesToHex3(blake2b4(signData, { dkLen: 32 }));
      const signature = secp256k12.sign(msgHash, secretKey);
      if (!secp256k12.verify(signature, msgHash, publicKey, { lowS: true })) {
        throw new Error("Provided secretKey is invalid");
      }
    }
    return new _Secp256k1Keypair({ publicKey, secretKey });
  }
  /**
   * Generate a keypair from a 32 byte seed.
   *
   * @param seed seed byte array
   */
  static fromSeed(seed) {
    let publicKey = secp256k12.getPublicKey(seed, true);
    return new _Secp256k1Keypair({ publicKey, secretKey: seed });
  }
  /**
   * The public key for this keypair
   */
  getPublicKey() {
    return new Secp256k1PublicKey(this.keypair.publicKey);
  }
  async sign(data) {
    return this.signData(data);
  }
  /**
   * Return the signature for the provided data.
   */
  signData(data) {
    const msgHash = sha2563(data);
    const sig = secp256k12.sign(msgHash, this.keypair.secretKey, {
      lowS: true
    });
    return sig.toCompactRawBytes();
  }
  /**
   * Derive Secp256k1 keypair from mnemonics and path. The mnemonics must be normalized
   * and validated against the english wordlist.
   *
   * If path is none, it will default to m/54'/784'/0'/0/0, otherwise the path must
   * be compliant to BIP-32 in form m/54'/784'/{account_index}'/{change_index}/{address_index}.
   */
  static deriveKeypair(mnemonics, path) {
    if (path == null) {
      path = DEFAULT_SECP256K1_DERIVATION_PATH;
    }
    if (!isValidBIP32Path(path)) {
      throw new Error("Invalid derivation path");
    }
    const key = HDKey.fromMasterSeed(mnemonicToSeed(mnemonics)).derive(path);
    if (key.publicKey == null || key.privateKey == null) {
      throw new Error("Invalid key");
    }
    return new _Secp256k1Keypair({
      publicKey: key.publicKey,
      secretKey: key.privateKey
    });
  }
  export() {
    return {
      schema: "Secp256k1",
      privateKey: toB646(this.keypair.secretKey)
    };
  }
};

// src/cryptography/utils.ts
function toParsedSignaturePubkeyPair(serializedSignature) {
  const bytes = fromB646(serializedSignature);
  const signatureScheme = SIGNATURE_FLAG_TO_SCHEME[bytes[0]];
  if (signatureScheme === "MultiSig") {
    try {
      return decodeMultiSig(serializedSignature);
    } catch (e) {
      throw new Error("legacy multisig viewing unsupported");
    }
  }
  const SIGNATURE_SCHEME_TO_PUBLIC_KEY = {
    ED25519: Ed25519PublicKey,
    Secp256k1: Secp256k1PublicKey,
    Secp256r1: Secp256r1PublicKey
  };
  const PublicKey2 = SIGNATURE_SCHEME_TO_PUBLIC_KEY[signatureScheme];
  const signature = bytes.slice(1, bytes.length - PublicKey2.SIZE);
  const pubkeyBytes = bytes.slice(1 + signature.length);
  const pubKey = new PublicKey2(pubkeyBytes);
  return [
    {
      signatureScheme,
      signature,
      pubKey
    }
  ];
}
function toSingleSignaturePubkeyPair(serializedSignature) {
  const res = toParsedSignaturePubkeyPair(serializedSignature);
  if (res.length !== 1) {
    throw Error("Expected a single signature");
  }
  return res[0];
}
function publicKeyFromSerialized(schema, pubKey) {
  if (schema === "ED25519") {
    return new Ed25519PublicKey(pubKey);
  }
  if (schema === "Secp256k1") {
    return new Secp256k1PublicKey(pubKey);
  }
  throw new Error("Unknown public key schema");
}
function fromExportedKeypair(keypair) {
  const secretKey = fromB646(keypair.privateKey);
  switch (keypair.schema) {
    case "ED25519":
      let pureSecretKey = secretKey;
      if (secretKey.length === LEGACY_PRIVATE_KEY_SIZE) {
        pureSecretKey = secretKey.slice(0, PRIVATE_KEY_SIZE);
      }
      return Ed25519Keypair.fromSecretKey(pureSecretKey);
    case "Secp256k1":
      return Secp256k1Keypair.fromSecretKey(secretKey);
    default:
      throw new Error(`Invalid keypair schema ${keypair.schema}`);
  }
}

// src/types/checkpoints.ts
import {
  array,
  number,
  object,
  string,
  tuple,
  boolean,
  optional,
  any,
  nullable
} from "superstruct";
var GasCostSummary = object({
  computationCost: string(),
  storageCost: string(),
  storageRebate: string(),
  nonRefundableStorageFee: string()
});
var CheckPointContentsDigest = string();
var CheckpointDigest = string();
var ECMHLiveObjectSetDigest = object({
  digest: array(number())
});
var CheckpointCommitment = any();
var ValidatorSignature = string();
var EndOfEpochData = object({
  nextEpochCommittee: array(tuple([string(), string()])),
  nextEpochProtocolVersion: string(),
  epochCommitments: array(CheckpointCommitment)
});
var ExecutionDigests = object({
  transaction: string(),
  effects: string()
});
var Checkpoint = object({
  epoch: string(),
  sequenceNumber: string(),
  digest: string(),
  networkTotalTransactions: string(),
  previousDigest: optional(string()),
  epochRollingGasCostSummary: GasCostSummary,
  timestampMs: string(),
  endOfEpochData: optional(EndOfEpochData),
  validatorSignature: string(),
  transactions: array(string()),
  checkpointCommitments: array(CheckpointCommitment)
});
var CheckpointPage = object({
  data: array(Checkpoint),
  nextCursor: nullable(string()),
  hasNextPage: boolean()
});

// src/types/objects.ts
import {
  any as any2,
  array as array2,
  assign,
  boolean as boolean3,
  literal as literal2,
  number as number2,
  object as object3,
  optional as optional2,
  record as record2,
  string as string3,
  union as union2,
  is,
  nullable as nullable3,
  tuple as tuple2,
  unknown
} from "superstruct";

// src/types/common.ts
import { boolean as boolean2, define, literal, nullable as nullable2, object as object2, record, string as string2, union } from "superstruct";
var TransactionDigest = string2();
var TransactionEffectsDigest = string2();
var TransactionEventDigest = string2();
var ObjectId = string2();
var SuiAddress = string2();
var SequenceNumber = string2();
var ObjectOwner = union([
  object2({
    AddressOwner: string2()
  }),
  object2({
    ObjectOwner: string2()
  }),
  object2({
    Shared: object2({
      initial_shared_version: nullable2(string2())
    })
  }),
  literal("Immutable")
]);
var SuiJsonValue = define("SuiJsonValue", () => true);
var ProtocolConfigValue = union([
  object2({ u32: string2() }),
  object2({ u64: string2() }),
  object2({ f64: string2() })
]);
var ProtocolConfig = object2({
  attributes: record(string2(), nullable2(ProtocolConfigValue)),
  featureFlags: record(string2(), boolean2()),
  maxSupportedProtocolVersion: string2(),
  minSupportedProtocolVersion: string2(),
  protocolVersion: string2()
});

// src/types/objects.ts
var ObjectType = union2([string3(), literal2("package")]);
var SuiObjectRef = object3({
  /** Base64 string representing the object digest */
  digest: string3(),
  /** Hex code as string representing the object id */
  objectId: string3(),
  /** Object version */
  version: union2([number2(), string3()])
});
var SuiGasData = object3({
  payment: array2(SuiObjectRef),
  /** Gas Object's owner */
  owner: string3(),
  price: string3(),
  budget: string3()
});
var SuiObjectInfo = assign(
  SuiObjectRef,
  object3({
    type: string3(),
    owner: ObjectOwner,
    previousTransaction: string3()
  })
);
var ObjectContentFields = record2(string3(), any2());
var MovePackageContent = record2(string3(), unknown());
var SuiMoveObject = object3({
  /** Move type (e.g., "0x2::coin::Coin<0x2::sui::SUI>") */
  type: string3(),
  /** Fields and values stored inside the Move object */
  fields: ObjectContentFields,
  hasPublicTransfer: boolean3()
});
var SuiMovePackage = object3({
  /** A mapping from module name to disassembled Move bytecode */
  disassembled: MovePackageContent
});
var SuiParsedData = union2([
  assign(SuiMoveObject, object3({ dataType: literal2("moveObject") })),
  assign(SuiMovePackage, object3({ dataType: literal2("package") }))
]);
var SuiRawMoveObject = object3({
  /** Move type (e.g., "0x2::coin::Coin<0x2::sui::SUI>") */
  type: string3(),
  hasPublicTransfer: boolean3(),
  version: string3(),
  bcsBytes: string3()
});
var SuiRawMovePackage = object3({
  id: string3(),
  /** A mapping from module name to Move bytecode enocded in base64*/
  moduleMap: record2(string3(), string3())
});
var SuiRawData = union2([
  assign(SuiRawMoveObject, object3({ dataType: literal2("moveObject") })),
  assign(SuiRawMovePackage, object3({ dataType: literal2("package") }))
]);
var SUI_DECIMALS = 9;
var MIST_PER_SUI = BigInt(1e9);
var ObjectDigest = string3();
var SuiObjectResponseError = object3({
  code: string3(),
  error: optional2(string3()),
  object_id: optional2(string3()),
  parent_object_id: optional2(string3()),
  version: optional2(string3()),
  digest: optional2(string3())
});
var DisplayFieldsResponse = object3({
  data: nullable3(optional2(record2(string3(), string3()))),
  error: nullable3(optional2(SuiObjectResponseError))
});
var DisplayFieldsBackwardCompatibleResponse = union2([
  DisplayFieldsResponse,
  optional2(record2(string3(), string3()))
]);
var SuiObjectData = object3({
  objectId: string3(),
  version: string3(),
  digest: string3(),
  /**
   * Type of the object, default to be undefined unless SuiObjectDataOptions.showType is set to true
   */
  type: nullable3(optional2(string3())),
  /**
   * Move object content or package content, default to be undefined unless SuiObjectDataOptions.showContent is set to true
   */
  content: nullable3(optional2(SuiParsedData)),
  /**
   * Move object content or package content in BCS bytes, default to be undefined unless SuiObjectDataOptions.showBcs is set to true
   */
  bcs: nullable3(optional2(SuiRawData)),
  /**
   * The owner of this object. Default to be undefined unless SuiObjectDataOptions.showOwner is set to true
   */
  owner: nullable3(optional2(ObjectOwner)),
  /**
   * The digest of the transaction that created or last mutated this object.
   * Default to be undefined unless SuiObjectDataOptions.showPreviousTransaction is set to true
   */
  previousTransaction: nullable3(optional2(string3())),
  /**
   * The amount of SUI we would rebate if this object gets deleted.
   * This number is re-calculated each time the object is mutated based on
   * the present storage gas price.
   * Default to be undefined unless SuiObjectDataOptions.showStorageRebate is set to true
   */
  storageRebate: nullable3(optional2(string3())),
  /**
   * Display metadata for this object, default to be undefined unless SuiObjectDataOptions.showDisplay is set to true
   * This can also be None if the struct type does not have Display defined
   * See more details in https://forums.sui.io/t/nft-object-display-proposal/4872
   */
  display: nullable3(optional2(DisplayFieldsBackwardCompatibleResponse))
});
var SuiObjectDataOptions = object3({
  /* Whether to fetch the object type, default to be true */
  showType: nullable3(optional2(boolean3())),
  /* Whether to fetch the object content, default to be false */
  showContent: nullable3(optional2(boolean3())),
  /* Whether to fetch the object content in BCS bytes, default to be false */
  showBcs: nullable3(optional2(boolean3())),
  /* Whether to fetch the object owner, default to be false */
  showOwner: nullable3(optional2(boolean3())),
  /* Whether to fetch the previous transaction digest, default to be false */
  showPreviousTransaction: nullable3(optional2(boolean3())),
  /* Whether to fetch the storage rebate, default to be false */
  showStorageRebate: nullable3(optional2(boolean3())),
  /* Whether to fetch the display metadata, default to be false */
  showDisplay: nullable3(optional2(boolean3()))
});
var ObjectStatus = union2([literal2("Exists"), literal2("notExists"), literal2("Deleted")]);
var GetOwnedObjectsResponse = array2(SuiObjectInfo);
var SuiObjectResponse = object3({
  data: nullable3(optional2(SuiObjectData)),
  error: nullable3(optional2(SuiObjectResponseError))
});
function getSuiObjectData(resp) {
  return resp.data;
}
function getObjectDeletedResponse(resp) {
  if (resp.error && "object_id" in resp.error && "version" in resp.error && "digest" in resp.error) {
    const error = resp.error;
    return {
      objectId: error.object_id,
      version: error.version,
      digest: error.digest
    };
  }
  return void 0;
}
function getObjectNotExistsResponse(resp) {
  if (resp.error && "object_id" in resp.error && !("version" in resp.error) && !("digest" in resp.error)) {
    return resp.error.object_id;
  }
  return void 0;
}
function getObjectReference(resp) {
  if ("reference" in resp) {
    return resp.reference;
  }
  const exists = getSuiObjectData(resp);
  if (exists) {
    return {
      objectId: exists.objectId,
      version: exists.version,
      digest: exists.digest
    };
  }
  return getObjectDeletedResponse(resp);
}
function getObjectId(data) {
  if ("objectId" in data) {
    return data.objectId;
  }
  return getObjectReference(data)?.objectId ?? getObjectNotExistsResponse(data);
}
function getObjectVersion(data) {
  if ("version" in data) {
    return data.version;
  }
  return getObjectReference(data)?.version;
}
function isSuiObjectResponse(resp) {
  return resp.data !== void 0;
}
function getObjectType(resp) {
  const data = isSuiObjectResponse(resp) ? resp.data : resp;
  if (!data?.type && "data" in resp) {
    if (data?.content?.dataType === "package") {
      return "package";
    }
    return getMoveObjectType(resp);
  }
  return data?.type;
}
function getObjectPreviousTransactionDigest(resp) {
  return getSuiObjectData(resp)?.previousTransaction;
}
function getObjectOwner(resp) {
  if (is(resp, ObjectOwner)) {
    return resp;
  }
  return getSuiObjectData(resp)?.owner;
}
function getObjectDisplay(resp) {
  const display = getSuiObjectData(resp)?.display;
  if (!display) {
    return { data: null, error: null };
  }
  if (is(display, DisplayFieldsResponse)) {
    return display;
  }
  return {
    data: display,
    error: null
  };
}
function getSharedObjectInitialVersion(resp) {
  const owner = getObjectOwner(resp);
  if (owner && typeof owner === "object" && "Shared" in owner) {
    return owner.Shared.initial_shared_version;
  } else {
    return void 0;
  }
}
function isSharedObject(resp) {
  const owner = getObjectOwner(resp);
  return !!owner && typeof owner === "object" && "Shared" in owner;
}
function isImmutableObject(resp) {
  const owner = getObjectOwner(resp);
  return owner === "Immutable";
}
function getMoveObjectType(resp) {
  return getMoveObject(resp)?.type;
}
function getObjectFields(resp) {
  if ("fields" in resp) {
    return resp.fields;
  }
  return getMoveObject(resp)?.fields;
}
function isSuiObjectDataWithContent(data) {
  return data.content !== void 0;
}
function getMoveObject(data) {
  const suiObject = "data" in data ? getSuiObjectData(data) : data;
  if (!suiObject || !isSuiObjectDataWithContent(suiObject) || suiObject.content.dataType !== "moveObject") {
    return void 0;
  }
  return suiObject.content;
}
function hasPublicTransfer(data) {
  return getMoveObject(data)?.hasPublicTransfer ?? false;
}
function getMovePackageContent(data) {
  if ("disassembled" in data) {
    return data.disassembled;
  }
  const suiObject = getSuiObjectData(data);
  if (suiObject?.content?.dataType !== "package") {
    return void 0;
  }
  return suiObject.content.disassembled;
}
var CheckpointedObjectId = object3({
  objectId: string3(),
  atCheckpoint: optional2(number2())
});
var PaginatedObjectsResponse = object3({
  data: array2(SuiObjectResponse),
  nextCursor: optional2(nullable3(string3())),
  hasNextPage: boolean3()
});
var ObjectRead = union2([
  object3({
    details: SuiObjectData,
    status: literal2("VersionFound")
  }),
  object3({
    details: string3(),
    status: literal2("ObjectNotExists")
  }),
  object3({
    details: SuiObjectRef,
    status: literal2("ObjectDeleted")
  }),
  object3({
    details: tuple2([string3(), number2()]),
    status: literal2("VersionNotFound")
  }),
  object3({
    details: object3({
      asked_version: number2(),
      latest_version: number2(),
      object_id: string3()
    }),
    status: literal2("VersionTooHigh")
  })
]);

// src/types/transactions.ts
import {
  is as is2,
  array as array4,
  literal as literal3,
  number as number3,
  object as object5,
  optional as optional4,
  string as string5,
  union as union3,
  boolean as boolean5,
  tuple as tuple3,
  assign as assign2,
  nullable as nullable5
} from "superstruct";

// src/types/events.ts
import { object as object4, string as string4, array as array3, record as record3, any as any3, optional as optional3, boolean as boolean4, nullable as nullable4 } from "superstruct";
var EventId = object4({
  txDigest: string4(),
  eventSeq: string4()
});
var SuiEvent = object4({
  id: EventId,
  // Move package where this event was emitted.
  packageId: string4(),
  // Move module where this event was emitted.
  transactionModule: string4(),
  // Sender's Sui address.
  sender: string4(),
  // Move event type.
  type: string4(),
  // Parsed json value of the event
  parsedJson: optional3(record3(string4(), any3())),
  // Base 58 encoded bcs bytes of the move event
  bcs: optional3(string4()),
  timestampMs: optional3(string4())
});
var PaginatedEvents = object4({
  data: array3(SuiEvent),
  nextCursor: nullable4(EventId),
  hasNextPage: boolean4()
});
function getEventSender(event) {
  return event.sender;
}
function getEventPackage(event) {
  return event.packageId;
}

// src/types/transactions.ts
var EpochId = string5();
var SuiChangeEpoch = object5({
  epoch: string5(),
  storage_charge: string5(),
  computation_charge: string5(),
  storage_rebate: string5(),
  epoch_start_timestamp_ms: optional4(string5())
});
var SuiConsensusCommitPrologue = object5({
  epoch: string5(),
  round: string5(),
  commit_timestamp_ms: string5()
});
var Genesis = object5({
  objects: array4(string5())
});
var SuiArgument = union3([
  literal3("GasCoin"),
  object5({ Input: number3() }),
  object5({ Result: number3() }),
  object5({ NestedResult: tuple3([number3(), number3()]) })
]);
var MoveCallSuiTransaction = object5({
  arguments: optional4(array4(SuiArgument)),
  type_arguments: optional4(array4(string5())),
  package: string5(),
  module: string5(),
  function: string5()
});
var SuiTransaction = union3([
  object5({ MoveCall: MoveCallSuiTransaction }),
  object5({ TransferObjects: tuple3([array4(SuiArgument), SuiArgument]) }),
  object5({ SplitCoins: tuple3([SuiArgument, array4(SuiArgument)]) }),
  object5({ MergeCoins: tuple3([SuiArgument, array4(SuiArgument)]) }),
  object5({
    Publish: union3([
      // TODO: Remove this after 0.34 is released:
      tuple3([SuiMovePackage, array4(string5())]),
      array4(string5())
    ])
  }),
  object5({
    Upgrade: union3([
      // TODO: Remove this after 0.34 is released:
      tuple3([SuiMovePackage, array4(string5()), string5(), SuiArgument]),
      tuple3([array4(string5()), string5(), SuiArgument])
    ])
  }),
  object5({ MakeMoveVec: tuple3([nullable5(string5()), array4(SuiArgument)]) })
]);
var SuiCallArg = union3([
  object5({
    type: literal3("pure"),
    valueType: nullable5(string5()),
    value: SuiJsonValue
  }),
  object5({
    type: literal3("object"),
    objectType: literal3("immOrOwnedObject"),
    objectId: string5(),
    version: string5(),
    digest: string5()
  }),
  object5({
    type: literal3("object"),
    objectType: literal3("sharedObject"),
    objectId: string5(),
    initialSharedVersion: string5(),
    mutable: boolean5()
  })
]);
var ProgrammableTransaction = object5({
  transactions: array4(SuiTransaction),
  inputs: array4(SuiCallArg)
});
var SuiTransactionBlockKind = union3([
  assign2(SuiChangeEpoch, object5({ kind: literal3("ChangeEpoch") })),
  assign2(
    SuiConsensusCommitPrologue,
    object5({
      kind: literal3("ConsensusCommitPrologue")
    })
  ),
  assign2(Genesis, object5({ kind: literal3("Genesis") })),
  assign2(ProgrammableTransaction, object5({ kind: literal3("ProgrammableTransaction") }))
]);
var SuiTransactionBlockData = object5({
  // Eventually this will become union(literal('v1'), literal('v2'), ...)
  messageVersion: literal3("v1"),
  transaction: SuiTransactionBlockKind,
  sender: string5(),
  gasData: SuiGasData
});
var AuthoritySignature = string5();
var GenericAuthoritySignature = union3([string5(), array4(string5())]);
var AuthorityQuorumSignInfo = object5({
  epoch: string5(),
  signature: GenericAuthoritySignature,
  signers_map: array4(number3())
});
var GasCostSummary2 = object5({
  computationCost: string5(),
  storageCost: string5(),
  storageRebate: string5(),
  nonRefundableStorageFee: string5()
});
var ExecutionStatusType = union3([literal3("success"), literal3("failure")]);
var ExecutionStatus = object5({
  status: ExecutionStatusType,
  error: optional4(string5())
});
var OwnedObjectRef = object5({
  owner: ObjectOwner,
  reference: SuiObjectRef
});
var TransactionEffectsModifiedAtVersions = object5({
  objectId: string5(),
  sequenceNumber: string5()
});
var TransactionEffects = object5({
  // Eventually this will become union(literal('v1'), literal('v2'), ...)
  messageVersion: literal3("v1"),
  /** The status of the execution */
  status: ExecutionStatus,
  /** The epoch when this transaction was executed */
  executedEpoch: string5(),
  /** The version that every modified (mutated or deleted) object had before it was modified by this transaction. **/
  modifiedAtVersions: optional4(array4(TransactionEffectsModifiedAtVersions)),
  gasUsed: GasCostSummary2,
  /** The object references of the shared objects used in this transaction. Empty if no shared objects were used. */
  sharedObjects: optional4(array4(SuiObjectRef)),
  /** The transaction digest */
  transactionDigest: string5(),
  /** ObjectRef and owner of new objects created */
  created: optional4(array4(OwnedObjectRef)),
  /** ObjectRef and owner of mutated objects, including gas object */
  mutated: optional4(array4(OwnedObjectRef)),
  /**
   * ObjectRef and owner of objects that are unwrapped in this transaction.
   * Unwrapped objects are objects that were wrapped into other objects in the past,
   * and just got extracted out.
   */
  unwrapped: optional4(array4(OwnedObjectRef)),
  /** Object Refs of objects now deleted (the old refs) */
  deleted: optional4(array4(SuiObjectRef)),
  /** Object Refs of objects now deleted (the old refs) */
  unwrappedThenDeleted: optional4(array4(SuiObjectRef)),
  /** Object refs of objects now wrapped in other objects */
  wrapped: optional4(array4(SuiObjectRef)),
  /**
   * The updated gas object reference. Have a dedicated field for convenient access.
   * It's also included in mutated.
   */
  gasObject: OwnedObjectRef,
  /** The events emitted during execution. Note that only successful transactions emit events */
  eventsDigest: nullable5(optional4(string5())),
  /** The set of transaction digests this transaction depends on */
  dependencies: optional4(array4(string5()))
});
var TransactionEvents = array4(SuiEvent);
var ReturnValueType = tuple3([array4(number3()), string5()]);
var MutableReferenceOutputType = tuple3([SuiArgument, array4(number3()), string5()]);
var ExecutionResultType = object5({
  mutableReferenceOutputs: optional4(array4(MutableReferenceOutputType)),
  returnValues: optional4(array4(ReturnValueType))
});
var DevInspectResults = object5({
  effects: TransactionEffects,
  events: TransactionEvents,
  results: optional4(array4(ExecutionResultType)),
  error: optional4(string5())
});
var AuthorityName = string5();
var SuiTransactionBlock = object5({
  data: SuiTransactionBlockData,
  txSignatures: array4(string5())
});
var SuiObjectChangePublished = object5({
  type: literal3("published"),
  packageId: string5(),
  version: string5(),
  digest: string5(),
  modules: array4(string5())
});
var SuiObjectChangeTransferred = object5({
  type: literal3("transferred"),
  sender: string5(),
  recipient: ObjectOwner,
  objectType: string5(),
  objectId: string5(),
  version: string5(),
  digest: string5()
});
var SuiObjectChangeMutated = object5({
  type: literal3("mutated"),
  sender: string5(),
  owner: ObjectOwner,
  objectType: string5(),
  objectId: string5(),
  version: string5(),
  previousVersion: string5(),
  digest: string5()
});
var SuiObjectChangeDeleted = object5({
  type: literal3("deleted"),
  sender: string5(),
  objectType: string5(),
  objectId: string5(),
  version: string5()
});
var SuiObjectChangeWrapped = object5({
  type: literal3("wrapped"),
  sender: string5(),
  objectType: string5(),
  objectId: string5(),
  version: string5()
});
var SuiObjectChangeCreated = object5({
  type: literal3("created"),
  sender: string5(),
  owner: ObjectOwner,
  objectType: string5(),
  objectId: string5(),
  version: string5(),
  digest: string5()
});
var SuiObjectChange = union3([
  SuiObjectChangePublished,
  SuiObjectChangeTransferred,
  SuiObjectChangeMutated,
  SuiObjectChangeDeleted,
  SuiObjectChangeWrapped,
  SuiObjectChangeCreated
]);
var BalanceChange = object5({
  owner: ObjectOwner,
  coinType: string5(),
  /* Coin balance change(positive means receive, negative means send) */
  amount: string5()
});
var SuiTransactionBlockResponse = object5({
  digest: string5(),
  transaction: optional4(SuiTransactionBlock),
  effects: optional4(TransactionEffects),
  events: optional4(TransactionEvents),
  timestampMs: optional4(string5()),
  checkpoint: optional4(string5()),
  confirmedLocalExecution: optional4(boolean5()),
  objectChanges: optional4(array4(SuiObjectChange)),
  balanceChanges: optional4(array4(BalanceChange)),
  /* Errors that occurred in fetching/serializing the transaction. */
  errors: optional4(array4(string5()))
});
var SuiTransactionBlockResponseOptions = object5({
  /* Whether to show transaction input data. Default to be false. */
  showInput: optional4(boolean5()),
  /* Whether to show transaction effects. Default to be false. */
  showEffects: optional4(boolean5()),
  /* Whether to show transaction events. Default to be false. */
  showEvents: optional4(boolean5()),
  /* Whether to show object changes. Default to be false. */
  showObjectChanges: optional4(boolean5()),
  /* Whether to show coin balance changes. Default to be false. */
  showBalanceChanges: optional4(boolean5())
});
var PaginatedTransactionResponse = object5({
  data: array4(SuiTransactionBlockResponse),
  nextCursor: nullable5(string5()),
  hasNextPage: boolean5()
});
var DryRunTransactionBlockResponse = object5({
  effects: TransactionEffects,
  events: TransactionEvents,
  objectChanges: array4(SuiObjectChange),
  balanceChanges: array4(BalanceChange),
  // TODO: Remove optional when this is rolled out to all networks:
  input: optional4(SuiTransactionBlockData)
});
function getTransaction(tx) {
  return tx.transaction;
}
function getTransactionDigest(tx) {
  return tx.digest;
}
function getTransactionSignature(tx) {
  return tx.transaction?.txSignatures;
}
function getTransactionSender(tx) {
  return tx.transaction?.data.sender;
}
function getGasData(tx) {
  return tx.transaction?.data.gasData;
}
function getTransactionGasObject(tx) {
  return getGasData(tx)?.payment;
}
function getTransactionGasPrice(tx) {
  return getGasData(tx)?.price;
}
function getTransactionGasBudget(tx) {
  return getGasData(tx)?.budget;
}
function getChangeEpochTransaction(data) {
  return data.kind === "ChangeEpoch" ? data : void 0;
}
function getConsensusCommitPrologueTransaction(data) {
  return data.kind === "ConsensusCommitPrologue" ? data : void 0;
}
function getTransactionKind(data) {
  return data.transaction?.data.transaction;
}
function getTransactionKindName(data) {
  return data.kind;
}
function getProgrammableTransaction(data) {
  return data.kind === "ProgrammableTransaction" ? data : void 0;
}
function getExecutionStatusType(data) {
  return getExecutionStatus(data)?.status;
}
function getExecutionStatus(data) {
  return getTransactionEffects(data)?.status;
}
function getExecutionStatusError(data) {
  return getExecutionStatus(data)?.error;
}
function getExecutionStatusGasSummary(data) {
  if (is2(data, TransactionEffects)) {
    return data.gasUsed;
  }
  return getTransactionEffects(data)?.gasUsed;
}
function getTotalGasUsed(data) {
  const gasSummary = getExecutionStatusGasSummary(data);
  return gasSummary ? BigInt(gasSummary.computationCost) + BigInt(gasSummary.storageCost) - BigInt(gasSummary.storageRebate) : void 0;
}
function getTotalGasUsedUpperBound(data) {
  const gasSummary = getExecutionStatusGasSummary(data);
  return gasSummary ? BigInt(gasSummary.computationCost) + BigInt(gasSummary.storageCost) : void 0;
}
function getTransactionEffects(data) {
  return data.effects;
}
function getEvents(data) {
  return data.events;
}
function getCreatedObjects(data) {
  return getTransactionEffects(data)?.created;
}
function getTimestampFromTransactionResponse(data) {
  return data.timestampMs ?? void 0;
}
function getNewlyCreatedCoinRefsAfterSplit(data) {
  return getTransactionEffects(data)?.created?.map((c) => c.reference);
}
function getObjectChanges(data) {
  return data.objectChanges;
}
function getPublishedObjectChanges(data) {
  return data.objectChanges?.filter(
    (a) => is2(a, SuiObjectChangePublished)
  ) ?? [];
}

// src/types/normalized.ts
import {
  array as array5,
  object as object6,
  string as string6,
  union as union4,
  boolean as boolean6,
  define as define2,
  number as number4,
  literal as literal4,
  record as record4,
  is as is3,
  tuple as tuple4
} from "superstruct";
var SuiMoveFunctionArgType = union4([string6(), object6({ Object: string6() })]);
var SuiMoveFunctionArgTypes = array5(SuiMoveFunctionArgType);
var SuiMoveModuleId = object6({
  address: string6(),
  name: string6()
});
var SuiMoveVisibility = union4([literal4("Private"), literal4("Public"), literal4("Friend")]);
var SuiMoveAbilitySet = object6({
  abilities: array5(string6())
});
var SuiMoveStructTypeParameter = object6({
  constraints: SuiMoveAbilitySet,
  isPhantom: boolean6()
});
var SuiMoveNormalizedTypeParameterType = object6({
  TypeParameter: number4()
});
var MoveCallMetric = tuple4([
  object6({
    module: string6(),
    package: string6(),
    function: string6()
  }),
  string6()
]);
var MoveCallMetrics = object6({
  rank3Days: array5(MoveCallMetric),
  rank7Days: array5(MoveCallMetric),
  rank30Days: array5(MoveCallMetric)
});
function isSuiMoveNormalizedType(value) {
  if (!value)
    return false;
  if (typeof value === "string")
    return true;
  if (is3(value, SuiMoveNormalizedTypeParameterType))
    return true;
  if (isSuiMoveNormalizedStructType(value))
    return true;
  if (typeof value !== "object")
    return false;
  const valueProperties = value;
  if (is3(valueProperties.Reference, SuiMoveNormalizedType))
    return true;
  if (is3(valueProperties.MutableReference, SuiMoveNormalizedType))
    return true;
  if (is3(valueProperties.Vector, SuiMoveNormalizedType))
    return true;
  return false;
}
var SuiMoveNormalizedType = define2(
  "SuiMoveNormalizedType",
  isSuiMoveNormalizedType
);
function isSuiMoveNormalizedStructType(value) {
  if (!value || typeof value !== "object")
    return false;
  const valueProperties = value;
  if (!valueProperties.Struct || typeof valueProperties.Struct !== "object")
    return false;
  const structProperties = valueProperties.Struct;
  if (typeof structProperties.address !== "string" || typeof structProperties.module !== "string" || typeof structProperties.name !== "string" || !Array.isArray(structProperties.typeArguments) || !structProperties.typeArguments.every((value2) => isSuiMoveNormalizedType(value2))) {
    return false;
  }
  return true;
}
var SuiMoveNormalizedStructType = define2(
  "SuiMoveNormalizedStructType",
  isSuiMoveNormalizedStructType
);
var SuiMoveNormalizedFunction = object6({
  visibility: SuiMoveVisibility,
  isEntry: boolean6(),
  typeParameters: array5(SuiMoveAbilitySet),
  parameters: array5(SuiMoveNormalizedType),
  return: array5(SuiMoveNormalizedType)
});
var SuiMoveNormalizedField = object6({
  name: string6(),
  type: SuiMoveNormalizedType
});
var SuiMoveNormalizedStruct = object6({
  abilities: SuiMoveAbilitySet,
  typeParameters: array5(SuiMoveStructTypeParameter),
  fields: array5(SuiMoveNormalizedField)
});
var SuiMoveNormalizedModule = object6({
  fileFormatVersion: number4(),
  address: string6(),
  name: string6(),
  friends: array5(SuiMoveModuleId),
  structs: record4(string6(), SuiMoveNormalizedStruct),
  exposedFunctions: record4(string6(), SuiMoveNormalizedFunction)
});
var SuiMoveNormalizedModules = record4(string6(), SuiMoveNormalizedModule);
function extractMutableReference(normalizedType) {
  return typeof normalizedType === "object" && "MutableReference" in normalizedType ? normalizedType.MutableReference : void 0;
}
function extractReference(normalizedType) {
  return typeof normalizedType === "object" && "Reference" in normalizedType ? normalizedType.Reference : void 0;
}
function extractStructTag(normalizedType) {
  if (typeof normalizedType === "object" && "Struct" in normalizedType) {
    return normalizedType;
  }
  const ref = extractReference(normalizedType);
  const mutRef = extractMutableReference(normalizedType);
  if (typeof ref === "object" && "Struct" in ref) {
    return ref;
  }
  if (typeof mutRef === "object" && "Struct" in mutRef) {
    return mutRef;
  }
  return void 0;
}

// src/types/validator.ts
import {
  array as array6,
  boolean as boolean7,
  literal as literal5,
  number as number5,
  object as object7,
  string as string7,
  union as union5,
  nullable as nullable6,
  tuple as tuple5,
  optional as optional5
} from "superstruct";
var Apy = object7({
  apy: number5(),
  address: string7()
});
var ValidatorsApy = object7({
  epoch: string7(),
  apys: array6(Apy)
});
var Balance = object7({
  value: number5()
});
var StakeObject = object7({
  stakedSuiId: string7(),
  stakeRequestEpoch: string7(),
  stakeActiveEpoch: string7(),
  principal: string7(),
  status: union5([literal5("Active"), literal5("Pending"), literal5("Unstaked")]),
  estimatedReward: optional5(string7())
});
var DelegatedStake = object7({
  validatorAddress: string7(),
  stakingPool: string7(),
  stakes: array6(StakeObject)
});
var StakeSubsidyFields = object7({
  balance: object7({ value: number5() }),
  distribution_counter: number5(),
  current_distribution_amount: number5(),
  stake_subsidy_period_length: number5(),
  stake_subsidy_decrease_rate: number5()
});
var StakeSubsidy = object7({
  type: string7(),
  fields: StakeSubsidyFields
});
var SuiSupplyFields = object7({
  value: number5()
});
var ContentsFields = object7({
  id: string7(),
  size: number5(),
  head: object7({ vec: array6() }),
  tail: object7({ vec: array6() })
});
var ContentsFieldsWithdraw = object7({
  id: string7(),
  size: number5()
});
var Contents = object7({
  type: string7(),
  fields: ContentsFields
});
var DelegationStakingPoolFields = object7({
  exchangeRates: object7({
    id: string7(),
    size: number5()
  }),
  id: string7(),
  pendingStake: number5(),
  pendingPoolTokenWithdraw: number5(),
  pendingTotalSuiWithdraw: number5(),
  poolTokenBalance: number5(),
  rewardsPool: object7({ value: number5() }),
  activationEpoch: object7({ vec: array6() }),
  deactivationEpoch: object7({ vec: array6() }),
  suiBalance: number5()
});
var DelegationStakingPool = object7({
  type: string7(),
  fields: DelegationStakingPoolFields
});
var Validators = array6(tuple5([string7(), string7()]));
var CommitteeInfo = object7({
  epoch: string7(),
  /** Array of (validator public key, stake unit) tuple */
  validators: Validators
});
var SuiValidatorSummary = object7({
  suiAddress: string7(),
  protocolPubkeyBytes: string7(),
  networkPubkeyBytes: string7(),
  workerPubkeyBytes: string7(),
  proofOfPossessionBytes: string7(),
  operationCapId: string7(),
  name: string7(),
  description: string7(),
  imageUrl: string7(),
  projectUrl: string7(),
  p2pAddress: string7(),
  netAddress: string7(),
  primaryAddress: string7(),
  workerAddress: string7(),
  nextEpochProtocolPubkeyBytes: nullable6(string7()),
  nextEpochProofOfPossession: nullable6(string7()),
  nextEpochNetworkPubkeyBytes: nullable6(string7()),
  nextEpochWorkerPubkeyBytes: nullable6(string7()),
  nextEpochNetAddress: nullable6(string7()),
  nextEpochP2pAddress: nullable6(string7()),
  nextEpochPrimaryAddress: nullable6(string7()),
  nextEpochWorkerAddress: nullable6(string7()),
  votingPower: string7(),
  gasPrice: string7(),
  commissionRate: string7(),
  nextEpochStake: string7(),
  nextEpochGasPrice: string7(),
  nextEpochCommissionRate: string7(),
  stakingPoolId: string7(),
  stakingPoolActivationEpoch: nullable6(string7()),
  stakingPoolDeactivationEpoch: nullable6(string7()),
  stakingPoolSuiBalance: string7(),
  rewardsPool: string7(),
  poolTokenBalance: string7(),
  pendingStake: string7(),
  pendingPoolTokenWithdraw: string7(),
  pendingTotalSuiWithdraw: string7(),
  exchangeRatesId: string7(),
  exchangeRatesSize: string7()
});
var SuiSystemStateSummary = object7({
  epoch: string7(),
  protocolVersion: string7(),
  systemStateVersion: string7(),
  storageFundTotalObjectStorageRebates: string7(),
  storageFundNonRefundableBalance: string7(),
  referenceGasPrice: string7(),
  safeMode: boolean7(),
  safeModeStorageRewards: string7(),
  safeModeComputationRewards: string7(),
  safeModeStorageRebates: string7(),
  safeModeNonRefundableStorageFee: string7(),
  epochStartTimestampMs: string7(),
  epochDurationMs: string7(),
  stakeSubsidyStartEpoch: string7(),
  maxValidatorCount: string7(),
  minValidatorJoiningStake: string7(),
  validatorLowStakeThreshold: string7(),
  validatorVeryLowStakeThreshold: string7(),
  validatorLowStakeGracePeriod: string7(),
  stakeSubsidyBalance: string7(),
  stakeSubsidyDistributionCounter: string7(),
  stakeSubsidyCurrentDistributionAmount: string7(),
  stakeSubsidyPeriodLength: string7(),
  stakeSubsidyDecreaseRate: number5(),
  totalStake: string7(),
  activeValidators: array6(SuiValidatorSummary),
  pendingActiveValidatorsId: string7(),
  pendingActiveValidatorsSize: string7(),
  pendingRemovals: array6(string7()),
  stakingPoolMappingsId: string7(),
  stakingPoolMappingsSize: string7(),
  inactivePoolsId: string7(),
  inactivePoolsSize: string7(),
  validatorCandidatesId: string7(),
  validatorCandidatesSize: string7(),
  atRiskValidators: array6(tuple5([string7(), string7()])),
  validatorReportRecords: array6(tuple5([string7(), array6(string7())]))
});

// src/types/coin.ts
import { array as array7, boolean as boolean8, nullable as nullable7, number as number6, object as object8, optional as optional6, string as string8 } from "superstruct";
var CoinStruct = object8({
  coinType: string8(),
  // TODO(chris): rename this to objectId
  coinObjectId: string8(),
  version: string8(),
  digest: string8(),
  balance: string8(),
  previousTransaction: string8()
});
var PaginatedCoins = object8({
  data: array7(CoinStruct),
  nextCursor: nullable7(string8()),
  hasNextPage: boolean8()
});
var CoinBalance = object8({
  coinType: string8(),
  coinObjectCount: number6(),
  totalBalance: string8(),
  lockedBalance: object8({
    epochId: optional6(number6()),
    number: optional6(number6())
  })
});
var CoinSupply = object8({
  value: string8()
});

// src/types/epochs.ts
import { array as array8, boolean as boolean9, nullable as nullable8, number as number7, object as object9, string as string9 } from "superstruct";
var EndOfEpochInfo = object9({
  lastCheckpointId: string9(),
  epochEndTimestamp: string9(),
  protocolVersion: string9(),
  referenceGasPrice: string9(),
  totalStake: string9(),
  storageFundReinvestment: string9(),
  storageCharge: string9(),
  storageRebate: string9(),
  storageFundBalance: string9(),
  stakeSubsidyAmount: string9(),
  totalGasFees: string9(),
  totalStakeRewardsDistributed: string9(),
  leftoverStorageFundInflow: string9()
});
var EpochInfo = object9({
  epoch: string9(),
  validators: array8(SuiValidatorSummary),
  epochTotalTransactions: string9(),
  firstCheckpointId: string9(),
  epochStartTimestamp: string9(),
  endOfEpochInfo: nullable8(EndOfEpochInfo),
  referenceGasPrice: nullable8(number7())
});
var EpochPage = object9({
  data: array8(EpochInfo),
  nextCursor: nullable8(string9()),
  hasNextPage: boolean9()
});

// src/types/name-service.ts
import { array as array9, boolean as boolean10, nullable as nullable9, object as object10, string as string10 } from "superstruct";
var ResolvedNameServiceNames = object10({
  data: array9(string10()),
  hasNextPage: boolean10(),
  nextCursor: nullable9(string10())
});

// src/types/dynamic_fields.ts
import { any as any4, array as array10, boolean as boolean11, literal as literal6, nullable as nullable10, number as number8, object as object11, string as string11, union as union6 } from "superstruct";
var DynamicFieldType = union6([literal6("DynamicField"), literal6("DynamicObject")]);
var DynamicFieldName = object11({
  type: string11(),
  value: any4()
});
var DynamicFieldInfo = object11({
  name: DynamicFieldName,
  bcsName: string11(),
  type: DynamicFieldType,
  objectType: string11(),
  objectId: string11(),
  version: number8(),
  digest: string11()
});
var DynamicFieldPage = object11({
  data: array10(DynamicFieldInfo),
  nextCursor: nullable10(string11()),
  hasNextPage: boolean11()
});

// src/types/metrics.ts
import { array as array11, number as number9, object as object12, string as string12 } from "superstruct";
var NetworkMetrics = object12({
  currentTps: number9(),
  tps30Days: number9(),
  currentCheckpoint: string12(),
  currentEpoch: string12(),
  totalAddresses: string12(),
  totalObjects: string12(),
  totalPackages: string12()
});
var AddressMetrics = object12({
  checkpoint: number9(),
  epoch: number9(),
  timestampMs: number9(),
  cumulativeAddresses: number9(),
  cumulativeActiveAddresses: number9(),
  dailyActiveAddresses: number9()
});
var AllEpochsAddressMetrics = array11(AddressMetrics);

// src/keypairs/secp256r1/keypair.ts
import { sha256 as sha2564 } from "@noble/hashes/sha256";
import { secp256r1 as secp256r12 } from "@noble/curves/p256";
import { HDKey as HDKey2 } from "@scure/bip32";
import { toB64 as toB647 } from "@mysten/bcs";
import { bytesToHex as bytesToHex4 } from "@noble/hashes/utils";
import { blake2b as blake2b5 } from "@noble/hashes/blake2b";
var DEFAULT_SECP256R1_DERIVATION_PATH = "m/74'/784'/0'/0/0";
var Secp256r1Keypair = class _Secp256r1Keypair extends Keypair {
  /**
   * Create a new keypair instance.
   * Generate random keypair if no {@link Secp256r1Keypair} is provided.
   *
   * @param keypair Secp256r1 keypair
   */
  constructor(keypair) {
    super();
    if (keypair) {
      this.keypair = keypair;
    } else {
      const secretKey = secp256r12.utils.randomPrivateKey();
      const publicKey = secp256r12.getPublicKey(secretKey, true);
      this.keypair = { publicKey, secretKey };
    }
  }
  /**
   * Get the key scheme of the keypair Secp256r1
   */
  getKeyScheme() {
    return "Secp256r1";
  }
  /**
   * Generate a new random keypair
   */
  static generate() {
    return new _Secp256r1Keypair();
  }
  /**
   * Create a keypair from a raw secret key byte array.
   *
   * This method should only be used to recreate a keypair from a previously
   * generated secret key. Generating keypairs from a random seed should be done
   * with the {@link Keypair.fromSeed} method.
   *
   * @throws error if the provided secret key is invalid and validation is not skipped.
   *
   * @param secretKey secret key byte array
   * @param options: skip secret key validation
   */
  static fromSecretKey(secretKey, options) {
    const publicKey = secp256r12.getPublicKey(secretKey, true);
    if (!options || !options.skipValidation) {
      const encoder = new TextEncoder();
      const signData = encoder.encode("sui validation");
      const msgHash = bytesToHex4(blake2b5(signData, { dkLen: 32 }));
      const signature = secp256r12.sign(msgHash, secretKey, { lowS: true });
      if (!secp256r12.verify(signature, msgHash, publicKey, { lowS: true })) {
        throw new Error("Provided secretKey is invalid");
      }
    }
    return new _Secp256r1Keypair({ publicKey, secretKey });
  }
  /**
   * Generate a keypair from a 32 byte seed.
   *
   * @param seed seed byte array
   */
  static fromSeed(seed) {
    let publicKey = secp256r12.getPublicKey(seed, true);
    return new _Secp256r1Keypair({ publicKey, secretKey: seed });
  }
  /**
   * The public key for this keypair
   */
  getPublicKey() {
    return new Secp256r1PublicKey(this.keypair.publicKey);
  }
  async sign(data) {
    return this.signData(data);
  }
  /**
   * Return the signature for the provided data.
   */
  signData(data) {
    const msgHash = sha2564(data);
    const sig = secp256r12.sign(msgHash, this.keypair.secretKey, {
      lowS: true
    });
    return sig.toCompactRawBytes();
  }
  /**
   * Derive Secp256r1 keypair from mnemonics and path. The mnemonics must be normalized
   * and validated against the english wordlist.
   *
   * If path is none, it will default to m/74'/784'/0'/0/0, otherwise the path must
   * be compliant to BIP-32 in form m/74'/784'/{account_index}'/{change_index}/{address_index}.
   */
  static deriveKeypair(mnemonics, path) {
    if (path == null) {
      path = DEFAULT_SECP256R1_DERIVATION_PATH;
    }
    if (!isValidBIP32Path(path)) {
      throw new Error("Invalid derivation path");
    }
    const privateKey = HDKey2.fromMasterSeed(mnemonicToSeed(mnemonics)).derive(path).privateKey;
    return _Secp256r1Keypair.fromSecretKey(privateKey);
  }
  export() {
    return {
      schema: "Secp256r1",
      privateKey: toB647(this.keypair.secretKey)
    };
  }
};

// src/rpc/client.ts
import { RequestManager, HTTPTransport, Client } from "@open-rpc/client-js";
import "superstruct";

// src/version.ts
var PACKAGE_VERSION = "0.40.0";
var TARGETED_RPC_VERSION = "1.8.0";

// src/rpc/errors.ts
var RPCValidationError = class extends Error {
  constructor(options) {
    super(
      "RPC Validation Error: The response returned from RPC server does not match the TypeScript definition. This is likely because the SDK version is not compatible with the RPC server.",
      { cause: options.cause }
    );
    this.req = options.req;
    this.result = options.result;
    this.message = this.toString();
  }
  toString() {
    let str = super.toString();
    if (this.cause) {
      str += `
Cause: ${this.cause}`;
    }
    if (this.result) {
      str += `
Reponse Received: ${JSON.stringify(this.result, null, 2)}`;
    }
    return str;
  }
};

// src/rpc/client.ts
var JsonRpcClient = class {
  constructor(url, httpHeaders) {
    const transport = new HTTPTransport(url, {
      headers: {
        "Content-Type": "application/json",
        "Client-Sdk-Type": "typescript",
        "Client-Sdk-Version": PACKAGE_VERSION,
        "Client-Target-Api-Version": TARGETED_RPC_VERSION,
        ...httpHeaders
      }
    });
    this.rpcClient = new Client(new RequestManager([transport]));
  }
  async requestWithType(method, args, struct) {
    const req = { method, args };
    const response = await this.request(method, args);
    if (false) {
      const [err] = validate(response, struct);
      if (err) {
        throw new RPCValidationError2({
          req,
          result: response,
          cause: err
        });
      }
    }
    return response;
  }
  async request(method, params) {
    return await this.rpcClient.request({ method, params });
  }
};

// src/rpc/websocket-client.ts
import { RequestManager as RequestManager2, Client as Client2, WebSocketTransport } from "@open-rpc/client-js";
var getWebsocketUrl = (httpUrl, port) => {
  const url = new URL(httpUrl);
  url.protocol = url.protocol.replace("http", "ws");
  if (port) {
    url.port = port.toString();
  }
  return url.toString();
};
var DEFAULT_CLIENT_OPTIONS = {
  callTimeout: 3e4,
  reconnectTimeout: 3e3,
  maxReconnects: 5
};
var _client, _subscriptions, _disconnects, _setupClient, setupClient_fn, _reconnect, reconnect_fn;
var WebsocketClient = class {
  constructor(endpoint, options = DEFAULT_CLIENT_OPTIONS) {
    this.endpoint = endpoint;
    this.options = options;
    __privateAdd(this, _setupClient);
    __privateAdd(this, _reconnect);
    __privateAdd(this, _client, void 0);
    __privateAdd(this, _subscriptions, void 0);
    __privateAdd(this, _disconnects, void 0);
    if (this.endpoint.startsWith("http")) {
      this.endpoint = getWebsocketUrl(this.endpoint);
    }
    __privateSet(this, _client, null);
    __privateSet(this, _subscriptions, /* @__PURE__ */ new Map());
    __privateSet(this, _disconnects, 0);
  }
  async request(input) {
    const client = __privateMethod(this, _setupClient, setupClient_fn).call(this);
    const id = await client.request(
      { method: input.method, params: input.params },
      this.options.callTimeout
    );
    const initialId = input.initialId || id;
    __privateGet(this, _subscriptions).set(initialId, {
      ...input,
      // Always set the latest actual subscription ID:
      id,
      initialId
    });
    return async () => {
      const client2 = __privateMethod(this, _setupClient, setupClient_fn).call(this);
      const subscription = __privateGet(this, _subscriptions).get(initialId);
      if (!subscription)
        return false;
      __privateGet(this, _subscriptions).delete(initialId);
      return client2.request(
        { method: input.unsubscribe, params: [subscription.id] },
        this.options.callTimeout
      );
    };
  }
};
_client = new WeakMap();
_subscriptions = new WeakMap();
_disconnects = new WeakMap();
_setupClient = new WeakSet();
setupClient_fn = function() {
  if (__privateGet(this, _client)) {
    return __privateGet(this, _client);
  }
  const transport = new WebSocketTransport(this.endpoint);
  const requestManager = new RequestManager2([transport]);
  __privateSet(this, _client, new Client2(requestManager));
  transport.connection.addEventListener("open", () => {
    __privateSet(this, _disconnects, 0);
  });
  transport.connection.addEventListener("close", () => {
    __privateWrapper(this, _disconnects)._++;
    if (__privateGet(this, _disconnects) <= this.options.maxReconnects) {
      setTimeout(() => {
        __privateMethod(this, _reconnect, reconnect_fn).call(this);
      }, this.options.reconnectTimeout);
    }
  });
  __privateGet(this, _client).onNotification((data) => {
    const params = data.params;
    __privateGet(this, _subscriptions).forEach((subscription) => {
      if (subscription.method === data.method && params.subscription === subscription.id) {
        subscription.onMessage(params.result);
      }
    });
  });
  return __privateGet(this, _client);
};
_reconnect = new WeakSet();
reconnect_fn = function() {
  __privateGet(this, _client)?.close();
  __privateSet(this, _client, null);
  __privateGet(this, _subscriptions).forEach((subscription) => this.request(subscription));
};

// src/providers/json-rpc-provider.ts
import { any as any6, array as array15, string as string17, nullable as nullable13 } from "superstruct";
import { fromB58 as fromB582, toB64 as toB648, toHEX as toHEX2 } from "@mysten/bcs";

// src/rpc/connection.ts
var _options;
var Connection = class {
  constructor(options) {
    __privateAdd(this, _options, void 0);
    __privateSet(this, _options, options);
  }
  get fullnode() {
    return __privateGet(this, _options).fullnode;
  }
  // TODO: Decide if we should default the websocket URL like this:
  get websocket() {
    return __privateGet(this, _options).websocket || __privateGet(this, _options).fullnode;
  }
  /** @deprecated Use the new faucet APIs from `@mysten/sui.js/faucet` instead. */
  get faucet() {
    return __privateGet(this, _options).faucet;
  }
};
_options = new WeakMap();
var localnetConnection = new Connection({
  fullnode: "http://127.0.0.1:9000",
  faucet: "http://127.0.0.1:9123/gas"
});
var devnetConnection = new Connection({
  fullnode: "https://fullnode.devnet.sui.io:443/",
  faucet: "https://faucet.devnet.sui.io/gas"
});
var testnetConnection = new Connection({
  fullnode: "https://fullnode.testnet.sui.io:443/",
  faucet: "https://faucet.testnet.sui.io/gas"
});
var mainnetConnection = new Connection({
  fullnode: "https://fullnode.mainnet.sui.io:443/"
});

// src/builder/TransactionBlock.ts
import { fromB64 as fromB648 } from "@mysten/bcs";
import { is as is6, mask } from "superstruct";

// src/builder/Transactions.ts
import { BCS as BCS3, fromB64 as fromB647 } from "@mysten/bcs";
import {
  is as is4,
  any as any5,
  array as array12,
  integer,
  literal as literal7,
  object as object13,
  optional as optional7,
  string as string13,
  union as union7,
  assert,
  define as define3,
  unknown as unknown2,
  record as record5
} from "superstruct";

// src/builder/utils.ts
import { create as superstructCreate } from "superstruct";
function create(value, struct) {
  return superstructCreate(value, struct);
}
var TRANSACTION_TYPE = Symbol("transaction-argument-type");

// src/builder/Transactions.ts
var option = (some) => union7([object13({ None: union7([literal7(true), literal7(null)]) }), object13({ Some: some })]);
var TransactionBlockInput = object13({
  kind: literal7("Input"),
  index: integer(),
  value: optional7(any5()),
  type: optional7(union7([literal7("pure"), literal7("object")]))
});
var TransactionArgumentTypes = [
  TransactionBlockInput,
  object13({ kind: literal7("GasCoin") }),
  object13({ kind: literal7("Result"), index: integer() }),
  object13({
    kind: literal7("NestedResult"),
    index: integer(),
    resultIndex: integer()
  })
];
var TransactionArgument = union7([...TransactionArgumentTypes]);
var ObjectTransactionArgument = union7([...TransactionArgumentTypes]);
ObjectTransactionArgument[TRANSACTION_TYPE] = {
  kind: "object"
};
var PureTransactionArgument = (type) => {
  const struct = union7([...TransactionArgumentTypes]);
  struct[TRANSACTION_TYPE] = {
    kind: "pure",
    type
  };
  return struct;
};
var MoveCallTransaction = object13({
  kind: literal7("MoveCall"),
  target: define3("target", string13().validator),
  typeArguments: array12(string13()),
  arguments: array12(TransactionArgument)
});
var TransferObjectsTransaction = object13({
  kind: literal7("TransferObjects"),
  objects: array12(ObjectTransactionArgument),
  address: PureTransactionArgument(BCS3.ADDRESS)
});
var SplitCoinsTransaction = object13({
  kind: literal7("SplitCoins"),
  coin: ObjectTransactionArgument,
  amounts: array12(PureTransactionArgument("u64"))
});
var MergeCoinsTransaction = object13({
  kind: literal7("MergeCoins"),
  destination: ObjectTransactionArgument,
  sources: array12(ObjectTransactionArgument)
});
var MakeMoveVecTransaction = object13({
  kind: literal7("MakeMoveVec"),
  // TODO: ideally we should use `TypeTag` instead of `record()` here,
  // but TypeTag is recursively defined and it's tricky to define a
  // recursive struct in superstruct
  type: optional7(option(record5(string13(), unknown2()))),
  objects: array12(ObjectTransactionArgument)
});
var PublishTransaction = object13({
  kind: literal7("Publish"),
  modules: array12(array12(integer())),
  dependencies: array12(string13())
});
var UpgradePolicy = /* @__PURE__ */ ((UpgradePolicy2) => {
  UpgradePolicy2[UpgradePolicy2["COMPATIBLE"] = 0] = "COMPATIBLE";
  UpgradePolicy2[UpgradePolicy2["ADDITIVE"] = 128] = "ADDITIVE";
  UpgradePolicy2[UpgradePolicy2["DEP_ONLY"] = 192] = "DEP_ONLY";
  return UpgradePolicy2;
})(UpgradePolicy || {});
var UpgradeTransaction = object13({
  kind: literal7("Upgrade"),
  modules: array12(array12(integer())),
  dependencies: array12(string13()),
  packageId: string13(),
  ticket: ObjectTransactionArgument
});
var TransactionTypes = [
  MoveCallTransaction,
  TransferObjectsTransaction,
  SplitCoinsTransaction,
  MergeCoinsTransaction,
  PublishTransaction,
  UpgradeTransaction,
  MakeMoveVecTransaction
];
var TransactionType = union7([...TransactionTypes]);
function getTransactionType(data) {
  assert(data, TransactionType);
  return TransactionTypes.find((schema) => is4(data, schema));
}
var Transactions = {
  MoveCall(input) {
    return create(
      {
        kind: "MoveCall",
        target: input.target,
        arguments: input.arguments ?? [],
        typeArguments: input.typeArguments ?? []
      },
      MoveCallTransaction
    );
  },
  TransferObjects(objects, address) {
    return create({ kind: "TransferObjects", objects, address }, TransferObjectsTransaction);
  },
  SplitCoins(coin, amounts) {
    return create({ kind: "SplitCoins", coin, amounts }, SplitCoinsTransaction);
  },
  MergeCoins(destination, sources) {
    return create({ kind: "MergeCoins", destination, sources }, MergeCoinsTransaction);
  },
  Publish({
    modules,
    dependencies
  }) {
    return create(
      {
        kind: "Publish",
        modules: modules.map(
          (module) => typeof module === "string" ? Array.from(fromB647(module)) : module
        ),
        dependencies: dependencies.map((dep) => normalizeSuiObjectId(dep))
      },
      PublishTransaction
    );
  },
  Upgrade({
    modules,
    dependencies,
    packageId,
    ticket
  }) {
    return create(
      {
        kind: "Upgrade",
        modules: modules.map(
          (module) => typeof module === "string" ? Array.from(fromB647(module)) : module
        ),
        dependencies: dependencies.map((dep) => normalizeSuiObjectId(dep)),
        packageId,
        ticket
      },
      UpgradeTransaction
    );
  },
  MakeMoveVec({
    type,
    objects
  }) {
    return create(
      {
        kind: "MakeMoveVec",
        type: type ? { Some: TypeTagSerializer.parseFromStr(type) } : { None: null },
        objects
      },
      MakeMoveVecTransaction
    );
  }
};

// src/builder/Inputs.ts
import { array as array13, boolean as boolean12, integer as integer2, object as object14, string as string14, union as union8 } from "superstruct";
var ObjectArg = union8([
  object14({ ImmOrOwned: SuiObjectRef }),
  object14({
    Shared: object14({
      objectId: string14(),
      initialSharedVersion: union8([integer2(), string14()]),
      mutable: boolean12()
    })
  })
]);
var PureCallArg = object14({ Pure: array13(integer2()) });
var ObjectCallArg = object14({ Object: ObjectArg });
var BuilderCallArg = union8([PureCallArg, ObjectCallArg]);
var Inputs = {
  Pure(data, type) {
    return {
      Pure: Array.from(
        data instanceof Uint8Array ? data : (
          // NOTE: We explicitly set this to be growable to infinity, because we have maxSize validation at the builder-level:
          builder.ser(type, data, { maxSize: Infinity }).toBytes()
        )
      )
    };
  },
  ObjectRef({ objectId, digest, version }) {
    return {
      Object: {
        ImmOrOwned: {
          digest,
          version,
          objectId: normalizeSuiAddress(objectId)
        }
      }
    };
  },
  SharedObjectRef({ objectId, mutable, initialSharedVersion }) {
    return {
      Object: {
        Shared: {
          mutable,
          initialSharedVersion,
          objectId: normalizeSuiAddress(objectId)
        }
      }
    };
  }
};
function getIdFromCallArg(arg) {
  if (typeof arg === "string") {
    return normalizeSuiAddress(arg);
  }
  if ("ImmOrOwned" in arg.Object) {
    return normalizeSuiAddress(arg.Object.ImmOrOwned.objectId);
  }
  return normalizeSuiAddress(arg.Object.Shared.objectId);
}
function getSharedObjectInput(arg) {
  return typeof arg === "object" && "Object" in arg && "Shared" in arg.Object ? arg.Object.Shared : void 0;
}
function isSharedObjectInput(arg) {
  return !!getSharedObjectInput(arg);
}
function isMutableSharedObjectInput(arg) {
  return getSharedObjectInput(arg)?.mutable ?? false;
}

// src/types/option.ts
function getOption(option2) {
  if (typeof option2 === "object" && option2 !== null && "type" in option2 && option2.type.startsWith("0x1::option::Option<")) {
    return void 0;
  }
  return option2;
}

// src/framework/framework.ts
import { nullable as nullable11, number as number10, object as object15, string as string15 } from "superstruct";
var SUI_SYSTEM_ADDRESS = "0x3";
var SUI_FRAMEWORK_ADDRESS = "0x2";
var MOVE_STDLIB_ADDRESS = "0x1";
var OBJECT_MODULE_NAME = "object";
var UID_STRUCT_NAME = "UID";
var ID_STRUCT_NAME = "ID";
var SUI_TYPE_ARG = `${SUI_FRAMEWORK_ADDRESS}::sui::SUI`;
var VALIDATORS_EVENTS_QUERY = "0x3::validator_set::ValidatorEpochInfoEventV2";
var SUI_CLOCK_OBJECT_ID = normalizeSuiObjectId("0x6");
var PAY_MODULE_NAME = "pay";
var PAY_SPLIT_COIN_VEC_FUNC_NAME = "split_vec";
var PAY_JOIN_COIN_FUNC_NAME = "join";
var COIN_TYPE_ARG_REGEX = /^0x2::coin::Coin<(.+)>$/;
function isObjectDataFull(resp) {
  return !!resp.data || !!resp.type;
}
var CoinMetadataStruct = object15({
  decimals: number10(),
  name: string15(),
  symbol: string15(),
  description: string15(),
  iconUrl: nullable11(string15()),
  id: nullable11(string15())
});
var Coin = class _Coin {
  static isCoin(data) {
    return _Coin.getType(data)?.match(COIN_TYPE_ARG_REGEX) != null;
  }
  static getCoinType(type) {
    const [, res] = type.match(COIN_TYPE_ARG_REGEX) ?? [];
    return res || null;
  }
  static getCoinTypeArg(obj) {
    const type = _Coin.getType(obj);
    return type ? _Coin.getCoinType(type) : null;
  }
  static isSUI(obj) {
    const arg = _Coin.getCoinTypeArg(obj);
    return arg ? _Coin.getCoinSymbol(arg) === "SUI" : false;
  }
  static getCoinSymbol(coinTypeArg) {
    return coinTypeArg.substring(coinTypeArg.lastIndexOf(":") + 1);
  }
  static getCoinStructTag(coinTypeArg) {
    return {
      address: normalizeSuiObjectId(coinTypeArg.split("::")[0]),
      module: coinTypeArg.split("::")[1],
      name: coinTypeArg.split("::")[2],
      typeParams: []
    };
  }
  static getID(obj) {
    if ("fields" in obj) {
      return obj.fields.id.id;
    }
    return getObjectId(obj);
  }
  static totalBalance(coins) {
    return coins.reduce(
      (partialSum, c) => partialSum + _Coin.getBalanceFromCoinStruct(c),
      BigInt(0)
    );
  }
  /**
   * Sort coin by balance in an ascending order
   */
  static sortByBalance(coins) {
    return [...coins].sort(
      (a, b) => _Coin.getBalanceFromCoinStruct(a) < _Coin.getBalanceFromCoinStruct(b) ? -1 : _Coin.getBalanceFromCoinStruct(a) > _Coin.getBalanceFromCoinStruct(b) ? 1 : 0
    );
  }
  static getBalanceFromCoinStruct(coin) {
    return BigInt(coin.balance);
  }
  static getBalance(data) {
    if (!_Coin.isCoin(data)) {
      return void 0;
    }
    const balance = getObjectFields(data)?.balance;
    return BigInt(balance);
  }
  static getType(data) {
    if (isObjectDataFull(data)) {
      return getObjectType(data);
    }
    return data.type;
  }
};
var _Delegation = class _Delegation {
  static isDelegationSuiObject(obj) {
    return "type" in obj && obj.type === _Delegation.SUI_OBJECT_TYPE;
  }
  constructor(obj) {
    this.suiObject = obj;
  }
  nextRewardUnclaimedEpoch() {
    return this.suiObject.data.fields.next_reward_unclaimed_epoch;
  }
  activeDelegation() {
    return BigInt(getOption(this.suiObject.data.fields.active_delegation) || 0);
  }
  delegateAmount() {
    return this.suiObject.data.fields.delegate_amount;
  }
  endingEpoch() {
    return getOption(this.suiObject.data.fields.ending_epoch);
  }
  validatorAddress() {
    return this.suiObject.data.fields.validator_address;
  }
  isActive() {
    return this.activeDelegation() > 0 && !this.endingEpoch();
  }
  hasUnclaimedRewards(epoch) {
    return this.nextRewardUnclaimedEpoch() <= epoch && (this.isActive() || (this.endingEpoch() || 0) > epoch);
  }
};
_Delegation.SUI_OBJECT_TYPE = "0x2::delegation::Delegation";
var Delegation = _Delegation;

// src/builder/serializer.ts
var STD_ASCII_MODULE_NAME = "ascii";
var STD_ASCII_STRUCT_NAME = "String";
var STD_UTF8_MODULE_NAME = "string";
var STD_UTF8_STRUCT_NAME = "String";
var STD_OPTION_MODULE_NAME = "option";
var STD_OPTION_STRUCT_NAME = "Option";
var RESOLVED_SUI_ID = {
  address: SUI_FRAMEWORK_ADDRESS,
  module: OBJECT_MODULE_NAME,
  name: ID_STRUCT_NAME
};
var RESOLVED_ASCII_STR = {
  address: MOVE_STDLIB_ADDRESS,
  module: STD_ASCII_MODULE_NAME,
  name: STD_ASCII_STRUCT_NAME
};
var RESOLVED_UTF8_STR = {
  address: MOVE_STDLIB_ADDRESS,
  module: STD_UTF8_MODULE_NAME,
  name: STD_UTF8_STRUCT_NAME
};
var RESOLVED_STD_OPTION = {
  address: MOVE_STDLIB_ADDRESS,
  module: STD_OPTION_MODULE_NAME,
  name: STD_OPTION_STRUCT_NAME
};
var isSameStruct = (a, b) => a.address === b.address && a.module === b.module && a.name === b.name;
function isTxContext(param) {
  const struct = extractStructTag(param)?.Struct;
  return struct?.address === "0x2" && struct?.module === "tx_context" && struct?.name === "TxContext";
}
function expectType(typeName, argVal) {
  if (typeof argVal === "undefined") {
    return;
  }
  if (typeof argVal !== typeName) {
    throw new Error(`Expect ${argVal} to be ${typeName}, received ${typeof argVal}`);
  }
}
var allowedTypes = ["Address", "Bool", "U8", "U16", "U32", "U64", "U128", "U256"];
function getPureSerializationType(normalizedType, argVal) {
  if (typeof normalizedType === "string" && allowedTypes.includes(normalizedType)) {
    if (normalizedType in ["U8", "U16", "U32", "U64", "U128", "U256"]) {
      expectType("number", argVal);
    } else if (normalizedType === "Bool") {
      expectType("boolean", argVal);
    } else if (normalizedType === "Address") {
      expectType("string", argVal);
      if (argVal && !isValidSuiAddress(argVal)) {
        throw new Error("Invalid Sui Address");
      }
    }
    return normalizedType.toLowerCase();
  } else if (typeof normalizedType === "string") {
    throw new Error(`Unknown pure normalized type ${JSON.stringify(normalizedType, null, 2)}`);
  }
  if ("Vector" in normalizedType) {
    if ((argVal === void 0 || typeof argVal === "string") && normalizedType.Vector === "U8") {
      return "string";
    }
    if (argVal !== void 0 && !Array.isArray(argVal)) {
      throw new Error(`Expect ${argVal} to be a array, received ${typeof argVal}`);
    }
    const innerType = getPureSerializationType(
      normalizedType.Vector,
      // undefined when argVal is empty
      argVal ? argVal[0] : void 0
    );
    if (innerType === void 0) {
      return;
    }
    return `vector<${innerType}>`;
  }
  if ("Struct" in normalizedType) {
    if (isSameStruct(normalizedType.Struct, RESOLVED_ASCII_STR)) {
      return "string";
    } else if (isSameStruct(normalizedType.Struct, RESOLVED_UTF8_STR)) {
      return "utf8string";
    } else if (isSameStruct(normalizedType.Struct, RESOLVED_SUI_ID)) {
      return "address";
    } else if (isSameStruct(normalizedType.Struct, RESOLVED_STD_OPTION)) {
      const optionToVec = {
        Vector: normalizedType.Struct.typeArguments[0]
      };
      return getPureSerializationType(optionToVec, argVal);
    }
  }
  return void 0;
}

// src/builder/TransactionBlockData.ts
import { toB58 } from "@mysten/bcs";
import {
  array as array14,
  assert as assert2,
  define as define4,
  integer as integer3,
  is as is5,
  literal as literal8,
  nullable as nullable12,
  object as object16,
  optional as optional8,
  string as string16,
  union as union9
} from "superstruct";

// src/builder/hash.ts
import { blake2b as blake2b6 } from "@noble/hashes/blake2b";
function hashTypedData(typeTag, data) {
  const typeTagBytes = Array.from(`${typeTag}::`).map((e) => e.charCodeAt(0));
  const dataWithTag = new Uint8Array(typeTagBytes.length + data.length);
  dataWithTag.set(typeTagBytes);
  dataWithTag.set(data, typeTagBytes.length);
  return blake2b6(dataWithTag, { dkLen: 32 });
}

// src/builder/TransactionBlockData.ts
var TransactionExpiration = optional8(
  nullable12(
    union9([object16({ Epoch: integer3() }), object16({ None: union9([literal8(true), literal8(null)]) })])
  )
);
var StringEncodedBigint = define4("StringEncodedBigint", (val) => {
  if (!["string", "number", "bigint"].includes(typeof val))
    return false;
  try {
    BigInt(val);
    return true;
  } catch {
    return false;
  }
});
var GasConfig = object16({
  budget: optional8(StringEncodedBigint),
  price: optional8(StringEncodedBigint),
  payment: optional8(array14(SuiObjectRef)),
  owner: optional8(string16())
});
var SerializedTransactionDataBuilder = object16({
  version: literal8(1),
  sender: optional8(string16()),
  expiration: TransactionExpiration,
  gasConfig: GasConfig,
  inputs: array14(TransactionBlockInput),
  transactions: array14(TransactionType)
});
function prepareSuiAddress(address) {
  return normalizeSuiAddress(address).replace("0x", "");
}
var TransactionBlockDataBuilder = class _TransactionBlockDataBuilder {
  constructor(clone) {
    this.version = 1;
    this.sender = clone?.sender;
    this.expiration = clone?.expiration;
    this.gasConfig = clone?.gasConfig ?? {};
    this.inputs = clone?.inputs ?? [];
    this.transactions = clone?.transactions ?? [];
  }
  static fromKindBytes(bytes) {
    const kind = builder.de("TransactionKind", bytes);
    const programmableTx = kind?.ProgrammableTransaction;
    if (!programmableTx) {
      throw new Error("Unable to deserialize from bytes.");
    }
    const serialized = create(
      {
        version: 1,
        gasConfig: {},
        inputs: programmableTx.inputs.map(
          (value, index) => create(
            {
              kind: "Input",
              value,
              index,
              type: is5(value, PureCallArg) ? "pure" : "object"
            },
            TransactionBlockInput
          )
        ),
        transactions: programmableTx.transactions
      },
      SerializedTransactionDataBuilder
    );
    return _TransactionBlockDataBuilder.restore(serialized);
  }
  static fromBytes(bytes) {
    const rawData = builder.de("TransactionData", bytes);
    const data = rawData?.V1;
    const programmableTx = data?.kind?.ProgrammableTransaction;
    if (!data || !programmableTx) {
      throw new Error("Unable to deserialize from bytes.");
    }
    const serialized = create(
      {
        version: 1,
        sender: data.sender,
        expiration: data.expiration,
        gasConfig: data.gasData,
        inputs: programmableTx.inputs.map(
          (value, index) => create(
            {
              kind: "Input",
              value,
              index,
              type: is5(value, PureCallArg) ? "pure" : "object"
            },
            TransactionBlockInput
          )
        ),
        transactions: programmableTx.transactions
      },
      SerializedTransactionDataBuilder
    );
    return _TransactionBlockDataBuilder.restore(serialized);
  }
  static restore(data) {
    assert2(data, SerializedTransactionDataBuilder);
    const transactionData = new _TransactionBlockDataBuilder();
    Object.assign(transactionData, data);
    return transactionData;
  }
  /**
   * Generate transaction digest.
   *
   * @param bytes BCS serialized transaction data
   * @returns transaction digest.
   */
  static getDigestFromBytes(bytes) {
    const hash = hashTypedData("TransactionData", bytes);
    return toB58(hash);
  }
  build({
    maxSizeBytes = Infinity,
    overrides,
    onlyTransactionKind
  } = {}) {
    const inputs = this.inputs.map((input) => {
      assert2(input.value, BuilderCallArg);
      return input.value;
    });
    const kind = {
      ProgrammableTransaction: {
        inputs,
        transactions: this.transactions
      }
    };
    if (onlyTransactionKind) {
      return builder.ser("TransactionKind", kind, { maxSize: maxSizeBytes }).toBytes();
    }
    const expiration = overrides?.expiration ?? this.expiration;
    const sender = overrides?.sender ?? this.sender;
    const gasConfig = { ...this.gasConfig, ...overrides?.gasConfig };
    if (!sender) {
      throw new Error("Missing transaction sender");
    }
    if (!gasConfig.budget) {
      throw new Error("Missing gas budget");
    }
    if (!gasConfig.payment) {
      throw new Error("Missing gas payment");
    }
    if (!gasConfig.price) {
      throw new Error("Missing gas price");
    }
    const transactionData = {
      sender: prepareSuiAddress(sender),
      expiration: expiration ? expiration : { None: true },
      gasData: {
        payment: gasConfig.payment,
        owner: prepareSuiAddress(this.gasConfig.owner ?? sender),
        price: BigInt(gasConfig.price),
        budget: BigInt(gasConfig.budget)
      },
      kind: {
        ProgrammableTransaction: {
          inputs,
          transactions: this.transactions
        }
      }
    };
    return builder.ser("TransactionData", { V1: transactionData }, { maxSize: maxSizeBytes }).toBytes();
  }
  getDigest() {
    const bytes = this.build({ onlyTransactionKind: false });
    return _TransactionBlockDataBuilder.getDigestFromBytes(bytes);
  }
  snapshot() {
    return create(this, SerializedTransactionDataBuilder);
  }
};

// src/builder/TransactionBlock.ts
var DefaultOfflineLimits = {
  maxPureArgumentSize: 16 * 1024,
  maxTxGas: 5e10,
  maxGasObjects: 256,
  maxTxSizeBytes: 128 * 1024
};
function createTransactionResult(index) {
  const baseResult = { kind: "Result", index };
  const nestedResults = [];
  const nestedResultFor = (resultIndex) => nestedResults[resultIndex] ?? (nestedResults[resultIndex] = {
    kind: "NestedResult",
    index,
    resultIndex
  });
  return new Proxy(baseResult, {
    set() {
      throw new Error(
        "The transaction result is a proxy, and does not support setting properties directly"
      );
    },
    // TODO: Instead of making this return a concrete argument, we should ideally
    // make it reference-based (so that this gets resolved at build-time), which
    // allows re-ordering transactions.
    get(target, property) {
      if (property in target) {
        return Reflect.get(target, property);
      }
      if (property === Symbol.iterator) {
        return function* () {
          let i = 0;
          while (true) {
            yield nestedResultFor(i);
            i++;
          }
        };
      }
      if (typeof property === "symbol")
        return;
      const resultIndex = parseInt(property, 10);
      if (Number.isNaN(resultIndex) || resultIndex < 0)
        return;
      return nestedResultFor(resultIndex);
    }
  });
}
function expectClient(options) {
  if (!options.client && !options.provider) {
    throw new Error(
      `No provider passed to Transaction#build, but transaction data was not sufficient to build offline.`
    );
  }
  return options.client ?? options.provider;
}
var TRANSACTION_BRAND = Symbol.for("@mysten/transaction");
var LIMITS = {
  // The maximum gas that is allowed.
  maxTxGas: "max_tx_gas",
  // The maximum number of gas objects that can be selected for one transaction.
  maxGasObjects: "max_gas_payment_objects",
  // The maximum size (in bytes) that the transaction can be:
  maxTxSizeBytes: "max_tx_size_bytes",
  // The maximum size (in bytes) that pure arguments can be:
  maxPureArgumentSize: "max_pure_argument_size"
};
var GAS_SAFE_OVERHEAD = 1000n;
var MAX_OBJECTS_PER_FETCH = 50;
var chunk = (arr, size) => Array.from(
  { length: Math.ceil(arr.length / size) },
  (_, i) => arr.slice(i * size, i * size + size)
);
function isTransactionBlock(obj) {
  return !!obj && typeof obj === "object" && obj[TRANSACTION_BRAND] === true;
}
var _blockData, _input, input_fn, _getConfig, getConfig_fn, _validate, validate_fn, _prepareGasPayment, prepareGasPayment_fn, _prepareGasPrice, prepareGasPrice_fn, _prepareTransactions, prepareTransactions_fn, _prepare, prepare_fn;
var _TransactionBlock = class _TransactionBlock {
  constructor(transaction) {
    /**
     * Dynamically create a new input, which is separate from the `input`. This is important
     * for generated clients to be able to define unique inputs that are non-overlapping with the
     * defined inputs.
     *
     * For `Uint8Array` type automatically convert the input into a `Pure` CallArg, since this
     * is the format required for custom serialization.
     *
     */
    __privateAdd(this, _input);
    __privateAdd(this, _getConfig);
    __privateAdd(this, _validate);
    // The current default is just picking _all_ coins we can which may not be ideal.
    __privateAdd(this, _prepareGasPayment);
    __privateAdd(this, _prepareGasPrice);
    __privateAdd(this, _prepareTransactions);
    /**
     * Prepare the transaction by valdiating the transaction data and resolving all inputs
     * so that it can be built into bytes.
     */
    __privateAdd(this, _prepare);
    __privateAdd(this, _blockData, void 0);
    __privateSet(this, _blockData, new TransactionBlockDataBuilder(
      transaction ? transaction.blockData : void 0
    ));
  }
  /** Returns `true` if the object is an instance of the Transaction builder class.
   * @deprecated Use `isTransactionBlock` from `@mysten/sui.js/transactions` instead.
   */
  static is(obj) {
    return !!obj && typeof obj === "object" && obj[TRANSACTION_BRAND] === true;
  }
  /**
   * Converts from a serialize transaction kind (built with `build({ onlyTransactionKind: true })`) to a `Transaction` class.
   * Supports either a byte array, or base64-encoded bytes.
   */
  static fromKind(serialized) {
    const tx = new _TransactionBlock();
    __privateSet(tx, _blockData, TransactionBlockDataBuilder.fromKindBytes(
      typeof serialized === "string" ? fromB648(serialized) : serialized
    ));
    return tx;
  }
  /**
   * Converts from a serialized transaction format to a `Transaction` class.
   * There are two supported serialized formats:
   * - A string returned from `Transaction#serialize`. The serialized format must be compatible, or it will throw an error.
   * - A byte array (or base64-encoded bytes) containing BCS transaction data.
   */
  static from(serialized) {
    const tx = new _TransactionBlock();
    if (typeof serialized !== "string" || !serialized.startsWith("{")) {
      __privateSet(tx, _blockData, TransactionBlockDataBuilder.fromBytes(
        typeof serialized === "string" ? fromB648(serialized) : serialized
      ));
    } else {
      __privateSet(tx, _blockData, TransactionBlockDataBuilder.restore(JSON.parse(serialized)));
    }
    return tx;
  }
  /**
   * A helper to retrieve the Transaction builder `Transactions`
   * @deprecated Either use the helper methods on the `TransactionBlock` class, or import `Transactions` from `@mysten/sui.js/transactions`.
   */
  static get Transactions() {
    return Transactions;
  }
  /**
   * A helper to retrieve the Transaction builder `Inputs`
   * * @deprecated Either use the helper methods on the `TransactionBlock` class, or import `Inputs` from `@mysten/sui.js/transactions`.
   */
  static get Inputs() {
    return Inputs;
  }
  setSender(sender) {
    __privateGet(this, _blockData).sender = sender;
  }
  /**
   * Sets the sender only if it has not already been set.
   * This is useful for sponsored transaction flows where the sender may not be the same as the signer address.
   */
  setSenderIfNotSet(sender) {
    if (!__privateGet(this, _blockData).sender) {
      __privateGet(this, _blockData).sender = sender;
    }
  }
  setExpiration(expiration) {
    __privateGet(this, _blockData).expiration = expiration;
  }
  setGasPrice(price) {
    __privateGet(this, _blockData).gasConfig.price = String(price);
  }
  setGasBudget(budget) {
    __privateGet(this, _blockData).gasConfig.budget = String(budget);
  }
  setGasOwner(owner) {
    __privateGet(this, _blockData).gasConfig.owner = owner;
  }
  setGasPayment(payments) {
    __privateGet(this, _blockData).gasConfig.payment = payments.map((payment) => mask(payment, SuiObjectRef));
  }
  /** Get a snapshot of the transaction data, in JSON form: */
  get blockData() {
    return __privateGet(this, _blockData).snapshot();
  }
  // Used to brand transaction classes so that they can be identified, even between multiple copies
  // of the builder.
  get [TRANSACTION_BRAND]() {
    return true;
  }
  /** Returns an argument for the gas coin, to be used in a transaction. */
  get gas() {
    return { kind: "GasCoin" };
  }
  /**
   * Add a new object input to the transaction.
   */
  object(value) {
    const id = getIdFromCallArg(value);
    const inserted = __privateGet(this, _blockData).inputs.find(
      (i) => i.type === "object" && id === getIdFromCallArg(i.value)
    );
    return inserted ?? __privateMethod(this, _input, input_fn).call(this, "object", value);
  }
  /**
   * Add a new object input to the transaction using the fully-resolved object reference.
   * If you only have an object ID, use `builder.object(id)` instead.
   */
  objectRef(...args) {
    return this.object(Inputs.ObjectRef(...args));
  }
  /**
   * Add a new shared object input to the transaction using the fully-resolved shared object reference.
   * If you only have an object ID, use `builder.object(id)` instead.
   */
  sharedObjectRef(...args) {
    return this.object(Inputs.SharedObjectRef(...args));
  }
  /**
   * Add a new non-object input to the transaction.
   */
  pure(value, type) {
    return __privateMethod(this, _input, input_fn).call(this, "pure", value instanceof Uint8Array ? Inputs.Pure(value) : type ? Inputs.Pure(value, type) : value);
  }
  /** Add a transaction to the transaction block. */
  add(transaction) {
    const index = __privateGet(this, _blockData).transactions.push(transaction);
    return createTransactionResult(index - 1);
  }
  // Method shorthands:
  splitCoins(...args) {
    return this.add(Transactions.SplitCoins(...args));
  }
  mergeCoins(...args) {
    return this.add(Transactions.MergeCoins(...args));
  }
  publish(...args) {
    return this.add(Transactions.Publish(...args));
  }
  upgrade(...args) {
    return this.add(Transactions.Upgrade(...args));
  }
  moveCall(...args) {
    return this.add(Transactions.MoveCall(...args));
  }
  transferObjects(...args) {
    return this.add(Transactions.TransferObjects(...args));
  }
  makeMoveVec(...args) {
    return this.add(Transactions.MakeMoveVec(...args));
  }
  /**
   * Serialize the transaction to a string so that it can be sent to a separate context.
   * This is different from `build` in that it does not serialize to BCS bytes, and instead
   * uses a separate format that is unique to the transaction builder. This allows
   * us to serialize partially-complete transactions, that can then be completed and
   * built in a separate context.
   *
   * For example, a dapp can construct a transaction, but not provide gas objects
   * or a gas budget. The transaction then can be sent to the wallet, where this
   * information is automatically filled in (e.g. by querying for coin objects
   * and performing a dry run).
   */
  serialize() {
    return JSON.stringify(__privateGet(this, _blockData).snapshot());
  }
  /** Build the transaction to BCS bytes, and sign it with the provided keypair. */
  async sign(options) {
    const { signer, ...buildOptions } = options;
    const bytes = await this.build(buildOptions);
    return signer.signTransactionBlock(bytes);
  }
  /** Build the transaction to BCS bytes. */
  async build(options = {}) {
    await __privateMethod(this, _prepare, prepare_fn).call(this, options);
    return __privateGet(this, _blockData).build({
      maxSizeBytes: __privateMethod(this, _getConfig, getConfig_fn).call(this, "maxTxSizeBytes", options),
      onlyTransactionKind: options.onlyTransactionKind
    });
  }
  /** Derive transaction digest */
  async getDigest(options = {}) {
    await __privateMethod(this, _prepare, prepare_fn).call(this, options);
    return __privateGet(this, _blockData).getDigest();
  }
};
_blockData = new WeakMap();
_input = new WeakSet();
input_fn = function(type, value) {
  const index = __privateGet(this, _blockData).inputs.length;
  const input = create(
    {
      kind: "Input",
      // bigints can't be serialized to JSON, so just string-convert them here:
      value: typeof value === "bigint" ? String(value) : value,
      index,
      type
    },
    TransactionBlockInput
  );
  __privateGet(this, _blockData).inputs.push(input);
  return input;
};
_getConfig = new WeakSet();
getConfig_fn = function(key, { protocolConfig, limits }) {
  if (limits && typeof limits[key] === "number") {
    return limits[key];
  }
  if (!protocolConfig) {
    return DefaultOfflineLimits[key];
  }
  const attribute = protocolConfig?.attributes[LIMITS[key]];
  if (!attribute) {
    throw new Error(`Missing expected protocol config: "${LIMITS[key]}"`);
  }
  const value = "u64" in attribute ? attribute.u64 : "u32" in attribute ? attribute.u32 : attribute.f64;
  if (!value) {
    throw new Error(`Unexpected protocol config value found for: "${LIMITS[key]}"`);
  }
  return Number(value);
};
_validate = new WeakSet();
validate_fn = function(options) {
  const maxPureArgumentSize = __privateMethod(this, _getConfig, getConfig_fn).call(this, "maxPureArgumentSize", options);
  __privateGet(this, _blockData).inputs.forEach((input, index) => {
    if (is6(input.value, PureCallArg)) {
      if (input.value.Pure.length > maxPureArgumentSize) {
        throw new Error(
          `Input at index ${index} is too large, max pure input size is ${maxPureArgumentSize} bytes, got ${input.value.Pure.length} bytes`
        );
      }
    }
  });
};
_prepareGasPayment = new WeakSet();
prepareGasPayment_fn = async function(options) {
  if (__privateGet(this, _blockData).gasConfig.payment) {
    const maxGasObjects = __privateMethod(this, _getConfig, getConfig_fn).call(this, "maxGasObjects", options);
    if (__privateGet(this, _blockData).gasConfig.payment.length > maxGasObjects) {
      throw new Error(`Payment objects exceed maximum amount: ${maxGasObjects}`);
    }
  }
  if (options.onlyTransactionKind || __privateGet(this, _blockData).gasConfig.payment) {
    return;
  }
  const gasOwner = __privateGet(this, _blockData).gasConfig.owner ?? __privateGet(this, _blockData).sender;
  const coins = await expectClient(options).getCoins({
    owner: gasOwner,
    coinType: SUI_TYPE_ARG
  });
  const paymentCoins = coins.data.filter((coin) => {
    const matchingInput = __privateGet(this, _blockData).inputs.find((input) => {
      if (is6(input.value, BuilderCallArg) && "Object" in input.value && "ImmOrOwned" in input.value.Object) {
        return coin.coinObjectId === input.value.Object.ImmOrOwned.objectId;
      }
      return false;
    });
    return !matchingInput;
  }).slice(0, __privateMethod(this, _getConfig, getConfig_fn).call(this, "maxGasObjects", options) - 1).map((coin) => ({
    objectId: coin.coinObjectId,
    digest: coin.digest,
    version: coin.version
  }));
  if (!paymentCoins.length) {
    throw new Error("No valid gas coins found for the transaction.");
  }
  this.setGasPayment(paymentCoins);
};
_prepareGasPrice = new WeakSet();
prepareGasPrice_fn = async function(options) {
  if (options.onlyTransactionKind || __privateGet(this, _blockData).gasConfig.price) {
    return;
  }
  this.setGasPrice(await expectClient(options).getReferenceGasPrice());
};
_prepareTransactions = new WeakSet();
prepareTransactions_fn = async function(options) {
  const { inputs, transactions } = __privateGet(this, _blockData);
  const moveModulesToResolve = [];
  const objectsToResolve = [];
  transactions.forEach((transaction) => {
    if (transaction.kind === "MoveCall") {
      const needsResolution = transaction.arguments.some(
        (arg) => arg.kind === "Input" && !is6(inputs[arg.index].value, BuilderCallArg)
      );
      if (needsResolution) {
        moveModulesToResolve.push(transaction);
      }
      return;
    }
    const transactionType = getTransactionType(transaction);
    if (!transactionType.schema)
      return;
    Object.entries(transaction).forEach(([key, value]) => {
      if (key === "kind")
        return;
      const keySchema = transactionType.schema[key];
      const isArray = keySchema.type === "array";
      const wellKnownEncoding = isArray ? keySchema.schema[TRANSACTION_TYPE] : keySchema[TRANSACTION_TYPE];
      if (!wellKnownEncoding)
        return;
      const encodeInput = (index) => {
        const input = inputs[index];
        if (!input) {
          throw new Error(`Missing input ${value.index}`);
        }
        if (is6(input.value, BuilderCallArg))
          return;
        if (wellKnownEncoding.kind === "object" && typeof input.value === "string") {
          objectsToResolve.push({ id: input.value, input });
        } else if (wellKnownEncoding.kind === "pure") {
          input.value = Inputs.Pure(input.value, wellKnownEncoding.type);
        } else {
          throw new Error("Unexpected input format.");
        }
      };
      if (isArray) {
        value.forEach((arrayItem) => {
          if (arrayItem.kind !== "Input")
            return;
          encodeInput(arrayItem.index);
        });
      } else {
        if (value.kind !== "Input")
          return;
        encodeInput(value.index);
      }
    });
  });
  if (moveModulesToResolve.length) {
    await Promise.all(
      moveModulesToResolve.map(async (moveCall) => {
        const [packageId, moduleName, functionName] = moveCall.target.split("::");
        const normalized = await expectClient(options).getNormalizedMoveFunction({
          package: normalizeSuiObjectId(packageId),
          module: moduleName,
          function: functionName
        });
        const hasTxContext = normalized.parameters.length > 0 && isTxContext(normalized.parameters.at(-1));
        const params = hasTxContext ? normalized.parameters.slice(0, normalized.parameters.length - 1) : normalized.parameters;
        if (params.length !== moveCall.arguments.length) {
          throw new Error("Incorrect number of arguments.");
        }
        params.forEach((param, i) => {
          const arg = moveCall.arguments[i];
          if (arg.kind !== "Input")
            return;
          const input = inputs[arg.index];
          if (is6(input.value, BuilderCallArg))
            return;
          const inputValue = input.value;
          const serType = getPureSerializationType(param, inputValue);
          if (serType) {
            input.value = Inputs.Pure(inputValue, serType);
            return;
          }
          const structVal = extractStructTag(param);
          if (structVal != null || typeof param === "object" && "TypeParameter" in param) {
            if (typeof inputValue !== "string") {
              throw new Error(
                `Expect the argument to be an object id string, got ${JSON.stringify(
                  inputValue,
                  null,
                  2
                )}`
              );
            }
            objectsToResolve.push({
              id: inputValue,
              input,
              normalizedType: param
            });
            return;
          }
          throw new Error(
            `Unknown call arg type ${JSON.stringify(param, null, 2)} for value ${JSON.stringify(
              inputValue,
              null,
              2
            )}`
          );
        });
      })
    );
  }
  if (objectsToResolve.length) {
    const dedupedIds = [...new Set(objectsToResolve.map(({ id }) => id))];
    const objectChunks = chunk(dedupedIds, MAX_OBJECTS_PER_FETCH);
    const objects = (await Promise.all(
      objectChunks.map(
        (chunk2) => expectClient(options).multiGetObjects({
          ids: chunk2,
          options: { showOwner: true }
        })
      )
    )).flat();
    let objectsById = new Map(
      dedupedIds.map((id, index) => {
        return [id, objects[index]];
      })
    );
    const invalidObjects = Array.from(objectsById).filter(([_, obj]) => obj.error).map(([id, _]) => id);
    if (invalidObjects.length) {
      throw new Error(`The following input objects are invalid: ${invalidObjects.join(", ")}`);
    }
    objectsToResolve.forEach(({ id, input, normalizedType }) => {
      const object17 = objectsById.get(id);
      const owner = object17.data?.owner;
      const initialSharedVersion = owner && typeof owner === "object" && "Shared" in owner ? owner.Shared.initial_shared_version : void 0;
      if (initialSharedVersion) {
        const mutable = isMutableSharedObjectInput(input.value) || normalizedType != null && extractMutableReference(normalizedType) != null;
        input.value = Inputs.SharedObjectRef({
          objectId: id,
          initialSharedVersion,
          mutable
        });
      } else {
        input.value = Inputs.ObjectRef(getObjectReference(object17));
      }
    });
  }
};
_prepare = new WeakSet();
prepare_fn = async function(options) {
  if (!options.onlyTransactionKind && !__privateGet(this, _blockData).sender) {
    throw new Error("Missing transaction sender");
  }
  const client = options.client || options.provider;
  if (!options.protocolConfig && !options.limits && client) {
    options.protocolConfig = await client.getProtocolConfig();
  }
  await Promise.all([__privateMethod(this, _prepareGasPrice, prepareGasPrice_fn).call(this, options), __privateMethod(this, _prepareTransactions, prepareTransactions_fn).call(this, options)]);
  if (!options.onlyTransactionKind) {
    await __privateMethod(this, _prepareGasPayment, prepareGasPayment_fn).call(this, options);
    if (!__privateGet(this, _blockData).gasConfig.budget) {
      const dryRunResult = await expectClient(options).dryRunTransactionBlock({
        transactionBlock: __privateGet(this, _blockData).build({
          maxSizeBytes: __privateMethod(this, _getConfig, getConfig_fn).call(this, "maxTxSizeBytes", options),
          overrides: {
            gasConfig: {
              budget: String(__privateMethod(this, _getConfig, getConfig_fn).call(this, "maxTxGas", options)),
              payment: []
            }
          }
        })
      });
      if (dryRunResult.effects.status.status !== "success") {
        throw new Error(
          `Dry run failed, could not automatically determine a budget: ${dryRunResult.effects.status.error}`,
          { cause: dryRunResult }
        );
      }
      const safeOverhead = GAS_SAFE_OVERHEAD * BigInt(this.blockData.gasConfig.price || 1n);
      const baseComputationCostWithOverhead = BigInt(dryRunResult.effects.gasUsed.computationCost) + safeOverhead;
      const gasBudget = baseComputationCostWithOverhead + BigInt(dryRunResult.effects.gasUsed.storageCost) - BigInt(dryRunResult.effects.gasUsed.storageRebate);
      this.setGasBudget(
        gasBudget > baseComputationCostWithOverhead ? gasBudget : baseComputationCostWithOverhead
      );
    }
  }
  __privateMethod(this, _validate, validate_fn).call(this, options);
};
var TransactionBlock = _TransactionBlock;

// src/faucet/index.ts
var FaucetRateLimitError = class extends Error {
};
async function faucetRequest(host, path, body, headers) {
  const endpoint = new URL(path, host).toString();
  const res = await fetch(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      ...headers || {}
    }
  });
  if (res.status === 429) {
    throw new FaucetRateLimitError(
      `Too many requests from this client have been sent to the faucet. Please retry later`
    );
  }
  try {
    const parsed = await res.json();
    if (parsed.error) {
      throw new Error(`Faucet returns error: ${parsed.error}`);
    }
    return parsed;
  } catch (e) {
    throw new Error(
      `Encountered error when parsing response from faucet, error: ${e}, status ${res.status}, response ${res}`
    );
  }
}
async function requestSuiFromFaucetV0(input) {
  return faucetRequest(
    input.host,
    "/gas",
    {
      FixedAmountRequest: {
        recipient: input.recipient
      }
    },
    input.headers
  );
}

// src/providers/json-rpc-provider.ts
var DEFAULT_OPTIONS = {
  socketOptions: DEFAULT_CLIENT_OPTIONS,
  versionCacheTimeoutInSeconds: 600
};
var JsonRpcProvider = class {
  /**
   * Establish a connection to a Sui RPC endpoint
   *
   * @param connection The `Connection` object containing configuration for the network.
   * @param options configuration options for the provider
   */
  constructor(connection = devnetConnection, options = DEFAULT_OPTIONS) {
    this.options = options;
    this.connection = connection;
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.options = opts;
    this.client = opts.rpcClient ?? new JsonRpcClient(this.connection.fullnode);
    this.wsClient = opts.websocketClient ?? new WebsocketClient(this.connection.websocket, opts.socketOptions);
  }
  async getRpcApiVersion() {
    if (this.rpcApiVersion && this.cacheExpiry && this.cacheExpiry <= Date.now()) {
      return this.rpcApiVersion;
    }
    try {
      const resp = await this.client.requestWithType("rpc.discover", [], any6());
      this.rpcApiVersion = resp.info.version;
      this.cacheExpiry = // Date.now() is in milliseconds, but the timeout is in seconds
      Date.now() + (this.options.versionCacheTimeoutInSeconds ?? 0) * 1e3;
      return this.rpcApiVersion;
    } catch (err) {
      console.warn("Error fetching version number of the RPC API", err);
    }
    return void 0;
  }
  /** @deprecated Use `@mysten/sui.js/faucet` instead. */
  async requestSuiFromFaucet(recipient, headers) {
    if (!this.connection.faucet) {
      throw new Error("Faucet URL is not specified");
    }
    return requestSuiFromFaucetV0({ host: this.connection.faucet, recipient, headers });
  }
  /**
   * Get all Coin<`coin_type`> objects owned by an address.
   */
  async getCoins(input) {
    if (!input.owner || !isValidSuiAddress(normalizeSuiAddress(input.owner))) {
      throw new Error("Invalid Sui address");
    }
    return await this.client.requestWithType(
      "suix_getCoins",
      [input.owner, input.coinType, input.cursor, input.limit],
      PaginatedCoins
    );
  }
  /**
   * Get all Coin objects owned by an address.
   */
  async getAllCoins(input) {
    if (!input.owner || !isValidSuiAddress(normalizeSuiAddress(input.owner))) {
      throw new Error("Invalid Sui address");
    }
    return await this.client.requestWithType(
      "suix_getAllCoins",
      [input.owner, input.cursor, input.limit],
      PaginatedCoins
    );
  }
  /**
   * Get the total coin balance for one coin type, owned by the address owner.
   */
  async getBalance(input) {
    if (!input.owner || !isValidSuiAddress(normalizeSuiAddress(input.owner))) {
      throw new Error("Invalid Sui address");
    }
    return await this.client.requestWithType(
      "suix_getBalance",
      [input.owner, input.coinType],
      CoinBalance
    );
  }
  /**
   * Get the total coin balance for all coin types, owned by the address owner.
   */
  async getAllBalances(input) {
    if (!input.owner || !isValidSuiAddress(normalizeSuiAddress(input.owner))) {
      throw new Error("Invalid Sui address");
    }
    return await this.client.requestWithType(
      "suix_getAllBalances",
      [input.owner],
      array15(CoinBalance)
    );
  }
  /**
   * Fetch CoinMetadata for a given coin type
   */
  async getCoinMetadata(input) {
    return await this.client.requestWithType(
      "suix_getCoinMetadata",
      [input.coinType],
      CoinMetadataStruct
    );
  }
  /**
   *  Fetch total supply for a coin
   */
  async getTotalSupply(input) {
    return await this.client.requestWithType("suix_getTotalSupply", [input.coinType], CoinSupply);
  }
  /**
   * Invoke any RPC method
   * @param method the method to be invoked
   * @param args the arguments to be passed to the RPC request
   */
  async call(method, params) {
    return await this.client.request(method, params);
  }
  /**
   * Get Move function argument types like read, write and full access
   */
  async getMoveFunctionArgTypes(input) {
    return await this.client.requestWithType(
      "sui_getMoveFunctionArgTypes",
      [input.package, input.module, input.function],
      SuiMoveFunctionArgTypes
    );
  }
  /**
   * Get a map from module name to
   * structured representations of Move modules
   */
  async getNormalizedMoveModulesByPackage(input) {
    return await this.client.requestWithType(
      "sui_getNormalizedMoveModulesByPackage",
      [input.package],
      SuiMoveNormalizedModules
    );
  }
  /**
   * Get a structured representation of Move module
   */
  async getNormalizedMoveModule(input) {
    return await this.client.requestWithType(
      "sui_getNormalizedMoveModule",
      [input.package, input.module],
      SuiMoveNormalizedModule
    );
  }
  /**
   * Get a structured representation of Move function
   */
  async getNormalizedMoveFunction(input) {
    return await this.client.requestWithType(
      "sui_getNormalizedMoveFunction",
      [input.package, input.module, input.function],
      SuiMoveNormalizedFunction
    );
  }
  /**
   * Get a structured representation of Move struct
   */
  async getNormalizedMoveStruct(input) {
    return await this.client.requestWithType(
      "sui_getNormalizedMoveStruct",
      [input.package, input.module, input.struct],
      SuiMoveNormalizedStruct
    );
  }
  /**
   * Get all objects owned by an address
   */
  async getOwnedObjects(input) {
    if (!input.owner || !isValidSuiAddress(normalizeSuiAddress(input.owner))) {
      throw new Error("Invalid Sui address");
    }
    return await this.client.requestWithType(
      "suix_getOwnedObjects",
      [
        input.owner,
        {
          filter: input.filter,
          options: input.options
        },
        input.cursor,
        input.limit
      ],
      PaginatedObjectsResponse
    );
  }
  /**
   * Get details about an object
   */
  async getObject(input) {
    if (!input.id || !isValidSuiObjectId(normalizeSuiObjectId(input.id))) {
      throw new Error("Invalid Sui Object id");
    }
    return await this.client.requestWithType(
      "sui_getObject",
      [input.id, input.options],
      SuiObjectResponse
    );
  }
  async tryGetPastObject(input) {
    return await this.client.requestWithType(
      "sui_tryGetPastObject",
      [input.id, input.version, input.options],
      ObjectRead
    );
  }
  /**
   * Batch get details about a list of objects. If any of the object ids are duplicates the call will fail
   */
  async multiGetObjects(input) {
    input.ids.forEach((id) => {
      if (!id || !isValidSuiObjectId(normalizeSuiObjectId(id))) {
        throw new Error(`Invalid Sui Object id ${id}`);
      }
    });
    const hasDuplicates = input.ids.length !== new Set(input.ids).size;
    if (hasDuplicates) {
      throw new Error(`Duplicate object ids in batch call ${input.ids}`);
    }
    return await this.client.requestWithType(
      "sui_multiGetObjects",
      [input.ids, input.options],
      array15(SuiObjectResponse)
    );
  }
  /**
   * Get transaction blocks for a given query criteria
   */
  async queryTransactionBlocks(input) {
    return await this.client.requestWithType(
      "suix_queryTransactionBlocks",
      [
        {
          filter: input.filter,
          options: input.options
        },
        input.cursor,
        input.limit,
        (input.order || "descending") === "descending"
      ],
      PaginatedTransactionResponse
    );
  }
  async getTransactionBlock(input) {
    if (!isValidTransactionDigest(input.digest)) {
      throw new Error("Invalid Transaction digest");
    }
    return await this.client.requestWithType(
      "sui_getTransactionBlock",
      [input.digest, input.options],
      SuiTransactionBlockResponse
    );
  }
  async multiGetTransactionBlocks(input) {
    input.digests.forEach((d) => {
      if (!isValidTransactionDigest(d)) {
        throw new Error(`Invalid Transaction digest ${d}`);
      }
    });
    const hasDuplicates = input.digests.length !== new Set(input.digests).size;
    if (hasDuplicates) {
      throw new Error(`Duplicate digests in batch call ${input.digests}`);
    }
    return await this.client.requestWithType(
      "sui_multiGetTransactionBlocks",
      [input.digests, input.options],
      array15(SuiTransactionBlockResponse)
    );
  }
  async executeTransactionBlock(input) {
    return await this.client.requestWithType(
      "sui_executeTransactionBlock",
      [
        typeof input.transactionBlock === "string" ? input.transactionBlock : toB648(input.transactionBlock),
        Array.isArray(input.signature) ? input.signature : [input.signature],
        input.options,
        input.requestType
      ],
      SuiTransactionBlockResponse
    );
  }
  /**
   * Get total number of transactions
   */
  async getTotalTransactionBlocks() {
    const resp = await this.client.requestWithType("sui_getTotalTransactionBlocks", [], string17());
    return BigInt(resp);
  }
  /**
   * Getting the reference gas price for the network
   */
  async getReferenceGasPrice() {
    const resp = await this.client.requestWithType("suix_getReferenceGasPrice", [], string17());
    return BigInt(resp);
  }
  /**
   * Return the delegated stakes for an address
   */
  async getStakes(input) {
    if (!input.owner || !isValidSuiAddress(normalizeSuiAddress(input.owner))) {
      throw new Error("Invalid Sui address");
    }
    return await this.client.requestWithType(
      "suix_getStakes",
      [input.owner],
      array15(DelegatedStake)
    );
  }
  /**
   * Return the delegated stakes queried by id.
   */
  async getStakesByIds(input) {
    input.stakedSuiIds.forEach((id) => {
      if (!id || !isValidSuiObjectId(normalizeSuiObjectId(id))) {
        throw new Error(`Invalid Sui Stake id ${id}`);
      }
    });
    return await this.client.requestWithType(
      "suix_getStakesByIds",
      [input.stakedSuiIds],
      array15(DelegatedStake)
    );
  }
  /**
   * Return the latest system state content.
   */
  async getLatestSuiSystemState() {
    return await this.client.requestWithType(
      "suix_getLatestSuiSystemState",
      [],
      SuiSystemStateSummary
    );
  }
  /**
   * Get events for a given query criteria
   */
  async queryEvents(input) {
    return await this.client.requestWithType(
      "suix_queryEvents",
      [input.query, input.cursor, input.limit, (input.order || "descending") === "descending"],
      PaginatedEvents
    );
  }
  /**
   * Subscribe to get notifications whenever an event matching the filter occurs
   */
  async subscribeEvent(input) {
    return this.wsClient.request({
      method: "suix_subscribeEvent",
      unsubscribe: "suix_unsubscribeEvent",
      params: [input.filter],
      onMessage: input.onMessage
    });
  }
  async subscribeTransaction(input) {
    return this.wsClient.request({
      method: "suix_subscribeTransaction",
      unsubscribe: "suix_unsubscribeTransaction",
      params: [input.filter],
      onMessage: input.onMessage
    });
  }
  /**
   * Runs the transaction block in dev-inspect mode. Which allows for nearly any
   * transaction (or Move call) with any arguments. Detailed results are
   * provided, including both the transaction effects and any return values.
   */
  async devInspectTransactionBlock(input) {
    let devInspectTxBytes;
    if (isTransactionBlock(input.transactionBlock)) {
      input.transactionBlock.setSenderIfNotSet(input.sender);
      devInspectTxBytes = toB648(
        await input.transactionBlock.build({
          provider: this,
          onlyTransactionKind: true
        })
      );
    } else if (typeof input.transactionBlock === "string") {
      devInspectTxBytes = input.transactionBlock;
    } else if (input.transactionBlock instanceof Uint8Array) {
      devInspectTxBytes = toB648(input.transactionBlock);
    } else {
      throw new Error("Unknown transaction block format.");
    }
    return await this.client.requestWithType(
      "sui_devInspectTransactionBlock",
      [input.sender, devInspectTxBytes, input.gasPrice, input.epoch],
      DevInspectResults
    );
  }
  /**
   * Dry run a transaction block and return the result.
   */
  async dryRunTransactionBlock(input) {
    return await this.client.requestWithType(
      "sui_dryRunTransactionBlock",
      [
        typeof input.transactionBlock === "string" ? input.transactionBlock : toB648(input.transactionBlock)
      ],
      DryRunTransactionBlockResponse
    );
  }
  /**
   * Return the list of dynamic field objects owned by an object
   */
  async getDynamicFields(input) {
    if (!input.parentId || !isValidSuiObjectId(normalizeSuiObjectId(input.parentId))) {
      throw new Error("Invalid Sui Object id");
    }
    return await this.client.requestWithType(
      "suix_getDynamicFields",
      [input.parentId, input.cursor, input.limit],
      DynamicFieldPage
    );
  }
  /**
   * Return the dynamic field object information for a specified object
   */
  async getDynamicFieldObject(input) {
    return await this.client.requestWithType(
      "suix_getDynamicFieldObject",
      [input.parentId, input.name],
      SuiObjectResponse
    );
  }
  /**
   * Get the sequence number of the latest checkpoint that has been executed
   */
  async getLatestCheckpointSequenceNumber() {
    const resp = await this.client.requestWithType(
      "sui_getLatestCheckpointSequenceNumber",
      [],
      string17()
    );
    return String(resp);
  }
  /**
   * Returns information about a given checkpoint
   */
  async getCheckpoint(input) {
    return await this.client.requestWithType("sui_getCheckpoint", [input.id], Checkpoint);
  }
  /**
   * Returns historical checkpoints paginated
   */
  async getCheckpoints(input) {
    const resp = await this.client.requestWithType(
      "sui_getCheckpoints",
      [input.cursor, input?.limit, input.descendingOrder],
      CheckpointPage
    );
    return resp;
  }
  /**
   * Return the committee information for the asked epoch
   */
  async getCommitteeInfo(input) {
    return await this.client.requestWithType(
      "suix_getCommitteeInfo",
      [input?.epoch],
      CommitteeInfo
    );
  }
  async getNetworkMetrics() {
    return await this.client.requestWithType("suix_getNetworkMetrics", [], NetworkMetrics);
  }
  async getAddressMetrics() {
    return await this.client.requestWithType("suix_getLatestAddressMetrics", [], AddressMetrics);
  }
  async getAllEpochAddressMetrics(input) {
    return await this.client.requestWithType(
      "suix_getAllEpochAddressMetrics",
      [input?.descendingOrder],
      AllEpochsAddressMetrics
    );
  }
  /**
   * Return the committee information for the asked epoch
   */
  async getEpochs(input) {
    return await this.client.requestWithType(
      "suix_getEpochs",
      [input?.cursor, input?.limit, input?.descendingOrder],
      EpochPage
    );
  }
  /**
   * Returns list of top move calls by usage
   */
  async getMoveCallMetrics() {
    return await this.client.requestWithType("suix_getMoveCallMetrics", [], MoveCallMetrics);
  }
  /**
   * Return the committee information for the asked epoch
   */
  async getCurrentEpoch() {
    return await this.client.requestWithType("suix_getCurrentEpoch", [], EpochInfo);
  }
  /**
   * Return the Validators APYs
   */
  async getValidatorsApy() {
    return await this.client.requestWithType("suix_getValidatorsApy", [], ValidatorsApy);
  }
  // TODO: Migrate this to `sui_getChainIdentifier` once it is widely available.
  async getChainIdentifier() {
    const checkpoint = await this.getCheckpoint({ id: "0" });
    const bytes = fromB582(checkpoint.digest);
    return toHEX2(bytes.slice(0, 4));
  }
  async resolveNameServiceAddress(input) {
    return await this.client.requestWithType(
      "suix_resolveNameServiceAddress",
      [input.name],
      nullable13(string17())
    );
  }
  async resolveNameServiceNames(input) {
    return await this.client.requestWithType(
      "suix_resolveNameServiceNames",
      [input.address],
      ResolvedNameServiceNames
    );
  }
  async getProtocolConfig(input) {
    return await this.client.requestWithType(
      "sui_getProtocolConfig",
      [input?.version],
      ProtocolConfig
    );
  }
  /**
   * Wait for a transaction block result to be available over the API.
   * This can be used in conjunction with `executeTransactionBlock` to wait for the transaction to
   * be available via the API.
   * This currently polls the `getTransactionBlock` API to check for the transaction.
   */
  async waitForTransactionBlock({
    signal,
    timeout = 60 * 1e3,
    pollInterval = 2 * 1e3,
    ...input
  }) {
    const timeoutSignal = AbortSignal.timeout(timeout);
    const timeoutPromise = new Promise((_, reject) => {
      timeoutSignal.addEventListener("abort", () => reject(timeoutSignal.reason));
    });
    timeoutPromise.catch(() => {
    });
    while (!timeoutSignal.aborted) {
      signal?.throwIfAborted();
      try {
        return await this.getTransactionBlock(input);
      } catch (e) {
        await Promise.race([
          new Promise((resolve) => setTimeout(resolve, pollInterval)),
          timeoutPromise
        ]);
      }
    }
    timeoutSignal.throwIfAborted();
    throw new Error("Unexpected error while waiting for transaction block.");
  }
};

// src/signers/raw-signer.ts
import { blake2b as blake2b7 } from "@noble/hashes/blake2b";

// src/signers/signer-with-provider.ts
import { fromB64 as fromB649, toB64 as toB649 } from "@mysten/bcs";
var SignerWithProvider = class {
  /**
   * @deprecated Use `client` instead.
   */
  get provider() {
    return this.client;
  }
  ///////////////////
  // Sub-classes MAY override these
  /**
   * Request gas tokens from a faucet server and send to the signer
   * address
   * @param httpHeaders optional request headers
   * @deprecated Use `@mysten/sui.js/faucet` instead.
   */
  async requestSuiFromFaucet(httpHeaders) {
    if (!("requestSuiFromFaucet" in this.provider)) {
      throw new Error("To request SUI from faucet, please use @mysten/sui.js/faucet instead");
    }
    return this.provider.requestSuiFromFaucet(await this.getAddress(), httpHeaders);
  }
  constructor(client) {
    this.client = client;
  }
  /**
   * Sign a message using the keypair, with the `PersonalMessage` intent.
   */
  async signMessage(input) {
    const signature = await this.signData(
      messageWithIntent(
        3 /* PersonalMessage */,
        bcs.ser(["vector", "u8"], input.message).toBytes()
      )
    );
    return {
      messageBytes: toB649(input.message),
      signature
    };
  }
  async prepareTransactionBlock(transactionBlock) {
    if (isTransactionBlock(transactionBlock)) {
      transactionBlock.setSenderIfNotSet(await this.getAddress());
      return await transactionBlock.build({
        client: this.client
      });
    }
    if (transactionBlock instanceof Uint8Array) {
      return transactionBlock;
    }
    throw new Error("Unknown transaction format");
  }
  /**
   * Sign a transaction.
   */
  async signTransactionBlock(input) {
    const transactionBlockBytes = await this.prepareTransactionBlock(input.transactionBlock);
    const intentMessage = messageWithIntent(0 /* TransactionData */, transactionBlockBytes);
    const signature = await this.signData(intentMessage);
    return {
      transactionBlockBytes: toB649(transactionBlockBytes),
      signature
    };
  }
  /**
   * Sign a transaction block and submit to the Fullnode for execution.
   *
   * @param options specify which fields to return (e.g., transaction, effects, events, etc).
   * By default, only the transaction digest will be returned.
   * @param requestType WaitForEffectsCert or WaitForLocalExecution, see details in `ExecuteTransactionRequestType`.
   * Defaults to `WaitForLocalExecution` if options.show_effects or options.show_events is true
   */
  async signAndExecuteTransactionBlock(input) {
    const { transactionBlockBytes, signature } = await this.signTransactionBlock({
      transactionBlock: input.transactionBlock
    });
    return await this.client.executeTransactionBlock({
      transactionBlock: transactionBlockBytes,
      signature,
      options: input.options,
      requestType: input.requestType
    });
  }
  /**
   * Derive transaction digest from
   * @param tx BCS serialized transaction data or a `Transaction` object
   * @returns transaction digest
   */
  async getTransactionBlockDigest(tx) {
    if (isTransactionBlock(tx)) {
      tx.setSenderIfNotSet(await this.getAddress());
      return tx.getDigest({ client: this.client });
    } else if (tx instanceof Uint8Array) {
      return TransactionBlockDataBuilder.getDigestFromBytes(tx);
    } else {
      throw new Error("Unknown transaction format.");
    }
  }
  /**
   * Runs the transaction in dev-inpsect mode. Which allows for nearly any
   * transaction (or Move call) with any arguments. Detailed results are
   * provided, including both the transaction effects and any return values.
   */
  async devInspectTransactionBlock(input) {
    const address = await this.getAddress();
    return this.client.devInspectTransactionBlock({
      sender: address,
      ...input
    });
  }
  /**
   * Dry run a transaction and return the result.
   */
  async dryRunTransactionBlock(input) {
    let dryRunTxBytes;
    if (isTransactionBlock(input.transactionBlock)) {
      input.transactionBlock.setSenderIfNotSet(await this.getAddress());
      dryRunTxBytes = await input.transactionBlock.build({
        client: this.client
      });
    } else if (typeof input.transactionBlock === "string") {
      dryRunTxBytes = fromB649(input.transactionBlock);
    } else if (input.transactionBlock instanceof Uint8Array) {
      dryRunTxBytes = input.transactionBlock;
    } else {
      throw new Error("Unknown transaction format");
    }
    return this.client.dryRunTransactionBlock({
      transactionBlock: dryRunTxBytes
    });
  }
  /**
   * Returns the estimated gas cost for the transaction
   * @param tx The transaction to estimate the gas cost. When string it is assumed it's a serialized tx in base64
   * @returns total gas cost estimation
   * @throws whens fails to estimate the gas cost
   */
  async getGasCostEstimation(...args) {
    const txEffects = await this.dryRunTransactionBlock(...args);
    const gasEstimation = getTotalGasUsedUpperBound(txEffects.effects);
    if (typeof gasEstimation === "undefined") {
      throw new Error("Failed to estimate the gas cost from transaction");
    }
    return gasEstimation;
  }
};

// src/signers/raw-signer.ts
var RawSigner = class _RawSigner extends SignerWithProvider {
  constructor(keypair, client) {
    super(client);
    this.keypair = keypair;
  }
  async getAddress() {
    return this.keypair.getPublicKey().toSuiAddress();
  }
  async signData(data) {
    const pubkey = this.keypair.getPublicKey();
    const digest = blake2b7(data, { dkLen: 32 });
    const signature = this.keypair.signData(digest);
    const signatureScheme = this.keypair.getKeyScheme();
    return toSerializedSignature({
      signatureScheme,
      signature,
      pubKey: pubkey
    });
  }
  connect(client) {
    return new _RawSigner(this.keypair, client);
  }
};

// src/utils/verify.ts
import { fromB64 as fromB6410 } from "@mysten/bcs";
import { blake2b as blake2b8 } from "@noble/hashes/blake2b";
async function verifyMessage(message, serializedSignature, scope) {
  const signature = toSingleSignaturePubkeyPair(serializedSignature);
  if (scope === 3 /* PersonalMessage */) {
    const messageBytes2 = messageWithIntent(
      scope,
      bcs.ser(["vector", "u8"], typeof message === "string" ? fromB6410(message) : message).toBytes()
    );
    if (await signature.pubKey.verify(blake2b8(messageBytes2, { dkLen: 32 }), signature.signature)) {
      return true;
    }
    const unwrappedMessageBytes = messageWithIntent(
      scope,
      typeof message === "string" ? fromB6410(message) : message
    );
    return signature.pubKey.verify(
      blake2b8(unwrappedMessageBytes, { dkLen: 32 }),
      signature.signature
    );
  }
  const messageBytes = messageWithIntent(
    scope,
    typeof message === "string" ? fromB6410(message) : message
  );
  return signature.pubKey.verify(blake2b8(messageBytes, { dkLen: 32 }), signature.signature);
}

// src/index.ts
import {
  fromB64 as fromB6411,
  toB64 as toB6410
} from "@mysten/bcs";

// src/utils/format.ts
var ELLIPSIS = "\u2026";
function formatAddress(address) {
  if (address.length <= 6) {
    return address;
  }
  const offset = address.startsWith("0x") ? 2 : 0;
  return `0x${address.slice(offset, offset + 4)}${ELLIPSIS}${address.slice(-4)}`;
}
function formatDigest(digest) {
  return `${digest.slice(0, 10)}${ELLIPSIS}`;
}

// src/index.ts
import {
  is as is7,
  assert as assert3
} from "superstruct";

// src/framework/sui-system-state.ts
var SUI_SYSTEM_STATE_OBJECT_ID = normalizeSuiObjectId("0x5");
var SUI_SYSTEM_MODULE_NAME = "sui_system";
var ADD_STAKE_FUN_NAME = "request_add_stake";
var ADD_STAKE_LOCKED_COIN_FUN_NAME = "request_add_stake_with_locked_coin";
var WITHDRAW_STAKE_FUN_NAME = "request_withdraw_stake";
var SuiSystemStateUtil = class {
  /**
   * Create a new transaction for staking coins ready to be signed and executed with `signer-and-provider`.
   *
   * @param coins the coins to be staked
   * @param amount the amount to stake
   * @param gasBudget omittable only for DevInspect mode
   */
  static async newRequestAddStakeTxn(client, coins, amount, validatorAddress) {
    const tx = new TransactionBlock();
    const coin = tx.splitCoins(tx.gas, [tx.pure(amount)]);
    tx.moveCall({
      target: `${SUI_SYSTEM_ADDRESS}::${SUI_SYSTEM_MODULE_NAME}::${ADD_STAKE_FUN_NAME}`,
      arguments: [tx.object(SUI_SYSTEM_STATE_OBJECT_ID), coin, tx.pure(validatorAddress)]
    });
    const coinObjects = await client.multiGetObjects({
      ids: coins,
      options: {
        showOwner: true
      }
    });
    tx.setGasPayment(coinObjects.map((obj) => getObjectReference(obj)));
    return tx;
  }
  /**
   * Create a new transaction for withdrawing coins ready to be signed and
   * executed with `signer-and-provider`.
   *
   * @param stake the stake object created in the requestAddStake txn
   * @param stakedCoinId the coins to withdraw
   * @param gasBudget omittable only for DevInspect mode
   */
  static async newRequestWithdrawlStakeTxn(stake, stakedCoinId) {
    const tx = new TransactionBlock();
    tx.moveCall({
      target: `${SUI_SYSTEM_ADDRESS}::${SUI_SYSTEM_MODULE_NAME}::${WITHDRAW_STAKE_FUN_NAME}`,
      arguments: [tx.object(SUI_SYSTEM_STATE_OBJECT_ID), tx.object(stake), tx.object(stakedCoinId)]
    });
    return tx;
  }
};
export {
  ADD_STAKE_FUN_NAME,
  ADD_STAKE_LOCKED_COIN_FUN_NAME,
  ARGUMENT,
  ARGUMENT_INNER,
  AddressMetrics,
  AllEpochsAddressMetrics,
  AppId,
  Apy,
  AuthorityName,
  AuthorityQuorumSignInfo,
  AuthoritySignature,
  Balance,
  BalanceChange,
  BaseSigner,
  BuilderCallArg,
  CALL_ARG,
  COIN_TYPE_ARG_REGEX,
  COMPRESSED_SIGNATURE,
  CheckPointContentsDigest,
  Checkpoint,
  CheckpointCommitment,
  CheckpointDigest,
  CheckpointPage,
  CheckpointedObjectId,
  Coin,
  CoinBalance,
  CoinMetadataStruct,
  CoinStruct,
  CoinSupply,
  CommitteeInfo,
  Connection,
  Contents,
  ContentsFields,
  ContentsFieldsWithdraw,
  DEFAULT_CLIENT_OPTIONS,
  DEFAULT_SECP256K1_DERIVATION_PATH,
  DEFAULT_SECP256R1_DERIVATION_PATH,
  DelegatedStake,
  Delegation,
  DelegationStakingPool,
  DelegationStakingPoolFields,
  DevInspectResults,
  DisplayFieldsBackwardCompatibleResponse,
  DisplayFieldsResponse,
  DryRunTransactionBlockResponse,
  DynamicFieldInfo,
  DynamicFieldName,
  DynamicFieldPage,
  DynamicFieldType,
  ECMHLiveObjectSetDigest,
  ENUM_KIND,
  Ed25519Keypair,
  Ed25519PublicKey,
  EndOfEpochData,
  EndOfEpochInfo,
  EpochId,
  EpochInfo,
  EpochPage,
  EventId,
  ExecutionDigests,
  ExecutionStatus,
  ExecutionStatusType,
  GasCostSummary,
  GenericAuthoritySignature,
  Genesis,
  GetOwnedObjectsResponse,
  ID_STRUCT_NAME,
  Inputs,
  IntentScope,
  IntentVersion,
  JsonRpcClient,
  JsonRpcProvider,
  Keypair,
  LEGACY_PRIVATE_KEY_SIZE,
  MAX_SIGNER_IN_MULTISIG,
  MIST_PER_SUI,
  MOVE_STDLIB_ADDRESS,
  MULTISIG,
  MULTISIG_PK_MAP,
  MULTISIG_PUBLIC_KEY,
  MakeMoveVecTransaction,
  MergeCoinsTransaction,
  MoveCallMetric,
  MoveCallMetrics,
  MoveCallSuiTransaction,
  MoveCallTransaction,
  MovePackageContent,
  NetworkMetrics,
  OBJECT_ARG,
  OBJECT_MODULE_NAME,
  OPTION,
  ObjectCallArg,
  ObjectContentFields,
  ObjectDigest,
  ObjectId,
  ObjectOwner,
  ObjectRead,
  ObjectStatus,
  ObjectTransactionArgument,
  ObjectType,
  OwnedObjectRef,
  PAY_JOIN_COIN_FUNC_NAME,
  PAY_MODULE_NAME,
  PAY_SPLIT_COIN_VEC_FUNC_NAME,
  PRIVATE_KEY_SIZE,
  PROGRAMMABLE_CALL,
  PROGRAMMABLE_CALL_INNER,
  PROGRAMMABLE_TX_BLOCK,
  PUBLIC_KEY,
  PaginatedCoins,
  PaginatedEvents,
  PaginatedObjectsResponse,
  PaginatedTransactionResponse,
  ProgrammableTransaction,
  ProtocolConfig,
  PublicKey,
  PublishTransaction,
  PureCallArg,
  PureTransactionArgument,
  RPCValidationError,
  RawSigner,
  ResolvedNameServiceNames,
  SIGNATURE_FLAG_TO_SCHEME,
  SIGNATURE_SCHEME_TO_FLAG,
  SIGNATURE_SCHEME_TO_SIZE,
  SUI_ADDRESS_LENGTH,
  SUI_CLOCK_OBJECT_ID,
  SUI_DECIMALS,
  SUI_FRAMEWORK_ADDRESS,
  SUI_SYSTEM_ADDRESS,
  SUI_SYSTEM_MODULE_NAME,
  SUI_SYSTEM_STATE_OBJECT_ID,
  SUI_TYPE_ARG,
  Secp256k1Keypair,
  Secp256k1PublicKey,
  Secp256r1Keypair,
  Secp256r1PublicKey,
  SequenceNumber,
  SignerWithProvider,
  SplitCoinsTransaction,
  StakeObject,
  StakeSubsidy,
  StakeSubsidyFields,
  SuiAddress,
  SuiArgument,
  SuiCallArg,
  SuiChangeEpoch,
  SuiConsensusCommitPrologue,
  SuiEvent,
  SuiGasData,
  SuiJsonValue,
  SuiMoveAbilitySet,
  SuiMoveFunctionArgType,
  SuiMoveFunctionArgTypes,
  SuiMoveModuleId,
  SuiMoveNormalizedField,
  SuiMoveNormalizedFunction,
  SuiMoveNormalizedModule,
  SuiMoveNormalizedModules,
  SuiMoveNormalizedStruct,
  SuiMoveNormalizedStructType,
  SuiMoveNormalizedType,
  SuiMoveNormalizedTypeParameterType,
  SuiMoveObject,
  SuiMovePackage,
  SuiMoveStructTypeParameter,
  SuiMoveVisibility,
  SuiObjectChange,
  SuiObjectChangeCreated,
  SuiObjectChangeDeleted,
  SuiObjectChangeMutated,
  SuiObjectChangePublished,
  SuiObjectChangeTransferred,
  SuiObjectChangeWrapped,
  SuiObjectData,
  SuiObjectDataOptions,
  SuiObjectInfo,
  SuiObjectRef,
  SuiObjectResponse,
  SuiObjectResponseError,
  SuiParsedData,
  SuiRawData,
  SuiRawMoveObject,
  SuiRawMovePackage,
  SuiSupplyFields,
  SuiSystemStateSummary,
  SuiSystemStateUtil,
  SuiTransaction,
  SuiTransactionBlock,
  SuiTransactionBlockData,
  SuiTransactionBlockKind,
  SuiTransactionBlockResponse,
  SuiTransactionBlockResponseOptions,
  SuiValidatorSummary,
  TRANSACTION,
  TRANSACTION_INNER,
  TYPE_TAG,
  TransactionArgument,
  TransactionBlock,
  TransactionBlockInput,
  TransactionDigest,
  TransactionEffects,
  TransactionEffectsDigest,
  TransactionEffectsModifiedAtVersions,
  TransactionEventDigest,
  TransactionEvents,
  TransactionType,
  Transactions,
  TransferObjectsTransaction,
  TypeTagSerializer,
  UID_STRUCT_NAME,
  UpgradePolicy,
  UpgradeTransaction,
  VALIDATORS_EVENTS_QUERY,
  VECTOR2 as VECTOR,
  ValidatorSignature,
  Validators,
  ValidatorsApy,
  WITHDRAW_STAKE_FUN_NAME,
  WebsocketClient,
  assert3 as assert,
  bcs,
  builder,
  bytesEqual,
  combinePartialSigs,
  decodeMultiSig,
  devnetConnection,
  extractMutableReference,
  extractReference,
  extractStructTag,
  formatAddress,
  formatDigest,
  fromB6411 as fromB64,
  fromExportedKeypair,
  getChangeEpochTransaction,
  getConsensusCommitPrologueTransaction,
  getCreatedObjects,
  getEventPackage,
  getEventSender,
  getEvents,
  getExecutionStatus,
  getExecutionStatusError,
  getExecutionStatusGasSummary,
  getExecutionStatusType,
  getGasData,
  getIdFromCallArg,
  getMoveObject,
  getMoveObjectType,
  getMovePackageContent,
  getNewlyCreatedCoinRefsAfterSplit,
  getObjectChanges,
  getObjectDeletedResponse,
  getObjectDisplay,
  getObjectFields,
  getObjectId,
  getObjectNotExistsResponse,
  getObjectOwner,
  getObjectPreviousTransactionDigest,
  getObjectReference,
  getObjectType,
  getObjectVersion,
  getProgrammableTransaction,
  getPublishedObjectChanges,
  getPureSerializationType,
  getSharedObjectInitialVersion,
  getSharedObjectInput,
  getSuiObjectData,
  getTimestampFromTransactionResponse,
  getTotalGasUsed,
  getTotalGasUsedUpperBound,
  getTransaction,
  getTransactionDigest,
  getTransactionEffects,
  getTransactionGasBudget,
  getTransactionGasObject,
  getTransactionGasPrice,
  getTransactionKind,
  getTransactionKindName,
  getTransactionSender,
  getTransactionSignature,
  getTransactionType,
  getWebsocketUrl,
  hasPublicTransfer,
  is7 as is,
  isImmutableObject,
  isMutableSharedObjectInput,
  isObjectDataFull,
  isPureArg,
  isSharedObject,
  isSharedObjectInput,
  isSuiObjectResponse,
  isTxContext,
  isValidBIP32Path,
  isValidHardenedPath,
  isValidSuiAddress,
  isValidSuiObjectId,
  isValidTransactionDigest,
  localnetConnection,
  mainnetConnection,
  messageWithIntent,
  mnemonicToSeed,
  mnemonicToSeedHex,
  normalizeStructTag,
  normalizeSuiAddress,
  normalizeSuiObjectId,
  parseSerializedSignature,
  parseStructTag,
  publicKeyFromSerialized,
  testnetConnection,
  toB6410 as toB64,
  toMultiSigAddress,
  toParsedSignaturePubkeyPair,
  toSerializedSignature,
  toSingleSignaturePubkeyPair,
  verifyMessage
};
//# sourceMappingURL=index.mjs.map