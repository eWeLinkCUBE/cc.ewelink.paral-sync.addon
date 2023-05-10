module.exports = {
    globals: {
        module: 'writable', // 忽略未声明的变量
    },
    //解析器，解析ts语法
    parser: '@typescript-eslint/parser',
    //第三方插件（规则的集合）
    plugins: ['@typescript-eslint'],
    //插件包的规则配置一起配置
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    //规则单独选择是否开启
    rules: {
        // 禁止使用 var
        'no-var': 'error',
        // 优先使用 interface 而不是 type
        '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    },
};
