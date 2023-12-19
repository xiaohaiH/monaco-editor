import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
export type {
    IDisposable,
    IPosition,
    CancellationToken,
    editor,
    IEvent,
    IMarkdownString,
    IRange,
    languages,
    Position,
    Range,
    Uri,
} from 'monaco-editor/esm/vs/editor/editor.api';

export let monaco: typeof Monaco;

/** 初始化实例 */
export function initMonaco(monacoInstance: typeof Monaco) {
    if (monaco) return false;
    monaco = monacoInstance;
    return true;
}
