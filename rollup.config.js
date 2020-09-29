import resolve from "rollup-plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
import sourcemaps from "rollup-plugin-sourcemaps";
import babel from 'rollup-plugin-babel';
import commonjs from "rollup-plugin-commonjs";

import pkg from "./package.json";

export default {
  input: './src/index.ts',
  output: [
    {
      format: 'es',
      file: pkg.module,
      sourcemap: true,
    },
    {
      format: 'cjs',
      file: pkg.main,
      sourcemap: true,
    },
    {
      format: 'iife', // 用于浏览器中直接引用
      file: 'index.min.js',
      name: 'Storage',
      sourcemap: true,
    },
    // {
    //   format: 'umd', // 用于浏览器中直接引用与iife二选一
    //   file: 'index.min.js',
    //   name: 'Storage',
    //   sourcemap: true,
    // }
  ],
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