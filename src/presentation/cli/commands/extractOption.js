// src/presentation/cli/commands/extractOption.js

/**
 * @param {string[]} args
 * @param {string} option
 * @returns {string|null}
 */
export function extractOption(args, option) {
  const index = args.indexOf(option);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return null;
}
