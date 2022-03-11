const net = require("net");
const debug = require("debug")("relay");

const sleep = ms => new Promise(res => setTimeout(res, ms));

/** Manager for the relay used to handle Jetson devices */
class Relay {
  /**
   * Create a Relay manager
   * @param {string} ip - Ip of the relay device
   * @param {number} channel - Id of the channel to manage. Ids start at 1.
   */
  constructor(ip, channel) {
    this._ip = ip;
    this._channel = channel;
    this._state = false;
    this._lastStateUpdate = null;
    this._lastStateChange = null;
  }

  /** Get ip */
  ip() {
    return this._ip;
  }

  /** Get channel */
  channel() {
    return this._ip;
  }

  /**
   * Set state of the Relay
   * @param {boolean} on - true for on, false for off
   * @return {Promise<boolean>} success
   */
  async setState(on) {
    try {
      await this._sendMessage(on ? 2 : 1);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Switches the Relay off and then on
   * @return {Promise<boolean>} success
   */
  async reset() {
    return (await this.setState(false)) && (await this.setState(true));
  }

  /**
   * Gets the state of the Relay and reports it
   * @return {Promise<boolean>} on or off, or null if the connection failed
   */
  async getState() {
    // cache state for 5000 ms
    if (this._state !== null && Date.now() - this._lastStateUpdate < 5000)
      return this._state;

    try {
      return await this._sendMessage(0);
    } catch (e) {
      return null;
    }
  }

  /**
   * @param {number} message - 0: info, 1: on, 2: off
   * @return {Promise<boolean | Event>} Promise: on or off, or null if the connection failed
   */
  async _sendMessage(message) {
    const channel = message ? this._channel : 0;

    if (channel && this._lastStateChange) {
      const delay = 10000 - (Date.now() - this._lastStateChange);
      if (delay > 0) {
        await sleep(delay);
      }
    }

    const socket = new net.Socket();
    socket.setEncoding("ascii");
    socket.setTimeout(5000);

    return new Promise((resolve, reject) => {
      socket.connect(6722, this._ip, () => {
        debug("connected");
        socket.write(`${message}${channel}`);
      });

      socket.on("timeout", () => {
        debug("timeout");
        socket.destroy();
        reject(new Error("relay timeout"));
      });

      socket.on("error", error => {
        debug("error");
        debug(error);
        socket.destroy();
        reject(error);
      });

      socket.on("close", () => {
        debug("close");
        socket.destroy();
        reject(new Error("relay closed"));
      });

      socket.on("data", data => {
        debug("message");
        debug(data);
        socket.end();
        this._state = data[this._channel - 1] == 0;
        this._lastStateUpdate = Date.now();
        if (channel) {
          this._lastStateChange = Date.now();
        }
        resolve(this._state);
      });
    });
  }
}

module.exports = { Relay };
