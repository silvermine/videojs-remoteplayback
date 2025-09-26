'use strict';

const sharedStandards = require(`@silvermine/standardization/.markdownlint-cli2.shared.cjs`);

module.exports = {
   ...sharedStandards,
   globs: [
      ...sharedStandards.globs,
   ],
   ignores: [
      ...sharedStandards.ignores,
   ]
};