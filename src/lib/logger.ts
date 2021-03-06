import * as log4js from 'log4js';

let Logger;

export function init(logger?, name = 'eip') {
  if (logger) {
    Logger = logger;
  } else {
    Logger = log4js.getLogger(`[${name}]`);
  }
}

export function getLogger() {
  if (!Logger) {
    init();
  }
  return Logger;
}
