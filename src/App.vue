<template>
    <div style="width: 100%; height: 100%; padding: 10px; display: flex; flex-flow: column">
        <div class="abc">
            <div :style="{ color: loading ? 'pink' : 'green' }">
                {{ loading ? '模块正在加载中, 请稍后' : '模块加载完毕' }}
            </div>
            <div>
                <p>失败模块集合</p>
                <p>{{ errorFiles }}</p>
            </div>
        </div>
        <VueMonacoEditor
            v-model:modelValue="value"
            ref="editorRef"
            language="typescript"
            style="width: 100%; height: 100%; flex: auto"
        ></VueMonacoEditor>
    </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { languages } from 'monaco-editor';
import { VueMonacoEditor } from '@xiaohaih/vue-monaco-editor';
import { monacoPluginTypescript } from '@xiaohaih/vue-monaco-editor/src/typescript';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
// import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
// import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
// import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

languages.typescript.typescriptDefaults.setCompilerOptions({
    allowNonTsExtensions: true,
    moduleResolution: languages.typescript.ModuleResolutionKind.NodeJs,
    module: languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    // isolatedModules: true,
    // moduleDetection: 'force',
    // jsx: languages.typescript.JsxEmit.React,
    // jsxFactory: 'JSXAlone.createElement',
});

self.MonacoEnvironment = {
    getWorker(_, label) {
        // if (label === 'json') {
        //     return new jsonWorker();
        // }
        // if (label === 'css' || label === 'scss' || label === 'less') {
        //     return new cssWorker();
        // }
        // if (label === 'html' || label === 'handlebars' || label === 'razor') {
        //     return new htmlWorker();
        // }
        if (label === 'typescript' || label === 'javascript') {
            return new tsWorker();
        }
        return new editorWorker();
    },
};

const modLoadHelper = [
    [
        'vue',
        (modName: string, filepath: string, mod: string) =>
            `https://unpkg.com/vue@3.3.11/${modName === mod ? `/dist/vue.d.ts` : `jsx.d.ts`}`,
    ],
    [
        '@vue/compiler-dom',
        (modName: string, filepath: string, mod: string) =>
            `https://unpkg.com/@vue/compiler-dom@3.3.11/dist/compiler-dom.d.ts`,
    ],
    [
        // 此模块下的声明未继续引入
        '@vue/compiler-core',
        (modName: string, filepath: string, mod: string) =>
            `https://unpkg.com/@vue/compiler-core@3.3.11/dist/compiler-core.d.ts`,
    ],
    [
        '@vue/runtime-dom',
        (modName: string, filepath: string, mod: string) =>
            `https://unpkg.com/@vue/runtime-dom@3.3.11/dist/runtime-dom.d.ts`,
    ],
    ['csstype', (modName: string, filepath: string, mod: string) => `https://unpkg.com/csstype@3.1.3/index.d.ts`],
    [
        '@vue/runtime-core',
        (modName: string, filepath: string, mod: string) =>
            `https://unpkg.com/@vue/runtime-core@3.3.11/dist/runtime-core.d.ts`,
    ],
    [
        '@vue/runtime-core',
        (modName: string, filepath: string, mod: string) =>
            `https://unpkg.com/@vue/runtime-core@3.3.11/dist/runtime-core.d.ts`,
    ],
    [
        '@vue/reactivity',
        (modName: string, filepath: string, mod: string) =>
            `https://unpkg.com/@vue/reactivity@3.3.11/dist/reactivity.d.ts`,
    ],
    [
        '@vue/shared',
        (modName: string, filepath: string, mod: string) => `https://unpkg.com/@vue/shared@3.3.11/dist/shared.d.ts`,
    ],
    // [
    //     'vue',
    //     (modName: string, filepath: string, mod: string) =>
    //         `https://unpkg.com/vue@2.6.0/types/${
    //             modName === mod
    //                 ? `index.d.ts`
    //                 : filepath.slice(0, 'vue/types'.length) === 'vue/types'
    //                 ? `${filepath.slice('vue/types'.length)}.d.ts`
    //                 : `${filepath.slice('vue'.length)}.d.ts`
    //         }`,
    // ],
] as const;

export default defineComponent({
    components: {
        VueMonacoEditor,
    },
    setup() {
        const editorRef = ref<InstanceType<typeof VueMonacoEditor>>();
        const value = ref(
            [
                '\n// 尽情发挥吧',
                `\nimport { defineComponent } from 'vue';`,
                '',
                `defineComponent({`,
                `    name: 'test',`,
                `});`,
            ].join('\n'),
        );
        onMounted(() => {
            editorRef.value?.editorInfo.addPlugin(monacoPluginTypescript({ loadMod: loadModule }));
        });

        const loading = ref(false);
        const successFiles = ref(new Set<string>());
        const errorFiles = ref(new Set<string>());

        let i = 0;
        async function loadModule(modName: string, filepath: string) {
            loading.value = true;
            i++;
            const r = modLoadHelper.find(([mod]) => filepath.slice(0, mod.length) === mod);
            if (!r) {
                i--;
                return '';
            }
            return fetch(r[1](modName, filepath, r[0]))
                .then((v) => {
                    successFiles.value.add(modName);
                    errorFiles.value.delete(modName);
                    i--;
                    if (!i) loading.value = false;
                    return v.text();
                })
                .catch((v) => {
                    successFiles.value.delete(modName);
                    errorFiles.value.add(modName);
                    i--;
                    if (!i) loading.value = false;
                });
        }

        return { editorRef, value, loading, successFiles, errorFiles };
    },
});
</script>

<style scoped></style>
