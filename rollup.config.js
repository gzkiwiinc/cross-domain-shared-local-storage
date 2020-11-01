import resolve from "rollup-plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
import sourcemaps from "rollup-plugin-sourcemaps";
import babel from 'rollup-plugin-babel';
import commonjs from "rollup-plugin-commonjs";

import pkg from "./package.json";

const config = {
  plugins: [
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          declaration: true, // only compile defs in es format
          declarationDir: 'lib/types',
          module: 'es2015',
        },
      },
      useTsconfigDeclarationDir: true,
    }),
    resolve(),
    commonjs(),
    babel({
      exclude: 'node_modules/**', // 只编译我们的源代码
      plugins: ['external-helpers'],
    }),
    sourcemaps(),
  ],
}

console.log('TARGET => ', process.env.TARGET)

if(process.env.TARGET === 'all')
{
  config.input = './src/index.ts';
  config.output = [
    {
      format: 'es',
      file: pkg.module,
      sourcemap: false,
    },
    {
      format: 'cjs',
      file: pkg.main,
      sourcemap: false,
    }
  ]
}
else if(process.env.TARGET === 'client')
{
  config.input = './src/storage/StorageClient.ts';
  config.output = {
    format: 'iife', // 用于浏览器中直接引用
    file: './lib/client.min.js',
    name: 'CrossDomainStorageClient',
    sourcemap: false,
  }
}
else
{
  config.input = './src/storage/StorageHub.ts';
  config.output = {
    format: 'iife', // 用于浏览器中直接引用
    file: './lib/hub.min.js',
    name: 'CrossDomainStorageHub',
    sourcemap: false,
  }
}

export default config