import { editor, type Uri } from 'monaco-editor';

/** 初始化编辑器时提供的参数 */
export interface EditorOption extends Omit<editor.IStandaloneEditorConstructionOptions, 'value' | 'model'> {
    /** 渲染的 dom 节点 */
    dom: HTMLElement;
    /** 语言 */
    language: string;
    /** 默认渲染的文本 */
    value?: string | editor.ITextModel;
    /** 编辑器 id - 防止重复创建 */
    id?: string | number;
    /** 加载的插件 */
    plugins?: PluginOption<any>[];
}

/** 创建编辑器后返回的信息 */
export interface EditorInfo {
    /** 编辑器实例 */
    editor: editor.IStandaloneCodeEditor;
    /** 获取编辑器的值 */
    getValue(): string;
    /** 校验编辑器的值是否报错 */
    validate(): Promise<boolean>;
    /** 获取语法树 */
    getAst<T = unknown>(): T | undefined;
    /** 增加插件 */
    addPlugin<T = unknown>(plugin: PluginOption<T>): void;
    /** 删除插件 */
    removePlugin(pluginName: string): void;
    /** 清空插件 */
    clearPlugin(): void;
}

export interface PluginOption<AST> {
    /** 插件名称 */
    name: string;
    /** 该语言是否与插件相匹配 */
    isMatch(language: string): boolean;
    /** 解析文本 */
    parse(fileInfo: ParseInfo): void;
    /** 获取文件对应的语法树 */
    getAst(filepath: string): AST | undefined;
    /** 校验文本语法是否出错 */
    validate(model: editor.IModel): Promise<boolean>;
    /** 移除插件 */
    destroy(): void;
}
/** 解析文件 */
export interface ParseInfo {
    text: string;
    uri: string | Uri;
    language: string;
}
