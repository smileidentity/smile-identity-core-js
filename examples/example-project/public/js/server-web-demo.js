const demoHomeScreen = document.querySelector('#demo-home');
const demoFormScreen = document.querySelector('#demo-form');
const demoCompleteScreen = document.querySelector('#demo-complete');


const form = document.querySelector('form[name="hosted-web-config"]');
const button = document.querySelector('#submitForm');
const product = document.querySelector('#product');

console.log(product);

const getWebToken = async () => {
  const payload = { product: product.value };
  const fetchConfig = {};

  fetchConfig.cache = 'no-cache';
  fetchConfig.mode = 'cors';
  fetchConfig.headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  fetchConfig.body = JSON.stringify(payload);

  fetchConfig.method = 'POST';
  try {
    const response = await fetch('/token', fetchConfig);

    if (response.status === 201 || response.statusCode === 201) {
      const json = await response.json();

      if (json.error) {
        throw new Error(json.error);
      }

      return json;
    }
  } catch (e) {
    console.log(`SmileIdentity Core: ${e.name}, ${e.message}`);
    throw e;
  }
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  button.textContent = 'Initializing session...';
  button.disabled = true;
});
