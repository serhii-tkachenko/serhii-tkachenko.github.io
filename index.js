/**
 *
 * Mocked data
 *
 */
const renderWalletButtonsProps = {
    walletButtons: [
        {
            paymentMethodId: 'paypalcommerce.paypal',
            containerId: 'paypalcommerce-button',
            options: {
                style: {"color":"gold","label":"checkout"},
                onComplete: () => {
                    const url = '/checkout/order-confirmation';
                    location.replace(url);
                    return new Promise();
                },
            },
        },
    ],
};

/**
 *
 * Checkout kit loader
 *
 */
async function getCheckoutKitLoader(env) {
    if (!window.checkoutKitLoader) {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.defer = true;
            script.src = env === 'local'
                ? `${window.location.origin}/v1/loader.js`
                : env === 'int'
                    ? 'https://checkout-sdk.integration.zone/v1/loader.js'
                    : 'https://checkout-sdk.bigcommerce.com/v1/loader.js';

            console.log(env, '<--->', script.src);

            script.onload = resolve;

            document.body.append(script);
        });
    }

    return window.checkoutKitLoader;
}

async function initCheckoutButtonInitializer(bcStoreHost) {
    const checkoutButtonModule = await window.checkoutKitLoader.load('checkout-button');

    window.checkoutButtonInitializer = checkoutButtonModule.createCheckoutButtonInitializer({ host: bcStoreHost });
}

/**
 *
 * Render wallet buttons
 *
 * */
async function renderWalletButtons(props) {
    const { bcStoreUrl, env, walletButtons } = props;

    if (walletButtons.length === 0) {
        console.error('Wallet buttons can not be rendered because wallet buttons options did not provided');

        return;
    }

    await getCheckoutKitLoader(env);
    await initCheckoutButtonInitializer(bcStoreUrl);

    return walletButtons.map(renderWalletButton);
}

/**
 *
 * Payment provider initialization options mapper
 *
 * */
function getPaymentProviderInitializationOptions(props) {
    const optionsGetter = {
        'paypalcommerce.paypal': getPayPalCommerceButtonInitializationOptions,
    };

    const paymentProviderInitializationOptionsGetter = optionsGetter[props.paymentMethodId];

    if (!paymentProviderInitializationOptionsGetter) {
        return;
    }

    return paymentProviderInitializationOptionsGetter(props);
}

/**
 *
 * Wallet buttons rendering methods
 *
 * */
function renderWalletButton(props) {
    const { paymentMethodId } = props;

    console.log('renderWalletButton props', props);

    if (!props.paymentMethodId) {
        console.error('Can not render wallet button because paymentMethodId is not provided or its empty');

        return;
    }

    const paymentProviderInitializationOptions = getPaymentProviderInitializationOptions(props);

    if (!paymentProviderInitializationOptions) {
        console.error(`Wallet button with "${paymentMethodId}" payment method id is not implemented`);

        return;
    }

    window.checkoutButtonInitializer.initializeButton(paymentProviderInitializationOptions);
}

/**
 *
 * Provider specific button rendering methods
 *
 * */
function getPayPalCommerceButtonInitializationOptions(props) {
    return {
        methodId: 'paypalcommerce',
        containerId: props.containerId,
        paypalcommerce: {
            ...props.options,
        },
    };
}


/**
 *
 * window object code
 *
 * */
window.BigCommerce = {
    ...window.BigCommerce,
    renderWalletButtons,
    renderWalletButtonsPropsMock: renderWalletButtonsProps,
};
