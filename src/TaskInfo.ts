/**
 * 任务详情
 */
export class TaskInfo {
    // 文件目录
    private readonly _rootPath: string
    // 任务类型
    private readonly _type: TaskType
    // 任务总数
    public taskCount: number = 0
    // 进度
    public process?: string;
    // 是否预览模式
    public preview = false;

    constructor(rootPath: string, type: TaskType) {
        this._rootPath = rootPath;
        this._type = type
    }

    /**
     * 创建任务
     */
    public static createTask(rootPath: string, type: TaskType = TaskType.SINGLE_IMG): TaskInfo {
        return new TaskInfo(rootPath, type);
    }

    get rootPath(): string {
        return this._rootPath;
    }

    get type(): TaskType {
        return this._type;
    }
}

export enum TaskType {
    SINGLE_IMG,  //单张图片
    MULTI_IMG,  // 多张图片
}