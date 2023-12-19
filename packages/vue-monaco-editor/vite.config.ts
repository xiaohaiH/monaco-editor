import { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import fastGlob from 'fast-glob';
import dts from 'vite-plugin-dts';
import pkgJson from './package.json';

const external = /^(vue|vue-demi|monaco-editor|@xiaohaih\/monaco-editor)/;
// const external = ['vue', 'vue-demi', 'monaco-editor', '@xiaohaih/monaco-editor'];
const globals = { vue: 'Vue', 'vue-demi': 'VueDemi', 'monaco-editor': 'monaco' };
// @ts-ignore
const pkg = pkgJson.publishConfig || pkgJson;
const pkPlugins = fastGlob.sync('src/*.ts');

/** 获取打包后的文件名 */
function getFilename(_name: string) {
    const name = _name.replace(/^dist\//, '');
    return (fileInfo: any) => {
        return fileInfo.name.slice(-3) === '.ts' ? `${fileInfo.name.slice(0, -3)}.${name.split('.')[1]}` : name;
    };
}

/**
 * @file vite 环境配置
 */
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vueJsx(),
        dts({
            // rollupTypes: true,
        }),
    ],
    optimizeDeps: {
        exclude: ['vue-demi'],
    },
    build: {
        lib: {
            entry: {
                index: resolve(__dirname, './index.ts'),
                ...pkPlugins.reduce((p, v) => {
                    p[v] = resolve(__dirname, v);
                    return p;
                }, {}),
            },
            name: 'VueMonacoEditor',
        },
        outDir: 'dist',
        sourcemap: true,
        rollupOptions: {
            external,
            output: [
                { entryFileNames: getFilename(pkg.module), format: 'es', globals },
                { entryFileNames: getFilename(pkg.main), format: 'cjs', exports: 'named', globals },
                // { entryFileNames: getFilename(pkg.unpkg), format: 'umd', name: 'MonacoEditor', globals },
                // { entryFileNames: getFilename(pkg.iife), format: 'iife', name: 'MonacoEditor', globals },
            ],
        },
    },
});
