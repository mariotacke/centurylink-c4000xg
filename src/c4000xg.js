const axios = require('axios');
const https = require('https');
const cookie = require('cookie');

const transform = require('./transform');

class C4000XGClient {
  constructor(options = {}) {
    const { host, username, password } = options || {};

    this._credentials = {
      username,
      password,
    };

    this._client = axios.create({
      baseURL: host,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });

    this._session = null;
  }

  async _authenticate() {
    const { username, password } = this._credentials;
    const data = `username=${username}&password=${password}`;

    const { headers } = await this._client.post('/cgi/cgi_action', data, {
      headers: {
        'Content-Type': 'text/plain',
      },
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 303;
      }
    });

    this._session = cookie.parse(headers['set-cookie'][0])['Session-Id'];

    console.debug(`Authenticated. SessionId: ${this._session}`);
  }

  async _get(object) {
    if (!this._session) {
      console.debug('No session. Authenticating.');

      await this._authenticate();
    }

    try {
      const response = await this._client.get(`/cgi/cgi_get?Object=${object}`, {
        headers: {
          'Cookie': `Session-Id=${this._session}`,
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      return response;
    } catch (e) {
      console.debug('Session expired.');
      this._session = null;

      return await this._get(object);
    }
  }

  async getDeviceInformation(objectName = 'Device.Ethernet') {
    const response = await this._get(objectName);

    const statistics = response.data['Objects']
      .reduce((stats, object) => {
        stats[object['ObjName']] = transform(object['Param']);

        return stats;
      }, {});

    return statistics;
  }
}

module.exports = C4000XGClient;