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

        return variable;
    }

    window.__env = window.__env || {};
    window.__env.RELEASE_TAG = defaults('${CI_COMMIT_TAG}', '');
    window.__env.SENTRY_URL = defaults('${SENTRY_URL}', '');
    window.__env.SENTRY_USER = defaults('${SENTRY_USER}', '');
    window.__env.SENTRY_PROJECT = defaults('${SENTRY_PROJECT}', '');
    window.__env.SENTRY_ENV = defaults('${SENTRY_ENV}', 'local');

}(this));