import Service from '@ember/service';
import fetch from 'fetch';
import validator from 'validator';
import {inject as service} from '@ember/service';

export default class FrontendService extends Service {
    @service settings;
    @service config;
    @service ajax;

    _hasLoggedIn = false;
    _lastPassword = null;

    get hasPasswordChanged() {
        return this._lastPassword !== this.settings.get('password');
    }

    getUrl(path) {
        const siteUrl = new URL(this.config.get('blogUrl'));
        const subdir = siteUrl.pathname.endsWith('/') ? siteUrl.pathname : `${siteUrl.pathname}/`;
        const fullPath = `${subdir}${path.replace(/^\//, '')}`;

        return `${siteUrl.origin}${fullPath}`;
    }

    async loginIfNeeded() {
        if (this.settings.get('isPrivate') && (this.hasPasswordChanged || !this._hasLoggedIn)) {
            const privateLoginUrl = this.getUrl('/private/?r=%2F');
            this._lastPassword = this.settings.get('password');
            return fetch(privateLoginUrl, {
                method: 'POST',
                mode: 'cors',
                redirect: 'manual',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `password=${this._lastPassword}`
            }).then(() => {
                this._hasLoggedIn = true;
            });
        }
    }

    async fetch(urlOrPath, options) {
        await this.loginIfNeeded();
        let frontendUrl = urlOrPath;
        if (!validator.isURL(urlOrPath)) {
            frontendUrl = this.getUrl(urlOrPath);
        }
        return fetch(frontendUrl, {
            mode: 'cors',
            credentials: 'include',
            ...options
        });
    }
}
