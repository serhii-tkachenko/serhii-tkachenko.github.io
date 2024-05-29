/**
 *
 * Mocked data
 *
 */
const renderWalletButtonsProps = [
    {
        paymentMethodId: 'paypalcommerce.paypal',
        containerId: 'paypalcommerce-button',
        options: {
            style: {"color":"gold","label":"checkout"},
            onComplete: () => {
                const url = 'your_host_here/checkout/order-confirmation';
                location.replace(url);
                return new Promise();
            },
        },
    },
    {
        paymentMethodId: 'next',
        containerId: 'asd',
    },
];

// renderWalletButtons(renderWalletButtonsProps);


/**
 *
 * Checkout kit loader
 *
 */
async function getCheckoutKitLoader(isTestMode) {
    if (!window.checkoutKitLoader) {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.defer = true;
            script.src = isTestMode
                ? 'https://checkout-sdk.integration.zone/v1/loader.js'
                : 'https://checkout-sdk.bigcommerce.com/v1/loader.js';

            script.onload = resolve;

            document.body.append(script);
        });
    }

    return window.checkoutKitLoader;
}


async function renderWalletButtons(walletButtonsProps) {
    await getCheckoutKitLoader();

    return walletButtonsProps.map(renderWalletButton);
}

function renderWalletButton(props) {
    const { paymentMethodId } = props;

    if (!paymentMethodId) {
        console.error('Can not render wallet button because paymentMethodId is not provided or its empty');

        return;
    }

    const paymentProviderRenderer = getPaymentProviderRendererByMethodId(paymentMethodId);

    switch (paymentMethodId) {
        case 'asd':
            renderPayPalCommerceButton(props);
            break;
        default:
            console.error(`Wallet button with "${paymentMethodId}" payment method id is not implemented`);
    }
}


function getPaymentProviderRendererByMethodId(paymentMethodId) {
    const paymentProviderRendererMap = {
        'paypalcommerce.paypal': renderPayPalCommerceButton,
    };

    const paymentProviderRenderer = paymentProviderRendererMap[paymentMethodId];

    if (!paymentProviderRenderer) {
        console.error(`Wallet button with "${paymentMethodId}" payment method id is not implemented`);
    }

    return paymentProviderRenderer;
}

function renderPayPalCommerceButton() {
    console.log('render paypal button');

    if (!window.checkoutButtonInitializer) {
        window.checkoutKitLoader.load('checkout-button')
            .then(function (module) {
                window.checkoutButtonInitializer = module.createCheckoutButtonInitializer({ host: host });
                window.checkoutButtonInitializer.initializeButton(initializeButtonOptions);
            });
    } else {
        window.checkoutButtonInitializer.initializeButton(initializeButtonOptions)
    }
}
