const { Relay } = require("./relay.js");

async function main(ip, channel) {
  const relay = new Relay(ip, channel);

  console.log(`Reset ${ip} - ${channel}`);
  await relay.reset();
  const res = await relay.getState();
  console.log(
    "Device State: ",
    res === null ? "NOT CONNECTED" : res ? "ON" : "OFF"
  );
  return;
}

const ip = process.argv[2];
const channel = process.argv[3];
main(ip, channel).then();
