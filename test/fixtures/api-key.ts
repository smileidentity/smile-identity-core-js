/*
 * A throwaway 2048-bit RSA public key, generated once and checked in. There is
 * no matching private key anywhere.
 *
 * The SDK never does anything asymmetric with the API key. It is only ever used
 * as an HMAC key (see src/signature.ts), so the tests just need a stable,
 * realistic-looking string.
 *
 * The tests used to call keypair() at the top of five test files. That package
 * bundles a pure-JS bignum implementation which picks its fast inner loop only
 * when there is no global `navigator`. Node 21 added one, so from Node 22
 * onwards it silently fell back to a slower loop and each call took 100-200
 * seconds under jest instead of about one second. Do not reintroduce it.
 */
export const publicKey = [
  '-----BEGIN RSA PUBLIC KEY-----',
  'MIIBCgKCAQEAyQPz3fObftgS6DQXikRproAsw8+W4VlFaMOwq9HWMOsuJrvkscVP',
  'TO3U3N5nummDHx1YyBrp+X/uk1EdFAAk1AKRtndWjhCfTqxZxFIpDzUJBlhhiwwS',
  'uwWytGr9ERHaBXS4UDkmNkW5Dz2TPEiD02eY7H0sKCBpBSQwvpj0I5LhH6D86r4j',
  'iVCLYg0Um2omL/DVoO7HhSEmINsIxm6fIRgcsur1apVTimiprKDVwD2LJbhl9XTu',
  'FhzWjDTMV4eI2UdML4Ayrjul8RtenK4lx0raJXSUjMA12S8cT22P98kZBTcqoGF8',
  'rit+tB1hROTGvWCbdXS5RxwJL4pBiefTxQIDAQAB',
  '-----END RSA PUBLIC KEY-----',
  '',
].join('\n');
