import { parse, type ParserOptions } from '@babel/parser';
import { isArray, isPlainObject } from '../../src/utils';

export type AstTree = ReturnType<typeof parse>;

export interface AstNode {
    type: string;
    start: number;
    end: number;
}
export interface Source {
    value: string;
    end: number;
    start: number;
}

/** 将字符串解析成语法树 */
export function toAst(value: string, extraOption?: ParserOptions): AstTree | undefined {
    if (!value) return;
    try {
        return parse(value, {
            sourceType: 'module',
            errorRecovery: true,
            allowImportExportEverywhere: true,
            plugins: ['typescript'],
            ...extraOption,
        });
    } catch (error) {}
}

/** 获取导入的模块 */
export function getModulesFromAst(ast: AstTree): Source[] {
    const a = getNodeOfTypes(ast, ['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration']);
    // @ts-ignore
    return a.map((v) => v?.source).filter(Boolean);
}

/** 获取指定节点类型 */
export function getNodeOfTypes(ast: AstTree, types: string[]) {
    const r: AstNode[] = [];
    traverseAllFields(ast, (val: AstNode) => {
        types.includes(val?.type) && r.push(val);
    });
    return r;
}

/** 遍历所有字段 */
export function traverseAllFields(ast: any, cb: (val: any) => void) {
    Object.keys(ast).forEach((o: keyof typeof ast) => {
        cb(ast[o]);
        if (isArray(ast[o]) || isPlainObject(ast[o])) traverseAllFields(ast[o], cb);
    });
}
