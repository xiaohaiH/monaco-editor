import { type editor } from './monaco';

/** 格式化文档 */
export function formatDocument(editor: editor.IStandaloneCodeEditor) {
    editor.getAction('editor.action.formatDocument')?.run();
}

/**
 * 更新文档值(不计入撤销事件)
 * @param {editor.IModel} model 文档
 * @param {string} value 文档值
 */
export function updateModelValue(model: editor.IModel, value: string) {
    model.pushEditOperations([], [{ range: model.getFullModelRange(), text: value || '' }], (inverseEditOperations) => {
        return null;
    });
}
