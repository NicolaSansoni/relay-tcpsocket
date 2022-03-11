const { Relay } = require("./relay.js");

const sleep = ms => new Promise(res => setTimeout(res, ms));

async function main(ip) {
  const relay = new Relay(ip, 1);

  console.log("Channel 1: ", (await relay.getState()) ? "ON" : "OFF");

  console.log("Turning on...");
  await relay.setState(true);
  console.log("Channel 1: ", (await relay.getState()) ? "ON" : "OFF");

  await sleep(500);

  console.log("Turning off...");
  await relay.setState(false);
  console.log("Channel 1: ", (await relay.getState()) ? "ON" : "OFF");

  await sleep(500);

  console.log("Test reset...");
  await relay.setState(true);
  await sleep(300);
  await relay.reset();
  console.log("Reset completed");
  console.log("Channel 1: ", (await relay.getState()) ? "ON" : "OFF");

  console.log("Test terminated");
  return;
}

const ip = process.argv[2];
main(ip).then();
