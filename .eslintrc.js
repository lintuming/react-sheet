  
module.exports = {
  extends: [
    'react-app',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
  ],
  "rules":{
    "react-hooks/*":"off"
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};