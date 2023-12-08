/** 获取模块名称 */
export function getModuleName(path: string) {
    return path
        .split('/')
        .slice(0, path.charAt(0) === '@' ? 2 : 1)
        .join('/');
}

/** 是否是模块类型路径 */
export function isModulePath(path: string) {
    const firstChar = path.charAt(0);
    return !['/', '\\', '.'].some((str) => str === firstChar);
}

/** 拼接路径(npm 包转绝对路径) */
export function resolvePath(base: string, relative: string) {
    const stack = base.split('/');
    stack.unshift(base[0] === '@' ? stack.splice(0, 2).join('/') : stack.splice(0, 1)[0]);
    if (relative.charAt(0) === '/') return `${stack[0]}${relative}`;
    const parts = relative.split('/');
    stack.pop();
    for (var i = 0; i < parts.length; i++) {
        if (parts[i] == '.') continue;
        if (parts[i] == '..') stack.pop();
        else stack.push(parts[i]);
    }
    return stack.join('/');
}
