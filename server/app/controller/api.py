# -*- coding: utf-8 -*-
import json

import flask
from flask import request, Blueprint, jsonify, Response
import os
import xml.dom.minidom
from ..utils import stringutil
from ..dao.TaskDao import TaskDao
from ..dao.RecordDao import RecordDao

mod = Blueprint('api', __name__, url_prefix='/api')
# voc 目录名称
VOC_DIR = 'Annotations'
VOC_FILE_EXT = '.xml'
task_dao = TaskDao()
record_dao = RecordDao()
# 图片后缀
ext_array = ['.png', '.jpg', '.jpeg', '.bmp']
# 图片列表缓存
task_cache = {}


def get_voc_file(file_path, root_path=''):
    """
    获取对应的 voc 目录
    :param file_path: 文件目录
    :param root_path: 根目录
    :return:
    """
    path, name = os.path.split(file_path)
    name_prefix, _ = os.path.splitext(name)
    last_path = root_path if len(root_path.strip()) > 0 else path
    output_file = os.path.join(last_path, VOC_DIR, name_prefix + VOC_FILE_EXT)
    output_dir = os.path.dirname(output_file)
    if not os.path.exists(output_dir):
        os.mkdir(output_dir)
    return output_file


def get_sort_list(filepath, dataset):
    """
    获取文件夹下所有图片
    :param filepath: 图片路径
    :param dataset: 完整路径数组
    :return: void
    """
    files = os.listdir(filepath)
    for fi in files:
        fi_d = os.path.join(filepath, fi)
        if os.path.isdir(fi_d):
            get_sort_list(os.path.join(filepath, fi_d), dataset)
        else:
            for ext in ext_array:
                if fi.lower().endswith(ext):
                    full_path = os.path.join(filepath, fi_d)
                    dataset.append(full_path)
                    break


def list_dir(filepath, dataset, exist_list=[], root_path=''):
    """
    遍历目录下所有图片
    :param filepath: 文件路径
    :param dataset: 需要标注的数据
    :param exist_list: 已标注的数据
    :param root_path: root path
    :return:
    """
    files = os.listdir(filepath)
    for fi in files:
        fi_d = os.path.join(filepath, fi)
        if os.path.isdir(fi_d):
            list_dir(os.path.join(filepath, fi_d), dataset, exist_list, root_path)
        else:
            for ext in ext_array:
                if fi.lower().endswith(ext):
                    full_path = os.path.join(filepath, fi_d)
                    if os.path.exists(get_voc_file(full_path, root_path)):
                        exist_list.append(full_path)
                    else:
                        dataset.append(full_path)
                    break


@mod.route('/getTask', methods=['POST', 'GET'])
def get_task():
    """
    获取任务详情
    :return:
    """
    task_id = request.values.get('task', None)
    filter_key = request.values.get('filter_key', None)
    index = request.values.get('index', -1)
    is_preview = request.values.get('preview', None) == 'true'
    task = task_dao.find(task_id)
    if not task:
        return jsonify({'code': -1, 'msg': '未找到指定任务:' + task_id})
    path = task.path
    dataset = []
    exist_list = []
    finish_count = 0
    if index >= 0:
        if task_id in task_cache:
            dataset = task_cache[task_id]
        else:
            get_sort_list(path, dataset)
            dataset.sort()
            task_cache[task_id] = dataset
        voc_dir = os.path.join(path, VOC_DIR)
        finish_count = len(os.listdir(voc_dir))
    else:
        if path and os.path.isdir(path):
            list_dir(path, dataset, exist_list, path)
            finish_count = len(exist_list)
    result = {'code': 0, "dataset": dataset, 'existCount': finish_count, 'path': path,
              'types': json.loads(task.types)}
    if 0 <= index < len(dataset):
        voc_file = get_voc_file(dataset[index], path)
        if os.path.exists(voc_file):
            with open(voc_file, 'r') as f:
                lines = f.readlines()
            content = ''.join(lines)
            result['voc'] = [content]
    elif is_preview:
        voc_list = []
        # 存在过滤的列表
        exist_filter_list = []
        should_filter = filter_key and len(filter_key.strip()) > 2
        for i in exist_list:
            voc_file = get_voc_file(i, path)
            with open(voc_file, 'r') as f:
                lines = f.readlines()
            content = ''.join(lines)
            if should_filter:
                if filter_key in content:
                    voc_list.append(content)
                    exist_filter_list.append(i)
            else:
                voc_list.append(content)
        result['dataset'] = exist_list if not should_filter else exist_filter_list
        result['voc'] = voc_list
        result['existCount'] = 0
    # 需要保障 types 顺序，所以不能使用 jsonify
    return Response(json.dumps(result), mimetype='application/json')


@mod.route('/createTask', methods=['POST'])
def create_task():
    """
    创建任务
    :return:
    """
    try:
        path = request.form.get('path', None)
        tags = request.form.get('tags', None)
        title = request.form.get('title', None)
        if stringutil.is_empty(path) or stringutil.is_empty(tags) or stringutil.is_empty(title):
            return jsonify({'code': -1, 'msg': '请填写必要的参数'})
        if not path or not os.path.isdir(path):
            return jsonify({'code': -2, 'msg': '输入的路径不存在'})
        tag_json = json.loads(tags)
        if len(tag_json) == 0:
            # 读取本地
            label_file = os.path.join(path, 'label_list.txt')
            if not os.path.exists(label_file):
                return jsonify({'code': -3, 'msg': '请填写必要的参数'})
            with open(label_file) as f:
                tag_json = [item.strip() for item in f.readlines()]
        tag_object = {}
        for i in tag_json:
            tag_object[i] = 'Rect'
        result = task_dao.insert(path, json.dumps(tag_object), title)
        return jsonify({'code': 0, 'data': {'taskId': result.id}})
    except Exception as e:
        print(e)
        return jsonify({'code': -1, 'msg': str(e)})


@mod.route('/getList', methods=['POST', 'GET'])
def get_list():
    path = request.values.get('path', None)
    dataset = []
    exist_list = []
    if path and os.path.isdir(path):
        list_dir(path, dataset, exist_list, path)
    return jsonify({'code': 0, "dataset": dataset, 'existCount': len(exist_list)})


@mod.route('/image', methods=['GET'])
def get_image():
    """
    获取本地图片
    """
    src = request.values.get('src', None)
    if src and os.path.isfile(src):
        folder_path, file_name = os.path.split(src)
        return flask.send_from_directory(folder_path, file_name, as_attachment=True)
    return jsonify({'msg': '文件找不到'})


@mod.route('/voc', methods=['POST'])
def write_voc():
    """
    voc 写入文件
    :return:
    """
    file_path = request.form.get("filePath")
    voc_content = request.form.get("vocContent")
    task_id = request.form.get("taskId")
    shape_count = request.form.get("shapeCount")
    total = request.form.get("total", type=int, default=0)
    # 是否不包含标注
    empty = request.form.get("empty")
    print(file_path, task_id, total, empty)
    task = task_dao.find(task_id)
    if not task:
        return jsonify({'code': -3, 'msg': '未找到任务'})
    if not file_path or file_path.strip() == "":
        return jsonify({'code': -1, 'msg': '地址为空'})
    record_dao.add_record(task_id, file_path, voc_content, shape_count, request.remote_addr)
    try:
        xml_content = xml.dom.minidom.parseString(voc_content)
        xml_pretty_str = xml_content.toprettyxml()
        with open(get_voc_file(file_path, task.path), 'w') as f:
            f.write(xml_pretty_str)
        task_dao.update_progress(task_id, total, empty == 'true')
        return jsonify({'code': 0})
    except Exception as e:
        return jsonify({'code': -2, 'msg': e})
