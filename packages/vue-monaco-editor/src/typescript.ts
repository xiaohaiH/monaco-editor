import { getCurrentInstance } from 'vue-demi';
import { typescript as monacoPluginTypescript } from '@xiaohaih/monaco-editor/plugins/typescript/index';
export * from '@xiaohaih/monaco-editor/plugins/typescript/index';

export { monacoPluginTypescript };
/** 以 hooks 方式使用 */
export function useMonacoPluginTypescript(instance: any) {
    // const currentInstance = instance || getCurrentInstance();
    // currentInstance;
}
