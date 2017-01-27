'use strict';
var _ = require('lodash');

var BufferUtil = require('./util/buffer');
var JSUtil = require('./util/js');
var networks = [];
var networkMaps = {};

/**
 * A network is merely a map containing values that correspond to version
 * numbers for each bitcoin network. Currently only supporting "livenet"
 * (a.k.a. "mainnet") and "testnet".
 * @constructor
 */
function Network() {}

Network.prototype.toString = function toString() {
  return this.name;
};

/**
 * @function
 * @member Networks#get
 * Retrieves the network associated with a magic number or string.
 * @param {string|number|Network} arg
 * @param {string|Array} keys - if set, only check if the magic number associated with this name matches
 * @return Network
 */
function get(arg, keys) {
  if (~networks.indexOf(arg)) {
    return arg;
  }
  if (keys) {
    if (!_.isArray(keys)) {
      keys = [keys];
    }
    var containsArg = function(key) {
      return networks[index][key] === arg;
    };
    for (var index in networks) {
      if (_.any(keys, containsArg)) {
        return networks[index];
      }
    }
    return undefined;
  }
  return networkMaps[arg];
}

/**
 * @function
 * @member Networks#add
 * Will add a custom Network
 * @param {Object} data
 * @param {string} data.name - The name of the network
 * @param {string} data.alias - The aliased name of the network
 * @param {Number} data.pubkeyhash - The publickey hash prefix
 * @param {Number} data.privatekey - The privatekey prefix
 * @param {Number} data.scripthash - The scripthash prefix
 * @param {Number} data.xpubkey - The extended public key magic
 * @param {Number} data.xprivkey - The extended private key magic
 * @param {Number} data.zaddr - The Zcash payment address prefix
 * @param {Number} data.zkey - The Zcash spending key prefix
 * @param {Number} data.networkMagic - The network magic number
 * @param {Number} data.port - The network port
 * @param {Array}  data.dnsSeeds - An array of dns seeds
 * @return Network
 */
function addNetwork(data) {

  var network = new Network();

  JSUtil.defineImmutable(network, {
    name: data.name,
    alias: data.alias,
    pubkeyhash: data.pubkeyhash,
    privatekey: data.privatekey,
    scripthash: data.scripthash,
    xpubkey: data.xpubkey,
    xprivkey: data.xprivkey,
    zaddr: data.zaddr,
    zkey: data.zkey
  });

  if (data.networkMagic) {
    JSUtil.defineImmutable(network, {
      networkMagic: BufferUtil.integerAsBuffer(data.networkMagic)
    });
  }

  if (data.port) {
    JSUtil.defineImmutable(network, {
      port: data.port
    });
  }

  if (data.dnsSeeds) {
    JSUtil.defineImmutable(network, {
      dnsSeeds: data.dnsSeeds
    });
  }
  _.each(network, function(value) {
    if (!_.isUndefined(value) && !_.isObject(value)) {
      networkMaps[value] = network;
    }
  });

  networks.push(network);

  return network;

}

/**
 * @function
 * @member Networks#remove
 * Will remove a custom network
 * @param {Network} network
 */
function removeNetwork(network) {
  for (var i = 0; i < networks.length; i++) {
    if (networks[i] === network) {
      networks.splice(i, 1);
    }
  }
  for (var key in networkMaps) {
    if (networkMaps[key] === network) {
      delete networkMaps[key];
    }
  }
}

addNetwork({
  name: 'livenet',
  alias: 'mainnet',
  pubkeyhash: 0x1cb8,
  privatekey: 0x80,
  scripthash: 0x1cbd,
  xpubkey: 0x0488b21e,
  xprivkey: 0x0488ade4,
  zaddr: 0x169a,
  zkey: 0xab36,
  networkMagic: 0x24e92764,
  port: 8233,
  dnsSeeds: [
    'dnsseed.z.cash',
    'dnsseed.str4d.xyz',
    'dnsseed.znodes.org'
  ]
});

/**
 * @instance
 * @member Networks#livenet
 */
var livenet = get('livenet');

addNetwork({
  name: 'testnet',
  alias: 'regtest',
  pubkeyhash: 0x1d25,
  privatekey: 0xef,
  scripthash: 0x1cba,
  xpubkey: 0x043587cf,
  xprivkey: 0x04358394,
  zaddr: 0x16b6,
  zkey: 0xac08,
});

/**
 * @instance
 * @member Networks#testnet
 */
var testnet = get('testnet');

// Add configurable values for testnet/regtest

var TESTNET = {
  PORT: 18233,
  NETWORK_MAGIC: BufferUtil.integerAsBuffer(0xfa1af9bf),
  DNS_SEEDS: [
    'dnsseed.testnet.z.cash',
  ]
};

for (var key in TESTNET) {
  if (!_.isObject(TESTNET[key])) {
    networkMaps[TESTNET[key]] = testnet;
  }
}

var REGTEST = {
  PORT: 18444,
  NETWORK_MAGIC: BufferUtil.integerAsBuffer(0xaae83f5f),
  DNS_SEEDS: []
};

for (var key in REGTEST) {
  if (!_.isObject(REGTEST[key])) {
    networkMaps[REGTEST[key]] = testnet;
  }
}

Object.defineProperty(testnet, 'port', {
  enumerable: true,
  configurable: false,
  get: function() {
    if (this.regtestEnabled) {
      return REGTEST.PORT;
    } else {
      return TESTNET.PORT;
    }
  }
});

Object.defineProperty(testnet, 'networkMagic', {
  enumerable: true,
  configurable: false,
  get: function() {
    if (this.regtestEnabled) {
      return REGTEST.NETWORK_MAGIC;
    } else {
      return TESTNET.NETWORK_MAGIC;
    }
  }
});

Object.defineProperty(testnet, 'dnsSeeds', {
  enumerable: true,
  configurable: false,
  get: function() {
    if (this.regtestEnabled) {
      return REGTEST.DNS_SEEDS;
    } else {
      return TESTNET.DNS_SEEDS;
    }
  }
});

/**
 * @function
 * @member Networks#enableRegtest
 * Will enable regtest features for testnet
 */
function enableRegtest() {
  testnet.regtestEnabled = true;
}

/**
 * @function
 * @member Networks#disableRegtest
 * Will disable regtest features for testnet
 */
function disableRegtest() {
  testnet.regtestEnabled = false;
}


/************** Option to run on Bitcoin as well as Zcash *********************/
/*******************************************************************************/
addNetwork({
  name: 'bitcoinLivenet',
  alias: 'bitcoin-mainnet',
  pubkeyhash: 0x00,
  privatekey: 0x80,
  scripthash: 0x05,
  xpubkey: 0x0488b21e,
  xprivkey: 0x0488ade4,
  networkMagic: 0xf9beb4d9,
  port: 8333,
  dnsSeeds: [
    'seed.bitcoin.sipa.be',
    'dnsseed.bluematt.me',
    'dnsseed.bitcoin.dashjr.org',
    'seed.bitcoinstats.com',
    'seed.bitnodes.io',
    'bitseed.xf2.org'
  ]
});

/**
 * @instance
 * @member Networks#bitcoinLivenet
 */
var bitcoinLivenet = get('bitcoinLivenet');

addNetwork({
  name: 'bitcoinTestnet',
  alias: 'BITCOIN_REGTEST',
  pubkeyhash: 0x6f,
  privatekey: 0xef,
  scripthash: 0xc4,
  xpubkey: 0x043587cf,
  xprivkey: 0x04358394
});

/**
 * @instance
 * @member Networks#bitcoinTestnet
 */
var bitcoinTestnet = get('bitcoinTestnet');

// Add configurable values for testnet/BITCOIN_REGTEST

var bitcoinTestnet = {
  PORT: 18333,
  NETWORK_MAGIC: BufferUtil.integerAsBuffer(0x0b110907),
  DNS_SEEDS: [
    'testnet-seed.bitcoin.petertodd.org',
    'testnet-seed.bluematt.me',
    'testnet-seed.alexykot.me',
    'testnet-seed.bitcoin.schildbach.de'
  ]
};

for (var key in bitcoinTestnet) {
  if (!_.isObject(bitcoinTestnet[key])) {
    networkMaps[bitcoinTestnet[key]] = testnet;
  }
}

var BITCOIN_REGTEST = {
  PORT: 18444,
  NETWORK_MAGIC: BufferUtil.integerAsBuffer(0xfabfb5da),
  DNS_SEEDS: []
};

for (var key in BITCOIN_REGTEST) {
  if (!_.isObject(BITCOIN_REGTEST[key])) {
    networkMaps[BITCOIN_REGTEST[key]] = testnet;
  }
}

Object.defineProperty(bitcoinTestnet, 'port', {
  enumerable: true,
  configurable: false,
  get: function() {
    if (this.regtestEnabled) {
      return BITCOIN_REGTEST.PORT;
    } else {
      return bitcoinTestnet.PORT;
    }
  }
});

Object.defineProperty(bitcoinTestnet, 'networkMagic', {
  enumerable: true,
  configurable: false,
  get: function() {
    if (this.regtestEnabled) {
      return BITCOIN_REGTEST.NETWORK_MAGIC;
    } else {
      return bitcoinTestnet.NETWORK_MAGIC;
    }
  }
});

Object.defineProperty(bitcoinTestnet, 'dnsSeeds', {
  enumerable: true,
  configurable: false,
  get: function() {
    if (this.regtestEnabled) {
      return BITCOIN_REGTEST.DNS_SEEDS;
    } else {
      return bitcoinTestnet.DNS_SEEDS;
    }
  }
});
/*******************************************************************************/
/*******************************************************************************/






/**
 * @namespace Networks
 */
module.exports = {
  add: addNetwork,
  remove: removeNetwork,
  defaultNetwork: livenet,
  livenet: livenet,
  mainnet: livenet,
  testnet: testnet,
  bitcoinLivenet: bitcoinLivenet,
  bitcoinTestnet: bitcoinTestnet,
  get: get,
  enableRegtest: enableRegtest,
  disableRegtest: disableRegtest
};
