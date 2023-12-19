<script lang="tsx">
import { computed, defineComponent, ref, h, watch, onMounted, type PropType, markRaw } from 'vue-demi';
import * as monaco from 'monaco-editor';
import { type editor } from 'monaco-editor';
import { initMonaco, createEditor, formatDocument, updateModelValue } from '@xiaohaih/monaco-editor';

// import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
// import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
// import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
// import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
// import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// 设置编译器属性
// monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
//     allowNonTsExtensions: true,
//     moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
//     module: monaco.languages.typescript.ModuleKind.CommonJS,
//     noEmit: true,
//     // isolatedModules: true,
//     // moduleDetection: 'force',
//     // jsx: monaco.languages.typescript.JsxEmit.React,
//     // jsxFactory: 'JSXAlone.createElement',
// });

// 设置提示语
// languages.registerCompletionItemProvider('typescript', {
//     // triggerCharacters: ['@', '"'],
//     provideCompletionItems: (model, position) => {
//         const word = model.getWordUntilPosition(position);
//         const suggestions = ["import  from ''"].map((keyword) => ({
//             label: keyword,
//             kind: languages.CompletionItemKind.Text,
//             insertText: keyword,
//             range: {
//                 startLineNumber: position.lineNumber,
//                 endLineNumber: position.lineNumber,
//                 startColumn: word.startColumn,
//                 endColumn: word.endColumn,
//             },
//         }));
//         return { suggestions, insertTextRules: 4 };
//     },
// });

// 设置需要引入的环境
// self.MonacoEnvironment = {
//     getWorker(_, label) {
//         if (label === 'json') {
//             return new jsonWorker();
//         }
//         if (label === 'css' || label === 'scss' || label === 'less') {
//             return new cssWorker();
//         }
//         if (label === 'html' || label === 'handlebars' || label === 'razor') {
//             return new htmlWorker();
//         }
//         if (label === 'typescript' || label === 'javascript') {
//             return new tsWorker();
//         }
//         return new editorWorker();
//     },
// };

const modelValue = 'modelValue';
const modelValueEmit = 'update:modelValue';

/**
 * @file 编辑器
 */
export default defineComponent({
    name: 'VueMonacoEditor',
    components: {},
    props: {
        /** 编辑器的值 - 优先取该字段 */
        [modelValue]: { type: [String, Object] as PropType<string | editor.ITextModel> },
        /** 编辑器的值 */
        value: { type: [String, Object] as PropType<string | editor.ITextModel> },
        language: { type: String as PropType<string>, required: true },
        editorOption: {
            type: Object as PropType<Omit<editor.IStandaloneEditorConstructionOptions, 'value' | 'model'>>,
        },
    },
    emits: {
        [modelValueEmit]: (val: string) => true,
        input: (val: string) => true,
    },
    setup(props, context) {
        initMonaco(monaco);
        const MODEL_VALUE = computed(() => (props[modelValue] !== undefined ? modelValue : 'value'));
        const MODEL_VALUE_EMIT = MODEL_VALUE.value === modelValue ? modelValueEmit : 'input';

        const { editorOption, [MODEL_VALUE.value]: initialValue, ...baseProps } = props;
        const domRef = ref<HTMLDivElement>();
        const dom = ref(markRaw(document.createElement('div')));
        Object.assign(dom.value.style, { width: '100%', height: '100%' });
        const editorInfo = ref(
            markRaw(
                createEditor({
                    automaticLayout: true,
                    suggest: {
                        filterGraceful: true,
                        preview: true,
                        showColors: true,
                        showConstants: true,
                        showConstructors: true,
                        showDeprecated: true,
                        showEnumMembers: true,
                        showEnums: true,
                        showEvents: true,
                        showFields: true,
                        showFiles: true,
                        showFolders: true,
                        showFunctions: true,
                        showIcons: true,
                        showInterfaces: true,
                        showIssues: true,
                        showKeywords: true,
                        showMethods: true,
                        showModules: true,
                        showOperators: true,
                        showReferences: true,
                        showSnippets: true,
                        showStatusBar: true,
                        showStructs: true,
                        showTypeParameters: true,
                        showUnits: true,
                        showUsers: true,
                        showValues: true,
                        showVariables: true,
                        showWords: true,
                    },
                    dom: dom.value,
                    value: initialValue,
                    ...baseProps,
                    ...editorOption,
                }),
            ),
        );

        onMounted(() => {
            if (domRef.value) domRef.value.appendChild(dom.value);
        });

        init();
        /** 初始化编辑器 */
        function init() {
            formatDocument(editorInfo.value.editor);
            // editorInfo.value.editor.onDidChangeModelLanguageConfiguration(() => {
            //     formatDocument(editorInfo.value.editor);
            // });
            // editorInfo.value.editor.getContribution('editor.contrib.suggestController')?.widget?.value._setDetailsVisible(true);
            const model = editorInfo.value.editor.getModel();
            if (model) {
                model.onDidChangeContent(() => context.emit(MODEL_VALUE_EMIT, model.getValue()));
            }
        }

        props[MODEL_VALUE.value] && valueChange(props[MODEL_VALUE.value]);
        function valueChange(val: string) {
            if (typeof val === 'object') return editorInfo.value.editor.setModel(val);
            const model = editorInfo.value.editor.getModel();
            model && updateModelValue(model, val || '');
        }
        watch(() => props[MODEL_VALUE.value], valueChange);

        return {
            domRef,
            editorInfo,
        };
    },
    render() {
        return h('div', { ref: 'domRef' });
    },
});
</script>
