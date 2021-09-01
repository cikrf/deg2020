(function (window) {

    function defaults(variable, defaults) {
        if (/^\$\{(.*)\}$/.test(variable)) {
            if (/^\$\{(.*)\}$/.test(defaults)) {
                return undefined;
            }
            return defaults;
        }

        switch (typeof defaults) {
            case 'boolean':
                if (variable === true.toString()) {
                    return true;
                } else if (variable === false.toString()) {
                    return false;
                } else {
                    return !!variable;
                }
                break;
            case 'number':
                return Number(variable);
                break;
        }

        return variable || defaults;
    }

    window.__env = window.__env || {};
    window.__env.RUN_TEST_VOTER = defaults('${RUN_TEST_VOTER}', true);
    window.__env.SENTRY_URL = defaults('${SENTRY_URL}', '');
    window.__env.SENTRY_USER = defaults('${SENTRY_USER}', '');
    window.__env.SENTRY_PROJECT = defaults('${SENTRY_PROJECT}', '');
    window.__env.SENTRY_ENV = defaults('${SENTRY_ENV}', 'local');
    window.__env.RELEASE_TAG = defaults('${CI_COMMIT_TAG}', '${CI_COMMIT_SHORT_SHA}');
    window.__env.YMETRIKA_COUNTER = defaults('${YMETRIKA_COUNTER}', 0);
    window.__env.SHOW_SHA = defaults('${SHOW_SHA}', false);
    window.__env.SIMPLE_LANDING = defaults('${SIMPLE_LANDING}', false);
    window.__env.LANDING_STATE = defaults('${LANDING_STATE}', 0);
    window.__env.PROFILE_URL = defaults('${PROFILE_URL}', 'https://lk.gosuslugi.ru/info');

}(this));
