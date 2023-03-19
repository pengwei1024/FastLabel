import React, {useEffect, useRef, useState} from "react"
import {Modal, Divider, Button, Input, Upload, message, InputRef, Row, Col} from "antd"
import {useLabelImg} from "./label-img-provider"
import {useStore} from "./store-provider"
import {Map, Points} from "src/structure"
import {TaskInfo, TaskType} from "src/TaskInfo";
import queryString from 'query-string';
import {Shape} from "../src/Shape";
import NewTaskView, {NewTaskRef} from "./new-task";
import X2JS from "x2js";
import {useSearchParams} from "react-router-dom";
import {RequestTask} from "../src/RequestTask";

const x2js = new X2JS();
const blackDogs = [
    [[620, 244], [799, 244], [799, 441], [620, 441]],
    [[265, 26], [420, 26], [420, 436], [265, 436]]
] as Points[]
const dogEar = [
    [[559, 116], [554, 125], [547, 135], [542, 151], [532, 166], [535, 180], [539, 189], [546, 189], [558, 183], [566, 175], [574, 170], [579, 166], [582, 159], [581, 152], [576, 146], [570, 134], [567, 126], [563, 118]]
] as Points[]
// 是否加载任务详情
let loadTasked = false;
const baseUrl = window.location.href.indexOf(':9001') > 0 ? 'http://127.0.0.1:8877/api' : '/api'

const SourceModal = () => {
    const [visible, setVisible] = useState(true)
    const [url, setUrl] = useState("")
    const [localPath, setLocalPath] = useState("")
    const [title, setTitle] = useState("")
    const [lb] = useLabelImg()
    const [_, setStore] = useStore()
    const [searchParams, setSearchParams] = useSearchParams();
    const getTagRef = useRef<NewTaskRef>(null);
    let index = 0;

    useEffect(() => {
        if (!lb) return
        lb.register("polygon", {
            type: "Polygon",
            style: {
                normal: {
                    lineColor: "black",
                    opacity: .05
                }
            },
            tag: "多边形",
        })
        lb.register("rect", {
            type: "Rect",
            tag: "矩形"
        })
    }, [lb])

    if (lb) {
        let taskId = searchParams.get('task')
        let preview = searchParams.get('preview')
        if (taskId && !loadTasked) {
            loadTasked = true
            // RequestTask.get(`${baseUrl}/getTask?taskId=${taskId}&preview=${preview}`)
            RequestTask.get(`${baseUrl}/getTask` + window.location.search)
                .then(res => {
                    if (res.code == 0) {
                        loadTask(res, preview == 'true')
                    } else {
                        message.warn(res.msg || '获取任务信息失败!')
                    }
                }).catch(err => message.warn(err))
        }
    }

    const close = () => {
        if (!lb) return
        const list = lb.getShapeList()
        const labelTypes = lb.getLabels()
        setStore({
            list,
            labelTypes
        })
        setVisible(false)
    }

    const createTask = ()=> {
        createAndPreviewTask(false)
    }

    const previewTask = ()=> {
        createAndPreviewTask(true)
    }

    /**
     * 创建任务
     */
    const createAndPreviewTask = (preview = false) => {
        if (!title || title.trim().length == 0) {
            message.warn("标题不能为空")
            return;
        }
        let tags = getTagRef.current?.getTags()
        // if(!tags || tags.length === 0) {
        //     message.warn("标注分类项不能为空")
        //     return;
        // }
        if (!localPath) {
            message.warn("本地图片路径不能为空")
            return;
        }
        RequestTask.postForm(`${baseUrl}/createTask`, {
            "path": localPath,
            "tags": JSON.stringify(tags),
            title
        }).then(res => {
            if (!res || res.code !== 0 || !res.data || !res.data.taskId) {
                message.warn(res.msg || '创建失败')
            } else {
                let params = 'task=' + res.data.taskId
                if (preview) {
                    params += '&preview=true'
                }
                setSearchParams(params)
            }
        }).catch(error => message.warn(error))
    }

    const loadVocData = (vocData: string) => {
        if (!lb) {
            return
        }
        let vocJs = x2js.xml2js(vocData) as any
        let anno = vocJs.annotation.object;
        if (!Array.isArray(anno)) {
            // 只有一个的时候是对象，强制转为数组
            anno = [anno]
        }
        for (let index in anno) {
            let i = anno[index] as any
            if (!i) {
                continue
            }
            let positions = [[parseInt(i.bndbox.xmin), parseInt(i.bndbox.ymin)],
                [parseInt(i.bndbox.xmax), parseInt(i.bndbox.ymin)],
                [parseInt(i.bndbox.xmax), parseInt(i.bndbox.ymax)],
                [parseInt(i.bndbox.xmin), parseInt(i.bndbox.ymax)]] as Points
            const shape = lb.createShape(i.name, {
                positions
            })
            lb.addShape(shape)
        }
    }

    const loadTask = (res: any, preview: boolean = false) => {
        if (!lb) return
        const typeObject = res.types || {};
        if (typeObject && Object.keys(typeObject).length > 0) {
            lb.cleanRegister();
            for (let i in typeObject) {
                lb.register(i, {
                    type: typeObject[i],
                    tag: i
                })
            }
        }
        if (!res.dataset || res.dataset.length == 0) {
            message.warn('本地路径未找到或任务已完成!')
            return;
        }
        let taskInfo = new TaskInfo(res.path, TaskType.MULTI_IMG);
        let finishCount = res.existCount;
        taskInfo.taskCount = res.dataset.length + res.existCount
        taskInfo.process = `${finishCount}/${taskInfo.taskCount}`;
        taskInfo.preview = preview;
        lb.setTaskInfo(taskInfo);
        lb.load(`${baseUrl}/image?src=` + res.dataset[0], res.dataset[0]).then(() => {
            close()
        })
        if (preview && res.voc) {
            loadVocData(res.voc[0]);
        }
        lb.registerDrawFinish((path: string, data: any, shape: Shape[], prev: boolean) => {
            if (prev) {
                finishCount--;
            } else {
                finishCount++;
            }
            taskInfo.process = `${finishCount}/${taskInfo.taskCount}`;
            let parseUrl = queryString.parseUrl(path)
            let filePath = parseUrl.query.src || ''
            // let nameIndex = filePath?.lastIndexOf('/') || 0
            // let fileName = filePath?.slice(nameIndex + 1)
            // let filePrefix = fileName?.slice(0, fileName.lastIndexOf('.'));
            // // 默认保存在项目目录 annotations 文件夹下
            // let outFile = `${taskInfo.rootPath}/annotations/${filePrefix}.xml`
            console.log('registerDrawFinish', filePath)
            if (path && !data && !shape) {
                // 预览代码
                let last_index = prev ? --index : ++index;
                if (last_index < 0 || last_index >= res.dataset.length) {
                    message.warn('已全部预览完成!')
                    return;
                }
                lb.load(`${baseUrl}/image?src=` + res.dataset[last_index], res.dataset[last_index]).then(() => {
                    close()
                })
                loadVocData(res.voc[last_index]);
                return;
            }
            let shapeCount = {} as Map<any>;
            if (shape) {
                shape.map(({tagContent}) => {
                    if (shapeCount.hasOwnProperty(tagContent)) {
                        shapeCount[tagContent] += 1
                    } else {
                        shapeCount[tagContent] = 1
                    }
                })
            }
            console.log(shape)
            RequestTask.postForm(`${baseUrl}/voc`, {
                filePath: filePath as string,
                vocContent: data,
                shapeCount: JSON.stringify(shapeCount),
                total: taskInfo.taskCount,
                empty: !shape || shape.length == 0,
                taskId: searchParams.get('task')
            }).then(vocRes => {
                console.log('writeVoc', vocRes)
                if (!vocRes || vocRes.code != 0) {
                    message.warn(res.msg || '提交失败')
                } else {
                    let last_index = ++index;
                    let error_count = 0;
                    while (!res.dataset[last_index] && error_count < 5) {
                        last_index = ++index;
                        error_count++;
                    }
                    if (last_index >= res.dataset.length) {
                        message.warn('标注任务已全部完成!')
                        return
                    }
                    lb.load(`${baseUrl}/image?src=` + res.dataset[last_index], res.dataset[last_index]).then(() => {
                        close()
                    })
                }
            }).catch(error => message.warn(error))
        })
    }

    const loadData = () => {
        if (!lb) return
        lb.register("black-dog", {
            type: "Rect",
            tag: "black dog"
        })
        lb.register("dog-ear", {
            type: "Polygon",
            tag: "狗耳朵",
            style: {
                normal: {
                    lineColor: "aqua",
                    fillColor: "blueviolet",
                    dotColor: "burlywood"
                }
            }
        })
        lb.setTaskInfo(TaskInfo.createTask("./dog.jpg"));
        lb.load("./dog.jpg").then(() => {
            blackDogs.forEach((positions) => {
                const shape = lb.createShape("black-dog", {
                    positions
                })
                lb.addShape(shape)
            })
            dogEar.forEach((positions) => {
                const shape = lb.createShape("dog-ear", {
                    positions
                })
                lb.addShape(shape)
            })
            close()
        })
    }

    const loadByUrl = () => {
        if (!url || !lb) return
        lb.setTaskInfo(TaskInfo.createTask(url));
        lb.load(url, url).then(() => {
            close()
        })
    }

    const handleVocDirChange = () => {

    }

    return (
        <Modal
            title="选择数据源"
            visible={visible}
            footer={false}
            closable={false}
            centered
        >
            <div>
                <Upload accept="image/*" style={{
                    width: "100%"
                }} className="w-full block"
                        onChange={({file}) => {
                            lb?.setTaskInfo(TaskInfo.createTask(file.name));
                            lb?.load(file.originFileObj as any, file.name)
                            close()
                        }}
                        action={""}
                >
                    <Button type="primary" block>上传本地图片</Button>
                </Upload>
            </div>
            <div style={{marginTop: 10}}>
                <Input value={url} onChange={(e) => {
                    setUrl(e.target.value)
                }} style={{
                    marginBottom: 8
                }} placeholder="请输入图片地址"/>
                <Button type="primary" block onClick={loadByUrl}>加载线上图片</Button>
            </div>
            <Divider/>
            <div>
                <Button type="primary" block onClick={loadData}>
                    加载示例数据
                </Button>
            </div>
            <Divider>自定义任务</Divider>
            <div>
                <Input placeholder="标注任务标题" value={title} onChange={(e) => {
                    setTitle(e.target.value)
                }} style={{
                    marginBottom: 8
                }} />
                <Input placeholder="输入本地图片文件夹路径" value={localPath} onBlur={handleVocDirChange}
                       onChange={(e) => {
                    setLocalPath(e.target.value)
                }} style={{
                    marginBottom: 8
                }} />
                <NewTaskView ref={getTagRef}/>
                <Row>
                  <Col span={10}>
                       <Button type="primary" block onClick={createTask}>创建标注任务</Button>
                  </Col>
                  <Col span={10} style={{
                    marginLeft: 6
                }}>
                       <Button type="primary" block onClick={createAndPreviewTask}>预览已有标注</Button>
                  </Col>
                </Row>

            </div>
        </Modal>
    )
}

export default SourceModal
