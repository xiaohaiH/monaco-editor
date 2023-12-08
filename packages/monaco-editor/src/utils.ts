/** 获取数据类型 */
export function getType(o: any): string {
    return Object.prototype.toString.call(o).slice(8, -1);
}
/** 判断是否是数组 */
export function isArray<T>(o: any): o is T[] {
    return getType(o) === 'Array';
}
/** 判断是否是字面量对象 */
export function isPlainObject<T = Record<string, any>>(o: any): o is T {
    return getType(o) === 'Object';
}

/** 判断是否是文件 */
export function isFile(filename: string) {
    return filename.split('/').slice(-1)[0].indexOf('.') !== -1;
}
