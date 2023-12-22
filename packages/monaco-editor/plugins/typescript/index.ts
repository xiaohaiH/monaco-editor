import { editor, languages, Uri } from 'monaco-editor';
import { parse, type ParserOptions } from '@babel/parser';
import { toAst, getModulesFromAst, type Source, type AstTree } from './ast';
import { getModuleName, isModulePath, resolvePath } from './utils';
import { type PluginOption } from '../../src/interface';

/** 支持的语言 */
export enum Language {
    javascript = 'javascript',
    typescript = 'typescript',
}

/** 文件后缀 */
export const fileSuffix = {
    [Language.javascript]: 'js',
    [Language.typescript]: 'ts',
};

/** 文件信息 */
export interface FileInfo {
    /** 文件内容语法树 */
    ast: AstTree;
    /** 导入的文件(模块)信息 */
    importModules: Source[];
    /** 导入文件(模块)对应的绝对路径 */
    filepaths: string[];
}
/** 文件目录信息 */
export const fileInfoMap: Record<string, FileInfo> = {};
/** 模块请求状态 */
export type ModStatus = 'loading' | 'success' | 'error';
/** 模块请求信息 */
const modMap: Record<string, ModStatus> = {};

export interface LoadDtsOption extends Pick<Option, 'loadMod' | 'declarationModel' | 'astOption'> {
    /** 文件内容 */
    text: string;
    /** 文件地址 */
    uri: string;
    /** 文件语言 */
    language: Language;
    /** 当前文件是否全局声明库(*.d.ts) */
    isLib?: boolean;
}
/** 依赖存放目录 */
export const NODE_MODULES_FOLDER = 'file:///node_modules/';

/** 加载声明文件 */
export async function loadDts({ text, uri, isLib, loadMod, language, declarationModel, astOption }: LoadDtsOption) {
    if (!text) return;
    isLib && addLib(text, uri.slice(-5) === 'index' ? `${uri}.d.ts` : `${uri}.d.ts`, language);
    isLib && declarationModel && editor.createModel(text, language, Uri.parse(`${uri}.d.ts`));
    const astValue = toAst(text, astOption);
    if (!astValue) return;
    const fileInfo = (fileInfoMap[uri] = {
        ast: astValue,
        importModules: getModulesFromAst(astValue),
        filepaths: [] as string[],
    });
    if (loadMod) {
        try {
            await Promise.all(
                fileInfo.importModules.map((mod) => {
                    const tempPath = isModulePath(mod.value)
                        ? `${NODE_MODULES_FOLDER}${mod.value}`
                        : resolvePath(uri, mod.value);
                    let newUri = mod.value === getModuleName(mod.value) ? `${tempPath}/index` : tempPath;

                    fileInfo.filepaths.push(newUri);
                    if (modMap[newUri] === 'loading' || modMap[newUri] === 'success') return;
                    modMap[newUri] = 'loading';
                    return new Promise<string>((r) =>
                        r(
                            loadMod(mod.value, tempPath.slice(NODE_MODULES_FOLDER.length), (isDir) =>
                                typeof isDir === 'string'
                                    ? (newUri = isDir)
                                    : isDir && newUri.charAt(newUri.length - 1) !== '/' && (newUri += '/index'),
                            ),
                        ),
                    )
                        .then((v) => {
                            modMap[newUri] = 'success';
                            loadDts({
                                text: v,
                                uri: newUri,
                                isLib: true,
                                loadMod,
                                language,
                                declarationModel,
                                astOption,
                            });
                        })
                        .catch((e) => {
                            modMap[newUri] = 'error';
                            throw e;
                        });
                }),
            );
        } catch (e) {
            throw e;
        }
    }
}

/** 新增全局声明库 */
export function addLib(value: string, uri: Uri | string, language: 'typescript' | 'javascript') {
    languages.typescript[`${language}Defaults`].addExtraLib(
        value,
        Uri.isUri(uri) ? decodeURIComponent(uri.toString()) : uri,
    );
}
/** 移除全局声明库 */
export function removeLib(...args: RemoveFirst<Parameters<typeof addLib>>) {
    addLib('', ...args);
}

let _tsInstance: Record<string, Promise<languages.typescript.TypeScriptWorker>> = {};
/** 获取语法检验句柄 */
export async function getSyntaxWorker(uri: Uri, language: string) {
    const uniqueKey = `${uri.toString()}${language || ''}`;
    if (!_tsInstance[uniqueKey]) {
        _tsInstance[uniqueKey] = getSyntaxWorkerFunc(
            language === 'typescript' ? 'getTypeScriptWorker' : 'getJavaScriptWorker',
        )
            .then((v) => v(uri))
            .catch((err) => {
                delete _tsInstance[uniqueKey];
                throw err;
            });
    }
    return _tsInstance[uniqueKey];
}

const _tsWorker = {} as Record<string, ReturnType<typeof languages.typescript.getTypeScriptWorker>>;
/** 获取语法校验函数 */
export async function getSyntaxWorkerFunc(workType: 'getJavaScriptWorker' | 'getTypeScriptWorker') {
    if (!_tsWorker[workType])
        _tsWorker[workType] = languages.typescript[workType]().catch((err) => {
            delete _tsWorker[workType];
            throw err;
        });
    return _tsWorker[workType];
}

/** 插件的配置项 */
export interface Option {
    /**
     * 加载依赖项
     * @property {string} name 模块名称
     * @property {string} filepath 模块绝对路径
     * @property {Function} cb 通知内部该路径是否是目录(比如写的是(C:/project), 实际应该是(C:/project/index.ts))
     */
    loadMod?: (
        name: string,
        filepath: string,
        cb: (isDirOrFilepath?: boolean | string) => void,
    ) => Promise<string> | string;
    /** 是否给声明文件创建 model(会影响效率, 但声明文件内部不会报错) */
    declarationModel?: boolean;
    /** 传递给 ast parse 的参数 */
    astOption?: ParserOptions;
}

export function typescript(option?: Option): PluginOption<AstTree> {
    return {
        name: 'typescript',
        isMatch(language) {
            return !!Language[language as Language];
        },
        parse({ text, language, uri }) {
            if (!Language[language as Language]) return;
            loadDts({
                text,
                language: language as Language,
                uri: uri.toString(),
                loadMod: option?.loadMod,
                declarationModel: option?.declarationModel,
                astOption: option?.astOption,
            });
        },
        getAst(filepath) {
            return fileInfoMap[filepath]?.ast;
        },
        async validate(model) {
            const tsWorker = await getSyntaxWorker(model.uri, model.getLanguageId());
            const r = await Promise.all([
                tsWorker.getSyntacticDiagnostics(model.uri.toString()),
                tsWorker.getSemanticDiagnostics(model.uri.toString()),
            ]);
            return r.some((v) => v.length) ? Promise.reject(r) : Promise.resolve(true);
        },
        destroy() {},
    };
}

/** 删除首位元素 */
type RemoveFirst<T> = T extends [any, ...infer R] ? R : never;

export default typescript;
