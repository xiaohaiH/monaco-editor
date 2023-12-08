import { editor, Uri } from 'monaco-editor';
import { EditorInfo, EditorOption, PluginOption } from './interface';

/** 保存编辑器的信息 */
const editorInfoMap: Record<
    string,
    {
        info: EditorInfo;
        option: EditorOption;
        listeners: (() => void)[];
        untitledI: 0;
    }
> = {};

let _editorId = 0;
const filenameBeginNum = 0;
/** 创建编辑器 */
export function createEditor(_option: EditorOption): EditorInfo {
    const option = { ..._option } as Omit<EditorOption, 'plugins'> & { plugins: NonNullable<EditorOption['plugins']> };
    if (option.id && editorInfoMap[option.id]) return editorInfoMap[option.id].info;
    option.plugins = option.plugins ? [...option.plugins] : [];
    const id = option.id || ++_editorId;
    const { value, dom, ...extraOption } = option;
    const editorInstance = editor.create(option.dom, {
        theme: 'vs-dark',
        tabSize: 4,
        detectIndentation: false,
        scrollbar: { alwaysConsumeMouseWheel: false },
        definitionLinkOpensInPeek: true,
        ...extraOption,
    });

    const model = createFile({
        ...option,
        uri: Uri.file(`/root${id}/Untitled-${filenameBeginNum}`),
        getPlugins: () => option.plugins,
    });

    editorInstance.setModel(model);

    const result: EditorInfo = {
        editor: editorInstance,
        getValue: () => editorInstance.getModel()?.getValue() || '',
        validate: () => {
            const model = editorInstance.getModel();
            if (model) {
                const plugin = option.plugins.find((v) => v.isMatch(model.getLanguageId()));
                if (plugin) return plugin.validate(model);
            }
            return Promise.resolve(true);
        },
        getAst() {
            const model = editorInstance.getModel();
            return model && option.plugins.find((v) => v.isMatch(model.getLanguageId()))?.getAst(model.uri.toString());
        },
        addPlugin(plugin) {
            option.plugins.push(plugin);
            editor.getModels().forEach((o) => {
                plugin.isMatch(o.getLanguageId()) &&
                    plugin.parse({ text: model!.getValue(), uri: model!.uri, language: o.getLanguageId() });
            });
        },
        removePlugin(pluginName) {
            const idx = option.plugins.findIndex((v) => v.name === pluginName);
            if (idx !== -1) {
                option.plugins[idx].destroy();
                option.plugins.splice(idx, -1);
            }
        },
        clearPlugin() {
            option.plugins.forEach((o) => o.destroy());
            option.plugins = [];
        },
    };
    editorInfoMap[id] = { option, info: result, listeners: [], untitledI: filenameBeginNum };
    return result;
}

/** 销毁编辑器 */
export function destroyEditor(editor: editor.IStandaloneCodeEditor) {
    let r: boolean;
    Object.entries(editorInfoMap).some((v) => {
        r = v[1].info.editor === editor;
        if (r) {
            v[1].listeners.forEach((o) => o());

            delete editorInfoMap[v[0]];
        }
        return r;
    });
}

/** 创建文件 */
export function createFile({
    value: content,
    language,
    uri: _uri,
    getPlugins,
}: Pick<EditorOption, 'value' | 'language'> & { uri: Uri | string; getPlugins: () => PluginOption<any>[] }) {
    if (typeof content === 'object') return content;
    const uri = typeof _uri === 'string' ? Uri.parse(_uri) : _uri;
    let model = editor.getModel(uri);
    if (!model) {
        model = editor.createModel(content || '', language, uri);

        const cb = () => {
            getPlugins()
                .find((v) => v.isMatch(language))
                ?.parse({ text: model!.getValue(), uri: model!.uri, language });
        };
        cb();
        model.onDidChangeContent(cb);
    }
    return model;
}
