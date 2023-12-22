import { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import fastGlob from 'fast-glob';
import dts from 'vite-plugin-dts';
import pkgJson from './package.json';

const external = ['@babel/parser', 'monaco-editor'];
const globals = { '@babel/parser': '' };
// @ts-ignore
const pkg = pkgJson.publishConfig || pkgJson;

const pkPlugins = fastGlob.sync('plugins/**/index.ts');

/** 获取打包后的文件名 */
function getFilename(_name: string) {
    const name = _name.replace(/^dist\//, '');
    return (fileInfo: any) => {
        const prefix = fileInfo.name.split('/').length > 1 ? `${fileInfo.name.split('/').slice(0, -1).join('/')}/` : '';
        return `${prefix}${name}`;
    };
}

/**
 * @file vite 环境配置
 */
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        dts({
            // rollupTypes: true,
        }),
    ],
    build: {
        lib: {
            entry: {
                index: resolve(__dirname, './index.ts'),
                ...pkPlugins.reduce((p, v) => {
                    p[v] = resolve(__dirname, v);
                    return p;
                }, {}),
            },
            name: 'MonacoEditor',
        },
        outDir: 'dist',
        // emptyOutDir: false,
        sourcemap: true,
        rollupOptions: {
            external,
            output: [
                { entryFileNames: getFilename(pkg.module), format: 'es' },
                { entryFileNames: getFilename(pkg.main), format: 'cjs', exports: 'named' },
                // { entryFileNames: getFilename(pkg.unpkg), format: 'umd', name: 'MonacoEditor', globals },
                // { entryFileNames: getFilename(pkg.iife), format: 'iife', name: 'MonacoEditor', globals },
            ],
        },
    },
});
