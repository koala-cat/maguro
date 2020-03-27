module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        useBuiltIns: 'usage',
        corejs: 3
      }
    ]
  ],
  plugins: [
    '@vue/babel-plugin-transform-vue-jsx',
    '@babel/plugin-proposal-optional-chaining'
  ]
}
