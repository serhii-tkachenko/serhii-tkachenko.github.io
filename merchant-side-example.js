/**
 *
 * Collect data from form
 *
 * */
function getBcStoreUrl() {
    return document.getElementById('bc-store-url').value;

}

function getStoreHash() {
    return document.getElementById('store-hash-input').value;
}

function getXAuthToken() {
    return document.getElementById('x-auth-token-input').value;
}

function getAllowedCorsOrigins() {
    const corsOriginsInputValue = document.getElementById('cors-origins-input').value;
    const domains = corsOriginsInputValue.split(',');

    return domains.length > 2 ? domains.slice(0, 2) : domains;
}

function getChannelId() {
    return document.getElementById('channel-id-input').value || 1;

}

function getTokenExpirationTime() {
    return document.getElementById('token-exp-time-input').value || 2;
}

/**
*
* API generation requests
*
*/
async function getStorefrontApiToken() {
    const storeHash = getStoreHash();
    const xAuthToken = getXAuthToken();

    if (!storeHash || !xAuthToken) {
        console.error('Wallet buttons can\'t be rendered because store hash or x-auth-token is not provided');
    }

    const url = `https://api.bigcommerce.com/stores/${storeHash}/v3/storefront/api-token`;
    const options = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Auth-Token': xAuthToken,
        },
        body: JSON.stringify({
            allowed_cors_origins: getAllowedCorsOrigins(),
            channel_id: getChannelId(),
            expires_at: Date.now() + getTokenExpirationTime() * 1000,
        }),
    };

    const response = await fetch(url, options);
    const { data } = await response.json();

    return data.token;
}

/**
 *
 *
 *
 * */
async function fetchPaymentWalletButtons(token) {
    const bcStoreUrl = getBcStoreUrl();
    const storefrontApiToken = getStorefrontApiToken();
    // const xxSrfToken = ''; // TODO:
    // const xSfCsrfToken = ''; // TODO:
    const billingAddressCountry = "US";

    const graphQLUrl = `${bcStoreUrl}/graphql`;
    const graphQLQuery = `
        query {
            site {
                paymentWallets(billingCountry: "${billingAddressCountry}") {
                    edges {
                        node {
                            paymentMethodId
                        }
                    }
                }
            }
        }
    `;

    try {
        const response = await fetch(graphQLUrl, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${storefrontApiToken}`,
                // 'X-XSRF-TOKEN': '',
                // 'X-Sf-Csrf-Token': '',
            },
            body: JSON.stringify({
                query: graphQLQuery,
            }),
        });

        const { data } = await response.json();

        const paymentMethodsList = data?.site?.paymentWallets?.edges?.map(paymentWalletEdge => {
            return paymentWalletEdge?.node?.paymentMethodId;
        });

        console.log({ paymentMethodsList, data });
    } catch(error) {
        console.error(error);

        return {};
    }
}


/**
 *
 * Options mapper
 *
 */
function getWalletButtonsOption(paymentMethodId) {
    switch (paymentMethodId) {
        case 'paypalcommerce.paypal': {
            return {
                paymentMethodId: 'paypalcommerce.paypal',
                containerId: 'paypalcommerce-button',
                options: {
                    style: { "color":"gold", "label":"checkout" },
                },
            };
        }
        case 'braintree.paypal': {
            return {
                paymentMethodId: 'braintree.paypal',
                containerId: 'braintree-paypal-button',
                options: {
                    style: { "color":"gold", "label":"checkout" },
                },
            };
        }
        default:
            return {};
    }
}

/**
 *
 * UI handlers
 *
 */
function onMockCheckboxChange(e) {
    const apiRelatedContainer = document.getElementById('api-related');

    apiRelatedContainer.style.display = e.target.checked ? 'none' : 'block';

    console.log(apiRelatedContainer.style.display);
}

async function onRenderWalletButtonsButtonClick(paymentMethodsList) {
    const bcStoreUrl = getBcStoreUrl();
    const env = document.getElementById('env-select').value;
    const isMockEnabled = document.getElementById('mock-checkbox').checked;

    if (!bcStoreUrl) {
        console.error('Can\'t render PayPal button because bc store url is not provided');

        return;
    }

    const mockedPaymentWalletsList = ['paypalcommerce.paypal'];

    const paymentWalletsList = isMockEnabled ? mockedPaymentWalletsList : await fetchPaymentWalletButtons();
    const walletButtonsOptions = paymentWalletsList.map(getWalletButtonsOption);

    generateWalletButtonsContainers();

    await window.BigCommerce.renderWalletButtons({
        bcStoreUrl,
        env,
        walletButtons: walletButtonsOptions,
    });
}

/**
 *
 * UI communication
 *
 * */
const button = document.getElementById('render-wallet-buttons');
button.addEventListener('click', () => onRenderWalletButtonsButtonClick);

const braintreeButton = document.getElementById('render-braintree-button');
braintreeButton.addEventListener('click', () => onRenderWalletButtonsButtonClick(['braintree.paypal']));

const mockCheckbox = document.getElementById('mock-checkbox');
mockCheckbox.addEventListener('change', onMockCheckboxChange);

/**
 *
 * Tools
 *
 * */
function generateWalletButtonsContainers(walletButtonsContainers) {
    const mainContainer = document.getElementById('wallet-buttons-list');

    walletButtonsContainers.map((walletButtonContainer) => {
        const div = document.createElement('div');
        div.id = walletButtonContainer;

        mainContainer.appendChild(div);
    })
}
